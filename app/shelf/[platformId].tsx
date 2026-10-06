import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import { sortCopies } from "../../src/collection";
import { CaseTile, Phone, SortBar, StickyAdd, formatsLine } from "../../src/components/chrome";
import { platformById, platformsFor } from "../../src/platforms";
import { useCollection } from "../../src/store";

export default function ShelfScreen() {
  const { platformId } = useLocalSearchParams<{ platformId: string }>();
  const id = String(platformId);
  const copies = useCollection((state) => state.copies);
  const catalog = useCollection((state) => state.catalog);
  const sort = useCollection((state) => state.sort);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const setSort = useCollection((state) => state.setSort);
  const toggleFinished = useCollection((state) => state.toggleFinished);
  const list = platformsFor(switch2RawgId);
  const nameOf = (platform: string) => platformById(list, platform)?.name ?? platform;
  const titleOf = (gameId: string) => catalog[gameId]?.title ?? gameId;
  const shelf = sortCopies(
    copies.filter((copy) => copy.platformId === id),
    sort,
    titleOf,
    nameOf,
  );

  return (
    <Phone
      title={nameOf(id)}
      showBack
      onBack={() => router.replace("/")}
      footer={<StickyAdd onPress={() => router.push(`/add?platformId=${id}`)} />}
    >
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 120, gap: 32 }}>
        <SortBar sort={sort} onSort={setSort} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -5 }}>
          {shelf.map((copy) => (
            <View key={`${copy.gameId}-${copy.platformId}`} style={{ width: "33.33%", padding: 5 }}>
              <CaseTile
                copy={copy}
                title={titleOf(copy.gameId)}
                subtitle={formatsLine(copy.formats)}
                onOpen={() => router.push(`/game/${copy.gameId}/${copy.platformId}?from=shelf`)}
                onToggleFinished={() => toggleFinished(copy.gameId, copy.platformId)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </Phone>
  );
}
