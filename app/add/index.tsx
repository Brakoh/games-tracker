import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { canAdd, possessionId, titleKey } from "../../src/collection";
import { ConsoleLogo, SearchField, display, frame } from "../../src/components/bits";
import { Phone } from "../../src/components/chrome";
import { Tap } from "../../src/components/tap";
import { menuPlatformId, platformById, platformsFor, systemIds, visibleOrder } from "../../src/platforms";
import { useCollection } from "../../src/store";
import { INK } from "../../src/theme";
import type { CatalogGame, PlatformDef } from "../../src/types";
import { useGameSearch } from "../../src/use-game-search";

export default function AddScreen() {
  const { platformId } = useLocalSearchParams<{ platformId?: string }>();
  const fixed = platformId ? String(platformId) : null;
  const active = useCollection((state) => state.active);
  const order = useCollection((state) => state.order);
  const copies = useCollection((state) => state.copies);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const remember = useCollection((state) => state.remember);
  const [query, setQuery] = useState("");
  const [viewport, setViewport] = useState(0);
  const debounced = useDebounced(query);
  const menuIds = fixed ? [menuPlatformId(fixed)] : visibleOrder(order, active);
  const allowed = menuIds.flatMap((id) => systemIds(id));
  const search = useGameSearch(debounced, allowed);
  const games = uniqueTitles(search.data?.pages.flatMap((page) => page.games) ?? [], copies)
    .filter((game) => canAdd(game, fixed, active, copies));
  const loadMore = () => {
    if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
  };
  const list = platformsFor(switch2RawgId);
  const title = fixed ? `Add a game` : "Add a game";

  return (
    <Phone title={title} showBack onBack={() => router.back()}>
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        scrollEventThrottle={100}
        onLayout={({ nativeEvent }) => setViewport(nativeEvent.layout.height)}
        onContentSizeChange={(_, height) => {
          if (viewport > 0 && height < viewport + NEAR_END) loadMore();
        }}
        onScroll={({ nativeEvent: { contentOffset, contentSize, layoutMeasurement } }) => {
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - NEAR_END) loadMore();
        }}
      >
        <SearchField value={query} onChange={setQuery} placeholder="Search games" />
        <View style={{ padding: 12, gap: 10 }}>
          {fixed ? <Text style={display(13)}>{platformById(list, menuPlatformId(fixed))?.name}</Text> : null}
          {games.map((game) => {
            const owned = ownedPlatforms(copies, order, game.id)
              .map((id) => platformById(list, id))
              .filter((platform): platform is PlatformDef => !!platform);
            return (
              <Tap
                key={game.id}
                accessibilityLabel={owned.length ? `${game.title}, ${owned.map((platform) => platform.name).join(", ")}` : game.title}
                onPress={() => {
                  remember(game);
                  if (fixed) router.push(`/add/confirm?gameId=${game.id}&platformId=${possessionId(game.platforms, fixed, copies, game.id)}&depth=1`);
                  else router.push(`/add/platform?gameId=${game.id}`);
                }}
                style={{ ...frame, padding: 10, flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Text style={{ ...display(16), flex: 1 }}>{game.title}</Text>
                {owned.length > 0 ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {owned.map((platform) => (
                      <PlatformMark key={platform.id} platform={platform} />
                    ))}
                  </View>
                ) : null}
              </Tap>
            );
          })}
          {search.isLoading || search.isFetchingNextPage ? <ActivityIndicator color={INK} /> : null}
        </View>
      </ScrollView>
    </Phone>
  );
}

const NEAR_END = 600;

function uniqueTitles(games: CatalogGame[], copies: { gameId: string }[]) {
  const owned = new Set(copies.map((copy) => copy.gameId));
  const byTitle = new Map<string, CatalogGame>();
  for (const game of games) {
    const key = titleKey(game.title);
    const kept = byTitle.get(key);
    if (!kept || (!owned.has(kept.id) && owned.has(game.id))) byTitle.set(key, game);
  }
  return [...byTitle.values()];
}

function ownedPlatforms(copies: { gameId: string; platformId: string }[], order: string[], gameId: string) {
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...new Set(copies.filter((copy) => copy.gameId === gameId).map((copy) => menuPlatformId(copy.platformId)))].sort(
    (a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99),
  );
}

function PlatformMark({ platform }: { platform: PlatformDef }) {
  if (!platform.logo) {
    return <Text style={display(12)}>{platform.name}</Text>;
  }
  return <ConsoleLogo uri={platform.logo} width={36} height={22} />;
}

function useDebounced(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), value ? 200 : 0);
    return () => clearTimeout(timer);
  }, [value]);
  return debounced;
}
