import { Redirect, router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { PlusButton } from "../src/components/bits";
import { CaseRow, CaseTile, Phone, SortBar, StickyAdd, formatsLine } from "../src/components/chrome";
import { PlatformList, PlatformRow } from "../src/components/platform-row";
import { sortCopies } from "../src/collection";
import { platformById, platformsFor } from "../src/platforms";
import { useCollection } from "../src/store";
import { DISPLAY, INK } from "../src/theme";

export default function HomeScreen() {
  const onboarded = useCollection((state) => state.onboarded);
  const active = useCollection((state) => state.active);
  const order = useCollection((state) => state.order);
  const copies = useCollection((state) => state.copies);
  const catalog = useCollection((state) => state.catalog);
  const sort = useCollection((state) => state.sort);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const reorder = useCollection((state) => state.reorder);
  const setSort = useCollection((state) => state.setSort);
  const toggleFinished = useCollection((state) => state.toggleFinished);

  if (!onboarded) return <Redirect href="/platforms" />;

  const list = platformsFor(switch2RawgId);
  const nameOf = (id: string) => platformById(list, id)?.name ?? id;
  const titleOf = (id: string) => catalog[id]?.title ?? id;
  const activeIds = order.filter((id) => active[id]);
  const sections = activeIds
    .map((id) => ({
      id,
      title: nameOf(id),
      copies: sortCopies(
        copies.filter((copy) => copy.platformId === id),
        sort,
        titleOf,
        nameOf,
      ),
    }))
    .filter((section) => section.copies.length > 0);

  return (
    <Phone title="Collection" kicker="Your shelf" showSettings onSettings={() => router.push("/settings")} footer={activeIds.length > 0 ? <StickyAdd onPress={() => router.push("/add")} /> : null}>
      <ScrollView contentContainerStyle={{ paddingBottom: activeIds.length > 0 ? 120 : 24 }}>
        <PlatformList ids={activeIds} onReorder={reorder}>
          {activeIds.map((id, index) => (
            <PlatformRow
              key={id}
              id={id}
              name={nameOf(id)}
              count={copies.filter((copy) => copy.platformId === id).length}
              highlighted={false}
              beforeId={activeIds[index - 1]}
              afterId={activeIds[index + 1]}
              onOpen={() => router.push(`/shelf/${id}`)}
              onReorder={reorder}
            />
          ))}
        </PlatformList>
        <PlusButton onPress={() => router.push("/platforms")} />
        {sections.length > 0 && (
          <View style={{ padding: 12, gap: 16 }}>
            <View style={{ marginBottom: 16 }}>
              <SortBar sort={sort} onSort={setSort} />
            </View>
            {sections.map((section) => (
              <View key={section.id} style={{ gap: 8 }}>
                <Text
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 22,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: INK,
                    borderBottomWidth: 3,
                    borderBottomColor: INK,
                    paddingBottom: 4,
                  }}
                >
                  {section.title}
                </Text>
                <CaseRow>
                  {section.copies.map((copy) => (
                    <CaseTile
                      key={`${copy.gameId}-${copy.platformId}`}
                      copy={copy}
                      title={titleOf(copy.gameId)}
                      subtitle={formatsLine(copy.formats)}
                      width={104}
                      onOpen={() => router.push(`/game/${copy.gameId}/${copy.platformId}?from=home`)}
                      onToggleFinished={() => toggleFinished(copy.gameId, copy.platformId)}
                    />
                  ))}
                </CaseRow>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Phone>
  );
}
