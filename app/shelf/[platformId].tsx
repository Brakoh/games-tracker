import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Animated, Easing, Image, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { sortCopies } from "../../src/collection";
import { useCaseCover } from "../../src/case-cover";
import { EmptyNote, FinishedRosette, MissingCover, SkewTag, ViewToggle } from "../../src/components/bits";
import { BottomDither, CaseTile, Phone, SortBar, StickyAdd, useFramed } from "../../src/components/chrome";
import { PressShade, Tap } from "../../src/components/tap";
import { menuPlatformId, platformById, platformsFor, shownOrder, systemIds } from "../../src/platforms";
import { useCollection } from "../../src/store";
import { CARD, DISPLAY, hard, hardSm, INK, RED } from "../../src/theme";
import type { Copy } from "../../src/types";

function DownTriangle() {
  return (
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: 4,
        borderRightWidth: 4,
        borderTopWidth: 5,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: "#FFFFFF",
      }}
    />
  );
}

function MenuDots() {
  if (Platform.OS === "web") {
    return (
      <View
        style={
          {
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
    <View style={{ height: 4, flexDirection: "row", alignItems: "center", overflow: "hidden", gap: 3 }}>
      {Array.from({ length: 40 }, (_, index) => (
        <View key={index} style={{ width: 1, height: 1, borderRadius: 1, backgroundColor: INK }} />
      ))}
    </View>
  );
}

const MENU_ROW = 26;
const MENU_VISIBLE = 6;

function ConsoleButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tap
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        transform: [{ skewX: "-12deg" }],
        transformOrigin: "right top",
        backgroundColor: RED,
        borderWidth: 3,
        borderColor: INK,
        ...hardSm,
        height: 34,
        paddingHorizontal: 12,
        justifyContent: "center",
      }}
    >
      <View style={{ transform: [{ skewX: "12deg" }], flexDirection: "row", alignItems: "center", gap: 8 }}>
        <DownTriangle />
        <Text numberOfLines={1} style={{ flexShrink: 1, color: "#FFFFFF", fontFamily: DISPLAY, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase" }}>
          {label}
        </Text>
      </View>
    </Tap>
  );
}

function ShelfThumb({ cover }: { cover?: string }) {
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const ready = !!cover && loaded === cover;
  const missing = !cover || failed === cover;
  return (
    <View
      style={{
        width: 32,
        height: 42,
        borderWidth: 2,
        borderColor: INK,
        overflow: "hidden",
        backgroundColor: "#E7E2D2",
        ...(Platform.OS === "web"
          ? ({
              backgroundImage: "radial-gradient(#0C0B08 0.7px, transparent 0.8px)",
              backgroundSize: "4px 4px",
            } as object)
          : null),
      }}
    >
      {cover ? (
        <Image
          accessible={false}
          source={{ uri: cover }}
          resizeMode="cover"
          onLoad={() => setLoaded(cover)}
          onError={() => setFailed(cover)}
          style={{ width: "100%", height: "100%", opacity: ready ? 1 : 0 }}
        />
      ) : null}
      {missing ? <MissingCover width={25} /> : null}
    </View>
  );
}

function ShelfLine({
  copy,
  title,
  onOpen,
}: {
  copy: Copy;
  title: string;
  onOpen: () => void;
}) {
  const stored = useCollection((state) => state.catalog[copy.gameId]?.cover);
  const front = useCaseCover(copy.gameId, copy.platformId, title) || (stored?.startsWith("https://images.igdb.com/") ? stored : undefined);
  return (
    <Tap
      shade={false}
      accessibilityLabel={title}
      onPress={onOpen}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hard,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }}
    >
      {(dim) => (
        <>
      <View>
        <ShelfThumb cover={front} />
        <PressShade opacity={dim} />
        {copy.finished ? <FinishedRosette size={18} inset={-6} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: DISPLAY, fontSize: 16, letterSpacing: 0.4, textTransform: "uppercase", color: INK }} numberOfLines={1}>
          {title}
        </Text>
      </View>
        </>
      )}
    </Tap>
  );
}

export default function ShelfScreen() {
  const { platformId, from } = useLocalSearchParams<{ platformId: string; from?: string }>();
  const id = String(platformId);
  const copies = useCollection((state) => state.copies);
  const catalog = useCollection((state) => state.catalog);
  const sort = useCollection((state) => state.sort);
  const shelfView = useCollection((state) => state.shelfView);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const order = useCollection((state) => state.order);
  const active = useCollection((state) => state.active);
  const favorites = useCollection((state) => state.favorites) ?? [];
  const setSort = useCollection((state) => state.setSort);
  const setShelfView = useCollection((state) => state.setShelfView);
  const list = platformsFor(switch2RawgId);
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  const [consolesOpen, setConsolesOpen] = useState(false);
  const [menuAtEnd, setMenuAtEnd] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const buttonRef = useRef<View>(null);
  const menuProgress = useRef(new Animated.Value(0)).current;
  const menuLive = useRef(false);
  const menuGeneration = useRef(0);
  const menuId = menuPlatformId(id);
  const nameOf = (platform: string) => platformById(list, menuPlatformId(platform))?.name ?? platform;
  const titleOf = (gameId: string) => catalog[gameId]?.title ?? gameId;
  const consoles = shownOrder(order, active, favorites);
  const shown = Math.min(MENU_VISIBLE, consoles.length);
  const listHeight = shown * MENU_ROW + Math.max(0, shown - 1) * 4;
  const menuFade = consoles.length > MENU_VISIBLE ? 28 : 0;
  const menuWindow = listHeight + menuFade;
  const menuHeight = menuProgress.interpolate({ inputRange: [0, 1], outputRange: [0, menuWindow] });

  useEffect(() => {
    const generation = ++menuGeneration.current;
    if (consolesOpen) {
      menuLive.current = true;
      menuProgress.stopAnimation();
      menuProgress.setValue(0);
      setMenuMounted(true);
      const frame = requestAnimationFrame(() => {
        Animated.timing(menuProgress, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      });
      return () => cancelAnimationFrame(frame);
    }
    if (!menuLive.current) return;
    Animated.timing(menuProgress, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: false }).start(({ finished }) => {
      if (finished && menuGeneration.current === generation) {
        menuLive.current = false;
        setMenuMounted(false);
      }
    });
  }, [consolesOpen, menuProgress]);

  const toggleConsoles = () => {
    if (consolesOpen) {
      setConsolesOpen(false);
      return;
    }
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      if (width === 0) return;
      setMenuAtEnd(false);
      setAnchor({ x, y, width, height });
      setConsolesOpen(true);
    });
  };
  const ids = new Set(systemIds(menuId));
  const shelf = sortCopies(
    copies.filter((copy) => ids.has(copy.platformId)),
    sort,
    titleOf,
    nameOf,
  );

  return (
    <Phone
      bare
      footer={
        <>
          <BottomDither />
          <StickyAdd onPress={() => router.push(`/add?platformId=${menuId}`)} />
        </>
      }
    >
      <View style={{ zIndex: 5 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            paddingTop: framed ? 12 : Math.max(insets.top, 12),
            paddingBottom: 8,
            borderBottomWidth: 3,
            borderBottomColor: INK,
          }}
        >
          <SkewTag label="Back" height={34} onPress={() => router.replace(from === "games" ? "/?sheet=games" : "/")} />
          <View ref={buttonRef} collapsable={false} style={{ marginLeft: 8, maxWidth: 250, flexShrink: 1, opacity: menuMounted ? 0 : 1 }}>
            <ConsoleButton label={nameOf(menuId)} onPress={toggleConsoles} />
          </View>
        </View>
      </View>
      <Modal visible={menuMounted} transparent animationType="none" onRequestClose={() => setConsolesOpen(false)}>
        <View style={{ flex: 1 }}>
          <Animated.View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(12,11,8,0.5)", opacity: menuProgress }}>
            <Pressable accessibilityLabel="Close" onPress={() => setConsolesOpen(false)} style={{ flex: 1 }} />
          </Animated.View>
          {anchor ? (
            <>
              <View style={{ position: "absolute", top: anchor.y, left: anchor.x, width: anchor.width, zIndex: 2 }}>
                <ConsoleButton label={nameOf(menuId)} onPress={() => setConsolesOpen(false)} />
              </View>
              <View
                style={{
                  position: "absolute",
                  top: anchor.y + anchor.height - 3,
                  left: anchor.x + anchor.width - Math.max(anchor.width, 180),
                  width: Math.max(anchor.width, 180),
                  zIndex: 3,
                  ...hardSm,
                }}
              >
                <Animated.View style={{ height: menuHeight, overflow: "hidden" }}>
                  <View style={{ height: menuWindow, backgroundColor: CARD, borderWidth: 3, borderColor: INK, position: "relative" }}>
                    <ScrollView
                      style={{ height: menuWindow }}
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                      scrollEnabled={consoles.length > MENU_VISIBLE}
                      scrollEventThrottle={16}
                      onScroll={(event) => {
                        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                        const end = contentOffset.y + layoutMeasurement.height >= contentSize.height - 2;
                        setMenuAtEnd((current) => (current === end ? current : end));
                      }}
                    >
                      {consoles.map((consoleId, index) => (
                        <View key={consoleId}>
                          {index > 0 ? <MenuDots /> : null}
                          <Tap
                            accessibilityLabel={nameOf(consoleId)}
                            onPress={() => {
                              setConsolesOpen(false);
                              if (consoleId !== menuId) router.replace(from === "games" ? `/shelf/${consoleId}?from=games` : `/shelf/${consoleId}`);
                            }}
                            style={{ height: MENU_ROW, justifyContent: "center", paddingHorizontal: 10 }}
                          >
                            <Text numberOfLines={1} style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", color: INK }}>
                              {nameOf(consoleId)}
                            </Text>
                          </Tap>
                        </View>
                      ))}
                    </ScrollView>
                    {consoles.length > MENU_VISIBLE && !menuAtEnd ? <BottomDither height={menuFade} /> : null}
                  </View>
                </Animated.View>
              </View>
            </>
          ) : null}
        </View>
      </Modal>
      {shelf.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyNote />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, paddingBottom: 120, gap: 32 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <SortBar sort={sort} onSort={setSort} />
            </View>
            <ViewToggle grid={shelfView === "grid"} onPress={() => setShelfView(shelfView === "grid" ? "list" : "grid")} />
          </View>
          {shelfView === "grid" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -5 }}>
              {shelf.map((copy) => (
                <View key={`${copy.gameId}-${copy.platformId}`} style={{ width: "33.33%", padding: 5 }}>
                  <CaseTile
                    copy={copy}
                    title={titleOf(copy.gameId)}
                    onOpen={() => router.push(`/game/${copy.gameId}/${copy.platformId}?from=shelf${from === "games" ? "&sheet=games" : ""}`)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {shelf.map((copy) => (
                <ShelfLine
                  key={`${copy.gameId}-${copy.platformId}`}
                  copy={copy}
                  title={titleOf(copy.gameId)}
                  onOpen={() => router.push(`/game/${copy.gameId}/${copy.platformId}?from=shelf${from === "games" ? "&sheet=games" : ""}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </Phone>
  );
}
