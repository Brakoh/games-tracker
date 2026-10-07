export type SortMode = "alpha" | "open" | "done";

export type CatalogGame = {
  id: string;
  title: string;
  platforms: string[];
  cover?: string;
};

export type Copy = {
  gameId: string;
  platformId: string;
  finished: boolean;
  playing?: boolean;
};

export type PlatformDef = {
  id: string;
  name: string;
  rawgId: number;
  featured: boolean;
  case: { w: number; h: number };
  logo?: string;
};
