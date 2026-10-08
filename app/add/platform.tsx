import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCaseCover } from "../../src/case-cover";
import { titleKey } from "../../src/collection";
import { SkewTag } from "../../src/components/bits";
import { Phone, useFramed } from "../../src/components/chrome";
import { AddButton, Checkbox, GameSheet } from "../../src/components/game-sheet";
import { menuPlatformId, platformById, platformsFor } from "../../src/platforms";
import { useCollection } from "../../src/store";
import { INK } from "../../src/theme";
import type { CatalogGame, Copy } from "../../src/types";

const BAND = "#E3DCC8";
const BAND_FADE = [40, 120];
const MENU_BUTTON_HEIGHT = 34;
const BAND_RULE = 3;
const BUTTON_SHADOW = 3;

export default function PlatformStep() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const id = String(gameId);
  const catalog = useCollection((state) => state.catalog);
  const active = useCollection((state) => state.active);
  const order = useCollection((state) => state.order);
  const copies = useCollection((state) => state.copies);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const commitPlatforms = useCollection((state) => state.commitPlatforms);
  const addCopy = useCollection((state) => state.addCopy);
  const removeCopy = useCollection((state) => state.removeCopy);
  const stored = catalog[id];
  const game = stored ?? { id, title: id, platforms: [] as string[], cover: undefined };
  const list = platformsFor(switch2RawgId);
  const choices = consoleChoices(game, catalog, copies, order, list);
  const key = titleKey(game.title);
  const owned = choices.filter((platformId) => copies.some((copy) => copy.platformId === platformId && sameTitle(copy, key, id, catalog)));
  const [picked, setPicked] = useState<string[] | null>(null);
  const selected = new Set(picked ?? owned);
  const shownId = owned[0] ?? choices[0] ?? "pc";
  const name = platformById(list, menuPlatformId(shownId))?.name ?? shownId;
  const choiceNames = choices.map((platformId) => platformById(list, platformId)?.name ?? platformId);
  const savedCover = game.cover?.startsWith("https://images.igdb.com/") ? game.cover : undefined;
  const front = useCaseCover(id, shownId, game.title, !savedCover) || savedCover;
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  const scrollY = useRef(new Animated.Value(0)).current;
  const top = framed ? 12 : Math.max(insets.top, 12);
  const band = top * 2 + MENU_BUTTON_HEIGHT + BUTTON_SHADOW + BAND_RULE;

  const confirm = () => {
    const nextActive = { ...active };
    let turnedOn = false;
    for (const platformId of choices) {
      if (selected.has(platformId) && !nextActive[platformId]) {
        nextActive[platformId] = true;
        turnedOn = true;
      }
    }
    if (turnedOn) commitPlatforms(nextActive);
    const had = new Set(owned);
    for (const platformId of choices) {
      const want = selected.has(platformId);
      const has = had.has(platformId);
      if (want && !has) {
        const existing = copies.find((copy) => sameTitle(copy, key, id, catalog));
        const base = existing ? catalog[existing.gameId] : game;
        const platforms = [...new Set([...(base?.platforms ?? []), ...choices, platformId])];
        addCopy({ ...(base ?? game), platforms }, platformId);
      }
      if (!want && has) {
        for (const copy of copies.filter((copy) => copy.platformId === platformId && sameTitle(copy, key, id, catalog))) {
          removeCopy(copy.gameId, copy.platformId);
        }
      }
    }
    router.back();
  };

  return (
    <Phone bare footer={<AddButton label="Add game" enabled={selected.size > 0} onPress={confirm} />}>
      <GameSheet title={game.title} platformId={shownId} platformName={name} platformNames={choiceNames} cover={front} topSpace={top + 52} bottomSpace={110} scrollY={scrollY}>
        <View style={{ gap: 10 }}>
          {pairs(choices).map((pair) => (
            <View key={pair[0]} style={{ flexDirection: "row", gap: 10 }}>
              {pair.map((platformId) => {
                const label = platformById(list, platformId)?.name ?? platformId;
                return (
                  <View key={platformId} style={{ flex: 1, minWidth: 0 }}>
                    <Checkbox
                      quiet
                      label={label}
                      checked={selected.has(platformId)}
                      onPress={() => {
                        const next = new Set(selected);
                        if (next.has(platformId)) next.delete(platformId);
                        else next.add(platformId);
                        setPicked([...next]);
                      }}
                    />
                  </View>
                );
              })}
              {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
        </View>
      </GameSheet>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: band,
          zIndex: 3,
          backgroundColor: BAND,
          borderBottomWidth: BAND_RULE,
          borderBottomColor: INK,
          opacity: scrollY.interpolate({
            inputRange: BAND_FADE,
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
        }}
      />
      <View style={{ position: "absolute", top, left: 12, right: 12, flexDirection: "row", alignItems: "center", zIndex: 4 }}>
        <SkewTag label="Back" onPress={() => router.back()} height={MENU_BUTTON_HEIGHT} />
      </View>
    </Phone>
  );
}

function pairs<T>(items: T[]) {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += 2) rows.push(items.slice(index, index + 2));
  return rows;
}

function sameTitle(copy: Copy, key: string, gameId: string, catalog: Record<string, CatalogGame>) {
  if (copy.gameId === gameId) return true;
  return titleKey(catalog[copy.gameId]?.title ?? "") === key;
}

function consoleChoices(
  game: CatalogGame,
  catalog: Record<string, CatalogGame>,
  copies: Copy[],
  order: string[],
  list: ReturnType<typeof platformsFor>,
) {
  const key = titleKey(game.title);
  const known = new Set(list.map((platform) => platform.id));
  const wanted = new Set(game.platforms.filter((platformId) => known.has(platformId)));
  for (const other of Object.values(catalog)) {
    if (titleKey(other.title) !== key) continue;
    for (const platformId of other.platforms) if (known.has(platformId)) wanted.add(platformId);
  }
  for (const copy of copies) {
    if (!sameTitle(copy, key, game.id, catalog) || !known.has(copy.platformId)) continue;
    wanted.add(copy.platformId);
  }
  const seen: string[] = [];
  for (const platformId of [...order, ...list.map((platform) => platform.id)]) {
    if (wanted.has(platformId) && !seen.includes(platformId)) seen.push(platformId);
  }
  return seen;
}
