import { Stack } from "expo-router";
import { Anton_400Regular, useFonts } from "@expo-google-fonts/anton";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform, View } from "react-native";

import { pruneCovers } from "../src/cover-cache";
import { useCollection, useHydrated } from "../src/store";
import { PAPER } from "../src/theme";

import "../global.css";

const queryClient = new QueryClient();

function CoverJanitor() {
  const copies = useCollection((state) => state.copies);
  const client = useQueryClient();
  const keep = copies
    .filter((copy) => copy.formats.length > 0)
    .map((copy) => `${copy.gameId}:${copy.platformId}`)
    .sort()
    .join("\n");

  useEffect(() => {
    const keys = keep ? keep.split("\n") : [];
    const owned = new Set(keys);
    void pruneCovers(keys);
    client.removeQueries({
      predicate: (query) => {
        const [kind, gameId, platformId] = query.queryKey;
        return kind === "case-cover" && !owned.has(`${String(gameId)}:${String(platformId)}`);
      },
    });
  }, [keep, client]);

  return null;
}

function useTouchFullscreen() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
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
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
