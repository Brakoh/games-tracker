import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { canAdd, possessionId, titleKey } from "../../src/collection";
import { ConsoleLogo, SearchField, SearchNotice, SkewTag, display, frame } from "../../src/components/bits";
import { Phone, useFramed } from "../../src/components/chrome";
import { Tap } from "../../src/components/tap";
import { menuPlatformId, platformById, platformsFor, systemIds } from "../../src/platforms";
import { useCollection } from "../../src/store";
import { INK } from "../../src/theme";
import type { CatalogGame, PlatformDef } from "../../src/types";
import { useDebouncedSearch } from "../../src/use-debounced-search";
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
  const debounced = useDebouncedSearch(query);
  const list = platformsFor(switch2RawgId);
  const menuIds = fixed ? [menuPlatformId(fixed)] : list.map((platform) => platform.id);
  const allowed = fixed ? menuIds.flatMap((id) => systemIds(id)) : menuIds;
  const search = useGameSearch(debounced, allowed);
  const games = uniqueTitles(search.data?.pages.flatMap((page) => page.games) ?? [], copies).filter((game) =>
    fixed ? canAdd(game, fixed, active, copies) : game.platforms.length > 0,
  );
  const loadMore = () => {
    if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
  };
  const term = debounced.trim();
  const pending = query.trim() !== term || (search.isFetching && !search.isFetchingNextPage);
  const insets = useSafeAreaInsets();
  const framed = useFramed();

  return (
    <Phone bare>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingTop: framed ? 12 : Math.max(insets.top, 12),
          paddingBottom: 8,
          borderBottomWidth: 3,
          borderBottomColor: INK,
        }}
      >
        <SkewTag label="Back" height={34} onPress={() => router.back()} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
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
        <SearchField value={query} onChange={setQuery} placeholder="Search games" labeled={false} />
        <View style={{ padding: 12, gap: 10 }}>
          {fixed ? <Text style={display(13)}>{platformById(list, menuPlatformId(fixed))?.name}</Text> : null}
          <SearchNotice pending={pending} term={term} empty={!pending && games.length === 0} />
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
                <Text numberOfLines={1} style={{ ...display(16), flex: 1, minWidth: 0 }}>{game.title}</Text>
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
          {search.isFetchingNextPage ? <SearchNotice pending term="" empty={false} /> : null}
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
    if (!kept) {
      byTitle.set(key, { ...game, platforms: [...game.platforms] });
      continue;
    }
    const platforms = [...new Set([...kept.platforms, ...game.platforms])];
    const primary = !owned.has(kept.id) && owned.has(game.id) ? game : kept;
    byTitle.set(key, { ...primary, platforms });
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
  return <ConsoleLogo uri={platform.logo} width={22} height={13} />;
}
