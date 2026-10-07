import Constants from "expo-constants";
import { Platform } from "react-native";

const PUBLIC_DOOR = "https://collection-igdb.brakoh-collection.workers.dev";

export function collectionDoor(path: "/covers" | "/switch-2" | "/details") {
  if (Platform.OS === "web" && typeof location !== "undefined") {
    const host = location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return path;
    if (PUBLIC_DOOR) return `${PUBLIC_DOOR}${path}`;
  }
  const base = process.env.EXPO_PUBLIC_API_BASE?.trim().replace(/\/$/, "");
  if (base) return `${base}${path}`;
  const host = Constants.expoConfig?.hostUri;
  if (host) return `http://${host}${path}`;
  return `${PUBLIC_DOOR}${path}`;
}
