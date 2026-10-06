import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Pressable, Text, View } from "react-native";

import { insertionIndex, ROW_GAP, rowShift, GRAB_SCALE, SLIDE_MS } from "../platform-drag";
import { CARD, DISPLAY, INK, RED } from "../theme";
import { display, TrashIcon } from "./bits";
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
};

const ACTION = 76;

const DragContext = createContext<DragApi | null>(null);

export function PlatformList({
  ids,
  onReorder,
  children,
}: {
  ids: string[];
  onReorder: (fromId: string, toId: string) => void;
  children: ReactNode;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const startY = useRef(0);
  const idsRef = useRef(ids);
  const onReorderRef = useRef(onReorder);
  const timer = useRef<number | null>(null);
  const listening = useRef(false);
  const attachRef = useRef<() => void>(() => {});
  const detachRef = useRef<() => void>(() => {});
  idsRef.current = ids;
  onReorderRef.current = onReorder;

  const move = useCallback((clientY: number) => {
    const current = dragRef.current;
    if (!current || current.settling) return;
    const dy = clientY - startY.current;
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

  const api = useMemo<DragApi>(() => ({ drag, ids, openId, setOpen, grab, move, finish }), [drag, ids, openId, setOpen, grab, move, finish]);

  return createElement(DragContext.Provider, { value: api }, createElement("div", null, children));
}

export function PlatformRow({
  id,
  name,
  count,
  highlighted,
  onOpen,
  onTurnOff,
}: {
  id: string;
  name: string;
  count: number;
  highlighted: boolean;
  beforeId?: string;
  afterId?: string;
  onOpen: () => void;
  onReorder: (fromId: string, toId: string) => void;
  onTurnOff: () => void;
}) {
  const drag = useContext(DragContext);
  const index = drag ? drag.ids.indexOf(id) : -1;
  const mine = drag?.drag?.id === id;
  const shift = drag?.drag && index >= 0 ? rowShift(index, drag.drag.from, drag.drag.pitch, drag.drag.dy) : 0;
  const translate = mine && drag?.drag ? drag.drag.dy : shift;
  const scale = mine && drag?.drag && !drag.drag.settling ? GRAB_SCALE : 1;
  const open = drag?.openId === id;
  const [offset, setOffset] = useState(0);
  const [live, setLive] = useState(false);
  const offsetRef = useRef(0);
  const moved = useRef(0);
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
      const next = Math.min(0, Math.max(-ACTION, origin + dx));
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
        transform: `translateY(${translate}px)`,
        transition: drag?.drag?.settling ? `transform ${SLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : "none",
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
        Pressable,
        {
          accessibilityRole: "button",
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
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            background: highlighted ? "#E7E2D2" : CARD,
            border: `3px solid ${INK}`,
            boxShadow: "4px 4px 0 0 #0C0B08",
            padding: "12px",
            transform: `translateX(${offset}px) scale(${scale})`,
            transformOrigin: "center",
            transition: live ? "none" : `transform ${SLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
            touchAction: "pan-y",
            userSelect: "none",
          },
        },
        createElement(
          "div",
          {
            onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
              event.preventDefault();
              event.stopPropagation();
              const row = event.currentTarget.closest("[data-platform-row]");
              if (row instanceof HTMLElement) drag?.grab(id, event.clientY, row);
            },
            style: { width: 28, cursor: mine ? "grabbing" : "grab", display: "flex", flexDirection: "column", gap: 3, touchAction: "none" },
            "aria-label": "Reorder",
          },
          createElement(Grip),
        ),
        createElement(
          Pressable,
          {
            onPress: () => {
              if (moved.current > 8) {
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
            style: { flex: 1 },
          },
          createElement(Text, { style: display(18) }, name),
        ),
        createElement(Text, { style: { fontFamily: DISPLAY, fontSize: 22, color: RED } }, String(count)),
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
