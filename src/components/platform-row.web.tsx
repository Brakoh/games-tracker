import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { insertionIndex, ROW_GAP, rowShift, GRAB_SCALE, SLIDE_MS } from "../platform-drag";
import { CARD, DISPLAY, INK, RED } from "../theme";
import { display } from "./bits";

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
  grab: (id: string, clientY: number, row: HTMLElement) => void;
  move: (clientY: number) => void;
  finish: () => void;
};

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

  const grab = useCallback((id: string, clientY: number, row: HTMLElement) => {
    if (dragRef.current) return;
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

  const api = useMemo<DragApi>(() => ({ drag, ids, grab, move, finish }), [drag, ids, grab, move, finish]);

  return createElement(DragContext.Provider, { value: api }, createElement("div", null, children));
}

export function PlatformRow({
  id,
  name,
  count,
  highlighted,
  onOpen,
}: {
  id: string;
  name: string;
  count: number;
  highlighted: boolean;
  beforeId?: string;
  afterId?: string;
  onOpen: () => void;
  onReorder: (fromId: string, toId: string) => void;
}) {
  const drag = useContext(DragContext);
  const index = drag ? drag.ids.indexOf(id) : -1;
  const mine = drag?.drag?.id === id;
  const shift = drag?.drag && index >= 0 ? rowShift(index, drag.drag.from, drag.drag.pitch, drag.drag.dy) : 0;
  const translate = mine && drag?.drag ? drag.drag.dy : shift;
  const scale = mine && drag?.drag && !drag.drag.settling ? GRAB_SCALE : 1;

  return createElement(
    "div",
    {
      "data-platform-row": id,
      style: {
        position: "relative",
        zIndex: mine ? 2 : 0,
        margin: "10px 12px 0",
        transform: `translateY(${translate}px)`,
        transition: drag?.drag?.settling ? `transform ${SLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : "none",
      },
    },
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          background: highlighted ? "#E7E2D2" : CARD,
          border: `3px solid ${INK}`,
          boxShadow: "4px 4px 0 0 #0C0B08",
          padding: "12px",
          transform: `scale(${scale})`,
          transformOrigin: "center",
          transition: `transform ${SLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
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
        { onPress: onOpen, accessibilityRole: "button", accessibilityLabel: name, style: { flex: 1 } },
        createElement(Text, { style: display(18) }, name),
      ),
      createElement(Text, { style: { fontFamily: DISPLAY, fontSize: 22, color: RED } }, String(count)),
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
