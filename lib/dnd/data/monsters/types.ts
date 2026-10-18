export type MonsterCrBracket =
  | "ALL"
  | "ND_LT_1"
  | "ND_1_4"
  | "ND_5_10"
  | "ND_11_15"
  | "ND_16_PLUS";

export interface DndMonsterEntry {
  id: string;
  name: string;         // Ex: "Orc (Guerreiro 1)"
  nameEn: string;       // Ex: "Orc"
  sizeAndType: string;  // Ex: "Humanóide Médio (Orc)"
  challengeRating: string; // Ex: "1/2", "1/3", "1", "5", "20"
  crNumeric: number;    // Ex: 0.5, 0.33, 1, 5, 20
  hitDice: string;      // Ex: "1d8+1"
  hp: number;           // Ex: 5
  initiative: number;   // Ex: 0
  speed: string;        // Ex: "9m"
  armorClass: string;   // Ex: "13 (+3 couro batido), toque 10, surpresa 13"
  acValue: number;      // Ex: 13
  touchAc: number;      // Ex: 10
  flatFootedAc: number; // Ex: 13
  baseAttackGrapple: string; // Ex: "+1 / +4"
  attack: string;
  specialAttacks: string;
  specialQualities: string;
  saves: { fort: number; ref: number; will: number };
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  sourcePage: string;   // Referência a assets/Livro dos Monstros D&D 3.5.pdf
}
