function words(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && word !== "the");
}

export function closestGame<T extends { name: string }>(title: string, games: T[]) {
  const want = words(title);
  if (want.length === 0) return null;
  const ranked = games.flatMap((game) => {
    const got = words(game.name);
    if (!want.every((word) => got.includes(word))) return [];
    return [{ game, extra: got.filter((word) => !want.includes(word)).length }];
  });
  ranked.sort((a, b) => a.extra - b.extra);
  const best = ranked[0];
  return best && best.extra <= 1 ? best.game : null;
}

function imageIdOf(cover: { image_id?: string } | number | undefined) {
  return typeof cover === "object" ? cover.image_id : undefined;
}

export function coverImage(title: string, games: { name: string; cover?: { image_id?: string } | number }[]) {
  const want = words(title);
  if (want.length === 0) return null;
  const ranked = games.flatMap((game) => {
    const imageId = imageIdOf(game.cover);
    if (!imageId) return [];
    const got = words(game.name);
    if (!want.every((word) => got.includes(word))) return [];
    const extra = got.filter((word) => !want.includes(word)).length;
    return [{ imageId, extra }];
  });
  ranked.sort((a, b) => a.extra - b.extra);
  const best = ranked[0];
  if (!best || best.extra > 1) return null;
  return `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${best.imageId}.jpg`;
}
