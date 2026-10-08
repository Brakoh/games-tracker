import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { fetchCatalogPage } from "./catalog";

export function useGameSearch(query: string, allowedPlatformIds: string[]) {
  const allowedKey = [...allowedPlatformIds].sort().join(",");

  return useInfiniteQuery({
    queryKey: ["catalog", query, allowedKey],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchCatalogPage({
        query,
        page: pageParam,
        allowedPlatformIds,
      }),
    getNextPageParam: (last) => last.nextPage,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
