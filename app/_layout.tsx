import { Stack } from "expo-router/js-stack";
import { Anton_400Regular, useFonts } from "@expo-google-fonts/anton";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform, View } from "react-native";

import { bannerKey } from "../src/case-cover";
import { pruneCovers } from "../src/cover-cache";
import { useCollection, useHydrated } from "../src/store";
import { PAPER } from "../src/theme";

import "../global.css";

const queryClient = new QueryClient();

function CoverJanitor() {
  const copies = useCollection((state) => state.copies);
  const client = useQueryClient();
  const keep = copies
    .map((copy) => `${copy.gameId}:${copy.platformId}`)
    .sort()
    .join("\n");

  useEffect(() => {
    const keys = keep ? keep.split("\n") : [];
    const owned = new Set(keys);
    const banners = new Set(keys.map((key) => bannerKey(...(key.split(":") as [string, string]))));
    void pruneCovers([...keys, ...banners]);
    client.removeQueries({
      predicate: (query) => {
        const [kind, first, second] = query.queryKey;
        if (kind === "saved-banner") return !banners.has(String(first));
        return kind === "case-cover" && !owned.has(`${String(first)}:${String(second)}`);
      },
    });
  }, [keep, client]);

  return null;
}

function useTouchFullscreen() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined" || __DEV__) return;
    const emulated = /Android|iPhone/.test(navigator.userAgent) && /^(Mac|Win)/.test(navigator.platform);
    if (emulated) return;
    const root = document.documentElement;
    if (!root.requestFullscreen || !window.matchMedia("(pointer: coarse)").matches) return;
    const enter = () => {
      if (document.fullscreenElement || window.matchMedia("(display-mode: fullscreen)").matches) return;
      root.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    };
    document.addEventListener("pointerup", enter);
    return () => document.removeEventListener("pointerup", enter);
  }, []);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Anton_400Regular });
  const hydrated = useHydrated();
  useTouchFullscreen();

  if (!fontsLoaded || !hydrated) {
    return <View style={{ flex: 1, backgroundColor: PAPER }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <CoverJanitor />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "none",
              gestureEnabled: false,
              cardShadowEnabled: false,
              cardOverlayEnabled: false,
              cardStyle: { backgroundColor: PAPER, flex: 1, height: "100%", maxHeight: "100%", overflow: "hidden" },
            }}
          />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
