import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { possessionId } from "../../src/collection";
import { ListRow, display } from "../../src/components/bits";
import { Phone } from "../../src/components/chrome";
import { platformById, platformsFor, systemIds, visibleOrder } from "../../src/platforms";
import { useCollection } from "../../src/store";
import { BODY, INK } from "../../src/theme";

export default function PlatformStep() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const id = String(gameId);
  const catalog = useCollection((state) => state.catalog);
  const active = useCollection((state) => state.active);
  const order = useCollection((state) => state.order);
  const copies = useCollection((state) => state.copies);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const game = catalog[id];
  const list = platformsFor(switch2RawgId);
  const choices = visibleOrder(order, active).filter((platformId) => systemIds(platformId).some((item) => game?.platforms.includes(item)));

  return (
    <Phone title="Add a game" showBack onBack={() => router.back()}>
      <View style={{ padding: 12, gap: 8 }}>
        <Text style={display(20)}>{game?.title ?? id}</Text>
        <Text style={{ fontFamily: BODY, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: INK }}>Choose a system</Text>
        {choices.map((platformId) => (
          <ListRow
            key={platformId}
            label={platformById(list, platformId)?.name ?? platformId}
            onPress={() => router.push(`/add/confirm?gameId=${id}&platformId=${possessionId(game?.platforms ?? [], platformId, copies, id)}&depth=2`)}
          />
        ))}
      </View>
    </Phone>
  );
}
