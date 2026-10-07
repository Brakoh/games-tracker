import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { SearchField, display } from "../src/components/bits";
import { Tap } from "../src/components/tap";
import { BottomDither, CornerAction, Phone } from "../src/components/chrome";
import { nameMatches } from "../src/name-match";
import { featuredPlatforms, otherPlatforms, platformsFor, systemIds } from "../src/platforms";
import { useCollection } from "../src/store";
import { CARD, INK, RED, hardSm } from "../src/theme";

export default function PlatformsScreen() {
  const active = useCollection((state) => state.active);
  const copies = useCollection((state) => state.copies);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const commitPlatforms = useCollection((state) => state.commitPlatforms);
  const [draft, setDraft] = useState(active);
  const [query, setQuery] = useState("");
  const list = platformsFor(switch2RawgId);
  const matches = (name: string) => nameMatches(name, query);
  const featured = featuredPlatforms(list).filter((platform) => matches(platform.name));
  const rest = otherPlatforms(list).filter((platform) => matches(platform.name));
  const chosen = Object.values(draft).some(Boolean);

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
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <SearchField value={query} onChange={setQuery} placeholder="Search systems" labeled={false} />
        <View style={{ padding: 12, gap: 12 }}>
          {featured.length > 0 && <PlatformGrid platforms={featured} draft={draft} copies={copies} onToggle={(id) => setDraft((prev) => {
            const next = !systemIds(id).some((item) => prev[item]);
            const updated = { ...prev };
            for (const item of systemIds(id)) updated[item] = next;
            return updated;
          })} />}
          {featured.length > 0 && rest.length > 0 ? <View style={{ height: 8, borderTopWidth: 1, borderTopColor: INK }} /> : null}
          {rest.length > 0 && <PlatformGrid platforms={rest} draft={draft} copies={copies} onToggle={(id) => setDraft((prev) => {
            const next = !systemIds(id).some((item) => prev[item]);
            const updated = { ...prev };
            for (const item of systemIds(id)) updated[item] = next;
            return updated;
          })} />}
        </View>
      </ScrollView>
    </Phone>
  );
}

function PlatformGrid({
  platforms,
  draft,
  copies,
  onToggle,
}: {
  platforms: { id: string; name: string }[];
  draft: Record<string, boolean>;
  copies: { platformId: string }[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -4 }}>
      {platforms.map((platform) => {
        const ids = systemIds(platform.id);
        const on = ids.some((id) => draft[id]);
        const count = String(copies.filter((copy) => ids.includes(copy.platformId)).length).padStart(2, "0");
        return (
          <View key={platform.id} style={{ width: "33.33%", padding: 4 }}>
            <Tap
              accessibilityLabel={`${platform.name}, ${count}`}
              onPress={() => onToggle(platform.id)}
              style={{
                minHeight: 72,
                padding: 8,
                paddingBottom: 18,
                borderWidth: 3,
                borderColor: INK,
                ...hardSm,
                backgroundColor: on ? RED : CARD,
              }}
            >
              <Text style={{ ...display(13), color: on ? "#FFFFFF" : INK }}>{platform.name}</Text>
              <Text style={{ ...display(11), position: "absolute", right: 6, bottom: 4, color: on ? "#FFFFFF" : RED }}>{count}</Text>
            </Tap>
          </View>
        );
      })}
    </View>
  );
}
