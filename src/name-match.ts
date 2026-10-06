function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function nameMatches(name: string, query: string) {
  const words = query
    .split(/\s+/)
    .map((word) => fold(word).replace(/[^a-z0-9]+/g, ""))
    .filter((word) => word.length > 0);
  if (words.length === 0) return true;
  const haystack = fold(name).replace(/[^a-z0-9]+/g, "");
  return words.every((word) => haystack.includes(word));
}
