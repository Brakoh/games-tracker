import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCaseCover } from "../case-cover";
import { useCollection } from "../store";
import { BODY, CARD, DISPLAY, hard, hardSm, INK, PAPER, RED } from "../theme";
import type { Copy, SortMode } from "../types";
import { FinishedBadge, MissingCover, SkewTag } from "./bits";
import { PressShade, Tap } from "./tap";

const DESKTOP = Platform.OS === "web" && typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

export function useFramed() {
  const { width } = useWindowDimensions();
  return DESKTOP && width >= 760;
}

export function Phone({
  title,
  kicker = "Collection",
  showBack,
  onBack,
  showSettings,
  onSettings,
  footer,
  bare,
  headerRule = true,
  children,
}: {
  title?: string;
  bare?: boolean;
  headerRule?: boolean;
  kicker?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSettings?: boolean;
  onSettings?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  return (
    <View className="flex-1 items-center bg-paper" style={{ paddingTop: framed ? 24 : 0, paddingBottom: framed ? 24 : 0 }}>
      <View
        className="w-full flex-1 overflow-hidden bg-paper"
        style={{
          maxWidth: framed ? 420 : undefined,
          borderWidth: framed ? 4 : 0,
          borderColor: INK,
          boxShadow: framed ? "6px 6px 0 0 #0C0B08" : undefined,
          maxHeight: framed ? Math.min(780, height - 48) : undefined,
        }}
      >
        <Notebook>
          {bare ? null : (
          <View
            className="flex-row items-center gap-2 bg-paper px-3 pb-2"
            style={{
              borderBottomWidth: headerRule ? 3 : 0,
              borderBottomColor: INK,
              paddingTop: framed ? 12 : Math.max(insets.top, 12),
            }}
          >
            <View className="min-w-0 flex-1">
              <Text style={{ fontFamily: DISPLAY, fontSize: 28, lineHeight: 30, letterSpacing: 0.5, color: RED, textTransform: "uppercase" }} numberOfLines={1}>
                {title}
              </Text>
              <Text style={{ marginTop: 2, fontFamily: BODY, fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", color: INK }}>{kicker}</Text>
            </View>
            {showBack && onBack ? <SkewTag label="Back" onPress={onBack} /> : null}
            {showSettings && onSettings ? <SkewTag label="Settings" onPress={onSettings} /> : null}
          </View>
          )}
          <View className="flex-1">{children}</View>
          {footer}
        </Notebook>
      </View>
    </View>
  );
}

function Notebook({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 overflow-hidden bg-paper">
      <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
        {Array.from({ length: 48 }, (_, index) => (
          <View
            key={index}
            style={{ position: "absolute", left: 0, right: 0, top: 28 * (index + 1), height: 1, backgroundColor: "rgba(12,11,8,0.08)" }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  note,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  note: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "rgba(12,11,8,0.78)" }}>
        <Pressable accessibilityLabel="Cancel" onPress={onCancel} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ width: "100%", maxWidth: 320, backgroundColor: CARD, borderWidth: 3, borderColor: INK, ...hard, padding: 16, gap: 14 }}>
          <Text style={{ fontFamily: DISPLAY, fontSize: 22, lineHeight: 26, letterSpacing: 0.4, textTransform: "uppercase", color: INK }}>{title}</Text>
          <Text style={{ fontFamily: BODY, fontSize: 13, lineHeight: 18, color: INK }}>{note}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Tap
              accessibilityLabel="Cancel"
              onPress={onCancel}
              style={{ flex: 1, alignItems: "center", borderWidth: 3, borderColor: INK, backgroundColor: CARD, ...hard, paddingVertical: 8 }}
            >
              <Text style={{ fontFamily: DISPLAY, fontSize: 16, letterSpacing: 0.4, color: INK }}>CANCEL</Text>
            </Tap>
            <Tap
              accessibilityLabel="Yes"
              onPress={onConfirm}
              style={{ flex: 1, alignItems: "center", borderWidth: 3, borderColor: INK, backgroundColor: RED, ...hard, paddingVertical: 8 }}
            >
              <Text style={{ fontFamily: DISPLAY, fontSize: 16, letterSpacing: 0.4, color: "#FFFFFF" }}>YES</Text>
            </Tap>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  const [mounted, setMounted] = useState(visible);
  const [height, setHeight] = useState(600);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start();
      return;
    }
    Animated.timing(progress, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, progress]);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(12,11,8,0.5)", opacity: progress }}>
          <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1 }} />
        </Animated.View>
        <Animated.View
          onLayout={({ nativeEvent }) => setHeight(nativeEvent.layout.height)}
          style={{
            width: "100%",
            maxWidth: framed ? 420 : undefined,
            alignSelf: "center",
            backgroundColor: PAPER,
            borderTopWidth: 3,
            borderColor: INK,
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            gap: 10,
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }],
          }}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export function SideSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  const [mounted, setMounted] = useState(visible);
  const [width, setWidth] = useState(360);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start();
      return;
    }
    Animated.timing(progress, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, progress]);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, alignItems: "center" }}>
        <Animated.View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(12,11,8,0.5)", opacity: progress }}>
          <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1 }} />
        </Animated.View>
        <View pointerEvents="box-none" style={{ flex: 1, width: "100%", maxWidth: framed ? 420 : undefined }}>
          <Animated.View
            onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "75%",
              backgroundColor: PAPER,
              borderLeftWidth: 3,
              borderColor: INK,
              paddingTop: framed ? 16 : Math.max(insets.top, 16),
              transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [width, 0] }) }],
            }}
          >
            <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
              {Array.from({ length: 48 }, (_, index) => (
                <View key={index} style={{ position: "absolute", left: 0, right: 0, top: 28 * (index + 1), height: 1, backgroundColor: "rgba(12,11,8,0.08)" }} />
              ))}
            </View>
            {children}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

export function SortBar({ sort, onSort, nowrap }: { sort: SortMode; onSort: (sort: SortMode) => void; nowrap?: boolean }) {
  return (
    <View className="flex-row gap-2" style={{ flexWrap: nowrap ? "nowrap" : "wrap", justifyContent: nowrap ? "flex-end" : "flex-start" }}>
      <SkewTag label="A–Z" active={sort === "alpha"} onPress={() => onSort("alpha")} />
      <SkewTag label="Unfinished" active={sort === "open"} onPress={() => onSort("open")} />
      <SkewTag label="Finished" active={sort === "done"} onPress={() => onSort("done")} />
    </View>
  );
}

export function CaseFace({ cover, finished, badge, onClearFinished }: { platformId: string; cover?: string; finished?: boolean; badge?: number; onClearFinished?: () => void }) {
  const [loadedCover, setLoadedCover] = useState<string | null>(null);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const ready = !!cover && loadedCover === cover;
  const missing = !cover || failedCover === cover;
  return (
    <View style={{ position: "relative" }}>
      <View style={{ width: "100%", borderWidth: 3, borderColor: INK, ...hardSm }}>
        <View
          style={{
            width: "100%",
            aspectRatio: 3 / 4,
            backgroundColor: "#E7E2D2",
            overflow: "hidden",
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
              onLoad={() => setLoadedCover(cover ?? null)}
              onError={() => setFailedCover(cover ?? null)}
              style={{ width: "100%", height: "100%", opacity: ready ? 1 : 0 }}
            />
          ) : null}
          {missing ? <MissingCover width={47} /> : null}
        </View>
      </View>
      {finished ? <FinishedBadge size={badge} inset={6} onPress={onClearFinished} /> : null}
    </View>
  );
}

function igdbCover(url?: string) {
  return url?.startsWith("https://images.igdb.com/") ? url : undefined;
}

export function CaseTile({
  copy,
  title,
  subtitle,
  width,
  lines = 2,
  inert = false,
  onOpen,
  onLongPress,
}: {
  copy: Copy;
  title: string;
  subtitle?: string;
  width?: number;
  lines?: number;
  inert?: boolean;
  onOpen: () => void;
  onLongPress?: () => void;
}) {
  const stored = useCollection((state) => state.catalog[copy.gameId]?.cover);
  const front = useCaseCover(copy.gameId, copy.platformId, title) || igdbCover(stored);
  const face = (
    <>
      <View>
        <CaseFace platformId={copy.platformId} cover={front} finished={copy.finished} />
      </View>
      <Text style={{ fontFamily: DISPLAY, fontSize: 12, lineHeight: 18, letterSpacing: 0.3, textTransform: "uppercase", color: INK }} numberOfLines={lines} ellipsizeMode="tail">
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontFamily: BODY, fontSize: 10, color: INK }} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </>
  );
  if (inert) return <View style={{ width: width ?? "100%", gap: 6 }}>{face}</View>;
  return (
    <Tap shade={false} onPress={onOpen} onLongPress={onLongPress} accessibilityLabel={title} style={{ width: width ?? "100%", gap: 6 }}>
      {(dim) => (
        <>
          <View>
            <CaseFace platformId={copy.platformId} cover={front} finished={copy.finished} />
            <PressShade opacity={dim} />
          </View>
          <Text style={{ fontFamily: DISPLAY, fontSize: 12, lineHeight: 18, letterSpacing: 0.3, textTransform: "uppercase", color: INK }} numberOfLines={lines} ellipsizeMode="tail">
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontFamily: BODY, fontSize: 10, color: INK }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </>
      )}
    </Tap>
  );
}

const DITHER_FADE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAICAYAAADqSp8ZAAAAUUlEQVR4nGNkIAC+fnr8n5tPlhGdj4/GZx4jPkliASmWM5FiKDY+uT6lCkB2BDoNwwR9iM9n6DSyz9BpqgJ8jiDbclJ8CqOxYQr9ht1R+CwHAFUHyzha+0AsAAAAAElFTkSuQmCC";
const DITHER_BOTTOM = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAACMCAYAAABBLuhFAAAAk0lEQVR42u2V3QqAMAhG9/6v2RsEXRcEg2Bq/ix1ZDBi5b6O58Jam3Yd+3ZS+/eT2D1NAtmiiIF8GMRw70UMopdODPyEDAxLJPSVqYsnU5QHPQNk1JsBMhrtwc7AT5jHAK1isCRkYPhBwjCGHBio4VEMGgb09xzoYfhEgIc1GbBRGOmBn/Cdh2KwFmTw4NBmFSgLLmgAlG22Px6yAAAAAElFTkSuQmCC";
const DITHER_FADE_DOWN = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAcCAYAAABcSP4GAAAARElEQVR42mP4+unxf3yYAasgAwMDXgU4TYDpRKaJMwGbTgwT0E2DKyJoAj5J0k3AyifKBLyAeibg4hMPyDeJem4Y3gAArL0YKueFXAkAAAAASUVORK5CYII=";
const DITHER_BANNER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAA4CAYAAADAdbkmAAAAXElEQVR42mNgGAVg8PXT4/+jbsK0k3w3UE/nQJgEU4lODwY3DDoT8HqRJDdgNYkiNxBvAl4Hk+QGGpoAwzBBZD5pbsBmEmluwIYZ0I0l3QRcDiTfDTgVEO0GdAwAK6YSC3LAExUAAAAASUVORK5CYII=";
const DITHER_BANNER_HEIGHT = 56;
const DITHER_WIDTH = 28;
const DITHER_BOTTOM_HEIGHT = 140;

export function DitherEdge({ side }: { side: "left" | "right" }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: DITHER_WIDTH,
        ...(side === "right" ? { right: 0 } : { left: 0 }),
        transform: side === "left" ? [{ scaleX: -1 }] : undefined,
        opacity: 0.72,
        zIndex: 2,
      }}
    >
      {Platform.OS === "web" ? (
        <View
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: `url("${DITHER_FADE}")`,
            backgroundRepeat: "repeat",
            backgroundSize: `${DITHER_WIDTH}px 8px`,
          } as ViewStyle}
        />
      ) : (
        <Image pointerEvents="none" source={{ uri: DITHER_FADE }} resizeMode="repeat" style={{ width: "100%", height: "100%" }} />
      )}
    </View>
  );
}

export function TopDither() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: "100%", height: DITHER_WIDTH, opacity: 0.72 }}>
      {Platform.OS === "web" ? (
        <View
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: `url("${DITHER_FADE_DOWN}")`,
            backgroundRepeat: "repeat",
            backgroundSize: `8px ${DITHER_WIDTH}px`,
          } as ViewStyle}
        />
      ) : (
        <Image source={{ uri: DITHER_FADE_DOWN }} resizeMode="repeat" style={{ width: "100%", height: "100%" }} />
      )}
    </View>
  );
}

export function BannerDither() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: DITHER_BANNER_HEIGHT }}>
      {Platform.OS === "web" ? (
        <View
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: `url("${DITHER_BANNER}")`,
            backgroundRepeat: "repeat-x",
            backgroundSize: `8px ${DITHER_BANNER_HEIGHT}px`,
          } as ViewStyle}
        />
      ) : (
        <Image source={{ uri: DITHER_BANNER }} resizeMode="repeat" style={{ width: "100%", height: "100%" }} />
      )}
    </View>
  );
}

export function CaseRow({
  children,
  bleed = 12,
  padTop = 2,
  padBottom = 10,
}: {
  children: React.ReactNode;
  bleed?: number;
  padTop?: number;
  padBottom?: number;
}) {
  const frame = useRef({ x: 0, content: 0, layout: 0 });
  const [edges, setEdges] = useState({ left: false, right: false });
  const sync = (next: Partial<{ x: number; content: number; layout: number }>) => {
    frame.current = { ...frame.current, ...next };
    const { x, content, layout } = frame.current;
    const max = content - layout;
    const left = x > 8;
    const right = max > 8 && x < max - 8;
    setEdges((current) => (current.left === left && current.right === right ? current : { left, right }));
  };
  return (
    <View style={{ marginHorizontal: -bleed }}>
      <ScrollView
        horizontal
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => sync({ x: event.nativeEvent.contentOffset.x })}
        onLayout={(event) => sync({ layout: event.nativeEvent.layout.width })}
        onContentSizeChange={(width) => sync({ content: width })}
        contentContainerStyle={{ gap: 12, paddingBottom: padBottom, paddingLeft: bleed, paddingRight: bleed, paddingTop: padTop }}
      >
        {children}
      </ScrollView>
      {edges.left ? <DitherEdge side="left" /> : null}
      {edges.right ? <DitherEdge side="right" /> : null}
    </View>
  );
}

export function StickyAdd({ label = "Add a game", onPress }: { label?: string; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  return (
    <Tap
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: framed ? 16 : Math.max(insets.bottom, 16),
        zIndex: 3,
        backgroundColor: RED,
        borderWidth: 3,
        borderColor: INK,
        ...hard,
        paddingVertical: 14,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontFamily: DISPLAY, fontSize: 18, letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</Text>
    </Tap>
  );
}

export function BottomDither({ height = DITHER_BOTTOM_HEIGHT }: { height?: number }) {
  return (
    <View
      pointerEvents="none"
      style={
        {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height,
          zIndex: 2,
          opacity: 1,
          backgroundImage: `url("${DITHER_BOTTOM}")`,
          backgroundRepeat: "repeat",
          backgroundSize: `8px ${height}px`,
        } as ViewStyle
      }
    >
      {Platform.OS === "web" ? null : (
        <Image pointerEvents="none" source={{ uri: DITHER_BOTTOM }} resizeMode="repeat" style={{ width: "100%", height: "100%" }} />
      )}
    </View>
  );
}

export function CornerAction({ label, onPress }: { label: string; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  return (
    <Tap
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        position: "absolute",
        left: 28,
        right: 28,
        bottom: (framed ? 0 : insets.bottom) + DITHER_WIDTH,
        zIndex: 3,
        backgroundColor: RED,
        borderWidth: 3,
        borderColor: INK,
        ...hard,
        paddingVertical: 14,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontFamily: DISPLAY, fontSize: 18, letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</Text>
    </Tap>
  );
}