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
  const candidates = platformId ? [platformId] : game.platforms.filter((id) => active[id]);
  return candidates.some((id) => {
    if (!game.platforms.includes(id)) return false;
    const copy = findCopy(copies, game.id, id);
    if (!copy) return true;
    return copy.formats.length < 2;
  });
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
