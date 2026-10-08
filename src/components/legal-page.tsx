import { router } from "expo-router";
import type { ReactNode } from "react";
import { Linking, ScrollView, Text } from "react-native";

import { BODY, INK, RED } from "../theme";
import { Phone } from "./chrome";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Phone title={title} showBack onBack={() => router.back()}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 14 }}>
        {children}
      </ScrollView>
    </Phone>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <Text style={{ fontFamily: BODY, fontSize: 12, lineHeight: 18, color: INK }}>{children}</Text>;
}

export function A({ href, children }: { href: string; children: string }) {
  return (
    <Text
      accessibilityRole="link"
      onPress={() => void Linking.openURL(href)}
      style={{ fontFamily: BODY, fontSize: 12, lineHeight: 18, color: RED, textDecorationLine: "underline" }}
    >
      {children}
    </Text>
  );
}
