import { Platform } from "react-native";

const CACHE_NAME = "collection-covers";
const shown = new Map<string, string>();
const saving = new Map<string, Promise<string | null>>();

function fileName(key: string) {
  return `${key.replace(/[^a-zA-Z0-9._-]/g, "_")}.jpg`;
}

function cacheRequest(key: string) {
  return new Request(`https://collection.local/covers/${encodeURIComponent(key)}`);
}

export async function readCover(key: string) {
  const ready = shown.get(key);
  if (ready) return ready;
  const uri = Platform.OS === "web" ? await readWeb(key) : await readNative(key);
  if (uri) shown.set(key, uri);
  return uri;
}

export function rememberCover(key: string, remoteUrl: string) {
  const ready = shown.get(key);
  if (ready) return Promise.resolve(ready);
  const pending = saving.get(key);
  if (pending) return pending;
  const job = saveCover(key, remoteUrl).finally(() => saving.delete(key));
  saving.set(key, job);
  return job;
}

export async function forgetCover(key: string) {
  const pending = saving.get(key);
  if (pending) await pending.catch(() => null);
  release(key);
  if (Platform.OS === "web") {
    if (typeof caches === "undefined") return;
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(cacheRequest(key));
    return;
  }
  const file = await nativeFile(key);
  if (file?.exists) file.delete();
}

export async function pruneCovers(keepKeys: string[]) {
  const keep = new Set(keepKeys);
  const pending = [...saving.entries()].filter(([key]) => !keep.has(key)).map(([, job]) => job);
  await Promise.allSettled(pending);
  for (const key of [...shown.keys()]) {
    if (!keep.has(key)) release(key);
  }
  if (Platform.OS === "web") {
    await pruneWeb(keep);
    return;
  }
  await pruneNative(keep);
}

function release(key: string) {
  const uri = shown.get(key);
  shown.delete(key);
  saving.delete(key);
  if (uri?.startsWith("blob:")) URL.revokeObjectURL(uri);
}

function keyFromRequest(request: Request) {
  try {
    const path = new URL(request.url).pathname;
    const prefix = "/covers/";
    if (!path.startsWith(prefix)) return null;
    return decodeURIComponent(path.slice(prefix.length));
  } catch {
    return null;
  }
}

async function pruneWeb(keep: Set<string>) {
  if (typeof caches === "undefined") return;
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  await Promise.all(
    requests.map(async (request) => {
      const key = keyFromRequest(request);
      if (key == null || !keep.has(key)) await cache.delete(request);
    }),
  );
}

async function pruneNative(keep: Set<string>) {
  const { Directory, File, Paths } = await import("expo-file-system");
  const folder = new Directory(Paths.document, "covers");
  if (!folder.exists) return;
  const names = new Set([...keep].map(fileName));
  for (const item of folder.list()) {
    if (item instanceof File && !names.has(item.name)) item.delete();
  }
}

async function saveCover(key: string, remoteUrl: string) {
  const existing = await readCover(key);
  if (existing) return existing;
  const uri = Platform.OS === "web" ? await saveWeb(key, remoteUrl) : await saveNative(key, remoteUrl);
  if (uri) shown.set(key, uri);
  return uri;
}

async function readWeb(key: string) {
  if (typeof caches === "undefined") return null;
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(cacheRequest(key));
  if (!hit) return null;
  return URL.createObjectURL(await hit.blob());
}

async function saveWeb(key: string, remoteUrl: string) {
  const response = await fetch(remoteUrl);
  if (!response.ok || typeof caches === "undefined") return null;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(cacheRequest(key), response.clone());
  return URL.createObjectURL(await response.blob());
}

async function nativeFile(key: string) {
  const { Directory, File, Paths } = await import("expo-file-system");
  const folder = new Directory(Paths.document, "covers");
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
  return new File(folder, fileName(key));
}

async function readNative(key: string) {
  const file = await nativeFile(key);
  return file?.exists ? file.uri : null;
}

async function saveNative(key: string, remoteUrl: string) {
  const { File } = await import("expo-file-system");
  const destination = await nativeFile(key);
  if (!destination) return null;
  if (destination.exists) return destination.uri;
  try {
    const saved = await File.downloadFileAsync(remoteUrl, destination);
    return saved.uri;
  } catch {
    if (destination.exists) destination.delete();
    return null;
  }
}
