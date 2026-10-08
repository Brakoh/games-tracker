import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { owns } from "../src/collection";
import { SearchField, SearchNotice, SkewTag, display, frame } from "../src/components/bits";
import { Phone } from "../src/components/chrome";
import { Tap } from "../src/components/tap";
import { nameMatches } from "../src/name-match";
import { platformsFor } from "../src/platforms";
import { useCollection } from "../src/store";
import { useDebouncedSearch } from "../src/use-debounced-search";
import { useGameSearch } from "../src/use-game-search";

export default function WishesScreen() {
  const copies = useCollection((state) => state.copies);
  const wishes = useCollection((state) => state.wishes);
  const catalog = useCollection((state) => state.catalog);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const addWish = useCollection((state) => state.addWish);
  const removeWish = useCollection((state) => state.removeWish);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedSearch(query);
  const term = debounced.trim();
  const allowed = platformsFor(switch2RawgId).map((platform) => platform.id);
  const search = useGameSearch(debounced, allowed);
  const results = (search.data?.pages.flatMap((page) => page.games) ?? [])
    .filter((game, index, all) => all.findIndex((item) => item.id === game.id) === index)
    .filter((game) => !owns(copies, game.id) && !wishes.includes(game.id))
    .sort((a, b) => a.title.localeCompare(b.title));
  const listed = [...wishes]
    .filter((id) => !term || nameMatches(catalog[id]?.title ?? "", term))
    .sort((a, b) => (catalog[a]?.title ?? a).localeCompare(catalog[b]?.title ?? b));
  const pending = query.trim() !== term || (search.isFetching && !search.isFetchingNextPage);

  return (
    <Phone title="Wishes" showBack onBack={() => router.back()}>
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <SearchField value={query} onChange={setQuery} placeholder="Search games" />
        <View style={{ padding: 12, gap: 10 }}>
          <SearchNotice pending={pending} term={term} empty={!pending && listed.length === 0 && results.length === 0} />
          {listed.map((id) => (
            <View key={id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <Text numberOfLines={1} style={{ ...display(16), flex: 1, minWidth: 0 }}>{catalog[id]?.title ?? id}</Text>
              <SkewTag label="Remove" onPress={() => removeWish(id)} />
            </View>
          ))}
          {results.map((game) => (
            <Tap key={game.id} onPress={() => addWish(game)} style={{ ...frame, padding: 10 }}>
              <Text numberOfLines={1} style={{ ...display(16), minWidth: 0 }}>{game.title}</Text>
            </Tap>
          ))}
          {search.isFetchingNextPage ? <SearchNotice pending term="" empty={false} /> : null}
          {search.hasNextPage ? (
            <Tap onPress={() => void search.fetchNextPage()} style={{ ...frame, padding: 10 }}>
              <Text style={display(16)}>More</Text>
            </Tap>
          ) : null}
        </View>
      </ScrollView>
    </Phone>
  );
}
