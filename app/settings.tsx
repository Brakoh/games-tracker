import { router } from "expo-router";

import { ListRow } from "../src/components/bits";
import { Phone } from "../src/components/chrome";

export default function SettingsScreen() {
  return (
    <Phone title="Settings" showBack onBack={() => router.back()}>
      <ListRow label="Wishes" onPress={() => router.push("/wishes")} />
      <ListRow label="Add systems" onPress={() => router.push("/platforms")} />
    </Phone>
  );
}
