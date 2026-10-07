export const ROW_GAP = 10;
export const REORDER_HIT = { left: -3, top: -3, bottom: -3, width: 51 };
export const GRAB_SCALE = 1.05;
export const SLIDE_MS = 180;

export function clampTravel(from: number, dy: number, pitch: number, favoriteCount: number, count: number) {
  if (pitch <= 0 || favoriteCount <= 0 || favoriteCount >= count) return dy;
  if (from < favoriteCount) {
    return Math.min((favoriteCount - 1 - from) * pitch, Math.max(-from * pitch, dy));
  }
  return Math.min((count - 1 - from) * pitch, Math.max((favoriteCount - from) * pitch, dy));
}

export function insertionIndex(from: number, dy: number, pitch: number, count: number) {
  if (pitch <= 0 || count <= 0) return from;
  return Math.min(count - 1, Math.max(0, from + Math.round(dy / pitch)));
}

export function rowShift(index: number, from: number, pitch: number, dy: number) {
  if (index === from || pitch <= 0) return 0;
  const travel = dy / pitch;
  if (travel > 0 && index > from) {
    const progress = Math.min(1, Math.max(0, travel - (index - from - 1)));
    return -progress * pitch;
  }
  if (travel < 0 && index < from) {
    const progress = Math.min(1, Math.max(0, -travel - (from - index - 1)));
    return progress * pitch;
  }
  return 0;
}
