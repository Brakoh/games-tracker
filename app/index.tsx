import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import { EmptyNote, SkewTag, SquaresTag } from "../src/components/bits";
import { SettingsMenu } from "./settings";
import { BottomDither, CaseRow, CaseTile, ConfirmDialog, Phone, SideSheet, StickyAdd, useFramed } from "../src/components/chrome";
import { Tap } from "../src/components/tap";
import { PlatformList, PlatformRow } from "../src/components/platform-row";
import { sortCopies } from "../src/collection";
import { platformById, platformsFor, menuPlatformId, systemIds, shownOrder } from "../src/platforms";
import { useCollection } from "../src/store";
import { DISPLAY, INK, RED, hardSm } from "../src/theme";

const LINE_PAPER = "#E7E2D2";

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
  const params = useLocalSearchParams<{ sheet?: string }>();
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  const [pendingOff, setPendingOff] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sheet = params.sheet === "games" ? "games" : "platforms";
  const openSheet = (next: "platforms" | "games") => {
    if (next === "games") router.setParams({ sheet: "games" });
    else router.replace("/");
  };

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
    <Phone bare>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 12,
          paddingTop: framed ? 12 : Math.max(insets.top, 12),
          paddingBottom: 4,
        }}
      >
        <SkewTag label="games" height={34} active={sheet === "games"} onPress={() => openSheet("games")} />
        <SkewTag label="platforms" height={34} active={sheet === "platforms"} onPress={() => openSheet("platforms")} />
        <View style={{ flex: 1 }} />
        <SquaresTag label="Settings" height={34} onPress={() => setSettingsOpen(true)} />
      </View>
      {activeIds.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyNote />
        </View>
      ) : sheet === "platforms" ? (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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
        </ScrollView>
      ) : sections.length === 0 ? (
        <EmptyNote />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, paddingBottom: 120, gap: 18 }}>
          {sections.map((section) => (
            <View
              key={section.id}
              style={{
                paddingTop: 6,
                paddingBottom: 10,
                paddingHorizontal: 10,
                borderWidth: 3,
                borderColor: INK,
                backgroundColor: LINE_PAPER,
                ...hardSm,
              }}
            >
              <Tap
                accessibilityLabel={section.title}
                onPress={() => router.push(`/shelf/${section.id}?from=games`)}
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={{ flexShrink: 0, fontFamily: DISPLAY, fontSize: 22, letterSpacing: 0.5, textTransform: "uppercase", color: INK }}>{section.title}</Text>
                <DotRule />
              </Tap>
              <Pressable
                onPress={() => router.push(`/shelf/${section.id}?from=games`)}
                style={{ marginTop: 8, touchAction: "pan-x" }}
              >
                <CaseRow bleed={10} padTop={0} padBottom={0}>
                  {section.copies.map((copy) => (
                    <CaseTile
                      key={`${copy.gameId}-${copy.platformId}`}
                      copy={copy}
                      title={titleOf(copy.gameId)}
                      width={104}
                      lines={1}
                      inert
                      onOpen={() => {}}
                    />
                  ))}
                </CaseRow>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      <BottomDither />
      <StickyAdd
        label={sheet === "games" ? "Add a game" : "Edit systems"}
        onPress={() => router.push(sheet === "games" ? "/add" : "/platforms")}
      />
      <SideSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <Text style={{ paddingHorizontal: 12, fontFamily: DISPLAY, fontSize: 28, lineHeight: 30, letterSpacing: 0.5, color: RED, textTransform: "uppercase" }}>Settings</Text>
        <SettingsMenu onNavigate={() => setSettingsOpen(false)} />
      </SideSheet>
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

function DotRule() {
  if (Platform.OS === "web") {
    return (
      <View
        style={
          {
            flex: 1,
            height: 4,
            backgroundImage: "radial-gradient(#0C0B08 0.7px, transparent 0.8px)",
            backgroundSize: "4px 4px",
            backgroundRepeat: "repeat-x",
            backgroundPosition: "left center",
          } as object
        }
      />
    );
  }
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", overflow: "hidden", gap: 3 }}>
      {Array.from({ length: 48 }, (_, index) => (
        <View key={index} style={{ width: 1, height: 1, borderRadius: 1, backgroundColor: INK }} />
      ))}
    </View>
  );
}
