import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useCaseCover } from "../../../src/case-cover";
import { findCopy } from "../../../src/collection";
import { SkewTag, display } from "../../../src/components/bits";
import { CaseFace, Phone, formatLabel } from "../../../src/components/chrome";
import { platformById, platformsFor } from "../../../src/platforms";
import { useCollection } from "../../../src/store";
import { BODY, CARD, DISPLAY, INK, RED } from "../../../src/theme";
import type { Format } from "../../../src/types";

export default function GameScreen() {
  const params = useLocalSearchParams<{ gameId: string; platformId: string; from?: string }>();
  const gameId = String(params.gameId);
  const platformId = String(params.platformId);
  const copies = useCollection((state) => state.copies);
  const catalog = useCollection((state) => state.catalog);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const toggleFinished = useCollection((state) => state.toggleFinished);
  const addFormat = useCollection((state) => state.addFormat);
  const removeFormat = useCollection((state) => state.removeFormat);
  const copy = findCopy(copies, gameId, platformId);
  const list = platformsFor(switch2RawgId);
  const title = catalog[gameId]?.title ?? gameId;
  const platformName = platformById(list, platformId)?.name ?? platformId;
  const game = catalog[gameId] ?? { id: gameId, title, platforms: [platformId] };
  const front = useCaseCover(gameId, platformId, title);

  if (!copy) {
    return (
      <Phone title="Game" showBack onBack={() => router.replace(params.from === "home" ? "/" : `/shelf/${platformId}`)}>
        <View />
      </Phone>
    );
  }

  const missing = (["physical", "digital"] as Format[]).filter((format) => !copy.formats.includes(format));

  return (
    <Phone title="Game" showBack onBack={() => router.replace(params.from === "home" ? "/" : `/shelf/${platformId}`)}>
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ width: 160 }}>
          <CaseFace
            platformId={platformId}
            cover={front}
            finished={copy.finished}
            onToggleFinished={() => toggleFinished(gameId, platformId)}
          />
        </View>
        <Text style={{ fontFamily: DISPLAY, fontSize: 28, lineHeight: 30, letterSpacing: 0.4, textTransform: "uppercase", color: INK }}>{title}</Text>
        <Text style={{ fontFamily: BODY, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: INK }}>{platformName}</Text>
        {copy.formats.map((format) => (
          <View key={format} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={display(16)}>{formatLabel(format)}</Text>
            <SkewTag
              label="Remove"
              onPress={() => {
                const still = removeFormat(gameId, platformId, format);
                if (!still) router.replace(`/shelf/${platformId}`);
              }}
            />
          </View>
        ))}
        {missing.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {missing.map((format) => (
              <SkewTag key={format} label={format === "physical" ? "Add Physical" : "Add Digital"} onPress={() => addFormat(game, platformId, format)} />
            ))}
          </View>
        )}
        <View style={{ height: 3, backgroundColor: INK }} />
        <Pressable onPress={() => toggleFinished(gameId, platformId)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 18, height: 18, borderWidth: 2, borderColor: INK, backgroundColor: copy.finished ? RED : CARD }} />
          <Text style={display(18)}>Finished</Text>
        </Pressable>
      </View>
    </Phone>
  );
}
