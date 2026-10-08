import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bannerKey, useCaseCover } from "../../../src/case-cover";
import { forgetCover } from "../../../src/cover-cache";
import { copyByTitle, findCopy } from "../../../src/collection";
import { SkewTag, SquaresTag } from "../../../src/components/bits";
import { BottomSheet, ConfirmDialog, Phone, useFramed } from "../../../src/components/chrome";
import { AddButton, Checkbox, GameSheet, type FeaturedGame } from "../../../src/components/game-sheet";
import { Tap } from "../../../src/components/tap";
import { platformById, platformsFor, menuPlatformId } from "../../../src/platforms";
import { useCollection } from "../../../src/store";
import { DISPLAY, hard, INK, RED } from "../../../src/theme";

const BAND = "#E3DCC8";
const BAND_FADE = [40, 120];
const MENU_BUTTON_HEIGHT = 34;
const BAND_RULE = 3;
const BUTTON_SHADOW = 3;

export default function GameScreen() {
  const params = useLocalSearchParams<{ gameId: string; platformId: string; from?: string; title?: string; cover?: string; sheet?: string }>();
  const gameId = String(params.gameId);
  const platformId = String(params.platformId);
  const copies = useCollection((state) => state.copies);
  const catalog = useCollection((state) => state.catalog);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const toggleFinished = useCollection((state) => state.toggleFinished);
  const removeCopy = useCollection((state) => state.removeCopy);
  const addCopy = useCollection((state) => state.addCopy);
  const insets = useSafeAreaInsets();
  const framed = useFramed();
  const [menu, setMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [added, setAdded] = useState(false);
  const copy = findCopy(copies, gameId, platformId);
  const list = platformsFor(switch2RawgId);
  const title = catalog[gameId]?.title ?? params.title ?? gameId;
  const platformName = platformById(list, menuPlatformId(platformId))?.name ?? platformId;
  const game = catalog[gameId] ?? { id: gameId, title, platforms: [platformId], cover: params.cover };
  const front = useCaseCover(gameId, platformId, title) || (game.cover?.startsWith("https://images.igdb.com/") ? game.cover : undefined);
  const top = framed ? 12 : Math.max(insets.top, 12);
  const band = top * 2 + MENU_BUTTON_HEIGHT + BUTTON_SHADOW + BAND_RULE;
  const scrollY = useRef(new Animated.Value(0)).current;
  const back = () => {
    const home = params.sheet === "games" ? "/?sheet=games" : "/";
    if (added) router.replace(home);
    else if ((params.from === "featured" || params.from === "home") && router.canGoBack()) router.back();
    else if (params.from === "home") router.replace(home);
    else router.replace(params.sheet === "games" ? `/shelf/${platformId}?from=games` : `/shelf/${platformId}`);
  };
  const openFeatured = (featured: FeaturedGame) => {
    const owned = findCopy(copies, featured.id, platformId) ?? copyByTitle(copies, catalog, featured.title, platformId);
    router.push({
      pathname: "/game/[gameId]/[platformId]",
      params: owned
        ? { gameId: owned.gameId, platformId, from: "featured" }
        : { gameId: featured.id, platformId, from: "featured", title: featured.title, cover: featured.cover },
    });
  };

  return (
    <Phone
      bare
      footer={
        copy || !params.title ? null : (
          <AddButton
            label="Add to library"
            onPress={() => {
              addCopy(game, platformId);
              setAdded(true);
            }}
          />
        )
      }
    >
      {copy || params.title ? (
        <GameSheet
          title={title}
          platformId={platformId}
          platformName={platformName}
          cover={front}
          finished={copy?.finished}
          topSpace={top + 52}
          bottomSpace={copy ? 24 : 110}
          onFeatured={copy ? openFeatured : undefined}
          onClearFinished={copy?.finished ? () => toggleFinished(gameId, platformId) : undefined}
          bannerSaveKey={copy ? bannerKey(gameId, platformId) : undefined}
          scrollY={scrollY}
        />
      ) : null}
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
      <View style={{ position: "absolute", top, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 4 }}>
        <SkewTag label="Back" onPress={back} height={MENU_BUTTON_HEIGHT} />
        {copy ? <SquaresTag label="Settings" onPress={() => setMenu(true)} height={MENU_BUTTON_HEIGHT} /> : null}
      </View>
      {copy ? (
        <BottomSheet visible={menu} onClose={() => setMenu(false)}>
              <Checkbox
                label="Mark as completed"
                checked={copy.finished}
                onPress={() => {
                  const marking = !copy.finished;
                  toggleFinished(gameId, platformId);
                  if (marking) setMenu(false);
                }}
              />
              <Tap
                accessibilityLabel="Remove from library"
                onPress={() => {
                  setMenu(false);
                  setConfirming(true);
                }}
                style={{ marginTop: 28, alignItems: "center", paddingVertical: 14, backgroundColor: RED, borderWidth: 3, borderColor: INK, ...hard }}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: DISPLAY, fontSize: 18, letterSpacing: 0.6, textTransform: "uppercase" }}>Remove from library</Text>
              </Tap>
        </BottomSheet>
      ) : null}
      <ConfirmDialog
        visible={confirming}
        title="Are you sure you want to remove this game?"
        note="You can add it again from Add a game."
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          removeCopy(gameId, platformId);
          void forgetCover(`${gameId}:${platformId}`);
          void forgetCover(bannerKey(gameId, platformId));
          router.replace(`/shelf/${platformId}`);
        }}
      />
    </Phone>
  );
}
