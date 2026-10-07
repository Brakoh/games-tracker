import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { LayoutAnimation, Platform, UIManager } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { withFormat, withoutFormat } from "./collection";
import { isSwitch, menuPlatformId, platformsFor, shownOrder } from "./platforms";
import { SEED_GAMES } from "./seed";
import type { CatalogGame, Copy, Format, SortMode } from "./types";

type CollectionState = {
  onboarded: boolean;
  active: Record<string, boolean>;
  order: string[];
  favorites: string[];
  copies: Copy[];
  wishes: string[];
  catalog: Record<string, CatalogGame>;
  sort: SortMode;
  shelfView: "grid" | "list";
  switch2RawgId: number | null;
  setSwitch2: (rawgId: number) => void;
  commitPlatforms: (draft: Record<string, boolean>) => void;
  reorder: (fromId: string, toId: string) => void;
  toggleFavorite: (id: string) => void;
  turnOff: (id: string) => void;
  setSort: (sort: SortMode) => void;
  setShelfView: (shelfView: "grid" | "list") => void;
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

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function slideList() {
  if (Platform.OS === "web") return;
  LayoutAnimation.configureNext(LayoutAnimation.create(180, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
}

function pinnedIds(favorites: string[] | undefined) {
  const ids: string[] = [];
  for (const id of favorites ?? []) {
    const menu = menuPlatformId(id);
    if (!ids.includes(menu)) ids.push(menu);
  }
  return ids;
}

function familyOn(active: Record<string, boolean>, id: string) {
  return isSwitch(id) ? !!(active.switch || active["switch-2"]) : !!active[id];
}

function placeVisible(order: string[], active: Record<string, boolean>, nextVisible: string[]) {
  const on = !!(active.switch || active["switch-2"]);
  let cursor = 0;
  let familyPlaced = false;
  const next: string[] = [];
  for (const id of order) {
    if (isSwitch(id)) {
      if (familyPlaced || !on) continue;
      familyPlaced = true;
      const item = nextVisible[cursor];
      cursor += 1;
      next.push(item);
      if (item === "switch") next.push("switch-2");
      continue;
    }
    if (!active[id]) {
      next.push(id);
      continue;
    }
    next.push(nextVisible[cursor]);
    cursor += 1;
  }
  while (cursor < nextVisible.length) {
    const item = nextVisible[cursor];
    cursor += 1;
    next.push(item);
    if (item === "switch") next.push("switch-2");
  }
  return next;
}

export const useCollection = create<CollectionState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      active: {},
      order: ["ps5", "pc", "switch", "xbox-series"],
      favorites: [],
      copies: [],
      wishes: [],
      catalog: seedCatalog(),
      sort: "alpha",
      shelfView: "grid",
      switch2RawgId: null,
      setSwitch2: (rawgId) => set({ switch2RawgId: rawgId }),
      commitPlatforms: (draft) => {
        const prev = get().active;
        const order = [...get().order];
        for (const platform of platformsFor(get().switch2RawgId)) {
          if (draft[platform.id] && !order.includes(platform.id)) order.push(platform.id);
        }
        const stored = pinnedIds(get().favorites);
        const rising = stored.filter((id) => !familyOn(prev, id) && familyOn(draft, id));
        const favorites = [...rising, ...stored.filter((id) => !rising.includes(id))];
        set({ active: { ...draft }, order, favorites, onboarded: true });
      },
      turnOff: (id) => {
        const ids = isSwitch(id) ? ["switch", "switch-2"] : [id];
        const active = { ...get().active };
        if (!ids.some((item) => active[item])) return;
        for (const item of ids) active[item] = false;
        set({ active });
      },
      reorder: (fromId, toId) => {
        if (fromId === toId) return;
        const { order, active, favorites } = get();
        const stored = pinnedIds(favorites);
        const visible = shownOrder(order, active, stored);
        const from = visible.indexOf(fromId);
        const to = visible.indexOf(toId);
        if (from < 0 || to < 0) return;
        const favoriteCount = visible.filter((id) => stored.includes(id)).length;
        if (from < favoriteCount !== to < favoriteCount) return;
        const nextVisible = [...visible];
        const [moved] = nextVisible.splice(from, 1);
        nextVisible.splice(to, 0, moved);
        const hidden = stored.filter((id) => !visible.includes(id));
        set({
          favorites: [...nextVisible.filter((id) => stored.includes(id)), ...hidden],
          order: placeVisible(order, active, nextVisible),
        });
      },
      toggleFavorite: (id) => {
        const menuId = menuPlatformId(id);
        const { order, active, favorites } = get();
        const stored = pinnedIds(favorites);
        const visible = shownOrder(order, active, stored);
        if (!visible.includes(menuId)) return;
        const isFavorite = stored.includes(menuId);
        const nextStored = isFavorite ? stored.filter((item) => item !== menuId) : [menuId, ...stored.filter((item) => item !== menuId)];
        const head = nextStored.filter((item) => visible.includes(item));
        const tail = visible.filter((item) => item !== menuId && !head.includes(item));
        const nextVisible = isFavorite ? [...head, menuId, ...tail] : [...head, ...tail];
        slideList();
        set({ favorites: nextStored, order: placeVisible(order, active, nextVisible) });
      },
      setSort: (sort) => set({ sort }),
      setShelfView: (shelfView) => set({ shelfView }),
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
        favorites: state.favorites,
        copies: state.copies,
        wishes: state.wishes,
        catalog: state.catalog,
        sort: state.sort,
        shelfView: state.shelfView,
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
