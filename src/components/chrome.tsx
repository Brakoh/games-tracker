import { useState } from "react";
import { Image, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCaseCover } from "../case-cover";
import { BODY, CARD, DISPLAY, hard, hardSm, INK, RED } from "../theme";
import type { Copy, Format, SortMode } from "../types";
import { SkewTag } from "./bits";

export function Phone({
  title,
  kicker = "Collection",
  showBack,
  onBack,
  showSettings,
  onSettings,
  footer,
  children,
}: {
  title: string;
  kicker?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSettings?: boolean;
  onSettings?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const framed = width >= 760;
  return (
    <View className="flex-1 items-center bg-paper" style={{ paddingTop: framed ? 24 : 0, paddingBottom: framed ? 24 : 0 }}>
      <View
        className="w-full flex-1 overflow-hidden bg-paper"
        style={{
          maxWidth: 420,
          borderWidth: framed ? 4 : 0,
          borderColor: INK,
          boxShadow: framed ? "6px 6px 0 0 #0C0B08" : undefined,
          maxHeight: framed ? Math.min(780, height - 48) : undefined,
        }}
      >
        <Notebook>
          <View
            className="flex-row items-center gap-2 bg-paper px-3 pb-2"
            style={{
              borderBottomWidth: 3,
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

export function SortBar({ sort, onSort }: { sort: SortMode; onSort: (sort: SortMode) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <SkewTag label="A–Z" active={sort === "alpha"} onPress={() => onSort("alpha")} />
      <SkewTag label="Unfinished" active={sort === "open"} onPress={() => onSort("open")} />
      <SkewTag label="Finished" active={sort === "done"} onPress={() => onSort("done")} />
    </View>
  );
}

export function CaseFace({
  finished,
  cover,
  onToggleFinished,
}: {
  platformId: string;
  finished: boolean;
  cover?: string;
  onToggleFinished: () => void;
}) {
  const [loadedCover, setLoadedCover] = useState<string | null>(null);
  const ready = !!cover && loadedCover === cover;
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
              style={{ width: "100%", height: "100%", opacity: ready ? 1 : 0 }}
            />
          ) : null}
        </View>
      </View>
      <Pressable
        accessibilityLabel={finished ? "Finished" : "Not finished"}
        onPress={onToggleFinished}
        hitSlop={8}
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 16,
          height: 16,
          borderWidth: 2,
          borderColor: INK,
          backgroundColor: finished ? RED : CARD,
        }}
      />
    </View>
  );
}

export function CaseTile({
  copy,
  title,
  subtitle,
  width,
  onOpen,
  onToggleFinished,
}: {
  copy: Copy;
  title: string;
  subtitle: string;
  width?: number;
  onOpen: () => void;
  onToggleFinished: () => void;
}) {
  const front = useCaseCover(copy.gameId, copy.platformId, title);
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={title} style={{ width: width ?? "100%", gap: 6 }}>
      <CaseFace platformId={copy.platformId} cover={front} finished={copy.finished} onToggleFinished={onToggleFinished} />
      <Text style={{ fontFamily: DISPLAY, fontSize: 12, letterSpacing: 0.3, textTransform: "uppercase", color: INK }} numberOfLines={2}>
        {title}
      </Text>
      <Text style={{ fontFamily: BODY, fontSize: 10, color: INK }} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export function CaseRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 12, paddingBottom: 10, paddingRight: 8, paddingTop: 2 }}>
      {children}
    </ScrollView>
  );
}

export function StickyAdd({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const framed = width >= 760;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add a game"
      onPress={onPress}
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: framed ? 16 : Math.max(insets.bottom, 16),
        backgroundColor: RED,
        borderWidth: 3,
        borderColor: INK,
        ...hard,
        paddingVertical: 14,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontFamily: DISPLAY, fontSize: 18, letterSpacing: 0.6, textTransform: "uppercase" }}>Add a game</Text>
    </Pressable>
  );
}

export function CornerAction({ label, onPress }: { label: string; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const framed = width >= 760;
  return (
    <View style={{ position: "absolute", right: 16, bottom: framed ? 16 : Math.max(insets.bottom, 16) }}>
      <SkewTag label={label} active onPress={onPress} />
    </View>
  );
}

export function formatLabel(format: Format) {
  return format === "physical" ? "Physical" : "Digital";
}

export function formatsLine(formats: Format[]) {
  return [...formats].sort().map(formatLabel).join(" · ");
}
