import { router, useLocalSearchParams } from "expo-router";

import { useCaseCover } from "../../src/case-cover";
import { Phone } from "../../src/components/chrome";
import { AddButton, GameSheet } from "../../src/components/game-sheet";
import { platformById, platformsFor, menuPlatformId } from "../../src/platforms";
import { useCollection } from "../../src/store";

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
        <AddButton
          label="Add game"
          onPress={() => {
            addCopy(game, platformId);
            router.dismiss(Number(params.depth) === 2 ? 2 : 1);
          }}
        />
      }
    >
      <GameSheet title={game.title} platformId={platformId} platformName={name} cover={front} bottomSpace={110} />
    </Phone>
  );
}
