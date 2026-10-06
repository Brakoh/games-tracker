import type { PlatformDef } from "./types";

const blu = { w: 135, h: 170 };
const dvd = { w: 135, h: 190 };

export const BASE_PLATFORMS: PlatformDef[] = [
  { id: "ps5", name: "PlayStation 5", rawgId: 187, featured: true, case: blu },
  { id: "xbox-series", name: "Xbox Series S/X", rawgId: 186, featured: true, case: blu },
  { id: "switch-2", name: "Nintendo Switch 2", rawgId: 0, featured: true, case: { w: 104, h: 170 } },
  { id: "switch", name: "Nintendo Switch", rawgId: 7, featured: true, case: { w: 104, h: 170 } },
  { id: "pc", name: "PC", rawgId: 4, featured: true, case: { w: 2, h: 3 } },
  { id: "gb", name: "Game Boy", rawgId: 26, featured: false, case: { w: 122, h: 135 } },
  { id: "gba", name: "Game Boy Advance", rawgId: 24, featured: false, case: { w: 122, h: 135 } },
  { id: "gc", name: "GameCube", rawgId: 105, featured: false, case: { w: 107, h: 149 } },
  { id: "n3ds", name: "Nintendo 3DS", rawgId: 8, featured: false, case: { w: 122, h: 135 } },
  { id: "n64", name: "Nintendo 64", rawgId: 83, featured: false, case: { w: 133, h: 182 } },
  { id: "nds", name: "Nintendo DS", rawgId: 9, featured: false, case: { w: 122, h: 135 } },
  { id: "ps1", name: "PlayStation", rawgId: 27, featured: false, case: { w: 125, h: 142 } },
  { id: "ps2", name: "PlayStation 2", rawgId: 15, featured: false, case: dvd },
  { id: "ps3", name: "PlayStation 3", rawgId: 16, featured: false, case: blu },
  { id: "ps4", name: "PlayStation 4", rawgId: 18, featured: false, case: blu },
  { id: "psp", name: "PSP", rawgId: 17, featured: false, case: { w: 99, h: 168 } },
  { id: "vita", name: "PS Vita", rawgId: 19, featured: false, case: { w: 105, h: 135 } },
  { id: "dreamcast", name: "Sega Dreamcast", rawgId: 106, featured: false, case: dvd },
  { id: "genesis", name: "Sega Genesis", rawgId: 167, featured: false, case: { w: 216, h: 159 } },
  { id: "snes", name: "Super Nintendo", rawgId: 79, featured: false, case: { w: 152, h: 114 } },
  { id: "wii", name: "Wii", rawgId: 11, featured: false, case: dvd },
  { id: "wiiu", name: "Wii U", rawgId: 10, featured: false, case: dvd },
  { id: "xbox", name: "Xbox", rawgId: 80, featured: false, case: dvd },
  { id: "xbox360", name: "Xbox 360", rawgId: 14, featured: false, case: dvd },
  { id: "xboxone", name: "Xbox One", rawgId: 1, featured: false, case: blu },
];

const FEATURED_ORDER = ["ps5", "xbox-series", "switch-2", "switch", "pc"];

export function platformsFor(_switch2RawgId?: number | null): PlatformDef[] {
  return BASE_PLATFORMS;
}

export function featuredPlatforms(list: PlatformDef[]) {
  return FEATURED_ORDER.map((id) => list.find((platform) => platform.id === id)).filter(
    (platform): platform is PlatformDef => !!platform,
  );
}

export function otherPlatforms(list: PlatformDef[]) {
  const featured = new Set(featuredPlatforms(list).map((platform) => platform.id));
  return list.filter((platform) => !featured.has(platform.id)).sort((a, b) => a.name.localeCompare(b.name));
}

export function platformById(list: PlatformDef[], id: string) {
  return list.find((platform) => platform.id === id);
}

export function platformByRawgId(list: PlatformDef[], rawgId: number) {
  if (!rawgId) return undefined;
  return list.find((platform) => platform.rawgId === rawgId);
}
