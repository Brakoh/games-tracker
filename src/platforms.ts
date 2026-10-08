import type { PlatformDef } from "./types";
import { WINDOWS_LOGO } from "./windows-logo";

const blu = { w: 135, h: 170 };
const dvd = { w: 135, h: 190 };

function igdbLogo(imageId: string) {
  return `https://images.igdb.com/igdb/image/upload/t_logo_med/${imageId}.png`;
}

export const BASE_PLATFORMS: PlatformDef[] = [
  { id: "ps5", name: "PlayStation 5", rawgId: 187, featured: true, case: blu, logo: igdbLogo("plm3") },
  { id: "xbox-series", name: "Xbox Series S/X", rawgId: 186, featured: true, case: blu, logo: igdbLogo("plfl") },
  { id: "switch-2", name: "Nintendo Switch 2", rawgId: 0, featured: false, case: { w: 104, h: 170 }, logo: igdbLogo("plow") },
  { id: "switch", name: "Switch", rawgId: 7, featured: true, case: { w: 104, h: 170 }, logo: igdbLogo("pl6b") },
  { id: "pc", name: "PC", rawgId: 4, featured: true, case: { w: 2, h: 3 }, logo: WINDOWS_LOGO },
  { id: "gb", name: "Game Boy", rawgId: 26, featured: false, case: { w: 122, h: 135 }, logo: igdbLogo("pl7n") },
  { id: "gba", name: "Game Boy Advance", rawgId: 24, featured: false, case: { w: 122, h: 135 }, logo: igdbLogo("pl73") },
  { id: "gc", name: "GameCube", rawgId: 105, featured: false, case: { w: 107, h: 149 }, logo: igdbLogo("pl7a") },
  { id: "n3ds", name: "Nintendo 3DS", rawgId: 8, featured: false, case: { w: 122, h: 135 }, logo: igdbLogo("pl6o") },
  { id: "n64", name: "Nintendo 64", rawgId: 83, featured: false, case: { w: 133, h: 182 }, logo: igdbLogo("pl77") },
  { id: "nds", name: "Nintendo DS", rawgId: 9, featured: false, case: { w: 122, h: 135 }, logo: igdbLogo("pl6r") },
  { id: "ps1", name: "PlayStation", rawgId: 27, featured: false, case: { w: 125, h: 142 }, logo: igdbLogo("pl7q") },
  { id: "ps2", name: "PlayStation 2", rawgId: 15, featured: false, case: dvd, logo: igdbLogo("pl71") },
  { id: "ps3", name: "PlayStation 3", rawgId: 16, featured: false, case: blu, logo: igdbLogo("pl6l") },
  { id: "ps4", name: "PlayStation 4", rawgId: 18, featured: false, case: blu, logo: igdbLogo("pl6e") },
  { id: "psp", name: "PSP", rawgId: 17, featured: false, case: { w: 99, h: 168 }, logo: igdbLogo("pl6q") },
  { id: "vita", name: "PS Vita", rawgId: 19, featured: false, case: { w: 105, h: 135 }, logo: igdbLogo("pl6g") },
  { id: "dreamcast", name: "Sega Dreamcast", rawgId: 106, featured: false, case: dvd, logo: igdbLogo("pl7i") },
  { id: "genesis", name: "Sega Genesis", rawgId: 167, featured: false, case: { w: 216, h: 159 }, logo: igdbLogo("pl85") },
  { id: "snes", name: "Super Nintendo", rawgId: 79, featured: false, case: { w: 152, h: 114 }, logo: igdbLogo("ob1omu1he33vpulatqzv") },
  { id: "wii", name: "Wii", rawgId: 11, featured: false, case: dvd, logo: igdbLogo("pl70") },
  { id: "wiiu", name: "Wii U", rawgId: 10, featured: false, case: dvd, logo: igdbLogo("pl6n") },
  { id: "xbox", name: "Xbox", rawgId: 80, featured: false, case: dvd, logo: igdbLogo("pl7e") },
  { id: "xbox360", name: "Xbox 360", rawgId: 14, featured: false, case: dvd, logo: igdbLogo("pl6x") },
  { id: "xboxone", name: "Xbox One", rawgId: 1, featured: false, case: blu, logo: igdbLogo("pl6a") },
];

export function isSwitch(id: string) {
  return id === "switch" || id === "switch-2";
}

export function systemIds(id: string) {
  return isSwitch(id) ? ["switch", "switch-2"] : [id];
}

export function menuPlatformId(id: string) {
  return isSwitch(id) ? "switch" : id;
}

export function shownOrder(order: string[], active: Record<string, boolean>, favorites: string[]) {
  const visible = visibleOrder(order, active);
  const pinned: string[] = [];
  for (const id of favorites) {
    const menu = menuPlatformId(id);
    if (visible.includes(menu) && !pinned.includes(menu)) pinned.push(menu);
  }
  return [...pinned, ...visible.filter((id) => !pinned.includes(id))];
}

export function visibleOrder(order: string[], active: Record<string, boolean>) {
  const shown: string[] = [];
  let placed = false;
  const familyOn = !!(active.switch || active["switch-2"]);
  for (const id of order) {
    if (isSwitch(id)) {
      if (familyOn && !placed) {
        shown.push("switch");
        placed = true;
      }
      continue;
    }
    if (active[id]) shown.push(id);
  }
  if (familyOn && !placed) shown.push("switch");
  return shown;
}

export function platformsFor(_switch2RawgId?: number | null): PlatformDef[] {
  return BASE_PLATFORMS;
}

const BRANDS: { label: string; ids: string[] }[] = [
  { label: "nintendo", ids: ["switch", "wiiu", "n3ds", "wii", "nds", "gc", "gba", "n64", "snes", "gb"] },
  { label: "sony", ids: ["ps5", "ps4", "vita", "ps3", "psp", "ps2", "ps1"] },
  { label: "microsoft", ids: ["xbox-series", "xboxone", "xbox360", "xbox", "pc"] },
  { label: "sega", ids: ["dreamcast", "genesis"] },
];

const NEXT_GEN = ["switch", "ps5", "xbox-series", "pc"];

function platformsIn(list: PlatformDef[], ids: string[]) {
  return ids.map((id) => list.find((platform) => platform.id === id)).filter((platform): platform is PlatformDef => !!platform);
}

export function nextGenPlatforms(list: PlatformDef[]) {
  return platformsIn(list, NEXT_GEN);
}

export function platformGroups(list: PlatformDef[]) {
  return BRANDS.map((brand) => ({
    label: brand.label,
    platforms: platformsIn(list, brand.ids),
  })).filter((group) => group.platforms.length > 0);
}

export function platformById(list: PlatformDef[], id: string) {
  return list.find((platform) => platform.id === id);
}

export function brandName(id: string) {
  const label = BRANDS.find((brand) => brand.ids.includes(menuPlatformId(id)))?.label ?? "";
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "";
}

export function platformByRawgId(list: PlatformDef[], rawgId: number) {
  if (!rawgId) return undefined;
  return list.find((platform) => platform.rawgId === rawgId);
}
