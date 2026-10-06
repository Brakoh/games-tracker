import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { canAdd } from "../../src/collection";
import { SearchField, display, frame } from "../../src/components/bits";
import { Phone } from "../../src/components/chrome";
import { platformById, platformsFor } from "../../src/platforms";
import { useCollection } from "../../src/store";
import { INK } from "../../src/theme";
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
  const debounced = useDebounced(query);
  const activeIds = order.filter((id) => active[id]);
  const allowed = fixed ? [fixed] : activeIds;
  const search = useGameSearch(debounced, allowed);
  const games = (search.data?.pages.flatMap((page) => page.games) ?? [])
    .filter((game, index, all) => all.findIndex((item) => item.id === game.id) === index)
    .filter((game) => canAdd(game, fixed, active, copies))
    .sort((a, b) => a.title.localeCompare(b.title));
  const list = platformsFor(switch2RawgId);
  const title = fixed ? `Add a game` : "Add a game";

  return (
    <Phone title={title} showBack onBack={() => router.back()}>
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <SearchField value={query} onChange={setQuery} placeholder="Search games" />
        <View style={{ padding: 12, gap: 10 }}>
          {fixed ? <Text style={display(13)}>{platformById(list, fixed)?.name}</Text> : null}
          {games.map((game) => (
            <Pressable
              key={game.id}
              onPress={() => {
                remember(game);
                if (fixed) router.push(`/add/format?gameId=${game.id}&platformId=${fixed}&depth=1`);
                else router.push(`/add/platform?gameId=${game.id}`);
              }}
              style={{ ...frame, padding: 10 }}
            >
              <Text style={display(16)}>{game.title}</Text>
            </Pressable>
          ))}
          {search.isLoading ? <ActivityIndicator color={INK} /> : null}
          {search.hasNextPage ? (
            <Pressable onPress={() => void search.fetchNextPage()} style={{ ...frame, padding: 10 }}>
              <Text style={display(16)}>More</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Phone>
  );
}

function useDebounced(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), value ? 200 : 0);
    return () => clearTimeout(timer);
  }, [value]);
  return debounced;
}
