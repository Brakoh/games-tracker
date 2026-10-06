import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { withFormat, withoutFormat } from "./collection";
import { platformsFor } from "./platforms";
import { SEED_GAMES } from "./seed";
import type { CatalogGame, Copy, Format, SortMode } from "./types";

type CollectionState = {
  onboarded: boolean;
  active: Record<string, boolean>;
  order: string[];
  copies: Copy[];
  wishes: string[];
  catalog: Record<string, CatalogGame>;
  sort: SortMode;
  switch2RawgId: number | null;
  setSwitch2: (rawgId: number) => void;
  commitPlatforms: (draft: Record<string, boolean>) => void;
  reorder: (fromId: string, toId: string) => void;
  setSort: (sort: SortMode) => void;
  remember: (game: CatalogGame) => void;
  toggleFinished: (gameId: string, platformId: string) => void;
  addFormat: (game: CatalogGame, platformId: string, format: Format) => void;
  removeFormat: (gameId: string, platformId: string, format: Format) => boolean;
  addWish: (game: CatalogGame) => void;
  removeWish: (gameId: string) => void;
};

function seedCatalog() {
  return Object.fromEntries(SEED_GAMES.map((game) => [game.id, { ...game, platforms: [...game.platforms] }]));
}

export const useCollection = create<CollectionState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      active: {},
      order: ["ps5", "pc", "switch", "xbox-series"],
      copies: [],
      wishes: [],
      catalog: seedCatalog(),
      sort: "alpha",
      switch2RawgId: null,
      setSwitch2: (rawgId) => set({ switch2RawgId: rawgId }),
      commitPlatforms: (draft) => {
        const order = [...get().order];
        for (const platform of platformsFor(get().switch2RawgId)) {
          if (draft[platform.id] && !order.includes(platform.id)) order.push(platform.id);
        }
        set({ active: { ...draft }, order, onboarded: true });
      },
      reorder: (fromId, toId) => {
        if (fromId === toId) return;
        const { order, active } = get();
        const visible = order.filter((id) => active[id]);
        const from = visible.indexOf(fromId);
        const to = visible.indexOf(toId);
        if (from < 0 || to < 0) return;
        const nextVisible = [...visible];
        const [moved] = nextVisible.splice(from, 1);
        nextVisible.splice(to, 0, moved);
        let cursor = 0;
        set({
          order: order.map((id) => {
            if (!active[id]) return id;
            const next = nextVisible[cursor];
            cursor += 1;
            return next;
          }),
        });
      },
      setSort: (sort) => set({ sort }),
      remember: (game) => set({ catalog: { ...get().catalog, [game.id]: game } }),
      toggleFinished: (gameId, platformId) =>
        set({
          copies: get().copies.map((copy) =>
            copy.gameId === gameId && copy.platformId === platformId ? { ...copy, finished: !copy.finished } : copy,
          ),
        }),
      addFormat: (game, platformId, format) => {
        set({
          copies: withFormat(get().copies, game.id, platformId, format),
          wishes: get().wishes.filter((id) => id !== game.id),
          catalog: { ...get().catalog, [game.id]: game },
        });
      },
      removeFormat: (gameId, platformId, format) => {
        const copies = withoutFormat(get().copies, gameId, platformId, format);
        set({ copies });
        return copies.some((copy) => copy.gameId === gameId && copy.platformId === platformId);
      },
      addWish: (game) => {
        const state = get();
        if (state.copies.some((copy) => copy.gameId === game.id && copy.formats.length > 0) || state.wishes.includes(game.id)) return;
        set({
          wishes: [...state.wishes, game.id],
          catalog: { ...state.catalog, [game.id]: game },
        });
      },
      removeWish: (gameId) => set({ wishes: get().wishes.filter((id) => id !== gameId) }),
    }),
    {
      name: "collection-v2",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onboarded: state.onboarded,
        active: state.active,
        order: state.order,
        copies: state.copies,
        wishes: state.wishes,
        catalog: state.catalog,
        sort: state.sort,
        switch2RawgId: state.switch2RawgId,
      }),
    },
  ),
);

export function useHydrated() {
  const [hydrated, setHydrated] = useState(useCollection.persist.hasHydrated());
  useEffect(() => {
    const unsub = useCollection.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useCollection.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
