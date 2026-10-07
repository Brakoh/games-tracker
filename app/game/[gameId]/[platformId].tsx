import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { useCaseCover } from "../../../src/case-cover";
import { forgetCover } from "../../../src/cover-cache";
import { findCopy } from "../../../src/collection";
import { display } from "../../../src/components/bits";
import { Phone } from "../../../src/components/chrome";
import { Checkbox, GameSheet } from "../../../src/components/game-sheet";
import { Tap } from "../../../src/components/tap";
import { platformById, platformsFor, menuPlatformId } from "../../../src/platforms";
import { useCollection } from "../../../src/store";
import { CARD, hardSm, INK, RED } from "../../../src/theme";

export default function GameScreen() {
  const params = useLocalSearchParams<{ gameId: string; platformId: string; from?: string }>();
  const gameId = String(params.gameId);
  const platformId = String(params.platformId);
  const copies = useCollection((state) => state.copies);
  const catalog = useCollection((state) => state.catalog);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const toggleFinished = useCollection((state) => state.toggleFinished);
  const removeCopy = useCollection((state) => state.removeCopy);
  const copy = findCopy(copies, gameId, platformId);
  const list = platformsFor(switch2RawgId);
  const title = catalog[gameId]?.title ?? gameId;
  const platformName = platformById(list, menuPlatformId(platformId))?.name ?? platformId;
  const game = catalog[gameId] ?? { id: gameId, title, platforms: [platformId] };
  const front = useCaseCover(gameId, platformId, title) || (game.cover?.startsWith("https://images.igdb.com/") ? game.cover : undefined);

  if (!copy) {
    return (
      <Phone title="Game" showBack onBack={() => router.replace(params.from === "home" ? "/" : `/shelf/${platformId}`)}>
        <View />
      </Phone>
    );
  }

  return (
    <Phone title="Game" showBack onBack={() => router.replace(params.from === "home" ? "/" : `/shelf/${platformId}`)}>
      <GameSheet title={title} platformId={platformId} platformName={platformName} cover={front} finished={copy.finished}>
        <Checkbox label="Finished" checked={copy.finished} onPress={() => toggleFinished(gameId, platformId)} />
        <Tap
          accessibilityLabel="Remove"
          onPress={() => {
            removeCopy(gameId, platformId);
            void forgetCover(`${gameId}:${platformId}`);
            router.replace(`/shelf/${platformId}`);
          }}
          style={{ paddingVertical: 14, paddingHorizontal: 12, backgroundColor: CARD, borderWidth: 3, borderColor: INK, ...hardSm }}
        >
          <Text style={{ ...display(18), color: RED }}>Remove</Text>
        </Tap>
      </GameSheet>
    </Phone>
  );
}
