import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Image, Platform, Pressable, Text, TextInput, View, type TextStyle, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";

import { CAMERA_RATIO, CAMERA_XML } from "../camera-icon";
import { FINISHED_ROSETTE_XML, FINISHED_XML } from "../finished-badge";
import { BODY, CARD, DISPLAY, hard, hardSm, INK, PAPER, RED, YELLOW } from "../theme";
import { WINDOWS_LOGO, WINDOWS_XML } from "../windows-logo";
import { Tap } from "./tap";

export function MissingCover({ width }: { width: number }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }}>
      <SvgXml xml={CAMERA_XML} width={width} height={width * CAMERA_RATIO} />
    </View>
  );
}

export function FinishedRosette({ size, inset }: { size: number; inset: number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: inset, left: inset, zIndex: 2, transform: [{ rotate: "-20deg" }] }}
    >
      <SvgXml xml={FINISHED_ROSETTE_XML} width={size} height={size} />
    </View>
  );
}

const BADGE = 27.28;

export function FinishedBadge({ size = BADGE, inset, onPress }: { size?: number; inset: number; onPress?: () => void }) {
  const badge = (
    <View
      pointerEvents="none"
      style={{
        width: BADGE,
        height: BADGE,
        transformOrigin: "top left",
        transform: [{ scale: size / BADGE }],
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: PAPER,
        borderWidth: 1.5,
        borderColor: "#000000",
        boxShadow: "2px 2px 0 0 #000000",
      }}
    >
      <View style={{ transform: [{ rotate: "-7.04deg" }] }}>
        <SvgXml xml={FINISHED_XML} width={22.3274} height={22.3062} />
      </View>
    </View>
  );
  if (!onPress) {
    return (
      <View pointerEvents="none" style={{ position: "absolute", top: inset, left: inset, zIndex: 2 }}>
        {badge}
      </View>
    );
  }
  return (
    <Tap accessibilityLabel="Mark as completed" onPress={onPress} hitSlop={10} style={{ position: "absolute", top: inset, left: inset, zIndex: 3 }}>
      {badge}
    </Tap>
  );
}

export function SkewTag({
  label,
  onPress,
  active,
  height,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  height?: number;
}) {
  return (
    <Tap
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        transform: [{ skewX: "-12deg" }],
        backgroundColor: active ? RED : CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hardSm,
        paddingVertical: height ? 0 : 6,
        paddingHorizontal: 12,
        height,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          transform: [{ skewX: "12deg" }],
          color: active ? "#FFFFFF" : INK,
          fontFamily: DISPLAY,
          fontSize: 13,
          lineHeight: 18,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </Tap>
  );
}

export function SquaresTag({ onPress, label, height = 34 }: { onPress: () => void; label: string; height?: number }) {
  return (
    <Tap
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        transform: [{ skewX: "-12deg" }],
        backgroundColor: CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hardSm,
        paddingHorizontal: 12,
        height,
        justifyContent: "center",
      }}
    >
      <View style={{ transform: [{ skewX: "12deg" }], flexDirection: "row", gap: 4 }}>
        {[0, 1, 2].map((dot) => (
          <View key={dot} style={{ width: 6, height: 6, backgroundColor: INK }} />
        ))}
      </View>
    </Tap>
  );
}

export function ViewToggle({ grid, onPress }: { grid: boolean; onPress: () => void }) {
  return (
    <Tap
      accessibilityLabel={grid ? "List" : "Grid"}
      onPress={onPress}
      style={{
        transform: [{ skewX: "-12deg" }],
        backgroundColor: CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hardSm,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }}
    >
      <View style={{ transform: [{ skewX: "12deg" }] }}>
        <ShelfMarks grid={grid} />
      </View>
    </Tap>
  );
}

function ShelfMarks({ grid }: { grid: boolean }) {
  const progress = useRef(new Animated.Value(grid ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: grid ? 0 : 1,
      duration: 280,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [grid, progress]);

  return (
    <View style={{ width: 27, height: 17 }}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            backgroundColor: INK,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: [27, 7] }),
            height: progress.interpolate({ inputRange: [0, 1], outputRange: [3, 7] }),
            left: progress.interpolate({ inputRange: [0, 1], outputRange: [0, index * 10] }),
            top: progress.interpolate({ inputRange: [0, 1], outputRange: [index * 7, 5] }),
          }}
        />
      ))}
    </View>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  labeled = true,
  divider = "below",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  labeled?: boolean;
  divider?: "above" | "below";
}) {
  const input = useRef<TextInput>(null);
  const clear = () => {
    onChange("");
    input.current?.focus();
  };
  return (
    <View
      className="bg-paper px-3 pb-3"
      style={
        divider === "above"
          ? { paddingTop: 12 }
          : { paddingTop: 12, borderBottomWidth: 3, borderBottomColor: INK }
      }
    >
      {divider === "above" ? <View style={{ height: 1, backgroundColor: INK, marginBottom: 12 }} /> : null}
      {labeled ? <Text style={kicker}>Search</Text> : null}
      <View>
        <TextInput
          ref={input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(12,11,8,0.45)"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          style={{
            backgroundColor: CARD,
            color: INK,
            borderWidth: 3,
            borderColor: INK,
            ...hard,
            paddingVertical: 12,
            paddingLeft: 14,
            paddingRight: value ? 40 : 14,
            fontFamily: BODY,
            fontSize: 15,
          }}
        />
        {value ? (
          <Pressable
            accessibilityLabel="Clear search"
            onPress={clear}
            {...(Platform.OS === "web" ? { onMouseDown: (event: { preventDefault: () => void }) => event.preventDefault() } : {})}
            style={{ position: "absolute", top: 0, right: 4, bottom: 0, width: 36, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontFamily: BODY, fontSize: 18, lineHeight: 20, color: INK }}>×</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function SearchNotice({ pending, term, empty }: { pending: boolean; term: string; empty: boolean }) {
  if (pending) return <ActivityIndicator color={INK} />;
  if (!empty || !term.trim()) return null;
  return <Text style={{ fontFamily: BODY, fontSize: 12, lineHeight: 18, color: INK }}>No games found for "{term.trim()}"</Text>;
}

const LOGO_W = 48;
const LOGO_H = 22;

function sharpLogo(uri: string) {
  return uri.replace("/t_logo_med/", "/t_1080p/");
}

export function ConsoleLogo({ uri, width = LOGO_W, height = LOGO_H, align = "center" }: { uri?: string; width?: number; height?: number; align?: "center" | "start" }) {
  if (uri === WINDOWS_LOGO) {
    const size = Math.min(width, height);
    return (
      <View style={{ width, height, alignItems: align === "start" ? "flex-start" : "center", justifyContent: "center" }}>
        <SvgXml xml={WINDOWS_XML} width={size} height={size} />
      </View>
    );
  }
  return <RemoteLogo uri={uri} width={width} height={height} />;
}

function RemoteLogo({ uri, width, height }: { uri?: string; width: number; height: number }) {
  const [src, setSrc] = useState<string | undefined>();
  useEffect(() => {
    if (Platform.OS !== "web" || !uri) return;
    let cancel = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancel) return;
      const source = document.createElement("canvas");
      source.width = img.naturalWidth;
      source.height = img.naturalHeight;
      const sample = source.getContext("2d");
      if (!sample) return;
      sample.drawImage(img, 0, 0);
      const pixels = sample.getImageData(0, 0, source.width, source.height);
      const data = pixels.data;
      const pixelW = pixels.width;
      const pixelH = pixels.height;
      let minX = pixelW;
      let minY = pixelH;
      let maxX = 0;
      let maxY = 0;
      for (let y = 0; y < pixelH; y += 1) {
        for (let x = 0; x < pixelW; x += 1) {
          if (data[(y * pixelW + x) * 4 + 3] < 30) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      if (maxX < minX || maxY < minY) return;
      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;
      const density = Math.min(window.devicePixelRatio || 1, 3);
      const outW = Math.round(width * density);
      const outH = Math.round(height * density);
      const scale = Math.min(outW / cropW, outH / cropH);
      const drawW = cropW * scale;
      const drawH = cropH * scale;
      const out = document.createElement("canvas");
      out.width = outW;
      out.height = outH;
      const paint = out.getContext("2d");
      if (!paint) return;
      paint.imageSmoothingEnabled = true;
      paint.imageSmoothingQuality = "high";
      paint.drawImage(source, minX, minY, cropW, cropH, (outW - drawW) / 2, (outH - drawH) / 2, drawW, drawH);
      setSrc(out.toDataURL());
    };
    img.src = sharpLogo(uri);
    return () => {
      cancel = true;
    };
  }, [uri, width, height]);
  if (!uri) return <View style={{ width, height }} />;
  if (Platform.OS === "web") {
    if (!src) return <View style={{ width, height }} />;
    return <Image accessible={false} source={{ uri: src }} style={{ width, height }} />;
  }
  return <Image accessible={false} source={{ uri: sharpLogo(uri) }} resizeMode="contain" style={{ width, height }} />;
}

const STAR = "★";
const STAR_SIZE = 28;

export function ActionStar({ crossed }: { crossed?: boolean }) {
  return (
    <View style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
      {crossed
        ? [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ].map(([dx, dy]) => <StarGlyph key={`${dx}${dy}`} color={INK} dx={dx} dy={dy} />)
        : null}
      <StarGlyph color="#FFFFFF" />
      {crossed ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 28,
            height: 5,
            backgroundColor: INK,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ rotate: "-40deg" }],
          }}
        >
          <View style={{ width: 26, height: 3, backgroundColor: "#FFFFFF" }} />
        </View>
      ) : null}
    </View>
  );
}

function StarGlyph({ color, dx = 0, dy = 0 }: { color: string; dx?: number; dy?: number }) {
  return (
    <Text
      style={{
        position: "absolute",
        width: 32,
        textAlign: "center",
        color,
        fontSize: STAR_SIZE,
        lineHeight: 32,
        transform: [{ translateX: dx }, { translateY: dy }],
      }}
    >
      {STAR}
    </Text>
  );
}

export function FavoriteCorner() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 2,
        width: 0,
        height: 0,
        borderTopWidth: 16,
        borderRightWidth: 16,
        borderTopColor: YELLOW,
        borderRightColor: "transparent",
      }}
    />
  );
}

export function TrashIcon() {
  const ink = "#FFFFFF";
  return (
    <View style={{ width: 20, height: 22, alignItems: "center" }}>
      <View style={{ width: 7, height: 2, backgroundColor: ink }} />
      <View style={{ width: 18, height: 3, backgroundColor: ink, marginTop: 1 }} />
      <View
        style={{
          width: 16,
          height: 14,
          marginTop: 2,
          borderWidth: 2,
          borderColor: ink,
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        <View style={{ width: 2, height: 7, backgroundColor: ink }} />
        <View style={{ width: 2, height: 7, backgroundColor: ink }} />
      </View>
    </View>
  );
}

export function PlusButton({ onPress }: { onPress: () => void }) {
  return (
    <Tap
      accessibilityLabel="Edit systems"
      onPress={onPress}
      style={{
        marginHorizontal: 78,
        marginTop: 12,
        marginBottom: 4,
        transform: [{ skewX: "-12deg" }],
        backgroundColor: RED,
        borderWidth: 3,
        borderColor: INK,
        ...hard,
        paddingVertical: 8,
        paddingHorizontal: 8,
        alignItems: "center",
      }}
    >
      <Text style={{ transform: [{ skewX: "12deg" }], color: "#FFFFFF", fontFamily: DISPLAY, fontSize: 15, lineHeight: 18, letterSpacing: 0.4 }}>
        EDIT SYSTEMS
      </Text>
    </Tap>
  );
}

export function ListRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tap
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        marginHorizontal: 12,
        marginTop: 10,
        backgroundColor: CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hard,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <Text style={display(18)}>{label}</Text>
    </Tap>
  );
}

function HazardMark() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: 44, height: 38, alignItems: "center" }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 22,
          borderRightWidth: 22,
          borderBottomWidth: 38,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: INK,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 5,
          width: 0,
          height: 0,
          borderLeftWidth: 17,
          borderRightWidth: 17,
          borderBottomWidth: 29,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: PAPER,
        }}
      />
      <Text style={{ position: "absolute", top: 16, fontFamily: DISPLAY, fontSize: 16, lineHeight: 18, color: INK }}>!</Text>
    </View>
  );
}

export function EmptyNote() {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 32, paddingTop: 168 }}>
      <HazardMark />
      <Text
        style={{
          marginTop: 14,
          fontFamily: DISPLAY,
          fontSize: 28,
          lineHeight: 38,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          textAlign: "center",
          color: INK,
        }}
      >
        Nothing here yet
      </Text>
    </View>
  );
}

export function display(size: number): TextStyle {
  return {
    fontFamily: DISPLAY,
    fontSize: size,
    lineHeight: Math.round(size * 1.35),
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: INK,
  };
}

export const kicker: TextStyle = {
  fontFamily: DISPLAY,
  fontSize: 12,
  letterSpacing: 1.6,
  textTransform: "uppercase",
  color: RED,
  marginBottom: 8,
};

export const frame: ViewStyle = {
  backgroundColor: CARD,
  borderWidth: 3,
  borderColor: INK,
  ...hard,
};
