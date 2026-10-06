import Constants from "expo-constants";
import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";

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
  if (Platform.OS === "web") return "/covers";
  const host = Constants.expoConfig?.hostUri;
  return host ? `http://${host}/covers` : "/covers";
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

export function useCaseCover(gameId: string, platformId: string, title: string) {
  const query = useQuery({
    queryKey: ["case-cover", gameId, platformId, title],
    queryFn: () => loadCaseCover(`${gameId}:${platformId}`, title, platformId),
    staleTime: Infinity,
    retry: false,
    enabled: title.trim().length > 0,
  });
  return query.data || undefined;
}
