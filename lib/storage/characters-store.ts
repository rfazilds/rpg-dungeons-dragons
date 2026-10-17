import type {
  CharacterAttackEntry,
  CharacterEquipmentData,
  CharacterSkillEntry,
  CharacterSpellbook,
} from "@/lib/db/schema";

export interface StoredCharacter35 {
  id: string;
  name: string;
  race: string;       // ID da raça em DND_RACES (ex: "anao", "elfo")
  class: string;      // ID da classe em DND_CLASSES (ex: "guerreiro", "mago")
  level: number;
  alignment: string;  // LB, NB, CB, LN, N, CN, LM, NM, CM
  deity: string;
  background: string;
  size: "Pequeno" | "Médio" | "Grande";
  experiencePoints: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  rollMethod: "virtual" | "physical";
  maxHp: number;
  currentHp: number;
  nonlethalDamage: number;
  armorClass: number;
  touchArmorClass: number;
  flatFootedArmorClass: number;
  speed: string;
  baseAttackBonus: number;
  spellResistance: number;
  damageReduction: string;
  fortitudeMisc: number;
  reflexMisc: number;
  willMisc: number;
  skills: Record<string, CharacterSkillEntry>;
  feats: string[];
  specialAbilities: string[];
  proficiencies: string[];
  languages: string[];
  attacks: CharacterAttackEntry[];
  spellSlots: CharacterSpellbook;
  equipment: CharacterEquipmentData;
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = "sanctum_dnd35_characters_v1";

export function createEmptySpellbook(): CharacterSpellbook {
  return {
    "0": { max: 0, used: 0, bonusSpells: 0, saveDc: 10, preparedOrKnown: [] },
    "1": { max: 0, used: 0, bonusSpells: 0, saveDc: 11, preparedOrKnown: [] },
    "2": { max: 0, used: 0, bonusSpells: 0, saveDc: 12, preparedOrKnown: [] },
    "3": { max: 0, used: 0, bonusSpells: 0, saveDc: 13, preparedOrKnown: [] },
    "4": { max: 0, used: 0, bonusSpells: 0, saveDc: 14, preparedOrKnown: [] },
    "5": { max: 0, used: 0, bonusSpells: 0, saveDc: 15, preparedOrKnown: [] },
    "6": { max: 0, used: 0, bonusSpells: 0, saveDc: 16, preparedOrKnown: [] },
    "7": { max: 0, used: 0, bonusSpells: 0, saveDc: 17, preparedOrKnown: [] },
    "8": { max: 0, used: 0, bonusSpells: 0, saveDc: 18, preparedOrKnown: [] },
    "9": { max: 0, used: 0, bonusSpells: 0, saveDc: 19, preparedOrKnown: [] },
  };
}

export const DEFAULT_DEMO_CHARACTERS: StoredCharacter35[] = [
  {
    id: "tordek-anao-guerreiro",
    name: "Tordek, Escudo de Pedra",
    race: "anao",
    class: "guerreiro",
    level: 1,
    alignment: "LB",
    deity: "Moradin",
    background: "Veterano das Minas da Grande-Torre",
    size: "Médio",
    experiencePoints: 0,
    strength: 16,
    dexterity: 13,
    constitution: 18, // 16 base + 2 racial Anão
    intelligence: 10,
    wisdom: 12,
    charisma: 8,      // 10 base - 2 racial Anão
    rollMethod: "virtual",
    maxHp: 14,        // d10 (10) + 4 mod. Con
    currentHp: 14,
    nonlethalDamage: 0,
    armorClass: 18,   // 10 + 5 Cota de Malha + 2 Escudo Pesado + 1 Des
    touchArmorClass: 11,
    flatFootedArmorClass: 17,
    speed: "6m",
    baseAttackBonus: 1,
    spellResistance: 0,
    damageReduction: "",
    fortitudeMisc: 0,
    reflexMisc: 0,
    willMisc: 0,
    skills: {
      intimidar: { ranks: 4, isClassSkill: true, miscMod: 0 },
      escalar: { ranks: 4, isClassSkill: true, miscMod: 0 },
      oficios: { ranks: 2, isClassSkill: true, miscMod: 2 },
    },
    feats: ["Foco em Arma (Machado de Guerra Anão)", "Ataque Poderoso"],
    specialAbilities: [
      "Visão no Escuro 18m",
      "Ligação com Rochas (+2 Procurar em pedra)",
      "Estabilidade (+4 contra Encontrão/Imobilização)",
      "+2 racial contra venenos e magias",
    ],
    proficiencies: [
      "Todas as Armas Simples e Marciais",
      "Machado de Guerra Anão",
      "Todas as Armaduras e Escudos",
    ],
    languages: ["Comum", "Anão"],
    attacks: [
      {
        id: "atq-1",
        name: "Machado de Guerra Anão",
        attackBonus: "+5",
        damage: "1d10+3",
        critical: "20/x3",
        range: "Corpo a corpo",
        damageType: "Cortante",
      },
      {
        id: "atq-2",
        name: "Besta Leve",
        attackBonus: "+2",
        damage: "1d8",
        critical: "19-20/x2",
        range: "24m",
        damageType: "Perfurante",
        ammo: 20,
      },
    ],
    spellSlots: createEmptySpellbook(),
    equipment: {
      armor: {
        name: "Cota de Malha (Chainmail)",
        type: "Média",
        acBonus: 5,
        maxDex: 2,
        checkPenalty: -5,
        spellFailure: 30,
        speed: "6m",
        weight: 20,
      },
      shield: {
        name: "Escudo Pesado de Aço",
        acBonus: 2,
        checkPenalty: -2,
        spellFailure: 15,
        weight: 7.5,
      },
      items: [
        { name: "Mochila de Aventureiro", quantity: 1, weight: 1 },
        { name: "Corda de Cânhamo (15m)", quantity: 1, weight: 5 },
        { name: "Poção de Curar Ferimentos Leves (1d8+1)", quantity: 2, weight: 0.2 },
      ],
      currency: { pc: 10, pp: 15, po: 45, pl: 0 },
    },
    notes:
      "Personagem icônico do Livro do Jogador D&D 3.5. Pronto para a aventura N1 - Um Cavaleiro Sombrio e Tempestuoso.",
    createdAt: "2026-10-16T20:00:00.000Z",
  },
  {
    id: "mialee-elfa-maga",
    name: "Mialee, Sábia Arcana",
    race: "elfo",
    class: "mago",
    level: 1,
    alignment: "NB",
    deity: "Boccob",
    background: "Estudiosa da Academia de Magia Élfica",
    size: "Médio",
    experiencePoints: 0,
    strength: 10,
    dexterity: 16,    // 14 base + 2 racial Elfo
    constitution: 12, // 14 base - 2 racial Elfo
    intelligence: 17, // +3 modificador (concede +1 magia bônus de 1º, 2º e 3º círculo)
    wisdom: 13,
    charisma: 10,
    rollMethod: "virtual",
    maxHp: 5,         // d4 (4) + 1 mod. Con
    currentHp: 5,
    nonlethalDamage: 0,
    armorClass: 13,   // 10 + 3 Des (17 com Armadura Arcana)
    touchArmorClass: 13,
    flatFootedArmorClass: 10,
    speed: "9m",
    baseAttackBonus: 0,
    spellResistance: 0,
    damageReduction: "",
    fortitudeMisc: 0,
    reflexMisc: 0,
    willMisc: 0,
    skills: {
      concentracao: { ranks: 4, isClassSkill: true, miscMod: 0 },
      conhecimento_arcano: { ranks: 4, isClassSkill: true, miscMod: 0 },
      identificar_magia: { ranks: 4, isClassSkill: true, miscMod: 0 },
      decifrar_escrita: { ranks: 4, isClassSkill: true, miscMod: 0 },
      observar: { ranks: 2, isClassSkill: false, miscMod: 2 },
    },
    feats: ["Escrever Pergaminho (Bônus Mago)", "Magias em Combate (+4 Concentração)"],
    specialAbilities: [
      "Visão na Penumbra",
      "Imunidade a sono mágico e +2 contra Encantamentos",
      "Invocar Familiar (Corvo)",
      "Sentido Élfico para Portas Secretas (+2 Procurar, Ouvir, Observar)",
    ],
    proficiencies: [
      "Clava, Adaga, Besta Leve/Pesada, Bordão",
      "Espada Longa, Sabre, Arco Longo e Arco Curto (Racial Elfo)",
    ],
    languages: ["Comum", "Élfico", "Dracônico", "Silvestre", "Goblin"],
    attacks: [
      {
        id: "atq-m1",
        name: "Arco Longo Élfico",
        attackBonus: "+3",
        damage: "1d8",
        critical: "20/x3",
        range: "30m",
        damageType: "Perfurante",
        ammo: 20,
      },
      {
        id: "atq-m2",
        name: "Bordão",
        attackBonus: "+0",
        damage: "1d6",
        critical: "20/x2",
        range: "Corpo a corpo",
        damageType: "Contusão",
      },
    ],
    spellSlots: {
      ...createEmptySpellbook(),
      "0": {
        max: 3,
        used: 0,
        bonusSpells: 0,
        saveDc: 13,
        preparedOrKnown: ["Detectar Magia", "Luz", "Raio de Gelo"],
      },
      "1": {
        max: 2, // 1 base + 1 bônus por Int 17
        used: 0,
        bonusSpells: 1,
        saveDc: 14,
        preparedOrKnown: ["Mísseis Mágicos", "Armadura Arcana", "Sono"],
      },
    },
    equipment: {
      items: [
        { name: "Grimório Encadernado em Couro", quantity: 1, weight: 1.5 },
        { name: "Bolsa de Componentes de Magia", quantity: 1, weight: 1 },
        { name: "Pergaminho de Escudo Arcano (NC 1º)", quantity: 1, weight: 0.1 },
      ],
      currency: { pc: 0, pp: 20, po: 65, pl: 0 },
    },
    notes:
      "Maga élfica icônica de D&D 3.5. Com Armadura Arcana ativa sua CA sobe para 17.",
    createdAt: "2026-10-16T20:05:00.000Z",
  },
];

export function loadStoredCharacters(): StoredCharacter35[] {
  if (typeof window === "undefined") return DEFAULT_DEMO_CHARACTERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_DEMO_CHARACTERS)
      );
      return DEFAULT_DEMO_CHARACTERS;
    }
    const parsed = JSON.parse(raw) as StoredCharacter35[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_DEMO_CHARACTERS;
  } catch {
    return DEFAULT_DEMO_CHARACTERS;
  }
}

export function saveStoredCharacters(list: StoredCharacter35[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignorar falha de quota
  }
}

export function addStoredCharacter(character: StoredCharacter35): void {
  const current = loadStoredCharacters();
  saveStoredCharacters([character, ...current]);
}

export function updateStoredCharacter(updated: StoredCharacter35): void {
  const current = loadStoredCharacters();
  saveStoredCharacters(
    current.map((c) => (c.id === updated.id ? updated : c))
  );
}

export function deleteStoredCharacter(id: string): StoredCharacter35[] {
  const current = loadStoredCharacters();
  const next = current.filter((c) => c.id !== id);
  saveStoredCharacters(next);
  return next;
}
