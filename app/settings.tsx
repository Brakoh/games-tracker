import { router } from "expo-router";
import { Platform, Text, View } from "react-native";

import { Phone } from "../src/components/chrome";
import { Tap } from "../src/components/tap";
import { BODY, INK } from "../src/theme";

const DOTS = {
  height: 4,
  marginHorizontal: 12,
  ...(Platform.OS === "web"
    ? ({ backgroundImage: "radial-gradient(#0C0B08 0.7px, transparent 0.8px)", backgroundSize: "4px 4px" } as object)
    : { backgroundColor: "transparent" }),
};

function QuietRow({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Tap
      accessibilityLabel={label}
      onPress={onPress ?? (() => {})}
      style={{ paddingHorizontal: 12, paddingVertical: 14 }}
    >
      <Text style={{ fontFamily: BODY, fontSize: 13, lineHeight: 18, color: INK }}>{label}</Text>
    </Tap>
  );
}

export function SettingsMenu({ onNavigate }: { onNavigate?: () => void }) {
  const open = (href: "/privacy" | "/terms") => {
    onNavigate?.();
    router.push(href);
  };

  return (
    <View style={{ paddingTop: 8 }}>
      <QuietRow label="Usage tips" />
      <View style={DOTS} />
      <QuietRow label="Share with friends" />
      <View style={DOTS} />
      <QuietRow label="Feedback" />
      <View style={DOTS} />
      <QuietRow label="Privacy policy" onPress={() => open("/privacy")} />
      <View style={DOTS} />
      <QuietRow label="Terms of service" onPress={() => open("/terms")} />
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <Phone title="Settings" showBack onBack={() => router.back()}>
      <SettingsMenu />
    </Phone>
  );
}
