import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { findCopy } from "../../src/collection";
import { SkewTag, display } from "../../src/components/bits";
import { Phone } from "../../src/components/chrome";
import { platformById, platformsFor } from "../../src/platforms";
import { useCollection } from "../../src/store";
import { BODY, INK } from "../../src/theme";
import type { Format } from "../../src/types";

export default function FormatStep() {
  const params = useLocalSearchParams<{ gameId: string; platformId: string; depth?: string }>();
  const gameId = String(params.gameId);
  const platformId = String(params.platformId);
  const catalog = useCollection((state) => state.catalog);
  const copies = useCollection((state) => state.copies);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const addFormat = useCollection((state) => state.addFormat);
  const game = catalog[gameId] ?? { id: gameId, title: gameId, platforms: [platformId] };
  const copy = findCopy(copies, gameId, platformId);
  const choices = (["physical", "digital"] as Format[]).filter((format) => !copy?.formats.includes(format));
  const name = platformById(platformsFor(switch2RawgId), platformId)?.name ?? platformId;

  return (
    <Phone title="Add a game" showBack onBack={() => router.back()}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={display(22)}>{game.title}</Text>
        <Text style={{ fontFamily: BODY, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: INK }}>{name}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {choices.map((format) => (
            <SkewTag
              key={format}
              active
              label={format === "physical" ? "Physical" : "Digital"}
              onPress={() => {
                addFormat(game, platformId, format);
                router.dismiss(Number(params.depth) === 2 ? 2 : 1);
              }}
            />
          ))}
        </View>
      </View>
    </Phone>
  );
}
