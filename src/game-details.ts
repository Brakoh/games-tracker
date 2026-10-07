import { useQuery } from "@tanstack/react-query";

import { collectionDoor } from "./door";
import type { GameDetails } from "./igdb";

async function fetchDetails(title: string, platformId: string) {
  const response = await fetch(collectionDoor("/details"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, platformId }),
  });
  if (!response.ok) throw new Error(String(response.status));
  const data = (await response.json()) as { details?: GameDetails | null };
  return data.details ?? null;
}

export function useGameDetails(title: string, platformId: string) {
  return useQuery({
    queryKey: ["game-details", title, platformId],
    queryFn: () => fetchDetails(title, platformId),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    enabled: title.trim().length > 0,
  });
}
