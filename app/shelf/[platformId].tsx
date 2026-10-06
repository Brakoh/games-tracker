import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { sortCopies } from "../../src/collection";
import { useCaseCover } from "../../src/case-cover";
import { EmptyNote, SkewTag } from "../../src/components/bits";
import { CaseTile, Phone, SortBar, StickyAdd, formatsLine } from "../../src/components/chrome";
import { platformById, platformsFor } from "../../src/platforms";
import { useCollection } from "../../src/store";
import { BODY, CARD, DISPLAY, hard, INK, RED } from "../../src/theme";
import type { Copy } from "../../src/types";

function ShelfThumb({ cover }: { cover?: string }) {
  const [loaded, setLoaded] = useState<string | null>(null);
  const ready = !!cover && loaded === cover;
  return (
    <View
      style={{
        width: 32,
        height: 42,
        borderWidth: 2,
        borderColor: INK,
        overflow: "hidden",
        backgroundColor: "#E7E2D2",
        ...(Platform.OS === "web"
          ? ({
              backgroundImage: "radial-gradient(#0C0B08 0.7px, transparent 0.8px)",
              backgroundSize: "4px 4px",
            } as object)
          : null),
      }}
    >
      {cover ? (
        <Image
          accessible={false}
          source={{ uri: cover }}
          resizeMode="cover"
          onLoad={() => setLoaded(cover)}
          style={{ width: "100%", height: "100%", opacity: ready ? 1 : 0 }}
        />
      ) : null}
    </View>
  );
}

function ShelfLine({
  copy,
  title,
  subtitle,
  onOpen,
  onToggleFinished,
}: {
  copy: Copy;
  title: string;
  subtitle: string;
  onOpen: () => void;
  onToggleFinished: () => void;
}) {
  const stored = useCollection((state) => state.catalog[copy.gameId]?.cover);
  const front = useCaseCover(copy.gameId, copy.platformId, title) || (stored?.startsWith("https://images.igdb.com/") ? stored : undefined);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onOpen}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: CARD,
        borderWidth: 3,
        borderColor: INK,
        ...hard,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }}
    >
      <ShelfThumb cover={front} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: DISPLAY, fontSize: 16, letterSpacing: 0.4, textTransform: "uppercase", color: INK }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ fontFamily: BODY, fontSize: 10, color: INK }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={copy.finished ? "Finished" : "Not finished"}
        onPress={onToggleFinished}
        hitSlop={8}
        style={{
          width: 16,
          height: 16,
          borderWidth: 2,
          borderColor: INK,
          backgroundColor: copy.finished ? RED : CARD,
        }}
      />
    </Pressable>
  );
}

export default function ShelfScreen() {
  const { platformId } = useLocalSearchParams<{ platformId: string }>();
  const id = String(platformId);
  const copies = useCollection((state) => state.copies);
  const catalog = useCollection((state) => state.catalog);
  const sort = useCollection((state) => state.sort);
  const shelfView = useCollection((state) => state.shelfView);
  const switch2RawgId = useCollection((state) => state.switch2RawgId);
  const setSort = useCollection((state) => state.setSort);
  const setShelfView = useCollection((state) => state.setShelfView);
  const toggleFinished = useCollection((state) => state.toggleFinished);
  const list = platformsFor(switch2RawgId);
  const nameOf = (platform: string) => platformById(list, platform)?.name ?? platform;
  const titleOf = (gameId: string) => catalog[gameId]?.title ?? gameId;
  const shelf = sortCopies(
    copies.filter((copy) => copy.platformId === id),
    sort,
    titleOf,
    nameOf,
  );

  return (
    <Phone
      title={nameOf(id)}
      showBack
      onBack={() => router.replace("/")}
      footer={<StickyAdd onPress={() => router.push(`/add?platformId=${id}`)} />}
    >
      {shelf.length === 0 ? (
        <EmptyNote />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, paddingBottom: 120, gap: 32 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <SortBar sort={sort} onSort={setSort} />
            </View>
            <SkewTag
              label={shelfView === "grid" ? "List" : "Grid"}
              onPress={() => setShelfView(shelfView === "grid" ? "list" : "grid")}
            />
          </View>
          {shelfView === "grid" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", margin: -5 }}>
              {shelf.map((copy) => (
                <View key={`${copy.gameId}-${copy.platformId}`} style={{ width: "33.33%", padding: 5 }}>
                  <CaseTile
                    copy={copy}
                    title={titleOf(copy.gameId)}
                    subtitle={formatsLine(copy.formats)}
                    onOpen={() => router.push(`/game/${copy.gameId}/${copy.platformId}?from=shelf`)}
                    onToggleFinished={() => toggleFinished(copy.gameId, copy.platformId)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {shelf.map((copy) => (
                <ShelfLine
                  key={`${copy.gameId}-${copy.platformId}`}
                  copy={copy}
                  title={titleOf(copy.gameId)}
                  subtitle={formatsLine(copy.formats)}
                  onOpen={() => router.push(`/game/${copy.gameId}/${copy.platformId}?from=shelf`)}
                  onToggleFinished={() => toggleFinished(copy.gameId, copy.platformId)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </Phone>
  );
}
