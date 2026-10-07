import { router, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCaseCover } from "../../src/case-cover";
import { Phone, useFramed } from "../../src/components/chrome";
import { GameSheet } from "../../src/components/game-sheet";
import { Tap } from "../../src/components/tap";
import { platformById, platformsFor, menuPlatformId } from "../../src/platforms";
import { useCollection } from "../../src/store";
import { DISPLAY, hard, INK, RED } from "../../src/theme";

export default function ConfirmStep() {
  const params = useLocalSearchParams<{ gameId: string; platformId: string; depth?: string }>();
  const gameId = String(params.gameId);
  const platformId = String(params.platformId);
  const catalog = useCollection((state) => state.catalog);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const addCopy = useCollection((state) => state.addCopy);
  const game = catalog[gameId] ?? { id: gameId, title: gameId, platforms: [platformId] };
  const name = platformById(platformsFor(switch2RawgId), menuPlatformId(platformId))?.name ?? platformId;
  const front = useCaseCover(gameId, platformId, game.title) || (game.cover?.startsWith("https://images.igdb.com/") ? game.cover : undefined);

  return (
    <Phone
      title="Add a game"
      showBack
      onBack={() => router.back()}
      footer={
        <AddGame
          onPress={() => {
            addCopy(game, platformId);
            router.dismiss(Number(params.depth) === 2 ? 2 : 1);
          }}
        />
      }
    >
      <GameSheet title={game.title} platformId={platformId} platformName={name} cover={front} />
    </Phone>
  );
}

function AddGame({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  return (
    <Tap
      accessibilityLabel="Add game"
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
      <Text style={{ color: "#FFFFFF", fontFamily: DISPLAY, fontSize: 18, letterSpacing: 0.6, textTransform: "uppercase" }}>Add game</Text>
    </Tap>
  );
}
