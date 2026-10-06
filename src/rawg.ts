import Constants from "expo-constants";
import { Platform } from "react-native";

import { nameMatches } from "./name-match";
import { platformByRawgId, platformsFor } from "./platforms";
import type { CatalogGame } from "./types";

type RawgList<T> = {
  next: string | null;
  results: T[];
};

type RawgGame = {
  id: number;
  name: string;
  background_image?: string | null;
  platforms?: { platform: { id: number; slug: string; name: string } }[] | null;
};

const PAGE_SIZE = 40;

export function rawgKey() {
  return process.env.EXPO_PUBLIC_RAWG_API_KEY?.trim() ?? "";
}

function switch2Endpoint() {
  if (Platform.OS === "web") return "/switch-2";
  const host = Constants.expoConfig?.hostUri;
  return host ? `http://${host}/switch-2` : "/switch-2";
}

async function fetchSwitch2Page(query: string, page: number) {
  try {
    const response = await fetch(switch2Endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, page }),
    });
    if (!response.ok) return { games: [] as CatalogGame[], nextPage: undefined as number | undefined };
    const body = (await response.json()) as { games?: CatalogGame[]; nextPage?: number };
    return { games: body.games ?? [], nextPage: body.nextPage };
  } catch {
    return { games: [] as CatalogGame[], nextPage: undefined as number | undefined };
  }
}

export async function fetchCatalogPage(input: {
  query: string;
  page: number;
  allowedPlatformIds: string[];
  switch2RawgId: number | null;
  localGames: CatalogGame[];
}) {
  const list = platformsFor(input.switch2RawgId);
  const allowed = new Set(input.allowedPlatformIds);
  const rawgIds = list.filter((platform) => allowed.has(platform.id) && platform.rawgId > 0).map((platform) => platform.rawgId);
  const local = filterLocal(input.localGames, input.query, allowed);
  const key = rawgKey();
  const switch2 = allowed.has("switch-2") ? await fetchSwitch2Page(input.query, input.page) : { games: [] as CatalogGame[], nextPage: undefined as number | undefined };
  if (!key || rawgIds.length === 0) {
    const games = [...switch2.games, ...(input.page === 1 ? local : [])].filter(
      (game, index, all) => all.findIndex((item) => item.id === game.id) === index,
    );
    games.sort((a, b) => a.title.localeCompare(b.title));
    return { games, nextPage: switch2.nextPage };
  }

  try {
    const query = input.query.trim();
    const games: CatalogGame[] = [];
    let page = input.page;
    let nextPage: number | undefined;
    const scans = query ? 5 : 1;
    for (let scan = 0; scan < scans && games.length < PAGE_SIZE; scan += 1) {
      const url = new URL("https://api.rawg.io/api/games");
      url.searchParams.set("key", key);
      url.searchParams.set("page_size", String(PAGE_SIZE));
      url.searchParams.set("page", String(page));
      url.searchParams.set("platforms", rawgIds.join(","));
      if (query) {
        url.searchParams.set("search", query);
        url.searchParams.set("search_precise", "true");
      } else {
        url.searchParams.set("ordering", "name");
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("catalog");
      const body = (await response.json()) as RawgList<RawgGame>;
      for (const game of body.results) {
        const catalogGame = toCatalogGame(game, list);
        if (!catalogGame || !nameMatches(catalogGame.title, query)) continue;
        if (games.some((item) => item.id === catalogGame.id)) continue;
        games.push(catalogGame);
      }
      page += 1;
      nextPage = body.next ? page : undefined;
      if (!body.next) break;
    }
    const merged = [...games, ...switch2.games, ...(input.page === 1 ? local : [])].filter(
      (game, index, all) => all.findIndex((item) => item.id === game.id) === index,
    );
    merged.sort((a, b) => a.title.localeCompare(b.title));
    return { games: merged, nextPage: nextPage ?? switch2.nextPage };
  } catch {
    const fallback = [...switch2.games, ...(input.page === 1 ? local : [])];
    return { games: fallback, nextPage: switch2.nextPage };
  }
}

function filterLocal(games: CatalogGame[], query: string, allowed: Set<string>) {
  return games
    .filter((game) => nameMatches(game.title, query) && game.platforms.some((id) => allowed.has(id)))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function toCatalogGame(game: RawgGame, list: ReturnType<typeof platformsFor>): CatalogGame | null {
  const platforms = (game.platforms ?? [])
    .map((entry) => platformByRawgId(list, entry.platform.id)?.id)
    .filter((id): id is string => !!id);
  const unique = [...new Set(platforms)];
  if (!game.name || unique.length === 0) return null;
  return {
    id: String(game.id),
    title: game.name,
    platforms: unique,
    cover: game.background_image || undefined,
  };
}
