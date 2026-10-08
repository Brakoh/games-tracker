import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, router } from "expo-router";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { ConsoleLogo, EmptyNote, SkewTag, SquaresTag } from "../src/components/bits";
import { SettingsMenu } from "./settings";
import { BottomDither, CaseRow, CaseTile, ConfirmDialog, Phone, SideSheet, StickyAdd, useFramed } from "../src/components/chrome";
import { PressShade } from "../src/components/tap";
import { PlatformList, PlatformRow } from "../src/components/platform-row";
import { sortCopies } from "../src/collection";
import { brandName, platformById, platformsFor, menuPlatformId, systemIds, shownOrder } from "../src/platforms";
import { useCollection } from "../src/store";
import { BODY, CARD, DISPLAY, INK, RED, hardSm } from "../src/theme";

const LINE_PAPER = "#E7E2D2";

let sessionTab: "games" | "platforms" | null = null;

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
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  const [pendingOff, setPendingOff] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sheet, setSheet] = useState<"games" | "platforms">(sessionTab ?? "games");
  const openSheet = (next: "platforms" | "games") => {
    sessionTab = next;
    setSheet(next);
  };
  useEffect(() => {
    sessionTab = sheet;
  }, [sheet]);

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
          paddingBottom: 8,
          borderBottomWidth: 3,
          borderBottomColor: INK,
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
          {sections.map((section) => {
            const open = () => router.push(`/shelf/${section.id}?from=games`);
            const brand = brandName(section.id);
            return (
              <TablePress
                key={section.id}
                label={brand ? `${section.title}, ${brand}` : section.title}
                onPress={open}
              >
                <View pointerEvents="none" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <LogoMark uri={platformById(list, section.id)?.logo} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontFamily: DISPLAY, fontSize: 22, lineHeight: 30, letterSpacing: 0.5, textTransform: "uppercase", color: INK }}>{section.title}</Text>
                    {brand ? <Text numberOfLines={1} style={{ marginTop: 2, fontFamily: BODY, fontSize: 11, lineHeight: 14, color: INK }}>{brand}</Text> : null}
                  </View>
                </View>
                <View style={{ marginTop: 10 }}>
                  <CaseRow bleed={10} padTop={0} padBottom={0}>
                    {section.copies.map((copy) => (
                      <CaseTile
                        key={`${copy.gameId}-${copy.platformId}`}
                        copy={copy}
                        title={titleOf(copy.gameId)}
                        width={104}
                        lines={1}
                        onOpen={() => router.push(`/game/${copy.gameId}/${copy.platformId}?from=home&sheet=games`)}
                      />
                    ))}
                    <RowRest onPress={open} />
                  </CaseRow>
                </View>
                <View
                  pointerEvents="none"
                  style={{
                    marginHorizontal: -10,
                    marginTop: 8,
                    borderTopWidth: 2,
                    borderTopColor: INK,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ color: INK, fontSize: 12, lineHeight: 16 }}>★</Text>
                    <Text style={{ fontFamily: BODY, fontSize: 12, lineHeight: 16, color: INK }}>{tally(section.copies)}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontFamily: BODY, fontSize: 12, lineHeight: 16, color: INK }}>view collection &gt;</Text>
                </View>
              </TablePress>
            );
          })}
        </ScrollView>
      )}
      <BottomDither />
      <StickyAdd
        label={sheet === "games" ? "Add a game" : "Edit systems"}
        onPress={() => router.push(sheet === "games" ? "/add" : "/platforms")}
      />
      <SideSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <Text style={{ paddingHorizontal: 12, fontFamily: DISPLAY, fontSize: 28, lineHeight: 38, letterSpacing: 0.5, color: RED, textTransform: "uppercase" }}>Settings</Text>
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

const TablePressControls = createContext<{ arm: () => void; release: () => void } | null>(null);

function RowRest({ onPress }: { onPress: () => void }) {
  const table = useContext(TablePressControls);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => table?.arm()}
      onPressOut={() => table?.release()}
      style={{ flexGrow: 1, alignSelf: "stretch" }}
    />
  );
}

function TablePress({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  const pressed = useRef(new Animated.Value(0)).current;
  const shade = pressed.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] });
  const scale = pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  const sink = (to: number) => {
    Animated.timing(pressed, {
      toValue: to,
      duration: to === 1 ? 90 : 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };
  const controls = useRef({ arm: () => sink(1), release: () => sink(0) }).current;
  return (
    <TablePressControls.Provider value={controls}>
      <Animated.View
        style={{
          transform: [{ scale }],
          paddingTop: 10,
          paddingHorizontal: 10,
          borderWidth: 3,
          borderColor: INK,
          backgroundColor: LINE_PAPER,
          ...hardSm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          onPressIn={() => sink(1)}
          onPressOut={() => sink(0)}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        {children}
        <PressShade opacity={shade} />
      </Animated.View>
    </TablePressControls.Provider>
  );
}

function tally(copies: { finished: boolean }[]) {
  const pad = (value: number) => String(value).padStart(3, "0");
  const finished = copies.filter((copy) => copy.finished).length;
  return `${pad(finished)}/${pad(copies.length)}`;
}

function LogoMark({ uri }: { uri?: string }) {
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderWidth: 2,
        borderColor: INK,
        backgroundColor: CARD,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        ...(Platform.OS === "web"
          ? ({
              backgroundImage: "radial-gradient(#0C0B08 0.55px, transparent 0.65px)",
              backgroundSize: "3px 3px",
            } as object)
          : null),
      }}
    >
      <ConsoleLogo uri={uri} width={34} height={18} />
    </View>
  );
}
