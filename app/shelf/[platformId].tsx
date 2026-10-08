import { useEffect, useRef, useState, type ReactNode } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Animated, Easing, Image, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SvgXml } from "react-native-svg";

import { sortCopies } from "../../src/collection";
import { bannerKey, useCaseCover } from "../../src/case-cover";
import { forgetCover } from "../../src/cover-cache";
import { COMPLETED_XML, NON_COMPLETED_XML } from "../../src/finished-badge";
import { EmptyNote, FinishedRosette, MissingCover, SkewTag, TrashIcon, ViewToggle } from "../../src/components/bits";
import { BottomDither, CaseTile, ConfirmDialog, Phone, StickyAdd, useFramed } from "../../src/components/chrome";
import { PressShade, Tap } from "../../src/components/tap";
import { menuPlatformId, platformById, platformsFor, shownOrder, systemIds } from "../../src/platforms";
import { useCollection } from "../../src/store";
import { CARD, DISPLAY, hard, hardSm, INK, PAPER, RED } from "../../src/theme";
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
  onLongPress,
  mark,
}: {
  copy: Copy;
  title: string;
  onOpen: () => void;
  onLongPress?: () => void;
  mark?: ReactNode;
}) {
  const stored = useCollection((state) => state.catalog[copy.gameId]?.cover);
  const front = useCaseCover(copy.gameId, copy.platformId, title) || (stored?.startsWith("https://images.igdb.com/") ? stored : undefined);
  return (
    <View
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
      <Tap shade={false} accessibilityLabel={title} onPress={onOpen} onLongPress={onLongPress} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
        {(dim) => (
          <>
            <View>
              <ShelfThumb cover={front} />
              <PressShade opacity={dim} />
              {copy.finished ? <FinishedRosette size={18} inset={-6} /> : null}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: DISPLAY, fontSize: 16, letterSpacing: 0.4, textTransform: "uppercase", color: INK }} numberOfLines={1}>
                {title}
              </Text>
            </View>
            {mark}
          </>
        )}
      </Tap>
    </View>
  );
}

function SelectBox({ checked }: { checked: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={{
        width: 18,
        height: 18,
        borderWidth: 2,
        borderColor: INK,
        backgroundColor: checked ? RED : CARD,
      }}
    />
  );
}

function CrossMark() {
  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: 14, height: 2, backgroundColor: "#FFFFFF", transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", width: 14, height: 2, backgroundColor: "#FFFFFF", transform: [{ rotate: "-45deg" }] }} />
    </View>
  );
}

function IconTag({
  label,
  onPress,
  red,
  disabled,
  fill,
  children,
}: {
  label: string;
  onPress: () => void;
  red?: boolean;
  disabled?: boolean;
  fill?: boolean;
  children: ReactNode;
}) {
  const style = {
    transform: [{ skewX: "-12deg" as const }],
    backgroundColor: red ? RED : CARD,
    borderWidth: 3,
    borderColor: INK,
    ...hardSm,
    paddingVertical: fill ? 2 : 6,
    paddingHorizontal: fill ? 4 : 10,
    justifyContent: "center" as const,
    ...(disabled ? { filter: "saturate(0)" as unknown as [] } : null),
  };
  const glyph = <View style={{ transform: [{ skewX: "12deg" }] }}>{children}</View>;
  if (disabled) {
    return (
      <View accessibilityLabel={label} accessibilityState={{ disabled: true }} style={style}>
        {glyph}
      </View>
    );
  }
  return (
    <Tap accessibilityLabel={label} onPress={onPress} style={style}>
      {glyph}
    </Tap>
  );
}

const GENTLE = Easing.bezier(0.47, 0, 0.23, 1.38);
const GENTLE_BACK = Easing.bezier(0.77, -0.38, 0.53, 1);
const BAND = "#E3DCC8";
const BAND_FADE = [40, 120];

function HoldButton({ label, onPress, red, children }: { label: string; onPress: () => void; red?: boolean; children: ReactNode }) {
  return (
    <Tap
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        backgroundColor: red ? RED : CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hardSm,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </Tap>
  );
}

function HoldMenu({
  held,
  title,
  onClose,
  onTrash,
  onToggle,
}: {
  held: { copy: Copy; frame: { x: number; y: number; width: number; height: number } };
  title: string;
  onClose: () => void;
  onTrash: () => void;
  onToggle: () => void;
}) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { copy, frame } = held;
  const size = 44;
  const cover = frame.height > 110;
  let left = frame.x + frame.width - (cover ? 20 : size + 8);
  if (left + size > screenW - 10) left = Math.max(8, screenW - 10 - size);
  const stack = size * 2 + 6;
  let top = cover ? frame.y + 10 : frame.y + (frame.height - stack) / 2;
  if (top < 8) top = 8;
  if (top + stack > screenH - 8) top = Math.max(8, screenH - 8 - stack);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(12,11,8,0.5)" }} />
        <View pointerEvents="none" style={{ position: "absolute", left: frame.x, top: frame.y, width: frame.width, backgroundColor: PAPER, transform: [{ scale: 1.03 }] }}>
          {cover ? (
            <CaseTile inert copy={copy} title={title} onOpen={() => {}} />
          ) : (
            <ShelfLine copy={copy} title={title} onOpen={() => {}} />
          )}
        </View>
        <View style={{ position: "absolute", left, top, gap: 6 }}>
          <HoldButton label="Remove from library" red onPress={onTrash}>
            <TrashIcon />
          </HoldButton>
          <HoldButton label={copy.finished ? "Unmark as completed" : "Mark as completed"} onPress={onToggle}>
            <SvgXml xml={copy.finished ? NON_COMPLETED_XML : COMPLETED_XML} width={26} height={26} />
          </HoldButton>
        </View>
      </View>
    </Modal>
  );
}

function SelectSwitch({ on, onPress }: { on: boolean; onPress: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const seen = useRef(false);
  const [wordW, setWordW] = useState(0);
  const [crossW, setCrossW] = useState(0);
  const [wordH, setWordH] = useState(0);
  const [crossH, setCrossH] = useState(0);

  useEffect(() => {
    if (!seen.current) {
      seen.current = true;
      progress.setValue(on ? 1 : 0);
      return;
    }
    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: on ? 1 : 0,
      duration: 200,
      easing: on ? GENTLE_BACK : GENTLE,
      useNativeDriver: false,
    }).start();
  }, [on, progress]);

  const ready = wordW > 0 && crossW > 0 && wordH > 0 && crossH > 0;
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: [wordW || 1, crossW || 1], extrapolate: "extend" });
  const height = progress.interpolate({ inputRange: [0, 1], outputRange: [wordH || 1, crossH || 1], extrapolate: "extend" });
  const wordOpacity = progress.interpolate({ inputRange: [0, 0.35, 0.8, 1], outputRange: [1, 1, 0, 0], extrapolate: "clamp" });
  const crossOpacity = progress.interpolate({ inputRange: [0, 0.2, 0.65, 1], outputRange: [0, 0, 1, 1], extrapolate: "clamp" });
  const shell = {
    borderWidth: 3,
    borderColor: INK,
    ...hardSm,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    transform: [{ skewX: "-12deg" as const }],
  };

  return (
    <View>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", opacity: 0 }}>
        <View
          style={{ alignSelf: "flex-start" }}
          onLayout={(event) => {
            setWordW(Math.ceil(event.nativeEvent.layout.width));
            setWordH(Math.ceil(event.nativeEvent.layout.height));
          }}
        >
          <SkewTag label="select" onPress={() => {}} />
        </View>
        <View
          style={{ alignSelf: "flex-start" }}
          onLayout={(event) => {
            setCrossW(Math.ceil(event.nativeEvent.layout.width));
            setCrossH(Math.ceil(event.nativeEvent.layout.height));
          }}
        >
          <IconTag label="Close" red onPress={() => {}}>
            <CrossMark />
          </IconTag>
        </View>
      </View>
      {ready ? (
        <Pressable accessibilityRole="button" accessibilityLabel={on ? "Close" : "select"} onPress={onPress}>
          <Animated.View style={{ width, height }}>
            <Animated.View style={[shell, { flex: 1, backgroundColor: CARD, opacity: wordOpacity, paddingHorizontal: 12 }]}>
              <Text style={{ transform: [{ skewX: "12deg" }], color: INK, fontFamily: DISPLAY, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase" }}>
                select
              </Text>
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[shell, { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: RED, opacity: crossOpacity }]}
            >
              <View style={{ transform: [{ skewX: "12deg" }] }}>
                <CrossMark />
              </View>
            </Animated.View>
          </Animated.View>
        </Pressable>
      ) : (
        <SkewTag label="select" onPress={onPress} />
      )}
    </View>
  );
}

function SelectTools({
  open,
  enabled,
  onRemove,
  onFinish,
  onClear,
}: {
  open: boolean;
  enabled: boolean;
  onRemove: () => void;
  onFinish: () => void;
  onClear: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [live, setLive] = useState(false);
  const [widths, setWidths] = useState<[number, number, number]>([0, 0, 0]);
  const generation = useRef(0);
  const ready = widths.every((item) => item > 0);
  const [trashW, markW, clearW] = widths;
  const clearTravel = clearW + 8;
  const markTravel = clearTravel + markW + 8;
  const trashTravel = markTravel + trashW + 8;
  const measure = (index: 0 | 1 | 2) => (event: { nativeEvent: { layout: { width: number } } }) => {
    const next = Math.ceil(event.nativeEvent.layout.width);
    setWidths((current) => (current[index] === next ? current : current.map((item, itemIndex) => (itemIndex === index ? next : item)) as [number, number, number]));
  };

  useEffect(() => {
    if (!open) return;
    setLive(true);
    if (!ready) return;
    progress.stopAnimation();
    progress.setValue(0);
    const frame = requestAnimationFrame(() => {
      Animated.timing(progress, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, ready, progress]);

  useEffect(() => {
    if (open || !live) return;
    const token = ++generation.current;
    progress.stopAnimation();
    Animated.timing(progress, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished && generation.current === token) setLive(false);
    });
  }, [open, live, progress]);

  if (!live) return null;

  const opacity = progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1], extrapolate: "clamp" });
  const slide = (distance: number) => progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0], extrapolate: "clamp" });

  return (
    <Animated.View style={{ flexDirection: "row", alignItems: "center", gap: 8, opacity }}>
      <Animated.View onLayout={measure(0)} style={{ transform: [{ translateX: slide(ready ? trashTravel : 0) }] }}>
        <IconTag label="Remove from library" red disabled={!enabled} onPress={onRemove}>
          <TrashIcon />
        </IconTag>
      </Animated.View>
      <Animated.View onLayout={measure(1)} style={{ transform: [{ translateX: slide(ready ? markTravel : 0) }] }}>
        <IconTag label="Mark as completed" fill disabled={!enabled} onPress={onFinish}>
          <SvgXml xml={COMPLETED_XML} width={30} height={30} />
        </IconTag>
      </Animated.View>
      <Animated.View onLayout={measure(2)} style={{ transform: [{ translateX: slide(ready ? clearTravel : 0) }] }}>
        <IconTag label="Unmark as completed" fill disabled={!enabled} onPress={onClear}>
          <SvgXml xml={NON_COMPLETED_XML} width={30} height={30} />
        </IconTag>
      </Animated.View>
    </Animated.View>
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
  const setShelfView = useCollection((state) => state.setShelfView);
  const finishCopies = useCollection((state) => state.finishCopies);
  const unfinishCopies = useCollection((state) => state.unfinishCopies);
  const toggleFinished = useCollection((state) => state.toggleFinished);
  const removeCopies = useCollection((state) => state.removeCopies);
  const list = platformsFor(switch2RawgId);
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  const [consolesOpen, setConsolesOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [held, setHeld] = useState<{ copy: Copy; frame: { x: number; y: number; width: number; height: number } } | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Copy | null>(null);
  const tileNodes = useRef(new Map<string, View>());
  const skipOpen = useRef(false);
  const [barTop, setBarTop] = useState(0);
  const [toolsBlock, setToolsBlock] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const bandOpacity = scrollY.interpolate({ inputRange: BAND_FADE, outputRange: [0, 1], extrapolate: "clamp" });
  const [picked, setPicked] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
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
  const copyKey = (copy: Copy) => `${copy.gameId}:${copy.platformId}`;
  const chosen = shelf.filter((copy) => picked.includes(copyKey(copy)));
  const togglePick = (copy: Copy) => {
    const key = copyKey(copy);
    setPicked((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };
  const toggleSelecting = () => {
    setSelecting((on) => {
      if (on) setPicked([]);
      return !on;
    });
    setHeld(null);
  };
  const holdGame = (copy: Copy) => {
    if (selecting) return;
    skipOpen.current = true;
    const node = tileNodes.current.get(copyKey(copy));
    node?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) setHeld({ copy, frame: { x, y, width, height } });
    });
  };
  const openHeld = (copy: Copy) => {
    if (skipOpen.current) {
      skipOpen.current = false;
      return;
    }
    if (selecting) togglePick(copy);
    else openGame(copy);
  };
  const openGame = (copy: Copy) => router.push(`/game/${copy.gameId}/${copy.platformId}?from=shelf${from === "games" ? "&sheet=games" : ""}`);

  useEffect(() => {
    setSelecting(false);
    setPicked([]);
    setConfirming(false);
    setHeld(null);
  }, [menuId]);

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
      <View onLayout={(event) => setBarTop(event.nativeEvent.layout.height)} style={{ zIndex: 5 }}>
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
        <>
        <Animated.ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: Platform.OS !== "web" })}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: toolsBlock + 20, paddingBottom: 120 }}
        >
          {shelfView === "grid" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -5 }}>
              {shelf.map((copy) => (
                <View key={copyKey(copy)} style={{ width: "33.33%", padding: 5 }}>
                  <View
                    collapsable={false}
                    ref={(node) => {
                      const key = copyKey(copy);
                      if (node) tileNodes.current.set(key, node);
                      else tileNodes.current.delete(key);
                    }}
                  >
                    <CaseTile
                      copy={copy}
                      title={titleOf(copy.gameId)}
                      onOpen={() => openHeld(copy)}
                      onLongPress={selecting ? undefined : () => holdGame(copy)}
                    />
                    {selecting ? (
                      <View pointerEvents="none" style={{ position: "absolute", top: 8, right: 8, zIndex: 4 }}>
                        <SelectBox checked={picked.includes(copyKey(copy))} />
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {shelf.map((copy) => (
                <View
                  key={copyKey(copy)}
                  collapsable={false}
                  ref={(node) => {
                    const key = copyKey(copy);
                    if (node) tileNodes.current.set(key, node);
                    else tileNodes.current.delete(key);
                  }}
                >
                  <ShelfLine
                    copy={copy}
                    title={titleOf(copy.gameId)}
                    onOpen={() => openHeld(copy)}
                    onLongPress={selecting ? undefined : () => holdGame(copy)}
                    mark={selecting ? <SelectBox checked={picked.includes(copyKey(copy))} /> : null}
                  />
                </View>
              ))}
            </View>
          )}
        </Animated.ScrollView>
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: barTop,
            left: 0,
            right: 0,
            height: toolsBlock,
            zIndex: 3,
            backgroundColor: BAND,
            borderBottomWidth: 3,
            borderBottomColor: INK,
            opacity: bandOpacity,
          }}
        />
        <View
          onLayout={(event) => setToolsBlock(Math.ceil(event.nativeEvent.layout.height))}
          style={{
            position: "absolute",
            top: barTop,
            left: 0,
            right: 0,
            zIndex: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 12,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <ViewToggle grid={shelfView === "grid"} onPress={() => setShelfView(shelfView === "grid" ? "list" : "grid")} />
          <View style={{ flex: 1 }} />
          <SelectTools
            open={selecting}
            enabled={chosen.length > 0}
            onRemove={() => setConfirming(true)}
            onFinish={() => finishCopies(chosen.map((copy) => ({ gameId: copy.gameId, platformId: copy.platformId })))}
            onClear={() => unfinishCopies(chosen.map((copy) => ({ gameId: copy.gameId, platformId: copy.platformId })))}
          />
          <SelectSwitch on={selecting} onPress={toggleSelecting} />
        </View>
      </>
      )}
      {held ? (
        <HoldMenu
          held={held}
          title={titleOf(held.copy.gameId)}
          onClose={() => setHeld(null)}
          onTrash={() => {
            setPendingRemove(held.copy);
            setHeld(null);
            setConfirming(true);
          }}
          onToggle={() => {
            toggleFinished(held.copy.gameId, held.copy.platformId);
            setHeld(null);
          }}
        />
      ) : null}
      <ConfirmDialog
        visible={confirming}
        title={!pendingRemove && chosen.length > 1 ? "Are you sure you want to remove these games?" : "Are you sure you want to remove this game?"}
        note="You can add it again from Add a game."
        onCancel={() => {
          setConfirming(false);
          setPendingRemove(null);
        }}
        onConfirm={() => {
          const items = pendingRemove
            ? [{ gameId: pendingRemove.gameId, platformId: pendingRemove.platformId }]
            : chosen.map((copy) => ({ gameId: copy.gameId, platformId: copy.platformId }));
          removeCopies(items);
          for (const item of items) {
            void forgetCover(`${item.gameId}:${item.platformId}`);
            void forgetCover(bannerKey(item.gameId, item.platformId));
          }
          setPicked([]);
          setPendingRemove(null);
          setConfirming(false);
        }}
      />
    </Phone>
  );
}
