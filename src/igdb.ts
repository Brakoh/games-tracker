import { coverImage } from "./cover-match";
import { nameMatches } from "./name-match";
import type { CatalogGame } from "./types";

const IGDB_PLATFORM: Record<string, number> = {
  ps5: 167,
  "xbox-series": 169,
  switch: 130,
  "switch-2": 508,
  pc: 6,
  gb: 33,
  gba: 24,
  gc: 21,
  n3ds: 37,
  n64: 4,
  nds: 20,
  ps1: 7,
  ps2: 8,
  ps3: 9,
  ps4: 48,
  psp: 38,
  vita: 46,
  dreamcast: 23,
  genesis: 29,
  snes: 19,
  wii: 5,
  wiiu: 41,
  xbox: 11,
  xbox360: 12,
  xboxone: 49,
};

export type CoverRequest = {
  key: string;
  title: string;
  platformId: string;
};

type IgdbGame = {
  name: string;
  cover?: { image_id?: string } | number;
};

let token: { value: string; expires: number } | null = null;

export function igdbConfigured() {
  return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

function quote(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function accessToken() {
  if (token && token.expires > Date.now()) return token.value;
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!response.ok) throw new Error("token");
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token || !json.expires_in) throw new Error("token");
  token = { value: json.access_token, expires: Date.now() + Math.max(30, json.expires_in - 60) * 1000 };
  return token.value;
}

async function igdb(path: string, body: string) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const access = await accessToken();
  if (!clientId || !access) throw new Error("token");
  const response = await fetch(`https://api.igdb.com/v4/${path}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${access}`,
      Accept: "application/json",
      "Content-Type": "text/plain",
    },
    body,
  });
  if (!response.ok) throw new Error("igdb");
  return response.json();
}

async function gamesFor(item: CoverRequest) {
  const platform = IGDB_PLATFORM[item.platformId];
  const title = item.title.replace(/[\r\n]+/g, " ").trim().slice(0, 160);
  const payload = (await igdb(
    "games",
    [`search ${quote(title)};`, "fields name,cover.image_id;", `where platforms = (${platform}) & cover != null;`, "limit 8;"].join(" "),
  )) as IgdbGame[];
  return coverImage(item.title, Array.isArray(payload) ? payload : []);
}

export async function lookupCovers(items: CoverRequest[]) {
  const covers: Record<string, string | null> = {};
  const pending = items.filter((item) => {
    const title = item.title.trim();
    if (!IGDB_PLATFORM[item.platformId] || !title) {
      covers[item.key] = null;
      return false;
    }
    return true;
  });

  for (let start = 0; start < pending.length; start += 3) {
    const chunk = pending.slice(start, start + 3);
    const found = await Promise.all(chunk.map(async (item) => [item.key, await gamesFor(item)] as const));
    for (const [key, url] of found) covers[key] = url;
    if (start + 3 < pending.length) await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return covers;
}

const SWITCH2_PAGE = 40;

function switch2Game(game: IgdbGame & { id?: number }): CatalogGame | null {
  const imageId = typeof game.cover === "object" ? game.cover?.image_id : undefined;
  if (!game.id || !game.name || !imageId) return null;
  return {
    id: `igdb-${game.id}`,
    title: game.name,
    platforms: ["switch-2"],
    cover: `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg`,
  };
}

export async function switch2Catalog(query: string, page: number) {
  const trimmed = query.trim();
  const games: CatalogGame[] = [];
  let cursor = page;
  const scans = trimmed ? 5 : 1;
  for (let scan = 0; scan < scans && games.length < SWITCH2_PAGE; scan += 1) {
    const offset = (cursor - 1) * SWITCH2_PAGE;
    const where = "platforms = (508) & cover != null & game_type = (0,4,8,9,10,11)";
    const body = trimmed
      ? `search ${quote(trimmed.slice(0, 160))}; fields name,cover.image_id; where ${where}; limit ${SWITCH2_PAGE}; offset ${offset};`
      : `fields name,cover.image_id; where ${where}; sort name asc; limit ${SWITCH2_PAGE}; offset ${offset};`;
    const payload = (await igdb("games", body)) as (IgdbGame & { id?: number })[];
    const batch = Array.isArray(payload) ? payload : [];
    for (const game of batch) {
      const catalogGame = switch2Game(game);
      if (!catalogGame || !nameMatches(catalogGame.title, trimmed)) continue;
      if (games.some((item) => item.id === catalogGame.id)) continue;
      games.push(catalogGame);
    }
    cursor += 1;
    if (batch.length < SWITCH2_PAGE) return { games, nextPage: undefined as number | undefined };
  }
  return { games, nextPage: cursor };
}
