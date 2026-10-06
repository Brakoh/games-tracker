import { igdbConfigured, lookupCovers, setIgdbCredentials, switch2Catalog, type CoverRequest } from "../src/igdb";

type Env = {
  TWITCH_CLIENT_ID?: string;
  TWITCH_CLIENT_SECRET?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}

function asCoverRequests(value: unknown): CoverRequest[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as { key?: unknown; title?: unknown; platformId?: unknown };
    const key = typeof record.key === "string" ? record.key.slice(0, 80) : "";
    const title = typeof record.title === "string" ? record.title.slice(0, 200) : "";
    const platformId = typeof record.platformId === "string" ? record.platformId.slice(0, 40) : "";
    if (!key || !title || !platformId) return [];
    return [{ key, title, platformId }];
  });
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (env.TWITCH_CLIENT_ID && env.TWITCH_CLIENT_SECRET) setIgdbCredentials(env.TWITCH_CLIENT_ID, env.TWITCH_CLIENT_SECRET);
    const path = new URL(request.url).pathname;
    if (request.method !== "POST") return json({ error: "method" }, 405);
    try {
      if (path.endsWith("/covers")) {
        if (!igdbConfigured()) return json({ configured: false, covers: {} });
        const parsed = (await request.json()) as { items?: unknown };
        const covers = await lookupCovers(asCoverRequests(parsed.items).slice(0, 40));
        return json({ configured: true, covers });
      }
      if (path.endsWith("/switch-2")) {
        if (!igdbConfigured()) return json({ configured: false, games: [], nextPage: undefined });
        const parsed = (await request.json().catch(() => ({}))) as { query?: unknown; page?: unknown };
        const query = typeof parsed.query === "string" ? parsed.query.slice(0, 200) : "";
        const page = typeof parsed.page === "number" && parsed.page > 0 ? Math.floor(parsed.page) : 1;
        const result = await switch2Catalog(query, page);
        return json({ configured: true, ...result });
      }
      return json({ error: "not found" }, 404);
    } catch {
      return json({ configured: true, covers: {}, games: [] }, 502);
    }
  },
};
