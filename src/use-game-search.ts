import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchCatalogPage } from "./rawg";
import { useCollection } from "./store";

export function useGameSearch(query: string, allowedPlatformIds: string[]) {
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const allowedKey = [...allowedPlatformIds].sort().join(",");

  return useInfiniteQuery({
    queryKey: ["catalog", query, allowedKey, switch2RawgId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchCatalogPage({
        query,
        page: pageParam,
        allowedPlatformIds,
        switch2RawgId,
        localGames: Object.values(useCollection.getState().catalog),
      }),
    getNextPageParam: (last) => last.nextPage,
  });
}
