import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { owns } from "../src/collection";
import { SearchField, SkewTag, display, frame } from "../src/components/bits";
import { Phone } from "../src/components/chrome";
import { platformsFor } from "../src/platforms";
import { useCollection } from "../src/store";
import { INK } from "../src/theme";
import { useGameSearch } from "../src/use-game-search";

export default function WishesScreen() {
  const copies = useCollection((state) => state.copies);
  const wishes = useCollection((state) => state.wishes);
  const catalog = useCollection((state) => state.catalog);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const addWish = useCollection((state) => state.addWish);
  const removeWish = useCollection((state) => state.removeWish);
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query);
  const allowed = platformsFor(switch2RawgId).map((platform) => platform.id);
  const search = useGameSearch(debounced, allowed);
  const results = (search.data?.pages.flatMap((page) => page.games) ?? [])
    .filter((game, index, all) => all.findIndex((item) => item.id === game.id) === index)
    .filter((game) => !owns(copies, game.id) && !wishes.includes(game.id))
    .sort((a, b) => a.title.localeCompare(b.title));
  const listed = [...wishes].sort((a, b) => (catalog[a]?.title ?? a).localeCompare(catalog[b]?.title ?? b));

  return (
    <Phone title="Wishes" showBack onBack={() => router.back()}>
      <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: 24 }}>
        <SearchField value={query} onChange={setQuery} placeholder="Search games" />
        <View style={{ padding: 12, gap: 10 }}>
          {listed.map((id) => (
            <View key={id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <Text style={{ ...display(16), flex: 1 }}>{catalog[id]?.title ?? id}</Text>
              <SkewTag label="Remove" onPress={() => removeWish(id)} />
            </View>
          ))}
          {results.map((game) => (
            <Pressable key={game.id} onPress={() => addWish(game)} style={{ ...frame, padding: 10 }}>
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
