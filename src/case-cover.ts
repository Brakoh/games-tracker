import { useQuery } from "@tanstack/react-query";

import { readCover, rememberCover } from "./cover-cache";
import { collectionDoor } from "./door";
import { useCollection } from "./store";

type CoverResponse = {
  configured?: boolean;
  covers?: Record<string, string | null>;
};

let unavailable = false;
const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

type Job = {
  key: string;
  title: string;
  platformId: string;
  resolve: (url: string | null) => void;
  reject: (error: Error) => void;
};

let queue: Job[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function endpoint() {
  return collectionDoor("/covers");
}

async function flush() {
  flushTimer = null;
  const jobs = queue;
  queue = [];
  if (jobs.length === 0) return;
  try {
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: jobs.map((job) => ({ key: job.key, title: job.title, platformId: job.platformId })),
      }),
    });
    if (!response.ok) throw new Error(String(response.status));
    const data = (await response.json()) as CoverResponse;
    if (data.configured === false) unavailable = true;
    for (const job of jobs) {
      const url = data.configured === false ? null : (data.covers?.[job.key] ?? null);
      if (data.configured !== false) cache.set(job.key, url);
      inflight.delete(job.key);
      job.resolve(url);
    }
  } catch (error) {
    const failure = error instanceof Error ? error : new Error("cover");
    for (const job of jobs) {
      inflight.delete(job.key);
      job.reject(failure);
    }
  }
}

export function loadCaseCover(key: string, title: string, platformId: string) {
  if (unavailable) return Promise.resolve(null);
  const cached = cache.get(key);
  if (cached !== undefined) return Promise.resolve(cached);
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = new Promise<string | null>((resolve, reject) => {
    queue.push({ key, title, platformId, resolve, reject });
    if (!flushTimer) flushTimer = setTimeout(() => void flush(), 40);
  });
  inflight.set(key, promise);
  return promise;
}

async function ownedCover(key: string, title: string, platformId: string) {
  try {
    const saved = await readCover(key);
    if (saved) return saved;
  } catch {
    // A broken local copy falls through to a fresh download.
  }
  const remote = await loadCaseCover(key, title, platformId);
  if (!remote) return null;
  try {
    return (await rememberCover(key, remote)) ?? remote;
  } catch {
    return remote;
  }
}

export function bannerKey(gameId: string, platformId: string) {
  return `banner:${gameId}:${platformId}`;
}

export function useSavedBanner(key: string | undefined, remote: string | undefined) {
  const query = useQuery({
    queryKey: ["saved-banner", key, remote ?? null],
    queryFn: async () => {
      const saved = await readCover(key!).catch(() => null);
      if (saved || !remote) return saved;
      return (await rememberCover(key!, remote).catch(() => null)) ?? remote;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    networkMode: "always",
    enabled: Boolean(key),
  });
  return query.data || undefined;
}

const PASSING_GC = 60_000;

export function useCaseCover(gameId: string, platformId: string, title: string, enabled = true) {
  const owned = useCollection((state) => state.copies.some((copy) => copy.gameId === gameId && copy.platformId === platformId));
  const query = useQuery({
    queryKey: [owned ? "case-cover" : "passing-cover", gameId, platformId, title],
    queryFn: () => (owned ? ownedCover : loadCaseCover)(`${gameId}:${platformId}`, title, platformId),
    staleTime: Infinity,
    gcTime: owned ? Infinity : PASSING_GC,
    retry: 2,
    networkMode: "always",
    enabled: enabled && title.trim().length > 0,
  });
  return query.data || undefined;
}
