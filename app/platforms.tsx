import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Platform, Text, View } from "react-native";

import { ConsoleLogo, SearchField, display } from "../src/components/bits";
import { Tap } from "../src/components/tap";
import { BottomDither, CornerAction, Phone, TopDither } from "../src/components/chrome";
import { nameMatches } from "../src/name-match";
import { nextGenPlatforms, platformGroups, platformsFor, systemIds } from "../src/platforms";
import { useCollection } from "../src/store";
import { BODY, CARD, INK, RED, hardSm } from "../src/theme";

export default function PlatformsScreen() {
  const active = useCollection((state) => state.active);
  const copies = useCollection((state) => state.copies);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const commitPlatforms = useCollection((state) => state.commitPlatforms);
  const [draft, setDraft] = useState(active);
  const [query, setQuery] = useState("");
  const scrollY = useRef(new Animated.Value(0)).current;
  const topFade = scrollY.interpolate({ inputRange: [0, 12], outputRange: [0, 0.72], extrapolate: "clamp" });
  const list = platformsFor(switch2RawgId);
  const matches = (name: string) => nameMatches(name, query);
  const nextGen = nextGenPlatforms(list).filter((platform) => matches(platform.name));
  const groups = platformGroups(list)
    .map((group) => ({ ...group, platforms: group.platforms.filter((platform) => matches(platform.name)) }))
    .filter((group) => group.platforms.length > 0);
  const chosen = Object.values(draft).some(Boolean);
  const toggle = (id: string) =>
    setDraft((prev) => {
      const next = !systemIds(id).some((item) => prev[item]);
      const updated = { ...prev };
      for (const item of systemIds(id)) updated[item] = next;
      return updated;
    });

  return (
    <Phone
      title="Systems"
      footer={
        <>
          <BottomDither />
          <CornerAction label={chosen ? "Continue" : "Skip"} onPress={() => {
            commitPlatforms(draft);
            router.replace("/");
          }} />
        </>
      }
    >
      <Text style={{ paddingHorizontal: 12, paddingTop: 12, fontFamily: BODY, fontSize: 12, lineHeight: 16, color: INK }}>
        You can change this selection at any time from Edit{"\u00A0"}systems menu.
      </Text>
      <View style={{ zIndex: 2 }}>
        <SearchField value={query} onChange={setQuery} placeholder="Search systems" labeled={false} divider="above" />
        <TopDither opacity={topFade} />
      </View>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: Platform.OS !== "web" })}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View style={{ padding: 12, gap: 18 }}>
          {nextGen.length > 0 ? (
            <View
              style={{
                gap: 6,
                padding: 10,
                borderWidth: 3,
                borderColor: INK,
                backgroundColor: "#E7E2D2",
                ...hardSm,
                ...(Platform.OS === "web"
                  ? ({
                      backgroundImage: "radial-gradient(#0C0B08 0.7px, transparent 0.8px)",
                      backgroundSize: "4px 4px",
                    } as object)
                  : null),
              }}
            >
              <Text style={{ alignSelf: "flex-start", paddingHorizontal: 4, marginLeft: -4, backgroundColor: "#E7E2D2", fontFamily: BODY, fontSize: 12, letterSpacing: 0.6, color: INK }}>next gen</Text>
              <PlatformGrid platforms={nextGen} draft={draft} copies={copies} onToggle={toggle} columns={4} />
            </View>
          ) : null}
          {groups.map((group) => (
            <View key={group.label} style={{ gap: 6 }}>
              <Text style={{ fontFamily: BODY, fontSize: 10, letterSpacing: 1.2, color: "rgba(12,11,8,0.55)" }}>{group.label}</Text>
              <PlatformGrid platforms={group.platforms} draft={draft} copies={copies} onToggle={toggle} />
            </View>
          ))}
        </View>
      </Animated.ScrollView>
    </Phone>
  );
}

function PlatformGrid({
  platforms,
  draft,
  copies,
  onToggle,
  columns = 3,
}: {
  platforms: { id: string; name: string; logo?: string }[];
  draft: Record<string, boolean>;
  copies: { platformId: string }[];
  onToggle: (id: string) => void;
  columns?: number;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -4 }}>
      {platforms.map((platform) => {
        const ids = systemIds(platform.id);
        const on = ids.some((id) => draft[id]);
        const count = String(copies.filter((copy) => ids.includes(copy.platformId)).length).padStart(2, "0");
        return (
          <View key={platform.id} style={{ width: `${100 / columns}%`, padding: 4 }}>
            <Tap
              accessibilityLabel={`${platform.name}, ${count}`}
              onPress={() => onToggle(platform.id)}
              style={{
                minHeight: columns === 4 ? 54 : 84,
                paddingTop: columns === 4 ? 6 : 8,
                paddingHorizontal: columns === 4 ? 4 : 8,
                paddingBottom: columns === 4 ? 18 : 22,
                borderWidth: 3,
                borderColor: INK,
                ...hardSm,
                backgroundColor: on ? RED : CARD,
              }}
            >
              <Text style={{ ...display(columns === 4 ? 10 : 13), letterSpacing: columns === 4 ? 0 : 0.4, color: on ? "#FFFFFF" : INK }}>{platform.name}</Text>
              <View style={{ position: "absolute", left: 6, bottom: 4 }}>
                <ConsoleLogo uri={platform.logo} width={30} height={14} align="start" />
              </View>
              <Text style={{ ...display(11), position: "absolute", right: 6, bottom: 4, color: on ? "#FFFFFF" : RED }}>{count}</Text>
            </Tap>
          </View>
        );
      })}
    </View>
  );
}
