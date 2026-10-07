import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bannerKey, useCaseCover } from "../../../src/case-cover";
import { forgetCover } from "../../../src/cover-cache";
import { copyByTitle, findCopy } from "../../../src/collection";
import { SkewTag } from "../../../src/components/bits";
import { BottomSheet, ConfirmDialog, Phone, useFramed } from "../../../src/components/chrome";
import { AddButton, Checkbox, GameSheet, type FeaturedGame } from "../../../src/components/game-sheet";
import { Tap } from "../../../src/components/tap";
import { platformById, platformsFor, menuPlatformId } from "../../../src/platforms";
import { useCollection } from "../../../src/store";
import { CARD, DISPLAY, hard, hardSm, INK, RED } from "../../../src/theme";

export default function GameScreen() {
  const params = useLocalSearchParams<{ gameId: string; platformId: string; from?: string; title?: string; cover?: string }>();
  const gameId = String(params.gameId);
  const platformId = String(params.platformId);
  const copies = useCollection((state) => state.copies);
  const catalog = useCollection((state) => state.catalog);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const toggleFinished = useCollection((state) => state.toggleFinished);
  const togglePlaying = useCollection((state) => state.togglePlaying);
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
  const back = () => {
    if (added) router.replace("/");
    else if (params.from === "featured" && router.canGoBack()) router.back();
    else router.replace(params.from === "home" ? "/" : `/shelf/${platformId}`);
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
          bannerSaveKey={copy ? bannerKey(gameId, platformId) : undefined}
        />
      ) : null}
      <View style={{ position: "absolute", top, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between", zIndex: 4 }}>
        <SkewTag label="Back" onPress={back} />
        {copy ? <MenuButton onPress={() => setMenu(true)} /> : null}
      </View>
      {copy ? (
        <BottomSheet visible={menu} onClose={() => setMenu(false)}>
              <Checkbox label="Currently playing" checked={!!copy.playing} onPress={() => togglePlaying(gameId, platformId)} />
              <Checkbox label="Complete" checked={copy.finished} onPress={() => toggleFinished(gameId, platformId)} />
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

function MenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Tap
      accessibilityLabel="Settings"
      onPress={onPress}
      style={{
        transform: [{ skewX: "-12deg" }],
        backgroundColor: CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hardSm,
        paddingHorizontal: 12,
        height: 34,
        justifyContent: "center",
      }}
    >
      <View style={{ transform: [{ skewX: "12deg" }], flexDirection: "row", gap: 4 }}>
        {[0, 1, 2].map((dot) => (
          <View key={dot} style={{ width: 6, height: 6, backgroundColor: INK }} />
        ))}
      </View>
    </Tap>
  );
}
