import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { SearchField, display } from "../src/components/bits";
import { CornerAction, Phone } from "../src/components/chrome";
import { nameMatches } from "../src/name-match";
import { featuredPlatforms, otherPlatforms, platformsFor } from "../src/platforms";
import { useCollection } from "../src/store";
import { CARD, INK, RED, hardSm } from "../src/theme";

export default function PlatformsScreen() {
  const active = useCollection((state) => state.active);
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
      title="Platforms"
      footer={<CornerAction label={chosen ? "Continue" : "Skip"} onPress={() => {
        commitPlatforms(draft);
        router.replace("/");
      }} />}
    >
      <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: 88 }}>
        <SearchField value={query} onChange={setQuery} placeholder="Search platforms" />
        <View style={{ padding: 12, gap: 12 }}>
          {featured.length > 0 && <PlatformGrid platforms={featured} draft={draft} onToggle={(id) => setDraft((prev) => ({ ...prev, [id]: !prev[id] }))} />}
          {featured.length > 0 && rest.length > 0 ? <View style={{ height: 8, borderTopWidth: 1, borderTopColor: INK }} /> : null}
          {rest.length > 0 && <PlatformGrid platforms={rest} draft={draft} onToggle={(id) => setDraft((prev) => ({ ...prev, [id]: !prev[id] }))} />}
        </View>
      </ScrollView>
    </Phone>
  );
}

function PlatformGrid({
  platforms,
  draft,
  onToggle,
}: {
  platforms: { id: string; name: string }[];
  draft: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -4 }}>
      {platforms.map((platform) => {
        const on = !!draft[platform.id];
        return (
          <View key={platform.id} style={{ width: "33.33%", padding: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={platform.name}
              onPress={() => onToggle(platform.id)}
              style={{
                minHeight: 72,
                padding: 8,
                borderWidth: 3,
                borderColor: INK,
                ...hardSm,
                backgroundColor: on ? RED : CARD,
              }}
            >
              <Text style={{ ...display(13), color: on ? "#FFFFFF" : INK }}>{platform.name}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
