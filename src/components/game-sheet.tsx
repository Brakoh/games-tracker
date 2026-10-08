import { useRef } from "react";
import { Animated, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSavedBanner } from "../case-cover";
import { useGameDetails } from "../game-details";
import { platformById, platformsFor } from "../platforms";
import type { GameDetails } from "../igdb";
import { BODY, CARD, DISPLAY, hard, hardSm, INK, PAPER, RED } from "../theme";
import { display } from "./bits";
import { BannerDither, CaseFace, CaseRow, useFramed } from "./chrome";
import { Tap } from "./tap";

export type FeaturedGame = GameDetails["related"][number];

const BANNER_HEIGHT = 220;
const OVERLAP = 72;

export function GameSheet({
  title,
  platformId,
  platformName,
  cover,
  finished,
  topSpace = 16,
  bottomSpace = 24,
  children,
  platformNote,
  platformNames,
  onFeatured,
  onClearFinished,
  bannerSaveKey,
  scrollY: sharedScrollY,
}: {
  scrollY?: Animated.Value;
  onFeatured?: (game: FeaturedGame) => void;
  onClearFinished?: () => void;
  bannerSaveKey?: string;
  topSpace?: number;
  bottomSpace?: number;
  title: string;
  platformId: string;
  platformName: string;
  platformNote?: React.ReactNode;
  platformNames?: string[];
  cover?: string;
  finished?: boolean;
  children?: React.ReactNode;
}) {
  const details = useGameDetails(title, platformId);
  const info = details.data;
  const saved = useSavedBanner(bannerSaveKey, info?.banner);
  const bannerImage = saved ?? (bannerSaveKey ? undefined : info?.banner);
  const banner = details.isLoading || Boolean(info?.banner) || Boolean(saved);
  const related = info?.related ?? [];
  const ownScrollY = useRef(new Animated.Value(0)).current;
  const scrollY = sharedScrollY ?? ownScrollY;
  const list = platformsFor();
  const fromCatalog = platformNames?.filter((name) => name.trim().length > 0);
  const consoles = fromCatalog?.length
    ? fromCatalog
    : info?.platforms?.length
      ? [...new Set(info.platforms.map((entry) => (entry.id && platformById(list, entry.id)?.name) || entry.name))].sort(
          (a, b) => Number(b === platformName) - Number(a === platformName),
        )
      : [platformName];
  const facts = [
    ...(platformNote ? [] : [{ label: consoles.length > 1 ? "Platforms" : "Platform", value: consoles.join(", ") }]),
    { label: "Developer", value: info?.developer },
    { label: "Publisher", value: info?.publisher && info.publisher !== info.developer ? info.publisher : undefined },
    { label: "Released", value: info?.year ? String(info.year) : undefined },
    { label: "Genre", value: info?.genres.length ? info.genres.join(", ") : undefined },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  const pull = (outputRange: number[]) =>
    scrollY.interpolate({ inputRange: [-BANNER_HEIGHT, 0], outputRange, extrapolateLeft: "extend", extrapolateRight: "clamp" });

  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      style={Platform.OS === "web" ? ({ overscrollBehavior: "none" } as object) : undefined}
      contentContainerStyle={{ paddingBottom: bottomSpace }}
      scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: Platform.OS !== "web" })}
    >
      {banner ? (
        <View style={{ height: BANNER_HEIGHT }}>
          {bannerImage ? (
            <Animated.Image
              source={{ uri: bannerImage }}
              resizeMode="cover"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: BANNER_HEIGHT,
                transform: [{ translateY: pull([-BANNER_HEIGHT / 2, 0]) }, { scale: pull([2, 1]) }],
              }}
            />
          ) : null}
          <BannerDither />
        </View>
      ) : null}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: banner ? 0 : topSpace, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start", marginTop: banner ? -OVERLAP : 0 }}>
          <View style={{ flex: 1, gap: 6, paddingLeft: 6, paddingTop: banner ? OVERLAP - 8 : 0 }}>
            <Text style={display(22)}>{title}</Text>
            <View style={{ gap: 4, marginTop: 4 }}>
              {platformNote}
              {facts.map((fact) => (
                <Fact key={fact.label} label={fact.label} value={fact.value} />
              ))}
              {details.isLoading ? <Fact label="Developer" value="…" /> : null}
            </View>
          </View>
          <View style={{ width: 112, marginRight: 10 }}>
            <CaseFace platformId={platformId} cover={cover} finished={finished} badge={30} onClearFinished={onClearFinished} />
          </View>
        </View>
        {info?.summary ? (
          <View style={{ marginTop: 4, padding: 12, gap: 6, backgroundColor: CARD, borderWidth: 3, borderColor: INK, ...hardSm }}>
            <Text style={{ fontFamily: BODY, fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(12,11,8,0.55)" }}>About</Text>
            <Text style={{ fontFamily: BODY, fontSize: 12, lineHeight: 18, color: INK }}>{info.summary}</Text>
          </View>
        ) : null}
        {children ? <View style={{ gap: 10, marginTop: 4 }}>{children}</View> : null}
        {onFeatured && related.length > 0 ? (
          <View style={{ gap: 8, marginTop: 20 }}>
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
              Featured games
            </Text>
            <CaseRow>
              {related.map((game) => (
                <Tap key={game.id} accessibilityLabel={game.title} shade={false} onPress={() => onFeatured(game)} style={{ width: 104, gap: 6 }}>
                  <CaseFace platformId={platformId} cover={game.cover} />
                  <Text style={{ fontFamily: DISPLAY, fontSize: 12, letterSpacing: 0.3, textTransform: "uppercase", color: INK }} numberOfLines={2}>
                    {game.title}
                  </Text>
                </Tap>
              ))}
            </CaseRow>
          </View>
        ) : null}
      </View>
    </Animated.ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontFamily: BODY, fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(12,11,8,0.55)" }}>{label}</Text>
      <Text style={{ fontFamily: BODY, fontSize: 12, lineHeight: 16, color: INK }}>{value}</Text>
    </View>
  );
}

export function AddButton({ label, onPress, enabled = true }: { label: string; onPress: () => void; enabled?: boolean }) {
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  return (
    <Tap
      accessibilityLabel={label}
      onPress={enabled ? onPress : undefined}
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: framed ? 16 : Math.max(insets.bottom, 16),
        zIndex: 3,
        backgroundColor: enabled ? RED : "#8A8A8A",
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

export function Checkbox({
  label,
  checked,
  onPress,
  quiet = false,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  quiet?: boolean;
}) {
  return (
    <Tap
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "stretch",
        minWidth: 0,
        gap: quiet ? 8 : 12,
        paddingVertical: quiet ? 8 : 12,
        paddingHorizontal: quiet ? 8 : 12,
        backgroundColor: CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hardSm,
      }}
    >
      <View
        style={{
          width: quiet ? 16 : 26,
          height: quiet ? 16 : 26,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: quiet ? 2 : 3,
          borderColor: INK,
          backgroundColor: checked ? RED : PAPER,
        }}
      >
        {checked ? (
          <Text style={{ color: "#FFFFFF", fontFamily: quiet ? BODY : DISPLAY, fontSize: quiet ? 11 : 16, lineHeight: quiet ? 13 : 18 }}>✓</Text>
        ) : null}
      </View>
      <Text
        numberOfLines={quiet ? 1 : undefined}
        style={
          quiet
            ? { flex: 1, minWidth: 0, fontFamily: BODY, fontSize: 12, lineHeight: 16, color: INK }
            : { ...display(18), color: INK }
        }
      >
        {label}
      </Text>
    </Tap>
  );
}
