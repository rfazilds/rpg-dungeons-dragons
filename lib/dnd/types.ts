export type AbilityKey =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export type AbilityShort = "FOR" | "DES" | "CON" | "INT" | "SAB" | "CAR";

export type AlignmentCode =
  | "LB" // Leal e Bom
  | "NB" // Neutro e Bom
  | "CB" // Caótico e Bom
  | "LN" // Leal e Neutro
  | "N"  // Neutro
  | "CN" // Caótico e Neutro
  | "LM" // Leal e Mau
  | "NM" // Neutro e Mau
  | "CM"; // Caótico e Mau

export type CreatureSize = "Pequeno" | "Médio" | "Grande";

export type BabProgression = "good" | "average" | "poor"; // Bom (+1/nv), Médio (+3/4), Ruim (+1/2)
export type SaveProgression = "good" | "poor";           // Bom (2 + nv/2), Ruim (nv/3)

export interface ClassSuggestion {
  classId: string;
  className: string;
  synergyBadge: string;
  reason: string;
}

export interface DndRace {
  id: string;
  name: string;
  pluralName: string;
  tagline: string;
  description: string;
  size: CreatureSize;
  speed: string; // "9m" (6 quadrados) ou "6m" (4 quadrados)
  vision: "Normal" | "Visão na Penumbra" | "Visão no Escuro (18m)";
  abilityModifiers: Partial<Record<AbilityKey, number>>;
  favoredClass: string; // Classe Favorecida na regra D&D 3.5
  extraFeatAtLevel1?: boolean;
  extraSkillPointsAtLevel1?: number;
  extraSkillPointsPerLevel?: number;
  racialTraits: string[];
  weaponProficiencies: string[];
  skillBonuses: Record<string, number>;
  automaticLanguages: string[];
  bonusLanguages: string[];
  suggestedClasses: ClassSuggestion[];
}

export interface DndClass {
  id: string;
  name: string;
  role: string;
  description: string;
  hitDie: 4 | 6 | 8 | 10 | 12;
  babProgression: BabProgression;
  saves: {
    fortitude: SaveProgression;
    reflex: SaveProgression;
    will: SaveProgression;
  };
  skillPointsPerLevel: 2 | 4 | 6 | 8;
  classSkills: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  alignmentRestriction?: string;
  spellcasting?: {
    type: "Arcana" | "Divina";
    ability: AbilityKey;
    preparesSpells: boolean;
    level1Slots: Record<string, number>;
  };
  startingGoldAverage: number;
  level1Features: string[];
}

export interface DndSkillDefinition {
  id: string;
  name: string;
  ability: AbilityKey;
  abilityShort: AbilityShort;
  untrained: boolean;        // Marcado com quadrado preto ■ na ficha D&D 3.5
  armorCheckPenalty: boolean; // Marcado com asterisco * na ficha D&D 3.5 (dobro para Natação)
}

export interface SingleAbilityRollResult {
  rolls: [number, number, number, number]; // Os 4 d6 rolados
  droppedIndex: number;                    // Índice do menor dado descartado
  keptSum: number;                         // Soma dos 3 maiores dados (3 a 18)
}

export interface PolyhedralRollResult {
  id: string;
  die: "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";
  count: number;
  modifier: number;
  individualRolls: number[];
  total: number;
  label?: string;
  timestamp: string;
  isCriticalHit?: boolean;
  isCriticalFumble?: boolean;
}

export interface DndAdventureModule {
  slug: string;
  code: string;
  title: string;
  recommendedLevel: number;
  levelRangeLabel: string;
  partySize: string;
  author: string;
  pages: number;
  pdfPath: string;
  setting: string;
  synopsis: string;
  keyMonsters: string[];
  bossEncounter: string;
}
