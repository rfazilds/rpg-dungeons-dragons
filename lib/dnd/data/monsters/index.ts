import type { DndMonsterEntry, MonsterCrBracket } from "./types";
import { MONSTERS_ND_LOW } from "./nd-low";
import { MONSTERS_ND_1_4 } from "./nd-1-4";
import { MONSTERS_ND_5_10 } from "./nd-5-10";
import { MONSTERS_ND_11_15 } from "./nd-11-15";
import { MONSTERS_ND_16_PLUS } from "./nd-16-plus";

export type { DndMonsterEntry, MonsterCrBracket } from "./types";
export {
  MONSTERS_ND_LOW,
  MONSTERS_ND_1_4,
  MONSTERS_ND_5_10,
  MONSTERS_ND_11_15,
  MONSTERS_ND_16_PLUS,
};

export const ALL_DND35_MONSTERS: DndMonsterEntry[] = [
  ...MONSTERS_ND_LOW,
  ...MONSTERS_ND_1_4,
  ...MONSTERS_ND_5_10,
  ...MONSTERS_ND_11_15,
  ...MONSTERS_ND_16_PLUS,
];

export const MONSTER_CR_BRACKET_OPTIONS: Array<{
  id: MonsterCrBracket;
  label: string;
}> = [
  { id: "ALL", label: "Todos" },
  { id: "ND_LT_1", label: "ND < 1" },
  { id: "ND_1_4", label: "ND 1-4" },
  { id: "ND_5_10", label: "ND 5-10" },
  { id: "ND_11_15", label: "ND 11-15" },
  { id: "ND_16_PLUS", label: "ND 16+" },
];

export function matchesCrBracket(
  monster: DndMonsterEntry,
  bracket: MonsterCrBracket
): boolean {
  if (bracket === "ALL") return true;
  if (bracket === "ND_LT_1") return monster.crNumeric < 1;
  if (bracket === "ND_1_4")
    return monster.crNumeric >= 1 && monster.crNumeric <= 4;
  if (bracket === "ND_5_10")
    return monster.crNumeric >= 5 && monster.crNumeric <= 10;
  if (bracket === "ND_11_15")
    return monster.crNumeric >= 11 && monster.crNumeric <= 15;
  if (bracket === "ND_16_PLUS") return monster.crNumeric >= 16;
  return true;
}

export function queryMonstersCatalog(params: {
  query?: string;
  crBracket?: MonsterCrBracket;
  page?: number;
  pageSize?: number;
}): {
  items: DndMonsterEntry[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
} {
  const q = (params.query || "").trim().toLowerCase();
  const bracket = params.crBracket || "ALL";
  const pageSize = Math.max(4, Math.min(50, params.pageSize || 12));

  const filtered = ALL_DND35_MONSTERS.filter((m) => {
    if (!matchesCrBracket(m, bracket)) return false;
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.nameEn.toLowerCase().includes(q) ||
      m.sizeAndType.toLowerCase().includes(q) ||
      m.challengeRating.toLowerCase() === q ||
      `nd ${m.challengeRating.toLowerCase()}` === q ||
      m.specialQualities.toLowerCase().includes(q)
    );
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.max(
    1,
    Math.min(totalPages, params.page || 1)
  );
  const startIdx = (currentPage - 1) * pageSize;
  const items = filtered.slice(startIdx, startIdx + pageSize);

  return {
    items,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
  };
}
