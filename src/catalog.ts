import { collectionDoor } from "./door";
import type { CatalogGame } from "./types";

export async function fetchCatalogPage(input: { query: string; page: number; allowedPlatformIds: string[] }) {
  if (input.allowedPlatformIds.length === 0) return { games: [] as CatalogGame[], nextPage: undefined as number | undefined };

  try {
    const response = await fetch(collectionDoor("/catalog"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: input.query,
        page: input.page,
        platformIds: input.allowedPlatformIds,
      }),
    });
    if (!response.ok) throw new Error("catalog");
    const body = (await response.json()) as { games?: CatalogGame[]; nextPage?: number };
    const games = (Array.isArray(body.games) ? body.games : []).filter(
      (game, index, all) => all.findIndex((item) => item.id === game.id) === index,
    );
    if (input.query.trim()) games.sort((a, b) => a.title.localeCompare(b.title));
    return { games, nextPage: body.nextPage };
  } catch {
    return { games: [] as CatalogGame[], nextPage: undefined as number | undefined };
  }
}
