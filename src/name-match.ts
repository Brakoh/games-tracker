function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function near(left: string, right: string) {
  if (Math.abs(left.length - right.length) > 1) return false;
  let edits = 0;
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (left.length === right.length) {
      i += 1;
      j += 1;
    } else if (left.length > right.length) i += 1;
    else j += 1;
  }
  if (i < left.length || j < right.length) edits += 1;
  return edits <= 1;
}

export function nameMatches(name: string, query: string) {
  const needle = fold(query);
  if (!needle) return true;
  const haystack = fold(name);
  if (haystack.includes(needle)) return true;
  const wanted = needle.split(/\s+/);
  const got = haystack.split(/\s+/);
  const blob = got.join("");
  return wanted.every((word) => blob.includes(word) || (word.length >= 4 && got.some((part) => near(word, part))));
}
