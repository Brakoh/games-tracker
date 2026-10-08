import { closestGame, coverImage } from "./cover-match";
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
const override: { id?: string; secret?: string } = {};

export function setIgdbCredentials(id: string, secret: string) {
  if (override.id === id && override.secret === secret) return;
  override.id = id;
  override.secret = secret;
  token = null;
}

function credential(name: "TWITCH_CLIENT_ID" | "TWITCH_CLIENT_SECRET") {
  if (name === "TWITCH_CLIENT_ID" && override.id) return override.id;
  if (name === "TWITCH_CLIENT_SECRET" && override.secret) return override.secret;
  const env = typeof process !== "undefined" ? process.env : undefined;
  return env?.[name];
}

export function igdbConfigured() {
  return Boolean(credential("TWITCH_CLIENT_ID") && credential("TWITCH_CLIENT_SECRET"));
}

function quote(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function accessToken() {
  if (token && token.expires > Date.now()) return token.value;
  const clientId = credential("TWITCH_CLIENT_ID");
  const clientSecret = credential("TWITCH_CLIENT_SECRET");
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

const MIN_GAP_MS = 250;
let lastIgdbStart = 0;
let igdbTail: Promise<unknown> = Promise.resolve();

function pace<T>(run: () => Promise<T>): Promise<T> {
  const job = igdbTail.then(async () => {
    const wait = lastIgdbStart + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastIgdbStart = Date.now();
    return run();
  });
  igdbTail = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

async function igdb(path: string, body: string) {
  return pace(async () => {
    const clientId = credential("TWITCH_CLIENT_ID");
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
  });
}

const SWITCH_FAMILY = [IGDB_PLATFORM.switch, IGDB_PLATFORM["switch-2"]];

function igdbPlatforms(platformId: string) {
  const platform = IGDB_PLATFORM[platformId];
  if (!platform) return [];
  return SWITCH_FAMILY.includes(platform) ? SWITCH_FAMILY : [platform];
}

async function gamesFor(item: CoverRequest) {
  const platforms = igdbPlatforms(item.platformId).join(",");
  const title = item.title.replace(/[\r\n]+/g, " ").trim().slice(0, 160);
  const payload = (await igdb(
    "games",
    [`search ${quote(title)};`, "fields name,cover.image_id;", `where platforms = (${platforms}) & cover != null;`, "limit 8;"].join(" "),
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
  }

  return covers;
}

export type GameDetails = {
  developer?: string;
  publisher?: string;
  year?: number;
  genres: string[];
  banner?: string;
  summary?: string;
  related: { id: string; title: string; cover: string }[];
  platforms: { id?: string; name: string }[];
};

type IgdbDetails = {
  name: string;
  first_release_date?: number;
  summary?: string;
  platforms?: { id?: number; name?: string }[];
  genres?: { name?: string }[];
  similar_games?: { id?: number; name?: string; platforms?: number[]; cover?: { image_id?: string } }[];
  screenshots?: { image_id?: string }[];
  involved_companies?: { developer?: boolean; publisher?: boolean; company?: { name?: string } }[];
};

export async function lookupDetails(item: { title: string; platformId: string }): Promise<GameDetails | null> {
  const platforms = igdbPlatforms(item.platformId);
  const title = item.title.replace(/[\r\n]+/g, " ").trim().slice(0, 160);
  if (!platforms.length || !title) return null;
  const payload = (await igdb(
    "games",
    [
      `search ${quote(title)};`,
      "fields name,first_release_date,summary,platforms.name,genres.name,involved_companies.developer,involved_companies.publisher,involved_companies.company.name,screenshots.image_id,similar_games.name,similar_games.platforms,similar_games.cover.image_id;",
      `where platforms = (${platforms.join(",")});`,
      "limit 8;",
    ].join(" "),
  )) as IgdbDetails[];
  const game = closestGame(item.title, Array.isArray(payload) ? payload : []);
  if (!game) return null;
  const companies = game.involved_companies ?? [];
  const companyName = (role: "developer" | "publisher") => companies.find((entry) => entry[role])?.company?.name;
  const bannerId = (game.screenshots ?? []).find((image) => image.image_id)?.image_id;
  return {
    platforms: (game.platforms ?? []).flatMap((entry) =>
      entry.name ? [{ id: Object.keys(IGDB_PLATFORM).find((id) => IGDB_PLATFORM[id] === entry.id), name: entry.name }] : [],
    ),
    summary: game.summary?.trim() || undefined,
    related: (game.similar_games ?? [])
      .flatMap((similar) =>
        similar.id && similar.name && similar.cover?.image_id && similar.platforms?.some((id) => platforms.includes(id))
          ? [
              {
                id: `igdb-${similar.id}`,
                title: similar.name,
                cover: `https://images.igdb.com/igdb/image/upload/t_cover_big/${similar.cover.image_id}.jpg`,
              },
            ]
          : [],
      )
      .slice(0, 6),
    banner: bannerId ? `https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${bannerId}.jpg` : undefined,
    developer: companyName("developer"),
    publisher: companyName("publisher"),
    year: game.first_release_date ? new Date(game.first_release_date * 1000).getUTCFullYear() : undefined,
    genres: (game.genres ?? []).flatMap((genre) => (genre.name ? [genre.name] : [])).slice(0, 2),
  };
}

const CATALOG_PAGE = 40;
const MAIN_GAME_TYPES = "0,4,8,9,10,11";

function knownPlatformId(igdbId: number | undefined) {
  if (!igdbId) return undefined;
  return Object.keys(IGDB_PLATFORM).find((id) => IGDB_PLATFORM[id] === igdbId);
}

function platformNumbers(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "number") return [entry];
    if (entry && typeof entry === "object" && typeof (entry as { id?: unknown }).id === "number") return [(entry as { id: number }).id];
    return [];
  });
}

function catalogGameFrom(game: { id?: number; name?: string; cover?: { image_id?: string } | number; platforms?: unknown }): CatalogGame | null {
  if (!game.id || !game.name) return null;
  const platforms = [...new Set(platformNumbers(game.platforms).map((id) => knownPlatformId(id)).filter((id): id is string => !!id))];
  if (!platforms.length) return null;
  const imageId = typeof game.cover === "object" ? game.cover?.image_id : undefined;
  return {
    id: `igdb-${game.id}`,
    title: game.name,
    platforms,
    cover: imageId ? `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg` : undefined,
  };
}

export async function searchCatalog(query: string, page: number, platformIds: string[]) {
  const igdbIds = [...new Set(platformIds.flatMap((id) => igdbPlatforms(id)))];
  if (!igdbIds.length || page < 1) return { games: [] as CatalogGame[], nextPage: undefined as number | undefined };
  const trimmed = query.trim().slice(0, 160);
  const where = `platforms = (${igdbIds.join(",")}) & game_type = (${MAIN_GAME_TYPES})`;
  const cursor = Math.floor(page);
  const offset = (cursor - 1) * CATALOG_PAGE;
  if (!trimmed) {
    const batch = await catalogBatch(`where ${where}; sort name asc; limit ${CATALOG_PAGE}; offset ${offset};`);
    const games = acceptCatalog(batch, trimmed);
    return { games, nextPage: batch.length < CATALOG_PAGE ? undefined : cursor + 1 };
  }
  const quoted = quote(trimmed);
  const prefix = await catalogBatch(`where name ~ ${quoted}* & ${where}; sort name asc; limit ${CATALOG_PAGE}; offset ${offset};`);
  const games = acceptCatalog(prefix, trimmed);
  if (prefix.length >= CATALOG_PAGE) return { games, nextPage: cursor + 1 };
  const infix = await catalogBatch(`where name ~ *${quoted}* & ${where}; sort name asc; limit ${CATALOG_PAGE}; offset ${offset};`);
  for (const game of acceptCatalog(infix, trimmed)) {
    if (games.length >= CATALOG_PAGE) break;
    if (games.some((item) => item.id === game.id)) continue;
    games.push(game);
  }
  const more = prefix.length + infix.length >= CATALOG_PAGE;
  return { games, nextPage: more ? cursor + 1 : undefined };
}

async function catalogBatch(clause: string) {
  const payload = (await igdb("games", `fields id,name,cover.image_id,platforms; ${clause}`)) as {
    id?: number;
    name?: string;
    cover?: { image_id?: string } | number;
    platforms?: unknown;
  }[];
  return Array.isArray(payload) ? payload : [];
}

function acceptCatalog(
  batch: { id?: number; name?: string; cover?: { image_id?: string } | number; platforms?: unknown }[],
  trimmed: string,
) {
  const games: CatalogGame[] = [];
  for (const game of batch) {
    const catalogGame = catalogGameFrom(game);
    if (!catalogGame || !nameMatches(catalogGame.title, trimmed)) continue;
    if (games.some((item) => item.id === catalogGame.id)) continue;
    games.push(catalogGame);
  }
  return games;
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
      ? `fields name,cover.image_id; where name ~ *${quote(trimmed.slice(0, 160))}* & ${where}; sort name asc; limit ${SWITCH2_PAGE}; offset ${offset};`
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
