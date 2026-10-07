import { Redirect, router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { EmptyNote, PlusButton } from "../src/components/bits";
import { CaseRow, CaseTile, ConfirmDialog, Phone } from "../src/components/chrome";
import { PlatformList, PlatformRow } from "../src/components/platform-row";
import { sortCopies } from "../src/collection";
import { platformById, platformsFor, menuPlatformId, systemIds, shownOrder } from "../src/platforms";
import { useCollection } from "../src/store";
import { DISPLAY, INK } from "../src/theme";

export default function HomeScreen() {
  const onboarded = useCollection((state) => state.onboarded);
  const active = useCollection((state) => state.active);
  const order = useCollection((state) => state.order);
  const favorites = useCollection((state) => state.favorites) ?? [];
  const copies = useCollection((state) => state.copies);
  const catalog = useCollection((state) => state.catalog);
  const sort = useCollection((state) => state.sort);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const reorder = useCollection((state) => state.reorder);
  const toggleFavorite = useCollection((state) => state.toggleFavorite);
  const turnOff = useCollection((state) => state.turnOff);
  const [pendingOff, setPendingOff] = useState<string | null>(null);

  if (!onboarded) return <Redirect href="/platforms" />;

  const list = platformsFor(switch2RawgId);
  const nameOf = (id: string) => platformById(list, menuPlatformId(id))?.name ?? id;
  const titleOf = (id: string) => catalog[id]?.title ?? id;
  const activeIds = shownOrder(order, active, favorites);
  const favoriteCount = activeIds.filter((id) => favorites.includes(id)).length;
  const onSystem = (id: string) => new Set(systemIds(id));
  const sections = activeIds
    .map((id) => ({
      id,
      title: nameOf(id),
      copies: sortCopies(
        copies.filter((copy) => onSystem(id).has(copy.platformId)),
        sort,
        titleOf,
        nameOf,
      ),
    }))
    .filter((section) => section.copies.length > 0);

  return (
    <Phone title="Collection" kicker="Your shelf" showSettings onSettings={() => router.push("/settings")}>
      {activeIds.length === 0 ? (
        <View style={{ flex: 1, paddingBottom: 16 }}>
          <EmptyNote />
          <PlusButton onPress={() => router.push("/platforms")} />
        </View>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <PlatformList ids={activeIds} favoriteCount={favoriteCount} confirming={pendingOff} onReorder={reorder}>
          {activeIds.map((id, index) => (
            <PlatformRow
              key={id}
              id={id}
              name={nameOf(id)}
              logo={platformById(list, id)?.logo}
              count={copies.filter((copy) => onSystem(id).has(copy.platformId)).length}
              highlighted={false}
              favorite={index < favoriteCount}
              beforeId={activeIds[index - 1]}
              afterId={activeIds[index + 1]}
              onOpen={() => router.push(`/shelf/${id}`)}
              onReorder={reorder}
              onTurnOff={() => setPendingOff(id)}
              onFavorite={() => toggleFavorite(id)}
            />
          ))}
        </PlatformList>
        <PlusButton onPress={() => router.push("/platforms")} />
        {sections.length > 0 && (
          <View style={{ padding: 12, paddingTop: 60, gap: 16 }}>
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
                      width={104}
                      onOpen={() => router.push(`/game/${copy.gameId}/${copy.platformId}?from=home`)}
                    />
                  ))}
                </CaseRow>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      )}
      <ConfirmDialog
        visible={pendingOff !== null}
        title="Are you sure you want to disable this category?"
        note="You can turn it back on from the system edit menu."
        onCancel={() => setPendingOff(null)}
        onConfirm={() => {
          if (pendingOff) turnOff(pendingOff);
          setPendingOff(null);
        }}
      />
    </Phone>
  );
}
