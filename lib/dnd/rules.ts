import type {
  BabProgression,
  CreatureSize,
  PolyhedralRollResult,
  SaveProgression,
  SingleAbilityRollResult,
} from "./types";

// ============================================================================
// 1. MODIFICADORES DE ATRIBUTO (LIVRO DO JOGADOR D&D 3.5 - TABELA 1-1)
// ============================================================================

/**
 * Calcula o modificador de habilidade canônico de D&D 3.5:
 * Math.floor((score - 10) / 2)
 */
export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Formata um modificador numérico com sinal explícito (ex: +3, +0, -1)
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ============================================================================
// 2. ROLAGEM VIRTUAL DE ATRIBUTOS (4d6 DROP LOWEST — REGRA PADRÃO D&D 3.5)
// ============================================================================

/**
 * Rola 4d6, identifica e descarta o menor dado e soma os 3 maiores (intervalo 3 a 18).
 * Retorna também os 4 dados individuais e o índice descartado para exibição visual.
 */
export function roll4d6DropLowest(): SingleAbilityRollResult {
  const rolls: [number, number, number, number] = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];

  let minVal = rolls[0];
  let droppedIndex = 0;

  for (let i = 1; i < 4; i++) {
    if (rolls[i] < minVal) {
      minVal = rolls[i];
      droppedIndex = i;
    }
  }

  const keptSum = rolls.reduce(
    (acc, val, idx) => (idx === droppedIndex ? acc : acc + val),
    0
  );

  return {
    rolls,
    droppedIndex,
    keptSum,
  };
}

/**
 * Gera o conjunto completo de 6 rolagens (4d6 drop lowest) para criação de personagem.
 */
export function rollSixAbilities4d6(): SingleAbilityRollResult[] {
  return Array.from({ length: 6 }, () => roll4d6DropLowest());
}

// ============================================================================
// 3. ROLADOR DE DADOS POLIÉDRICOS INTEGRADO (d4, d6, d8, d10, d12, d20, d100)
// ============================================================================

export function rollPolyhedralDice(
  die: PolyhedralRollResult["die"],
  count = 1,
  modifier = 0,
  label?: string
): PolyhedralRollResult {
  const sides = parseInt(die.replace("d", ""), 10);
  const safeCount = Math.max(1, Math.min(50, count));

  const individualRolls = Array.from(
    { length: safeCount },
    () => Math.floor(Math.random() * sides) + 1
  );

  const rawSum = individualRolls.reduce((a, b) => a + b, 0);
  const total = rawSum + modifier;

  const isD20Single = die === "d20" && safeCount === 1;

  return {
    id: crypto.randomUUID(),
    die,
    count: safeCount,
    modifier,
    individualRolls,
    total,
    label,
    timestamp: new Date().toISOString(),
    isCriticalHit: isD20Single && individualRolls[0] === 20,
    isCriticalFumble: isD20Single && individualRolls[0] === 1,
  };
}

// ============================================================================
// 4. BÔNUS BASE DE ATAQUE (BBA), AGARRAR E TESTES DE RESISTÊNCIA (D&D 3.5)
// ============================================================================

/**
 * Calcula o Bônus Base de Ataque (BBA) em D&D 3.5:
 * - Bom (Guerreiro, Bárbaro, Paladino, Ranger): +1 por nível (nível * 1)
 * - Médio (Clérigo, Druida, Ladino, Bardo, Monge): +3/4 por nível (Math.floor(nível * 0.75))
 * - Ruim (Mago, Feiticeiro): +1/2 por nível (Math.floor(nível * 0.5))
 */
export function calculateBaseAttackBonus(
  progression: BabProgression,
  level: number
): number {
  const safeLevel = Math.max(1, Math.min(20, level));
  switch (progression) {
    case "good":
      return safeLevel;
    case "average":
      return Math.floor((safeLevel * 3) / 4);
    case "poor":
      return Math.floor(safeLevel / 2);
  }
}

/**
 * Formata os ataques múltiplos iterativos de D&D 3.5 (a cada +6 de BBA ganha um ataque extra com -5):
 * Ex: BBA 6 -> "+6/+1", BBA 11 -> "+11/+6/+1", BBA 16 -> "+16/+11/+6/+1"
 */
export function formatIterativeAttackBonus(
  bab: number,
  abilityMod = 0,
  sizeMod = 0,
  miscMod = 0
): string {
  const attacks: string[] = [];
  let currentBab = bab;

  do {
    const total = currentBab + abilityMod + sizeMod + miscMod;
    attacks.push(formatModifier(total));
    currentBab -= 5;
  } while (currentBab >= 1 && attacks.length < 4);

  return attacks.join("/");
}

/**
 * Calcula o Bônus Base de Teste de Resistência (Fortitude, Reflexos ou Vontade) em D&D 3.5:
 * - Bom: 2 + Math.floor(level / 2) (ex: Nv 1 = +2)
 * - Ruim: Math.floor(level / 3)    (ex: Nv 1 = +0)
 */
export function calculateBaseSave(
  progression: SaveProgression,
  level: number
): number {
  const safeLevel = Math.max(1, Math.min(20, level));
  if (progression === "good") {
    return 2 + Math.floor(safeLevel / 2);
  }
  return Math.floor(safeLevel / 3);
}

/**
 * Modificador de Tamanho na CA e Jogadas de Ataque (D&D 3.5):
 * Pequeno = +1, Médio = 0, Grande = -1
 */
export function getSizeModifier(size: CreatureSize): number {
  if (size === "Pequeno") return 1;
  if (size === "Grande") return -1;
  return 0;
}

/**
 * Modificador Especial de Tamanho em Manobras de Agarrar (D&D 3.5):
 * Pequeno = -4, Médio = 0, Grande = +4
 */
export function getGrappleSizeModifier(size: CreatureSize): number {
  if (size === "Pequeno") return -4;
  if (size === "Grande") return 4;
  return 0;
}

/**
 * Calcula o Modificador Total de Agarrar (BBA + Mod. Força + Mod. Especial de Tamanho + Outros)
 */
export function calculateGrappleModifier(
  bab: number,
  strengthScore: number,
  size: CreatureSize,
  miscMod = 0
): number {
  const strMod = calculateAbilityModifier(strengthScore);
  return bab + strMod + getGrappleSizeModifier(size) + miscMod;
}

// ============================================================================
// 5. CLASSE DE ARMADURA (CA TOTAL, CA DE TOQUE E CA SURPRESA — D&D 3.5)
// ============================================================================

export function calculateArmorClass35(params: {
  dexterityScore: number;
  size: CreatureSize;
  armorBonus?: number;
  shieldBonus?: number;
  maxDexFromArmor?: number | null;
  naturalArmor?: number;
  deflectionBonus?: number;
  miscBonus?: number;
  monkWisdomBonus?: number;
}) {
  const rawDexMod = calculateAbilityModifier(params.dexterityScore);
  const effectiveDexMod =
    typeof params.maxDexFromArmor === "number"
      ? Math.min(rawDexMod, params.maxDexFromArmor)
      : rawDexMod;

  const sizeMod = getSizeModifier(params.size);
  const armor = params.armorBonus ?? 0;
  const shield = params.shieldBonus ?? 0;
  const natural = params.naturalArmor ?? 0;
  const deflection = params.deflectionBonus ?? 0;
  const misc = (params.miscBonus ?? 0) + (params.monkWisdomBonus ?? 0);

  // CA Total = 10 + Armadura + Escudo + Mod. Des + Mod. Tamanho + Natural + Deflexão + Outros
  const totalAc =
    10 + armor + shield + effectiveDexMod + sizeMod + natural + deflection + misc;

  // CA de Toque = Ignora Armadura, Escudo e Armadura Natural
  const touchAc = 10 + effectiveDexMod + sizeMod + deflection + misc;

  // CA Surpresa (Flat-Footed) = Perde bônus positivo de Destreza
  const flatFootedDex = Math.min(0, effectiveDexMod);
  const flatFootedAc =
    10 + armor + shield + flatFootedDex + sizeMod + natural + deflection + misc;

  return {
    totalAc,
    touchAc,
    flatFootedAc,
    effectiveDexMod,
    sizeMod,
  };
}

// ============================================================================
// 6. PERÍCIAS POR GRADUAÇÃO E MAGIAS BÔNUS (D&D 3.5)
// ============================================================================

/**
 * Pontos de Perícia totais no 1º Nível:
 * (Base da Classe + Mod. Int [mínimo 1]) * 4 + (4 se Humano)
 */
export function calculateSkillPointsAtLevel1(
  classBaseSkillPoints: number,
  intelligenceScore: number,
  isHuman: boolean
): number {
  const intMod = calculateAbilityModifier(intelligenceScore);
  const perLevel = Math.max(1, classBaseSkillPoints + intMod);
  return perLevel * 4 + (isHuman ? 4 : 0);
}

/**
 * Graduação máxima permitida em uma perícia (D&D 3.5):
 * - Perícia de Classe: Nível + 3
 * - Perícia de Outra Classe: (Nível + 3) / 2
 */
export function calculateMaxSkillRanks(
  level: number,
  isClassSkill: boolean
): number {
  return isClassSkill ? level + 3 : Math.floor(((level + 3) / 2) * 10) / 10;
}

/**
 * Magias Bônus por dia concedidas por valor alto de Habilidade Chave (Tabela 1-1 Livro do Jogador 3.5)
 */
export function calculateBonusSpells35(
  abilityScore: number,
  spellLevel: number
): number {
  if (spellLevel <= 0 || spellLevel > 9) return 0;
  if (abilityScore < 10 + spellLevel) return 0;
  const mod = calculateAbilityModifier(abilityScore);
  if (mod < spellLevel) return 0;
  return Math.floor((mod - spellLevel) / 4) + 1;
}

/**
 * CD do Teste de Resistência contra Magia em D&D 3.5:
 * 10 + Nível da Magia + Modificador da Habilidade Chave
 */
export function calculateSpellSaveDc35(
  abilityScore: number,
  spellLevel: number
): number {
  return 10 + spellLevel + calculateAbilityModifier(abilityScore);
}

// ============================================================================
// 7. CALCULADORA DE ENCONTROS E XP (LIVRO DO MESTRE D&D 3.5 - CAP. 3)
// ============================================================================

/**
 * Converte string de Nível de Desafio (ND / CR) como "1/4", "1/2", "1", "5" em valor numérico.
 */
export function parseChallengeRating(cr: string | number): number {
  if (typeof cr === "number") return cr;
  const trimmed = cr.trim();
  if (trimmed === "1/8") return 0.125;
  if (trimmed === "1/6") return 0.166;
  if (trimmed === "1/4") return 0.25;
  if (trimmed === "1/3") return 0.333;
  if (trimmed === "1/2") return 0.5;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? 1 : parsed;
}

/**
 * Calcula o XP base total de um monstro de determinado ND para um grupo de nível médio `partyLevel`,
 * seguindo a progressão oficial da Tabela 2-6 do Livro do Mestre D&D 3.5 (base: 300 * partyLevel para ND == partyLevel,
 * dobrando a cada +2 de ND).
 */
export function calculateMonsterXp35(
  partyLevel: number,
  monsterCr: string | number
): number {
  const safePartyLevel = Math.max(1, Math.min(20, partyLevel));
  const crNum = parseChallengeRating(monsterCr);

  if (crNum < 1) {
    const baseLevel1 = 300 * Math.pow(2, (1 - safePartyLevel) / 2);
    return Math.round(baseLevel1 * crNum);
  }

  const effectivePartyLevel = Math.max(3, safePartyLevel);
  const diff = crNum - effectivePartyLevel;
  const xpTotal = 300 * effectivePartyLevel * Math.pow(2, diff / 2);
  return Math.max(25, Math.round(xpTotal / 25) * 25);
}

/**
 * Calcula o Nível de Encontro (NE / EL), a recompensa de XP (total e por jogador)
 * e a classificação de dificuldade segundo o Livro do Mestre D&D 3.5 (pág. 48-49).
 */
export function calculateEncounterDifficulty35(params: {
  partySize: number;
  partyLevel: number;
  monsters: Array<{ cr: string | number; count: number }>;
}) {
  const safePartySize = Math.max(1, params.partySize);
  const safePartyLevel = Math.max(1, Math.min(20, params.partyLevel));

  let totalPower = 0;
  let totalXp = 0;
  let totalMonsters = 0;

  for (const m of params.monsters) {
    if (m.count <= 0) continue;
    const crVal = parseChallengeRating(m.cr);
    totalMonsters += m.count;
    // Em D&D 3.5, dobrar a quantidade de criaturas equivale a +2 no Nível de Encontro (potência base 2^(CR/2))
    const unitPower =
      crVal >= 1 ? Math.pow(2, crVal / 2) : crVal * Math.pow(2, 0.5);
    totalPower += unitPower * m.count;
    totalXp += calculateMonsterXp35(safePartyLevel, crVal) * m.count;
  }

  // Nível de Encontro efetivo (NE)
  const encounterLevel =
    totalPower > 0 ? Math.max(1, Math.round(2 * Math.log2(totalPower))) : 0;

  // Ajuste de Nível Efetivo do Grupo (NEP) quando o grupo tem mais ou menos de 4 jogadores
  const partySizeAdjustment =
    safePartySize >= 6 ? 1 : safePartySize <= 3 ? -1 : 0;
  const effectivePartyLevel = safePartyLevel + partySizeAdjustment;

  const diff = encounterLevel - effectivePartyLevel;

  let difficulty:
    | "Trivial"
    | "Fácil"
    | "Desafiador (Médio)"
    | "Difícil"
    | "Mortal (Avassalador)" = "Desafiador (Médio)";
  let description =
    "Encontro equilibrado padrão de D&D 3.5: consome cerca de 20% a 25% dos recursos do grupo (PV e magias).";

  if (totalMonsters === 0) {
    difficulty = "Trivial";
    description = "Adicione monstros ao encontro para calcular o Nível de Encontro (NE) e o XP.";
  } else if (diff <= -3) {
    difficulty = "Trivial";
    description = "Vitória quase automática sem gasto significativo de recursos.";
  } else if (diff <= -1) {
    difficulty = "Fácil";
    description = "Consome cerca de 10% dos recursos do grupo; ideal para patrulhas e guardas menores.";
  } else if (diff <= 1) {
    difficulty = "Desafiador (Médio)";
    description = "Encontro padrão equilibrado (NE próximo ao nível do grupo).";
  } else if (diff <= 3) {
    difficulty = "Difícil";
    description = "Ameaça séria (consome 50%+ dos recursos); ideal para subchefes ou emboscadas.";
  } else {
    difficulty = "Mortal (Avassalador)";
    description = "Alto risco de morte de personagens (NE 4+ níveis acima do grupo).";
  }

  return {
    encounterLevel,
    effectivePartyLevel,
    totalMonsters,
    totalXp,
    xpPerCharacter: Math.floor(totalXp / safePartySize),
    difficulty,
    description,
  };
}
