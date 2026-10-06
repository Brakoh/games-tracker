import { Stack } from "expo-router";
import { Anton_400Regular, useFonts } from "@expo-google-fonts/anton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";

import { useHydrated } from "../src/store";
import { PAPER } from "../src/theme";

import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Anton_400Regular });
  const hydrated = useHydrated();

  if (!fontsLoaded || !hydrated) {
    return <View style={{ flex: 1, backgroundColor: PAPER }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
