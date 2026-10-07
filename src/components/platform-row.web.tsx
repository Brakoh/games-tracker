import { createContext, createElement, useCallback, useContext, useLayoutEffect, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Text, View } from "react-native";

import { clampTravel, insertionIndex, REORDER_HIT, ROW_GAP, rowShift, GRAB_SCALE, SLIDE_MS } from "../platform-drag";
import { CARD, DISPLAY, INK, RED, YELLOW } from "../theme";
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
  grab: (id: string, clientY: number, row: HTMLElement) => void;
  move: (clientY: number) => void;
  finish: () => void;
  bumps: Record<string, number>;
  gliding: boolean;
};

const ACTION = 76;

const DragContext = createContext<DragApi | null>(null);

export function PlatformList({
  ids,
  favoriteCount,
  onReorder,
  children,
}: {
  ids: string[];
  favoriteCount: number;
  onReorder: (fromId: string, toId: string) => void;
  children: ReactNode;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const startY = useRef(0);
  const idsRef = useRef(ids);
  const favoriteCountRef = useRef(favoriteCount);
  const onReorderRef = useRef(onReorder);
  const skipFlip = useRef(false);
  const tops = useRef(new Map<string, number>());
  const listRef = useRef<HTMLDivElement | null>(null);
  const [bumps, setBumps] = useState<Record<string, number>>({});
  const [gliding, setGliding] = useState(false);
  const timer = useRef<number | null>(null);
  const listening = useRef(false);
  const attachRef = useRef<() => void>(() => {});
  const detachRef = useRef<() => void>(() => {});
  idsRef.current = ids;
  favoriteCountRef.current = favoriteCount;
  onReorderRef.current = onReorder;

  const move = useCallback((clientY: number) => {
    const current = dragRef.current;
    if (!current || current.settling) return;
    const dy = clampTravel(current.from, clientY - startY.current, current.pitch, favoriteCountRef.current, idsRef.current.length);
    const to = insertionIndex(current.from, dy, current.pitch, idsRef.current.length);
    if (dy === current.dy && to === current.to) return;
    const next = { ...current, dy, to };
    dragRef.current = next;
    setDrag(next);
  }, []);

  const finish = useCallback(() => {
    const current = dragRef.current;
    if (!current || current.settling) return;
    detachRef.current();
    const to = insertionIndex(current.from, current.dy, current.pitch, idsRef.current.length);
    const next = { ...current, to, dy: (to - current.from) * current.pitch, settling: true };
    dragRef.current = next;
    setDrag(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const latest = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (latest && latest.to !== latest.from) {
        skipFlip.current = true;
        const order = idsRef.current;
        onReorderRef.current(order[latest.from], order[latest.to]);
      }
    }, SLIDE_MS + 30);
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => move(event.clientY);
    const onUp = () => finish();
    const attach = () => {
      if (listening.current) return;
      listening.current = true;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };
    const detach = () => {
      if (!listening.current) return;
      listening.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    attachRef.current = attach;
    detachRef.current = detach;
    return () => {
      detach();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [finish, move]);

  const setOpen = useCallback((id: string | null) => setOpenId(id), []);

  const grab = useCallback((id: string, clientY: number, row: HTMLElement) => {
    if (dragRef.current) return;
    setOpenId(null);
    setGliding(false);
    setBumps({});
    const list = row.parentElement;
    if (!list) return;
    const rows = [...list.children];
    const from = rows.indexOf(row);
    if (from < 0) return;
    const top = row.getBoundingClientRect().top;
    const next = rows[from + 1] as HTMLElement | undefined;
    const pitch = next ? next.getBoundingClientRect().top - top : row.getBoundingClientRect().height + ROW_GAP;
    startY.current = clientY;
    const nextDrag = { id, from, to: from, dy: 0, pitch, settling: false };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
    attachRef.current();
  }, []);

  const idsKey = ids.join("|");

  useLayoutEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const rows = [...root.querySelectorAll<HTMLElement>("[data-platform-row]")];
    const nextTops = new Map<string, number>();
    const delta: Record<string, number> = {};
    for (const row of rows) {
      const rowId = row.getAttribute("data-platform-row");
      if (!rowId) continue;
      const top = row.getBoundingClientRect().top;
      nextTops.set(rowId, top);
      const prev = tops.current.get(rowId);
      if (prev != null && Math.abs(prev - top) > 1) delta[rowId] = prev - top;
    }
    if (skipFlip.current || dragRef.current) {
      skipFlip.current = false;
      tops.current = nextTops;
      return;
    }
    tops.current = nextTops;
    if (Object.keys(delta).length === 0) return;
    setGliding(false);
    setBumps(delta);
  }, [idsKey]);

  useLayoutEffect(() => {
    if (Object.keys(bumps).length === 0) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setGliding(true);
        setBumps({});
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [bumps]);

  useEffect(() => {
    if (!gliding) return;
    const done = window.setTimeout(() => setGliding(false), SLIDE_MS);
    return () => window.clearTimeout(done);
  }, [gliding]);

  const api = useMemo<DragApi>(
    () => ({ drag, ids, openId, setOpen, grab, move, finish, bumps, gliding }),
    [drag, ids, openId, setOpen, grab, move, finish, bumps, gliding],
  );

  return createElement(DragContext.Provider, { value: api }, createElement("div", { ref: listRef }, children));
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
  const drag = useContext(DragContext);
  const bump = drag?.bumps[id] ?? 0;
  const glide = !!drag?.gliding;
  const index = drag ? drag.ids.indexOf(id) : -1;
  const mine = drag?.drag?.id === id;
  const shift = drag?.drag && index >= 0 ? rowShift(index, drag.drag.from, drag.drag.pitch, drag.drag.dy) : 0;
  const translate = mine && drag?.drag ? drag.drag.dy : shift;
  const settling = !!drag?.drag?.settling;
  const scale = mine && drag?.drag && !settling ? GRAB_SCALE : 1;
  const open = drag?.openId === id;
  const [offset, setOffset] = useState(0);
  const [live, setLive] = useState(false);
  const offsetRef = useRef(0);
  const moved = useRef(0);
  const sorting = useRef(false);
  const listeners = useRef<{ move: (event: PointerEvent) => void; up: () => void } | null>(null);

  useEffect(() => {
    if (live) return;
    const next = open ? -ACTION : 0;
    offsetRef.current = next;
    setOffset(next);
  }, [live, open]);

  useEffect(() => {
    return () => {
      if (!listeners.current) return;
      window.removeEventListener("pointermove", listeners.current.move);
      window.removeEventListener("pointerup", listeners.current.up);
      window.removeEventListener("pointercancel", listeners.current.up);
    };
  }, []);

  const beginSwipe = (clientX: number, clientY: number) => {
    if (drag?.drag) return;
    const originX = clientX;
    const originY = clientY;
    const origin = offsetRef.current;
    let axis: "x" | "y" | null = null;
    moved.current = 0;
    const move = (event: PointerEvent) => {
      const dx = event.clientX - originX;
      const dy = event.clientY - originY;
      if (!axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (axis === "x") setLive(true);
      }
      if (axis !== "x") return;
      const next = Math.min(ACTION, Math.max(-ACTION, origin + dx));
      moved.current = Math.abs(dx);
      offsetRef.current = next;
      setOffset(next);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      listeners.current = null;
      if (axis === "x") {
        if (offsetRef.current > ACTION / 2) {
          offsetRef.current = 0;
          flushSync(() => {
            setLive(false);
            setOffset(0);
            drag?.setOpen(null);
          });
          onFavorite();
          return;
        }
        const next = offsetRef.current < -ACTION / 2 ? -ACTION : 0;
        offsetRef.current = next;
        flushSync(() => {
          setLive(false);
          setOffset(next);
          drag?.setOpen(next === -ACTION ? id : null);
        });
        return;
      }
      setLive(false);
    };
    listeners.current = { move, up };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return createElement(
    "div",
    {
      "data-platform-row": id,
      style: {
        position: "relative",
        zIndex: mine ? 2 : 0,
        margin: "10px 8px 0 12px",
        transform: `translateY(${translate + bump}px)`,
        transition: settling || (glide && !drag?.drag) ? `transform ${SLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : "none",
      },
    },
    offset < 0
      ? createElement(
          "div",
          {
            style: {
              position: "absolute",
              left: -SCREEN_EDGE,
              top: 0,
              bottom: 0,
              width: 28,
              zIndex: 6,
              pointerEvents: "none",
            },
          },
          createElement(DitherEdge, { side: "left" }),
        )
      : null,
    createElement(
      "div",
      { style: { position: "relative", overflow: "visible", padding: "0 4px 4px 0" } },
      createElement(
        View,
        {
          pointerEvents: "none",
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 4,
            width: ACTION,
            borderWidth: 3,
            borderColor: INK,
            backgroundColor: YELLOW,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "4px 4px 0 0 #0C0B08",
          },
        },
        createElement(ActionStar, { crossed: favorite }),
      ),
      createElement(
        Tap,
        {
          accessibilityLabel: "Off",
          onPress: onTurnOff,
          style: {
            position: "absolute",
            top: 0,
            right: 4,
            bottom: 4,
            width: ACTION,
            borderWidth: 3,
            borderColor: INK,
            backgroundColor: RED,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "4px 4px 0 0 #0C0B08",
          },
        },
        createElement(TrashIcon),
      ),
      createElement(
        "div",
        {
          onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
            if (event.button !== 0) return;
            beginSwipe(event.clientX, event.clientY);
          },
          style: {
            position: "relative",
            zIndex: 1,
            transform: `translateX(${offset}px) scale(${scale})`,
            transformOrigin: "center",
            transition: live ? "none" : `transform ${SLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
            touchAction: "pan-y",
            userSelect: "none",
          },
        },
        createElement(
          Tap,
          {
            shrink: false,
            onPress: () => {
              if (sorting.current || moved.current > 8) {
                moved.current = 0;
                return;
              }
              if (drag?.openId === id) {
                drag.setOpen(null);
                return;
              }
              onOpen();
            },
            accessibilityRole: "button",
            accessibilityLabel: name,
            style: {
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: highlighted ? "#E7E2D2" : CARD,
              borderWidth: 3,
              borderColor: INK,
              boxShadow: "4px 4px 0 0 #0C0B08",
              paddingVertical: 12,
              paddingHorizontal: 12,
            },
          },
          createElement(
            "div",
            { style: { width: 28, display: "flex", flexDirection: "column", gap: 3 } },
            createElement(Grip),
          ),
          createElement("div", {
            onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
              event.preventDefault();
              event.stopPropagation();
              sorting.current = true;
              const release = () => {
                window.removeEventListener("pointerup", release);
                window.removeEventListener("pointercancel", release);
                setTimeout(() => {
                  sorting.current = false;
                }, 0);
              };
              window.addEventListener("pointerup", release);
              window.addEventListener("pointercancel", release);
              const row = event.currentTarget.closest("[data-platform-row]");
              if (row instanceof HTMLElement) drag?.grab(id, event.clientY, row);
            },
            onClick: (event: ReactPointerEvent<HTMLDivElement>) => {
              event.preventDefault();
              event.stopPropagation();
            },
            style: {
              position: "absolute",
              zIndex: 3,
              cursor: mine ? "grabbing" : "grab",
              touchAction: "none",
              ...REORDER_HIT,
            },
            "aria-label": "Reorder",
          }),
          createElement(ConsoleLogo, { uri: logo }),
          createElement(Text, { style: [display(18), { flex: 1 }] }, name),
          createElement(Text, { style: { fontFamily: DISPLAY, fontSize: 22, color: RED } }, String(count)),
          favorite ? createElement(FavoriteCorner) : null,
        ),
      ),
    ),
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
