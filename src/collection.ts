import { isSwitch, menuPlatformId, systemIds } from "./platforms";
import type { CatalogGame, Copy, Format, SortMode } from "./types";

export function owns(copies: Copy[], gameId: string) {
  return copies.some((copy) => copy.gameId === gameId && copy.formats.length > 0);
}

export function findCopy(copies: Copy[], gameId: string, platformId: string) {
  return copies.find((copy) => copy.gameId === gameId && copy.platformId === platformId && copy.formats.length > 0);
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
  return [...groups.values()].some((ids) => {
    const owned = copies.filter((copy) => copy.gameId === game.id && ids.includes(copy.platformId) && copy.formats.length > 0);
    if (owned.length === 0) return true;
    return owned.some((copy) => copy.formats.length < 2);
  });
}

export function possessionId(platforms: string[], menuId: string, copies: Copy[], gameId: string) {
  const ids = systemIds(menuId).filter((id) => platforms.includes(id));
  const owned = copies.find((copy) => copy.gameId === gameId && ids.includes(copy.platformId) && copy.formats.length > 0);
  if (owned) return owned.platformId;
  return ids[0] ?? menuId;
}

export function withFormat(copies: Copy[], gameId: string, platformId: string, format: Format) {
  const existing = findCopy(copies, gameId, platformId);
  if (!existing) return [...copies, { gameId, platformId, formats: [format], finished: false }];
  return copies.map((copy) =>
    copy.gameId === gameId && copy.platformId === platformId
      ? { ...copy, formats: copy.formats.includes(format) ? copy.formats : [...copy.formats, format] }
      : copy,
  );
}

export function withoutFormat(copies: Copy[], gameId: string, platformId: string, format: Format) {
  return copies.flatMap((copy) => {
    if (copy.gameId !== gameId || copy.platformId !== platformId) return [copy];
    const formats = copy.formats.filter((item) => item !== format);
    return formats.length ? [{ ...copy, formats }] : [];
  });
}
