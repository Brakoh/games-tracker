import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { EmptyNote, PlusButton } from "../src/components/bits";
import { CaseRow, CaseTile, Phone, formatsLine } from "../src/components/chrome";
import { PlatformList, PlatformRow } from "../src/components/platform-row";
import { sortCopies } from "../src/collection";
import { platformById, platformsFor } from "../src/platforms";
import { useCollection } from "../src/store";
import { BODY, CARD, DISPLAY, hard, INK, RED } from "../src/theme";

export default function HomeScreen() {
  const onboarded = useCollection((state) => state.onboarded);
  const active = useCollection((state) => state.active);
  const order = useCollection((state) => state.order);
  const copies = useCollection((state) => state.copies);
  const catalog = useCollection((state) => state.catalog);
  const sort = useCollection((state) => state.sort);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const reorder = useCollection((state) => state.reorder);
  const turnOff = useCollection((state) => state.turnOff);
  const toggleFinished = useCollection((state) => state.toggleFinished);
  const [pendingOff, setPendingOff] = useState<string | null>(null);

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
    <Phone title="Collection" kicker="Your shelf" showSettings onSettings={() => router.push("/settings")}>
      {activeIds.length === 0 ? (
        <View style={{ flex: 1, paddingBottom: 16 }}>
          <EmptyNote />
          <PlusButton onPress={() => router.push("/platforms")} />
        </View>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
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
              onTurnOff={() => setPendingOff(id)}
            />
          ))}
        </PlatformList>
        <PlusButton onPress={() => router.push("/platforms")} />
        {sections.length > 0 && (
          <View style={{ padding: 12, paddingTop: 20, gap: 16 }}>
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
      )}
      <Modal visible={pendingOff !== null} transparent animationType="fade" onRequestClose={() => setPendingOff(null)}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "rgba(12,11,8,0.78)" }}>
          <Pressable accessibilityLabel="Cancel" onPress={() => setPendingOff(null)} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
          <View style={{ width: "100%", maxWidth: 320, backgroundColor: CARD, borderWidth: 3, borderColor: INK, ...hard, padding: 16, gap: 14 }}>
            <Text style={{ fontFamily: DISPLAY, fontSize: 22, lineHeight: 26, letterSpacing: 0.4, textTransform: "uppercase", color: INK }}>
              Are you sure you want to disable this category?
            </Text>
            <Text style={{ fontFamily: BODY, fontSize: 13, lineHeight: 18, color: INK }}>You can turn it back on from the system edit menu.</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={() => setPendingOff(null)}
                style={{ flex: 1, alignItems: "center", borderWidth: 3, borderColor: INK, backgroundColor: CARD, ...hard, paddingVertical: 8 }}
              >
                <Text style={{ fontFamily: DISPLAY, fontSize: 16, letterSpacing: 0.4, color: INK }}>CANCEL</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Yes"
                onPress={() => {
                  if (pendingOff) turnOff(pendingOff);
                  setPendingOff(null);
                }}
                style={{ flex: 1, alignItems: "center", borderWidth: 3, borderColor: INK, backgroundColor: RED, ...hard, paddingVertical: 8 }}
              >
                <Text style={{ fontFamily: DISPLAY, fontSize: 16, letterSpacing: 0.4, color: "#FFFFFF" }}>YES</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Phone>
  );
}
