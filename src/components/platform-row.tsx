import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, PanResponder, Text, View } from "react-native";

import { clampTravel, GRAB_SCALE, insertionIndex, REORDER_HIT, ROW_GAP, rowShift, SLIDE_MS } from "../platform-drag";
import { CARD, DISPLAY, hard, INK, RED, YELLOW } from "../theme";
import { ActionStar, ConsoleLogo, display, FavoriteCorner, TrashIcon } from "./bits";
import { Tap } from "./tap";
import { DitherEdge } from "./chrome";

const SCREEN_EDGE = 12;

type Drag = {
  id: string;
  from: number;
  to: number;
  dy: number;
  pitch: number;
  settling: boolean;
};

type DragApi = {
  drag: Drag | null;
  ids: string[];
  openId: string | null;
  setOpen: (id: string | null) => void;
  grab: (id: string, height: number) => void;
  move: (dy: number) => void;
  finish: () => void;
};

const ACTION = 76;

const DragContext = createContext<DragApi | null>(null);

export function PlatformList({
  ids,
  favoriteCount,
  confirming = null,
  onReorder,
  children,
}: {
  ids: string[];
  favoriteCount: number;
  confirming?: string | null;
  onReorder: (fromId: string, toId: string) => void;
  children: ReactNode;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    if (confirming === null) setOpenId(null);
  }, [confirming]);
  const dragRef = useRef<Drag | null>(null);
  const idsRef = useRef(ids);
  const favoriteCountRef = useRef(favoriteCount);
  const onReorderRef = useRef(onReorder);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  idsRef.current = ids;
  favoriteCountRef.current = favoriteCount;
  onReorderRef.current = onReorder;

  const move = useCallback((dy: number) => {
    const current = dragRef.current;
    if (!current || current.settling) return;
    const travel = clampTravel(current.from, dy, current.pitch, favoriteCountRef.current, idsRef.current.length);
    const to = insertionIndex(current.from, travel, current.pitch, idsRef.current.length);
    if (travel === current.dy && to === current.to) return;
    const next = { ...current, dy: travel, to };
    dragRef.current = next;
    setDrag(next);
  }, []);

  const finish = useCallback(() => {
    const current = dragRef.current;
    if (!current || current.settling) return;
    const to = insertionIndex(current.from, current.dy, current.pitch, idsRef.current.length);
    const next = { ...current, to, dy: (to - current.from) * current.pitch, settling: true };
    dragRef.current = next;
    setDrag(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const latest = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (latest && latest.to !== latest.from) {
        const order = idsRef.current;
        onReorderRef.current(order[latest.from], order[latest.to]);
      }
    }, SLIDE_MS + 30);
  }, []);

  const setOpen = useCallback((id: string | null) => setOpenId(id), []);

  const grab = useCallback((id: string, height: number) => {
    if (dragRef.current) return;
    setOpenId(null);
    const order = idsRef.current;
    const from = order.indexOf(id);
    if (from < 0) return;
    const next = { id, from, to: from, dy: 0, pitch: height + ROW_GAP, settling: false };
    dragRef.current = next;
    setDrag(next);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const api = useMemo<DragApi>(() => ({ drag, ids, openId, setOpen, grab, move, finish }), [drag, ids, openId, setOpen, grab, move, finish]);
  return <DragContext.Provider value={api}>{children}</DragContext.Provider>;
}

export function PlatformRow({
  id,
  name,
  count,
  logo,
  highlighted,
  favorite,
  onOpen,
  onTurnOff,
  onFavorite,
}: {
  id: string;
  name: string;
  count: number;
  logo?: string;
  highlighted: boolean;
  favorite: boolean;
  beforeId?: string;
  afterId?: string;
  onOpen: () => void;
  onReorder: (fromId: string, toId: string) => void;
  onTurnOff: () => void;
  onFavorite: () => void;
}) {
  const api = useContext(DragContext);
  const height = useRef(0);
  const index = api ? api.ids.indexOf(id) : -1;
  const mine = api?.drag?.id === id;
  const shift = api?.drag && index >= 0 ? rowShift(index, api.drag.from, api.drag.pitch, api.drag.dy) : 0;
  const translate = mine && api?.drag ? api.drag.dy : shift;
  const scale = mine && api?.drag && !api.drag.settling ? GRAB_SCALE : 1;
  const settling = !!api?.drag?.settling;
  const reveal = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);
  const [atEdge, setAtEdge] = useState(false);
  const moved = useRef(0);
  const sorting = useRef(false);
  const apiRef = useRef(api);
  const onFavoriteRef = useRef(onFavorite);
  apiRef.current = api;
  onFavoriteRef.current = onFavorite;
  const open = api?.openId === id;

  useEffect(() => {
    if (open) {
      openRef.current = true;
      return;
    }
    openRef.current = false;
    setAtEdge(false);
    Animated.timing(reveal, { toValue: 0, duration: SLIDE_MS, useNativeDriver: true }).start();
  }, [open, reveal]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        sorting.current = true;
        apiRef.current?.grab(id, height.current);
      },
      onPanResponderMove: (_, gesture) => apiRef.current?.move(gesture.dy),
      onPanResponderRelease: () => {
        apiRef.current?.finish();
        setTimeout(() => {
          sorting.current = false;
        }, 0);
      },
      onPanResponderTerminate: () => apiRef.current?.finish(),
    }),
  ).current;

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (apiRef.current?.drag) return false;
        const horizontal = Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
        if (!horizontal) return false;
        return true;
      },
      onPanResponderMove: (_, gesture) => {
        const base = openRef.current ? -ACTION : 0;
        const next = Math.min(ACTION, Math.max(-ACTION, base + gesture.dx));
        moved.current = Math.abs(gesture.dx);
        reveal.setValue(next);
        setAtEdge(next < 0);
      },
      onPanResponderRelease: (_, gesture) => {
        const base = openRef.current ? -ACTION : 0;
        const next = Math.min(ACTION, Math.max(-ACTION, base + gesture.dx));
        if (next > ACTION / 2) {
          openRef.current = false;
          setAtEdge(false);
          apiRef.current?.setOpen(null);
          Animated.timing(reveal, { toValue: 0, duration: SLIDE_MS, useNativeDriver: true }).start();
          onFavoriteRef.current();
          return;
        }
        const should = next < -ACTION / 2;
        openRef.current = should;
        setAtEdge(should);
        apiRef.current?.setOpen(should ? id : null);
        Animated.timing(reveal, { toValue: should ? -ACTION : 0, duration: SLIDE_MS, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => {
        openRef.current = false;
        setAtEdge(false);
        apiRef.current?.setOpen(null);
      },
    }),
  ).current;

  return (
    <Slide translate={translate} scale={scale} immediate={!settling}>
      <View
        onLayout={(event) => {
          height.current = event.nativeEvent.layout.height;
        }}
        style={{ marginLeft: 12, marginRight: 8, marginTop: 10, overflow: "visible", paddingRight: 4, paddingBottom: 4 }}
      >
        {atEdge || open ? (
          <View pointerEvents="none" style={{ position: "absolute", left: -SCREEN_EDGE, top: 0, bottom: 0, width: 28, zIndex: 6 }}>
            <DitherEdge side="left" />
          </View>
        ) : null}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 4,
            width: ACTION,
            backgroundColor: YELLOW,
            borderWidth: 3,
            borderColor: INK,
            alignItems: "center",
            justifyContent: "center",
            ...hard,
          }}
        >
          <ActionStar crossed={favorite} />
        </View>
        <Tap
          accessibilityLabel="Off"
          onPress={onTurnOff}
          style={{
            position: "absolute",
            top: 0,
            right: 4,
            bottom: 4,
            width: ACTION,
            backgroundColor: RED,
            borderWidth: 3,
            borderColor: INK,
            alignItems: "center",
            justifyContent: "center",
            ...hard,
          }}
        >
          <TrashIcon />
        </Tap>
        <Animated.View style={{ transform: [{ translateX: reveal }] }} {...swipe.panHandlers}>
          <Tap
            shrink={false}
            accessibilityLabel={name}
            onPress={() => {
              if (sorting.current || moved.current > 8) {
                moved.current = 0;
                return;
              }
              if (openRef.current) {
                api?.setOpen(null);
                return;
              }
              onOpen();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: highlighted ? "#E7E2D2" : CARD,
              borderWidth: 3,
              borderColor: INK,
              ...hard,
              paddingVertical: 12,
              paddingHorizontal: 12,
            }}
          >
            <View style={{ width: 28, justifyContent: "center", gap: 3 }}>
              <Grip />
            </View>
            <View accessibilityLabel="Reorder" {...pan.panHandlers} style={{ position: "absolute", zIndex: 3, ...REORDER_HIT }} />
            <ConsoleLogo uri={logo} />
            <Text style={[display(18), { flex: 1 }]}>{name}</Text>
            <Text style={{ fontFamily: DISPLAY, fontSize: 22, lineHeight: 30, color: RED }}>{count}</Text>
            {favorite ? <FavoriteCorner /> : null}
          </Tap>
        </Animated.View>
      </View>
    </Slide>
  );
}

function Slide({
  translate,
  scale,
  immediate,
  children,
}: {
  translate: number;
  scale: number;
  immediate: boolean;
  children: ReactNode;
}) {
  const shift = useRef(new Animated.Value(0)).current;
  const zoom = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (immediate) {
      shift.stopAnimation();
      shift.setValue(translate);
      return;
    }
    Animated.timing(shift, { toValue: translate, duration: SLIDE_MS, useNativeDriver: true }).start();
  }, [immediate, shift, translate]);

  useEffect(() => {
    Animated.timing(zoom, { toValue: scale, duration: SLIDE_MS, useNativeDriver: true }).start();
  }, [scale, zoom]);

  return (
    <Animated.View style={{ zIndex: scale > 1 ? 2 : 0, transform: [{ translateY: shift }, { scale: zoom }] }}>
      {children}
    </Animated.View>
  );
}

function Grip() {
  return (
    <View style={{ gap: 3 }}>
      {[0, 1, 2].map((line) => (
        <View key={line} style={{ height: 2, width: 16, backgroundColor: INK, borderRadius: 1 }} />
      ))}
    </View>
  );
}
