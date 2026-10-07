import { isSwitch, menuPlatformId, systemIds } from "./platforms";
import type { CatalogGame, Copy, SortMode } from "./types";

export function owns(copies: Copy[], gameId: string) {
  return copies.some((copy) => copy.gameId === gameId);
}

export function findCopy(copies: Copy[], gameId: string, platformId: string) {
  return copies.find((copy) => copy.gameId === gameId && copy.platformId === platformId);
}

export function titleKey(title: string) {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function copyByTitle(copies: Copy[], catalog: Record<string, CatalogGame>, title: string, platformId: string) {
  const key = titleKey(title);
  return copies.find((copy) => copy.platformId === platformId && titleKey(catalog[copy.gameId]?.title ?? "") === key);
}

export function sortCopies(copies: Copy[], mode: SortMode, titleOf: (gameId: string) => string, platformOf: (id: string) => string) {
  const titled = copies.map((copy) => ({
    copy,
    title: titleOf(copy.gameId),
    platform: platformOf(copy.platformId),
  }));
  const byName = (a: (typeof titled)[number], b: (typeof titled)[number]) =>
    a.title.localeCompare(b.title) || a.platform.localeCompare(b.platform);
  const open = titled.filter((item) => !item.copy.finished).sort(byName);
  const done = titled.filter((item) => item.copy.finished).sort(byName);
  if (mode === "open") return [...open, ...done].map((item) => item.copy);
  if (mode === "done") return [...done, ...open].map((item) => item.copy);
  return [...titled].sort(byName).map((item) => item.copy);
}

export function canAdd(game: CatalogGame, platformId: string | null, active: Record<string, boolean>, copies: Copy[]) {
  const candidates = platformId
    ? systemIds(platformId).filter((id) => game.platforms.includes(id))
    : game.platforms.filter((id) => active[id] || (isSwitch(id) && (active.switch || active["switch-2"])));
  const groups = new Map<string, string[]>();
  for (const id of candidates) {
    const key = menuPlatformId(id);
    groups.set(key, [...(groups.get(key) ?? []), id]);
  }
  return [...groups.values()].some((ids) => !copies.some((copy) => copy.gameId === game.id && ids.includes(copy.platformId)));
}

export function possessionId(platforms: string[], menuId: string, copies: Copy[], gameId: string) {
  const ids = systemIds(menuId).filter((id) => platforms.includes(id));
  const owned = copies.find((copy) => copy.gameId === gameId && ids.includes(copy.platformId));
  if (owned) return owned.platformId;
  return ids[0] ?? menuId;
}

export function withCopy(copies: Copy[], gameId: string, platformId: string) {
  if (findCopy(copies, gameId, platformId)) return copies;
  return [...copies, { gameId, platformId, finished: false }];
}

export function withoutCopy(copies: Copy[], gameId: string, platformId: string) {
  return copies.filter((copy) => copy.gameId !== gameId || copy.platformId !== platformId);
}
