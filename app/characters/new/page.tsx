"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Dices,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Shield,
  Heart,
  BookOpen,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { DND_RACES, getRaceById } from "@/lib/dnd/data/races";
import { DND_CLASSES, getClassById } from "@/lib/dnd/data/classes";
import { DND_SKILLS } from "@/lib/dnd/data/skills";
import {
  calculateAbilityModifier,
  calculateArmorClass35,
  calculateBaseAttackBonus,
  calculateBaseSave,
  calculateBonusSpells35,
  calculateSkillPointsAtLevel1,
  calculateSpellSaveDc35,
  formatModifier,
  roll4d6DropLowest,
  rollSixAbilities4d6,
} from "@/lib/dnd/rules";
import type { AbilityKey, SingleAbilityRollResult } from "@/lib/dnd/types";
import {
  addStoredCharacter,
  createEmptySpellbook,
  type StoredCharacter35,
} from "@/lib/storage/characters-store";
import type { CharacterSkillEntry } from "@/lib/db/schema";

const ABILITY_META: Array<{
  key: AbilityKey;
  label: string;
  short: string;
  desc: string;
}> = [
  {
    key: "strength",
    label: "Força",
    short: "FOR",
    desc: "Ataque e dano corpo a corpo, Agarrar e Carga",
  },
  {
    key: "dexterity",
    label: "Destreza",
    short: "DES",
    desc: "CA, Iniciativa, Ataques à Distância e Reflexos",
  },
  {
    key: "constitution",
    label: "Constituição",
    short: "CON",
    desc: "Pontos de Vida (PV), Concentração e Fortitude",
  },
  {
    key: "intelligence",
    label: "Inteligência",
    short: "INT",
    desc: "Pontos de Perícia por nível e Magias de Mago",
  },
  {
    key: "wisdom",
    label: "Sabedoria",
    short: "SAB",
    desc: "Vontade, Percepção (Ouvir/Observar) e Magias Divinas",
  },
  {
    key: "charisma",
    label: "Carisma",
    short: "CAR",
    desc: "Liderança, Magias de Feiticeiro/Bardo e Expulsar Mortos-Vivos",
  },
];

const ALIGNMENTS = [
  { code: "LB", name: "Leal e Bom" },
  { code: "NB", name: "Neutro e Bom" },
  { code: "CB", name: "Caótico e Bom" },
  { code: "LN", name: "Leal e Neutro" },
  { code: "N", name: "Neutro" },
  { code: "CN", name: "Caótico e Neutro" },
  { code: "LM", name: "Leal e Mau" },
  { code: "NM", name: "Neutro e Mau" },
  { code: "CM", name: "Caótico e Mau" },
];

const BACKGROUNDS_35 = [
  {
    id: "veterano-fronteira",
    name: "Guardião da Fronteira",
    bonusFeat: "Prontidão (+2 Ouvir e Observar)",
    gear: "Mochila, Corda de Cânhamo (15m), Tochas (5), Pederneira",
  },
  {
    id: "academia-arcana",
    name: "Iniciado de Academia Arcana",
    bonusFeat: "Foco em Perícia (Conhecimento [Arcano])",
    gear: "Estojos de Pergaminho (2), Tinta, Pena, Grimório de Viagem",
  },
  {
    id: "acólito-templo",
    name: "Acólito de Templo Antigo",
    bonusFeat: "Vontade de Ferro (+2 nos testes de Vontade)",
    gear: "Símbolo Sagrado de Prata, Água Benta (1 frasco), Traje de Viajante",
  },
  {
    id: "guilda-sombras",
    name: "Operativo das Sombras Urbanas",
    bonusFeat: "Iniciativa Aprimorada (+4 na Iniciativa)",
    gear: "Instrumentos de Ladrão Obra-Prima, Capa Escura, Arpéu",
  },
];

export default function CharacterCreationWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Etapa 1: Raça
  const [selectedRaceId, setSelectedRaceId] = useState<string>("anao");
  // Etapa 2: Classe
  const [selectedClassId, setSelectedClassId] = useState<string>("guerreiro");
  // Etapa 3: Atributos (Virtual 4d6 drop lowest vs Físico manual)
  const [rollMode, setRollMode] = useState<"virtual" | "physical">("virtual");
  const [baseScores, setBaseScores] = useState<Record<AbilityKey, number>>({
    strength: 15,
    dexterity: 13,
    constitution: 14,
    intelligence: 12,
    wisdom: 10,
    charisma: 8,
  });
  const [virtualBreakdowns, setVirtualBreakdowns] = useState<
    Record<AbilityKey, SingleAbilityRollResult | null>
  >({
    strength: { rolls: [6, 5, 4, 1], droppedIndex: 3, keptSum: 15 },
    dexterity: { rolls: [5, 4, 4, 2], droppedIndex: 3, keptSum: 13 },
    constitution: { rolls: [6, 5, 3, 2], droppedIndex: 3, keptSum: 14 },
    intelligence: { rolls: [5, 4, 3, 1], droppedIndex: 3, keptSum: 12 },
    wisdom: { rolls: [4, 3, 3, 2], droppedIndex: 3, keptSum: 10 },
    charisma: { rolls: [3, 3, 2, 1], droppedIndex: 3, keptSum: 8 },
  });

  // Etapa 4: Identidade, Tendência, Antecedente e Perícias
  const [name, setName] = useState("");
  const [alignment, setAlignment] = useState("LB");
  const [deity, setDeity] = useState("Moradin");
  const [backgroundId, setBackgroundId] = useState(BACKGROUNDS_35[0].id);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "intimidar",
    "escalar",
  ]);

  const selectedRace = useMemo(
    () => getRaceById(selectedRaceId) || DND_RACES[0],
    [selectedRaceId]
  );
  const selectedClass = useMemo(
    () => getClassById(selectedClassId) || DND_CLASSES[0],
    [selectedClassId]
  );

  // Atributos Finais (Base + Modificador Racial D&D 3.5)
  const finalScores = useMemo(() => {
    const result = {} as Record<AbilityKey, number>;
    for (const { key } of ABILITY_META) {
      const racial = selectedRace.abilityModifiers[key] ?? 0;
      const raw = baseScores[key] + racial;
      // Regra D&D 3.5: Inteligência nunca fica abaixo de 3 por penalidade racial
      result[key] = key === "intelligence" ? Math.max(3, raw) : Math.max(1, raw);
    }
    return result;
  }, [baseScores, selectedRace]);

  // Pontos de Perícia no 1º Nível ((Base + Mod. Int) * 4 + 4 se Humano)
  const totalSkillPointsLevel1 = useMemo(() => {
    return calculateSkillPointsAtLevel1(
      selectedClass.skillPointsPerLevel,
      finalScores.intelligence,
      selectedRace.id === "humano"
    );
  }, [selectedClass, finalScores.intelligence, selectedRace.id]);

  // Quantidade máxima de perícias com 4 graduações (máximo no 1º nível = Nível + 3 = 4)
  const maxFullRankSkills = Math.max(1, Math.floor(totalSkillPointsLevel1 / 4));

  function handleRollAllVirtual() {
    const six = rollSixAbilities4d6();
    const keys: AbilityKey[] = [
      "strength",
      "dexterity",
      "constitution",
      "intelligence",
      "wisdom",
      "charisma",
    ];
    const nextScores = { ...baseScores };
    const nextBreakdowns = { ...virtualBreakdowns };
    keys.forEach((k, idx) => {
      nextScores[k] = six[idx].keptSum;
      nextBreakdowns[k] = six[idx];
    });
    setBaseScores(nextScores);
    setVirtualBreakdowns(nextBreakdowns);
  }

  function handleRollSingleAbility(key: AbilityKey) {
    const res = roll4d6DropLowest();
    setBaseScores((prev) => ({ ...prev, [key]: res.keptSum }));
    setVirtualBreakdowns((prev) => ({ ...prev, [key]: res }));
  }

  function handlePhysicalInput(key: AbilityKey, valueStr: string) {
    const num = parseInt(valueStr, 10);
    if (Number.isNaN(num)) {
      setBaseScores((prev) => ({ ...prev, [key]: 10 }));
      return;
    }
    const clamped = Math.max(3, Math.min(18, num));
    setBaseScores((prev) => ({ ...prev, [key]: clamped }));
  }

  function toggleSkillSelection(skillId: string) {
    setSelectedSkills((prev) => {
      if (prev.includes(skillId)) {
        return prev.filter((s) => s !== skillId);
      }
      if (prev.length >= maxFullRankSkills) {
        return [...prev.slice(1), skillId];
      }
      return [...prev, skillId];
    });
  }

  function handleCreateCharacter() {
    const bg =
      BACKGROUNDS_35.find((b) => b.id === backgroundId) || BACKGROUNDS_35[0];
    const conMod = calculateAbilityModifier(finalScores.constitution);
    const maxHp = Math.max(1, selectedClass.hitDie + conMod);
    const bab = calculateBaseAttackBonus(selectedClass.babProgression, 1);

    // Armadura inicial padrão conforme proficiência da classe
    const hasHeavy = selectedClass.armorProficiencies.some((p) =>
      p.includes("Pesadas")
    );
    const hasMedium = selectedClass.armorProficiencies.some((p) =>
      p.includes("Médias")
    );
    const hasLight = selectedClass.armorProficiencies.some((p) =>
      p.includes("Leves")
    );
    const hasShield = selectedClass.armorProficiencies.some((p) =>
      p.includes("Escudos")
    );

    const armorBonus = hasHeavy ? 5 : hasMedium ? 4 : hasLight ? 3 : 0;
    const shieldBonus = hasShield ? 2 : 0;
    const monkWisBonus =
      selectedClass.id === "monge"
        ? Math.max(0, calculateAbilityModifier(finalScores.wisdom))
        : 0;

    const acCalc = calculateArmorClass35({
      dexterityScore: finalScores.dexterity,
      size: selectedRace.size,
      armorBonus,
      shieldBonus,
      maxDexFromArmor: hasHeavy ? 2 : hasMedium ? 3 : null,
      monkWisdomBonus: monkWisBonus,
    });

    // Monta o mapa de perícias D&D 3.5 (4 graduações nas perícias selecionadas)
    const skillsRecord: Record<string, CharacterSkillEntry> = {};
    selectedSkills.forEach((skillId) => {
      const isClassSkill = selectedClass.classSkills.includes(skillId);
      const racialBonus = selectedRace.skillBonuses[skillId] ?? 0;
      skillsRecord[skillId] = {
        ranks: isClassSkill ? 4 : 2,
        isClassSkill,
        miscMod: racialBonus,
      };
    });

    // Configura Slots de Magia de 1º nível se a classe for conjuradora no Nv 1
    const spellbook = createEmptySpellbook();
    if (selectedClass.spellcasting) {
      const keyAbilityScore = finalScores[selectedClass.spellcasting.ability];
      const base0 = selectedClass.spellcasting.level1Slots["0"] ?? 0;
      const base1 = selectedClass.spellcasting.level1Slots["1"] ?? 0;
      const bonus1 = base1 > 0 ? calculateBonusSpells35(keyAbilityScore, 1) : 0;

      spellbook["0"] = {
        max: base0,
        used: 0,
        bonusSpells: 0,
        saveDc: calculateSpellSaveDc35(keyAbilityScore, 0),
        preparedOrKnown: ["Detectar Magia", "Luz"],
      };
      if (base1 > 0) {
        spellbook["1"] = {
          max: base1 + bonus1,
          used: 0,
          bonusSpells: bonus1,
          saveDc: calculateSpellSaveDc35(keyAbilityScore, 1),
          preparedOrKnown:
            selectedClass.spellcasting.type === "Arcana"
              ? ["Mísseis Mágicos", "Armadura Arcana"]
              : ["Curar Ferimentos Leves", "Bênção"],
        };
      }
    }

    const strMod = calculateAbilityModifier(finalScores.strength);
    const dexMod = calculateAbilityModifier(finalScores.dexterity);
    const sizeAtkMod = selectedRace.size === "Pequeno" ? 1 : 0;

    const newCharacter: StoredCharacter35 = {
      id: `pj-${Date.now()}`,
      name:
        name.trim() ||
        `${selectedRace.name} ${selectedClass.name}`,
      race: selectedRace.id,
      class: selectedClass.id,
      level: 1,
      alignment,
      deity: deity.trim() || "Panteão D&D 3.5",
      background: bg.name,
      size: selectedRace.size,
      experiencePoints: 0,
      strength: finalScores.strength,
      dexterity: finalScores.dexterity,
      constitution: finalScores.constitution,
      intelligence: finalScores.intelligence,
      wisdom: finalScores.wisdom,
      charisma: finalScores.charisma,
      rollMethod: rollMode,
      maxHp,
      currentHp: maxHp,
      nonlethalDamage: 0,
      armorClass: acCalc.totalAc,
      touchArmorClass: acCalc.touchAc,
      flatFootedArmorClass: acCalc.flatFootedAc,
      speed: selectedRace.speed,
      baseAttackBonus: bab,
      spellResistance: 0,
      damageReduction: "",
      fortitudeMisc: selectedRace.id === "halfling" ? 1 : 0,
      reflexMisc: selectedRace.id === "halfling" ? 1 : 0,
      willMisc: selectedRace.id === "halfling" ? 1 : 0,
      skills: skillsRecord,
      feats: [
        bg.bonusFeat,
        ...(selectedRace.extraFeatAtLevel1
          ? ["Talento Extra Humano (Iniciativa Aprimorada)"]
          : []),
        ...(selectedClass.id === "guerreiro"
          ? ["Talento Bônus de Guerreiro (Ataque Poderoso)"]
          : []),
      ],
      specialAbilities: [
        ...selectedRace.racialTraits,
        ...selectedClass.level1Features,
      ],
      proficiencies: [
        ...selectedClass.weaponProficiencies,
        ...selectedClass.armorProficiencies,
        ...selectedRace.weaponProficiencies,
      ],
      languages: [...selectedRace.automaticLanguages],
      attacks: [
        {
          id: "atq-principal",
          name:
            selectedClass.id === "mago" || selectedClass.id === "feiticeiro"
              ? "Bordão / Adaga"
              : selectedClass.id === "monge"
              ? "Ataque Desarmado"
              : "Arma Principal Corpo a Corpo",
          attackBonus: formatModifier(bab + strMod + sizeAtkMod),
          damage: `1d8${strMod !== 0 ? formatModifier(strMod) : ""}`,
          critical: "19-20/x2",
          range: "Corpo a corpo",
          damageType: "Cortante",
        },
        {
          id: "atq-distancia",
          name: "Arco / Besta à Distância",
          attackBonus: formatModifier(bab + dexMod + sizeAtkMod),
          damage: "1d8",
          critical: "20/x3",
          range: "24m",
          damageType: "Perfurante",
          ammo: 20,
        },
      ],
      spellSlots: spellbook,
      equipment: {
        armor:
          armorBonus > 0
            ? {
                name: hasHeavy
                  ? "Cota de Malha"
                  : hasMedium
                  ? "Camisão de Cota de Malha"
                  : "Couro Batido",
                type: hasHeavy ? "Média" : "Leve",
                acBonus: armorBonus,
                maxDex: hasHeavy ? 2 : 4,
                checkPenalty: hasHeavy ? -5 : -1,
                spellFailure: hasHeavy ? 30 : 15,
                speed: selectedRace.speed,
                weight: hasHeavy ? 20 : 10,
              }
            : undefined,
        shield:
          shieldBonus > 0
            ? {
                name: "Escudo Pesado",
                acBonus: shieldBonus,
                checkPenalty: -2,
                spellFailure: 15,
                weight: 7,
              }
            : undefined,
        items: bg.gear.split(", ").map((item) => ({
          name: item,
          quantity: 1,
          weight: 1,
        })),
        currency: {
          pc: 0,
          pp: 10,
          po: selectedClass.startingGoldAverage,
          pl: 0,
        },
      },
      notes: `Personagem criado via Assistente D&D 3.5 (${
        rollMode === "virtual" ? "Dados Virtuais 4d6" : "Dados Físicos de Mesa"
      }).`,
      createdAt: new Date().toISOString(),
    };

    addStoredCharacter(newCharacter);
    router.push(`/characters/${newCharacter.id}`);
  }

  return (
    <AppShell>
      {/* Cabeçalho e Barra de Etapas Responsiva */}
      <div className="mb-5">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-dungeon-parchment">
          Assistente Inteligente de Criação D&D 3.5
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Fluxo guiado oficial do Livro do Jogador v.3.5 com cálculo reativo de
          modificadores raciais, sinergias de classe, BBA e perícias.
        </p>

        {/* Indicador de Progresso Mobile-First */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 sm:gap-2.5">
          {[
            { num: 1, title: "1. Raça" },
            { num: 2, title: "2. Classe" },
            { num: 3, title: "3. Atributos" },
            { num: 4, title: "4. Finalizar" },
          ].map((item) => {
            const isActive = step === item.num;
            const isDone = step > item.num;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => setStep(item.num as 1 | 2 | 3 | 4)}
                className={`min-h-[42px] rounded-lg border px-2 py-2 text-center text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-torch-bright bg-torch/20 text-torch-glow shadow-torch-glow"
                    : isDone
                    ? "border-vital/50 bg-vital-deep/20 text-vital"
                    : "border-stone-800 bg-dungeon-stone text-slate-400"
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          ETAPA 1: ESCOLHA DA RAÇA + SUGESTÃO INTELIGENTE DE CLASSES
      ==================================================================== */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DND_RACES.map((race) => {
              const isSelected = race.id === selectedRaceId;
              const modEntries = Object.entries(race.abilityModifiers);

              return (
                <button
                  key={race.id}
                  type="button"
                  onClick={() => setSelectedRaceId(race.id)}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-torch-bright bg-torch/15 shadow-torch-glow"
                      : "border-stone-800 bg-dungeon-stone/90 hover:border-stone-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold text-dungeon-parchment">
                      {race.name}
                    </h2>
                    <span className="rounded bg-dungeon-abyss px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-stone-800">
                      {race.size} • {race.speed}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {race.tagline}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {modEntries.length === 0 ? (
                      <span className="rounded border border-torch/40 bg-torch/10 px-2 py-0.5 text-[11px] font-semibold text-torch-glow">
                        +1 Talento Extra & +4 Perícias Nv 1
                      </span>
                    ) : (
                      modEntries.map(([k, val]) => {
                        const ab = ABILITY_META.find((a) => a.key === k);
                        const num = val ?? 0;
                        return (
                          <span
                            key={k}
                            className={`rounded border px-2 py-0.5 text-[11px] font-mono font-semibold ${
                              num > 0
                                ? "border-vital/40 bg-vital-deep/30 text-vital"
                                : "border-crimson/40 bg-crimson-blood/30 text-crimson-soft"
                            }`}
                          >
                            {ab?.short} {formatModifier(num)}
                          </span>
                        );
                      })
                    )}
                    <span className="rounded border border-stone-700 bg-dungeon-abyss px-2 py-0.5 text-[11px] text-slate-300">
                      {race.vision}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CARD DE SINERGIA: CLASSES RECOMENDADAS PARA A RAÇA ESCOLHIDA */}
          <div className="dungeon-panel p-4 sm:p-5 border-torch/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-torch-bright shrink-0" />
                <div>
                  <h3 className="font-display text-base font-bold text-torch-glow">
                    Classes Recomendadas para {selectedRace.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Baseado nos bônus raciais e na Classe Favorecida (
                    <span className="text-dungeon-parchment font-semibold">
                      {selectedRace.favoredClass}
                    </span>
                    ). Você tem liberdade total para escolher qualquer classe!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3">
              {selectedRace.suggestedClasses.map((sug) => {
                const isPicked = selectedClassId === sug.classId;
                return (
                  <div
                    key={sug.classId}
                    className={`rounded-lg border p-3.5 flex flex-col justify-between ${
                      isPicked
                        ? "border-torch-bright bg-torch/15"
                        : "border-stone-800 bg-dungeon-abyss/80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-bold text-dungeon-parchment">
                          {sug.className}
                        </span>
                        <span className="rounded-full border border-torch/40 bg-torch/10 px-2 py-0.5 text-[10px] font-semibold text-torch-glow">
                          {sug.synergyBadge}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400">
                        {sug.reason}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClassId(sug.classId);
                        setStep(2);
                      }}
                      className="mt-3 min-h-[38px] w-full rounded-lg border border-torch/40 bg-torch/20 px-3 py-1.5 text-xs font-semibold text-torch-glow hover:bg-torch/30 transition-colors"
                    >
                      Selecionar {sug.className} e Avançar →
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Resumo dos Traços Raciais Injetados Automaticamente */}
            <div className="mt-4 pt-3 border-t border-stone-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Traços Raciais Injetados Automaticamente ({selectedRace.name}):
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                {selectedRace.racialTraits.map((trait) => (
                  <li key={trait} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-torch-bright shrink-0 mt-0.5" />
                    <span>{trait}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="runic-button"
            >
              <span>Continuar para Escolha da Classe</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          ETAPA 2: ESCOLHA DA CLASSE (TODAS AS 11 CLASSES LIBERADAS)
      ==================================================================== */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-stone-800 bg-dungeon-stone/90 p-3.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-300">
              Raça selecionada:{" "}
              <strong className="text-torch-glow">{selectedRace.name}</strong> •
              As classes com selo dourado possuem sinergia direta com sua raça,
              mas todas as 11 classes estão liberadas.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DND_CLASSES.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const isSuggested = selectedRace.suggestedClasses.some(
                (s) => s.classId === cls.id
              );

              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setSelectedSkills(cls.classSkills.slice(0, 2));
                  }}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-torch-bright bg-torch/15 shadow-torch-glow"
                      : "border-stone-800 bg-dungeon-stone/90 hover:border-stone-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-base font-bold text-dungeon-parchment">
                      {cls.name}
                    </h2>
                    <span className="rounded border border-stone-700 bg-dungeon-abyss px-2 py-0.5 font-mono text-xs font-bold text-torch-glow">
                      DV d{cls.hitDie}
                    </span>
                  </div>

                  {isSuggested && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-torch/40 bg-torch/15 px-2 py-0.5 text-[10px] font-semibold text-torch-glow">
                      <Sparkles className="h-3 w-3" /> Recomendada para{" "}
                      {selectedRace.name}
                    </span>
                  )}

                  <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">
                    {cls.description}
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-1.5 text-center border-t border-stone-800 pt-2.5 text-[11px]">
                    <div className="rounded bg-dungeon-abyss p-1">
                      <span className="block text-[9px] text-slate-500 uppercase">
                        BBA Nv 1
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {formatModifier(
                          calculateBaseAttackBonus(cls.babProgression, 1)
                        )}
                      </span>
                    </div>
                    <div className="rounded bg-dungeon-abyss p-1">
                      <span className="block text-[9px] text-slate-500 uppercase">
                        Fort/Ref/Von
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        +{calculateBaseSave(cls.saves.fortitude, 1)}/+
                        {calculateBaseSave(cls.saves.reflex, 1)}/+
                        {calculateBaseSave(cls.saves.will, 1)}
                      </span>
                    </div>
                    <div className="rounded bg-dungeon-abyss p-1">
                      <span className="block text-[9px] text-slate-500 uppercase">
                        Perícias
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {cls.skillPointsPerLevel}+Int
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalhes Automáticos da Classe Escolhida */}
          <div className="dungeon-panel p-4 sm:p-5">
            <h3 className="font-display text-base font-bold text-dungeon-parchment">
              Características Automáticas de {selectedClass.name} (1º Nível)
            </h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold text-torch-glow uppercase tracking-wider mb-1.5">
                  Habilidades de Classe Iniciais:
                </p>
                <ul className="space-y-1 text-slate-300">
                  {selectedClass.level1Features.map((feat) => (
                    <li key={feat} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-torch-bright shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-torch-glow uppercase tracking-wider mb-1.5">
                  Proficiências em Armas e Armaduras:
                </p>
                <p className="text-slate-300">
                  <strong>Armaduras:</strong>{" "}
                  {selectedClass.armorProficiencies.join(", ")}
                </p>
                <p className="mt-1 text-slate-300">
                  <strong>Armas:</strong>{" "}
                  {selectedClass.weaponProficiencies.join(", ")}
                </p>
                {selectedClass.alignmentRestriction && (
                  <p className="mt-2 rounded border border-torch/30 bg-torch/10 p-2 text-torch-glow">
                    <strong>Restrição de Tendência D&D 3.5:</strong>{" "}
                    {selectedClass.alignmentRestriction}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-700 bg-dungeon-stone px-4 py-2 text-xs font-semibold text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para Raça
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="runic-button"
            >
              <span>Continuar para Atributos</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          ETAPA 3: DEFINIÇÃO DOS ATRIBUTOS (DADOS VIRTUAIS 4d6 VS DADOS FÍSICOS)
      ==================================================================== */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Seletor de Modalidade: Dados Virtuais vs Dados Físicos */}
          <div className="dungeon-panel p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-dungeon-parchment">
                  Modalidade de Definição de Atributos
                </h2>
                <p className="text-xs text-slate-400">
                  Os bônus raciais de <strong>{selectedRace.name}</strong> são
                  somados automaticamente em ambas as modalidades.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-stone-800 bg-dungeon-abyss p-1">
                <button
                  type="button"
                  onClick={() => setRollMode("virtual")}
                  className={`min-h-[40px] rounded-md px-3 text-xs font-semibold transition-colors ${
                    rollMode === "virtual"
                      ? "bg-torch text-dungeon-abyss"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  1. Dados Virtuais (4d6)
                </button>
                <button
                  type="button"
                  onClick={() => setRollMode("physical")}
                  className={`min-h-[40px] rounded-md px-3 text-xs font-semibold transition-colors ${
                    rollMode === "physical"
                      ? "bg-torch text-dungeon-abyss"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  2. Dados Físicos (3–18)
                </button>
              </div>
            </div>

            {rollMode === "virtual" && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-torch/30 bg-torch/10 p-3">
                <p className="text-xs text-slate-200">
                  <strong>Regra Oficial 4d6 Drop Lowest:</strong> O sistema rola
                  4 dados de 6 faces para cada atributo, descarta o menor dado e
                  soma os 3 maiores.
                </p>
                <button
                  type="button"
                  onClick={handleRollAllVirtual}
                  className="runic-button text-xs py-2"
                >
                  <Dices className="h-4 w-4" />
                  <span>Rolar Todos os 6 Atributos (4d6)</span>
                </button>
              </div>
            )}

            {rollMode === "physical" && (
              <div className="mt-4 rounded-lg border border-arcane/30 bg-arcane/10 p-3 text-xs text-slate-200">
                <strong>Modo Dados Físicos:</strong> Role seus dados reais na
                mesa física e digite os valores base obtidos (de 3 a 18) nos
                campos abaixo.
              </div>
            )}

            {/* Grid dos 6 Atributos */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ABILITY_META.map((ab) => {
                const baseVal = baseScores[ab.key];
                const racialMod = selectedRace.abilityModifiers[ab.key] ?? 0;
                const finalVal = finalScores[ab.key];
                const finalMod = calculateAbilityModifier(finalVal);
                const breakdown = virtualBreakdowns[ab.key];

                return (
                  <div
                    key={ab.key}
                    className="rounded-xl border border-stone-800 bg-dungeon-abyss/90 p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-torch-glow">
                            {ab.short}
                          </span>
                          <h3 className="font-display text-sm font-bold text-dungeon-parchment">
                            {ab.label}
                          </h3>
                        </div>

                        {/* Valor Final + Modificador */}
                        <div className="text-right">
                          <span className="block font-display text-2xl font-extrabold text-dungeon-parchment leading-none">
                            {finalVal}
                          </span>
                          <span
                            className={`inline-block mt-1 rounded px-1.5 py-0.5 font-mono text-xs font-bold ${
                              finalMod > 0
                                ? "bg-vital-deep/40 text-vital"
                                : finalMod < 0
                                ? "bg-crimson-blood/40 text-crimson-soft"
                                : "bg-stone-800 text-slate-300"
                            }`}
                          >
                            Mod {formatModifier(finalMod)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {ab.desc}
                      </p>
                    </div>

                    {/* Controles Virtuais vs Físicos */}
                    <div className="mt-3 pt-2.5 border-t border-stone-800/80">
                      {rollMode === "virtual" ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-mono text-slate-300">
                            <span>Base: {baseVal}</span>
                            {racialMod !== 0 && (
                              <span
                                className={
                                  racialMod > 0
                                    ? "text-vital ml-1"
                                    : "text-crimson-soft ml-1"
                                }
                              >
                                ({formatModifier(racialMod)} racial)
                              </span>
                            )}
                            {breakdown && (
                              <div className="mt-1 flex items-center gap-1">
                                {breakdown.rolls.map((dieVal, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-mono ${
                                      idx === breakdown.droppedIndex
                                        ? "border border-stone-800 bg-stone-900 text-slate-600 line-through"
                                        : "border border-torch/40 bg-torch/15 text-torch-glow font-bold"
                                    }`}
                                  >
                                    {dieVal}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRollSingleAbility(ab.key)}
                            className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-stone-700 bg-dungeon-stone px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-torch/60 active:scale-95"
                          >
                            <Dices className="h-3.5 w-3.5 text-torch-bright" />
                            <span>4d6</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs text-slate-300">
                            Dado Físico (3–18):
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={3}
                              max={18}
                              value={baseVal}
                              onChange={(e) =>
                                handlePhysicalInput(ab.key, e.target.value)
                              }
                              className="carved-input w-20 text-center font-mono font-bold py-1"
                            />
                            {racialMod !== 0 && (
                              <span className="text-xs font-mono text-slate-400">
                                {formatModifier(racialMod)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-700 bg-dungeon-stone px-4 py-2 text-xs font-semibold text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para Classe
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="runic-button"
            >
              <span>Continuar para Perícias & Finalização</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          ETAPA 4: ANTECEDENTE, TENDÊNCIA, PERÍCIAS 3.5 E SALVAMENTO
      ==================================================================== */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Identidade, Tendência e Antecedente */}
            <div className="dungeon-panel p-4 sm:p-5 space-y-4">
              <h2 className="font-display text-base font-bold text-dungeon-parchment">
                Identidade, Tendência & Antecedente
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome do Personagem
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Ex: Krusk, ${selectedRace.name} ${selectedClass.name}`}
                  className="carved-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tendência (Alinhamento 3.5)
                  </label>
                  <select
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
                    className="carved-input"
                  >
                    {ALIGNMENTS.map((al) => (
                      <option key={al.code} value={al.code}>
                        {al.code} — {al.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Divindade Patrona
                  </label>
                  <input
                    type="text"
                    value={deity}
                    onChange={(e) => setDeity(e.target.value)}
                    placeholder="Ex: Pelor, Moradin, Heironeous, Boccob"
                    className="carved-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Antecedente & Equipamento Inicial
                </label>
                <div className="space-y-2">
                  {BACKGROUNDS_35.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setBackgroundId(bg.id)}
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        backgroundId === bg.id
                          ? "border-torch-bright bg-torch/15"
                          : "border-stone-800 bg-dungeon-abyss/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dungeon-parchment">
                          {bg.name}
                        </span>
                        <span className="text-[11px] font-semibold text-torch-glow">
                          {bg.bonusFeat}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Itens: {bg.gear}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seleção de Perícias de Classe (Graduações Nv 1) */}
            <div className="dungeon-panel p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-dungeon-parchment">
                    Perícias de Classe ({selectedClass.name})
                  </h2>
                  <span className="rounded border border-torch/40 bg-torch/10 px-2 py-0.5 text-xs font-mono font-bold text-torch-glow">
                    {selectedSkills.length} / {maxFullRankSkills} selecionadas
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Você possui <strong>{totalSkillPointsLevel1} pontos</strong>{" "}
                  de perícia no 1º nível. Selecione até{" "}
                  <strong>{maxFullRankSkills} perícias</strong> para receber
                  graduação máxima inicial (4 graduações):
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {DND_SKILLS.filter((s) =>
                    selectedClass.classSkills.includes(s.id)
                  ).map((skill) => {
                    const isPicked = selectedSkills.includes(skill.id);
                    const abMod = calculateAbilityModifier(
                      finalScores[skill.ability]
                    );
                    const racial = selectedRace.skillBonuses[skill.id] ?? 0;
                    const totalMod = (isPicked ? 4 : 0) + abMod + racial;

                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkillSelection(skill.id)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                          isPicked
                            ? "border-torch-bright bg-torch/20 text-dungeon-parchment"
                            : "border-stone-800 bg-dungeon-abyss/80 text-slate-300"
                        }`}
                      >
                        <span className="truncate pr-2">
                          {skill.name}{" "}
                          <span className="text-[10px] text-slate-500">
                            ({skill.abilityShort})
                          </span>
                        </span>
                        <span className="font-mono font-bold text-torch-glow shrink-0">
                          {formatModifier(totalMod)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resumo Final Calculado Antes de Salvar */}
              <div className="mt-4 rounded-xl border border-stone-800 bg-dungeon-abyss p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Resumo Calculado da Ficha D&D 3.5 (Nível 1):
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded border border-stone-800 bg-dungeon-stone p-2">
                    <span className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                      <Heart className="h-3 w-3 text-crimson-soft" /> PV Máximo
                    </span>
                    <span className="font-mono text-base font-bold text-vital">
                      {Math.max(
                        1,
                        selectedClass.hitDie +
                          calculateAbilityModifier(finalScores.constitution)
                      )}
                    </span>
                  </div>
                  <div className="rounded border border-stone-800 bg-dungeon-stone p-2">
                    <span className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                      <Shield className="h-3 w-3 text-torch-bright" /> BBA Nv 1
                    </span>
                    <span className="font-mono text-base font-bold text-torch-glow">
                      {formatModifier(
                        calculateBaseAttackBonus(
                          selectedClass.babProgression,
                          1
                        )
                      )}
                    </span>
                  </div>
                  <div className="rounded border border-stone-800 bg-dungeon-stone p-2">
                    <span className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                      <BookOpen className="h-3 w-3 text-arcane-bright" /> Ouro
                    </span>
                    <span className="font-mono text-base font-bold text-dungeon-parchment">
                      {selectedClass.startingGoldAverage} PO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-700 bg-dungeon-stone px-4 py-2 text-xs font-semibold text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para Atributos
            </button>

            <button
              type="button"
              onClick={handleCreateCharacter}
              className="runic-button px-6"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Forjar Personagem & Abrir Ficha 3.5</span>
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
