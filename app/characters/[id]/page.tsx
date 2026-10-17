"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Heart,
  Swords,
  Dices,
  Sparkles,
  Backpack,
  ScrollText,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import {
  loadStoredCharacters,
  updateStoredCharacter,
  type StoredCharacter35,
} from "@/lib/storage/characters-store";
import { getRaceById } from "@/lib/dnd/data/races";
import { getClassById } from "@/lib/dnd/data/classes";
import { DND_SKILLS } from "@/lib/dnd/data/skills";
import {
  calculateAbilityModifier,
  calculateBaseAttackBonus,
  calculateBaseSave,
  calculateGrappleModifier,
  calculateMaxSkillRanks,
  formatIterativeAttackBonus,
  formatModifier,
  rollPolyhedralDice,
} from "@/lib/dnd/rules";

export default function InteractiveCharacterSheetPage() {
  const params = useParams<{ id: string }>();
  const [character, setCharacter] = useState<StoredCharacter35 | null>(null);
  const [activeTab, setActiveTab] = useState<
    "combat" | "skills" | "spells" | "gear"
  >("combat");
  const [rollBanner, setRollBanner] = useState<{
    title: string;
    d20: number;
    mod: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const all = loadStoredCharacters();
    const found = all.find((c) => c.id === params.id) || all[0] || null;
    setCharacter(found);
  }, [params.id]);

  if (!character) {
    return (
      <AppShell>
        <div className="dungeon-panel p-6 text-center">
          <p className="text-sm text-slate-400">Carregando ficha D&D 3.5...</p>
        </div>
      </AppShell>
    );
  }

  const race = getRaceById(character.race);
  const cls = getClassById(character.class);

  const strMod = calculateAbilityModifier(character.strength);
  const dexMod = calculateAbilityModifier(character.dexterity);
  const conMod = calculateAbilityModifier(character.constitution);
  const intMod = calculateAbilityModifier(character.intelligence);
  const wisMod = calculateAbilityModifier(character.wisdom);
  const chaMod = calculateAbilityModifier(character.charisma);

  const bab = cls
    ? calculateBaseAttackBonus(cls.babProgression, character.level)
    : character.baseAttackBonus;

  const grappleTotal = calculateGrappleModifier(
    bab,
    character.strength,
    character.size
  );

  const fortBase = cls
    ? calculateBaseSave(cls.saves.fortitude, character.level)
    : 0;
  const refBase = cls
    ? calculateBaseSave(cls.saves.reflex, character.level)
    : 0;
  const willBase = cls
    ? calculateBaseSave(cls.saves.will, character.level)
    : 0;

  const fortTotal = fortBase + conMod + character.fortitudeMisc;
  const refTotal = refBase + dexMod + character.reflexMisc;
  const willTotal = willBase + wisMod + character.willMisc;

  function saveChar(next: StoredCharacter35) {
    setCharacter(next);
    updateStoredCharacter(next);
  }

  function handleHpDelta(delta: number) {
    if (!character) return;
    const nextHp = Math.max(
      -10, // Regra D&D 3.5: Morte em -10 PV
      Math.min(character.maxHp, character.currentHp + delta)
    );
    saveChar({ ...character, currentHp: nextHp });
  }

  function handleLevelChange(nextLevel: number) {
    if (!character || !cls) return;
    const clamped = Math.max(1, Math.min(20, nextLevel));
    const nextBab = calculateBaseAttackBonus(cls.babProgression, clamped);
    const avgHpPerLevel = Math.floor(cls.hitDie / 2) + 1 + conMod;
    const nextMaxHp = Math.max(
      1,
      cls.hitDie + conMod + (clamped - 1) * Math.max(1, avgHpPerLevel)
    );
    saveChar({
      ...character,
      level: clamped,
      baseAttackBonus: nextBab,
      maxHp: nextMaxHp,
      currentHp: nextMaxHp,
    });
  }

  function triggerD20Check(title: string, mod: number) {
    const res = rollPolyhedralDice("d20", 1, mod, title);
    setRollBanner({
      title,
      d20: res.individualRolls[0],
      mod,
      total: res.total,
    });
  }

  function handleSkillRankDelta(skillId: string, delta: number) {
    if (!character || !cls) return;
    const isClassSkill = cls.classSkills.includes(skillId);
    const maxRanks = calculateMaxSkillRanks(character.level, isClassSkill);
    const currentEntry = character.skills[skillId] || {
      ranks: 0,
      isClassSkill,
      miscMod: race?.skillBonuses[skillId] ?? 0,
    };
    const nextRanks = Math.max(
      0,
      Math.min(maxRanks, currentEntry.ranks + delta)
    );
    saveChar({
      ...character,
      skills: {
        ...character.skills,
        [skillId]: {
          ...currentEntry,
          ranks: nextRanks,
        },
      },
    });
  }

  function toggleSpellSlot(
    circleKey: keyof StoredCharacter35["spellSlots"],
    delta: number
  ) {
    if (!character) return;
    const slot = character.spellSlots[circleKey];
    const nextUsed = Math.max(0, Math.min(slot.max, slot.used + delta));
    saveChar({
      ...character,
      spellSlots: {
        ...character.spellSlots,
        [circleKey]: {
          ...slot,
          used: nextUsed,
        },
      },
    });
  }

  return (
    <AppShell>
      {/* Topo da Ficha: Identidade e Nível */}
      <div className="dungeon-panel p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Link
              href="/characters"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-torch-glow mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Meus Personagens
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-dungeon-parchment">
                {character.name}
              </h1>
              <span className="rounded border border-torch/40 bg-torch/15 px-2 py-0.5 text-xs font-semibold text-torch-glow">
                {character.alignment}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              {race?.name || character.race} ({character.size},{" "}
              {character.speed}) • {cls?.name || character.class} (DV d
              {cls?.hitDie || 8}) • Divindade: {character.deity || "—"}
            </p>
          </div>

          {/* Controle Rápido de Nível (1 a 20) */}
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-stone-800 bg-dungeon-abyss p-2">
            <span className="text-xs font-semibold text-slate-400 px-1">
              Nível:
            </span>
            <button
              type="button"
              onClick={() => handleLevelChange(character.level - 1)}
              className="h-8 w-8 rounded border border-stone-700 bg-dungeon-stone font-bold text-slate-200 active:scale-95"
            >
              -
            </button>
            <span className="w-7 text-center font-mono text-base font-bold text-torch-glow">
              {character.level}
            </span>
            <button
              type="button"
              onClick={() => handleLevelChange(character.level + 1)}
              className="h-8 w-8 rounded border border-stone-700 bg-dungeon-stone font-bold text-slate-200 active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Banner Instantâneo de Teste d20 */}
        {rollBanner && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-torch-bright bg-torch/15 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Dices className="h-4 w-4 text-torch-bright shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-dungeon-parchment">
                {rollBanner.title}:{" "}
                <strong className="text-torch-glow font-mono text-base">
                  {rollBanner.total}
                </strong>{" "}
                <span className="text-xs font-mono text-slate-300">
                  (d20 [{rollBanner.d20}] {formatModifier(rollBanner.mod)})
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRollBanner(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Abas Mobile-First para Navegação Limpa */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-lg border border-stone-800 bg-dungeon-abyss p-1">
          {[
            { id: "combat", label: "Combate & Atributos", icon: Swords },
            { id: "skills", label: "Perícias 3.5", icon: ScrollText },
            { id: "spells", label: "Magias & Slots", icon: Sparkles },
            { id: "gear", label: "Equipamento & Ouro", icon: Backpack },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id as "combat" | "skills" | "spells" | "gear")
                }
                className={`min-h-[42px] flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-torch text-dungeon-abyss shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          ABA 1: COMBATE, PV, CA, RESISTÊNCIAS E ATRIBUTOS (FRENTE DA FICHA 3.5)
      ==================================================================== */}
      {activeTab === "combat" && (
        <div className="mt-4 space-y-4">
          {/* Rastreador Dinâmico de PV e Defesa (CA Total / Toque / Surpresa) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Painel de Pontos de Vida (PV) */}
            <div className="dungeon-panel p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-crimson-soft">
                  <Heart className="h-4 w-4" /> Pontos de Vida (Ferimentos /
                  Atuais)
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Morte em -10 PV
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <span className="font-display text-3xl font-extrabold text-dungeon-parchment">
                    {character.currentHp}
                  </span>
                  <span className="font-mono text-lg text-slate-400">
                    {" "}
                    / {character.maxHp} PV
                  </span>
                  {character.currentHp <= 0 && (
                    <span className="ml-2 rounded bg-crimson px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      {character.currentHp === 0
                        ? "Incapacitado (0 PV)"
                        : character.currentHp > -10
                        ? "Morrendo!"
                        : "Morto (-10 PV)"}
                    </span>
                  )}
                </div>

                {/* Botões Rápidos de Dano e Cura (Toque 44px) */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleHpDelta(-5)}
                    className="min-h-[40px] px-2.5 rounded-lg border border-crimson/50 bg-crimson-blood/40 font-mono text-xs font-bold text-crimson-soft active:scale-95"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHpDelta(-1)}
                    className="min-h-[40px] px-2.5 rounded-lg border border-crimson/50 bg-crimson-blood/40 font-mono text-xs font-bold text-crimson-soft active:scale-95"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHpDelta(1)}
                    className="min-h-[40px] px-2.5 rounded-lg border border-vital/50 bg-vital-deep/40 font-mono text-xs font-bold text-vital active:scale-95"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHpDelta(5)}
                    className="min-h-[40px] px-2.5 rounded-lg border border-vital/50 bg-vital-deep/40 font-mono text-xs font-bold text-vital active:scale-95"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      saveChar({ ...character, currentHp: character.maxHp })
                    }
                    title="Descanso Completo"
                    className="min-h-[40px] px-2.5 rounded-lg border border-stone-700 bg-dungeon-abyss text-xs text-slate-300"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Painel de CA, Iniciativa, BBA e Agarrar */}
            <div className="dungeon-panel p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="rounded-lg border border-stone-800 bg-dungeon-abyss p-2.5">
                <span className="block text-[10px] font-semibold uppercase text-slate-400">
                  CA Total
                </span>
                <span className="font-display text-2xl font-extrabold text-torch-glow">
                  {character.armorClass}
                </span>
                <span className="block text-[10px] font-mono text-slate-400">
                  Toque {character.touchArmorClass} | Surp{" "}
                  {character.flatFootedArmorClass}
                </span>
              </div>

              <button
                type="button"
                onClick={() => triggerD20Check("Iniciativa", dexMod)}
                className="rounded-lg border border-stone-800 bg-dungeon-abyss p-2.5 hover:border-torch/50 active:scale-95"
              >
                <span className="block text-[10px] font-semibold uppercase text-slate-400">
                  Iniciativa 🎲
                </span>
                <span className="font-display text-2xl font-extrabold text-dungeon-parchment">
                  {formatModifier(dexMod)}
                </span>
                <span className="block text-[10px] text-torch-bright">
                  Toque p/ rolar
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  triggerD20Check("Ataque Corpo a Corpo", bab + strMod)
                }
                className="rounded-lg border border-stone-800 bg-dungeon-abyss p-2.5 hover:border-torch/50 active:scale-95"
              >
                <span className="block text-[10px] font-semibold uppercase text-slate-400">
                  BBA (3.5) 🎲
                </span>
                <span className="font-mono text-lg font-extrabold text-dungeon-parchment">
                  {formatIterativeAttackBonus(bab)}
                </span>
                <span className="block text-[10px] text-slate-400">
                  Desl. {character.speed}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  triggerD20Check("Manobra de Agarrar", grappleTotal)
                }
                className="rounded-lg border border-stone-800 bg-dungeon-abyss p-2.5 hover:border-torch/50 active:scale-95"
              >
                <span className="block text-[10px] font-semibold uppercase text-slate-400">
                  Agarrar 🎲
                </span>
                <span className="font-display text-2xl font-extrabold text-dungeon-parchment">
                  {formatModifier(grappleTotal)}
                </span>
                <span className="block text-[10px] text-slate-400">
                  BBA+For+Tam
                </span>
              </button>
            </div>
          </div>

          {/* Os 6 Atributos (Toque para rolar Teste de Habilidade d20) */}
          <div className="dungeon-panel p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
              Habilidades (Toque em qualquer atributo para rolar 1d20 + Mod)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { short: "FOR", name: "Força", val: character.strength, mod: strMod },
                { short: "DES", name: "Destreza", val: character.dexterity, mod: dexMod },
                { short: "CON", name: "Constituição", val: character.constitution, mod: conMod },
                { short: "INT", name: "Inteligência", val: character.intelligence, mod: intMod },
                { short: "SAB", name: "Sabedoria", val: character.wisdom, mod: wisMod },
                { short: "CAR", name: "Carisma", val: character.charisma, mod: chaMod },
              ].map((ab) => (
                <button
                  key={ab.short}
                  type="button"
                  onClick={() =>
                    triggerD20Check(`Teste de ${ab.name}`, ab.mod)
                  }
                  className="rounded-xl border border-stone-800 bg-dungeon-abyss p-3 text-center hover:border-torch/60 active:scale-95 transition-all"
                >
                  <span className="block text-[10px] font-bold tracking-wider text-torch-glow">
                    {ab.short} • {ab.name}
                  </span>
                  <span className="mt-1 block font-display text-2xl font-extrabold text-dungeon-parchment">
                    {ab.val}
                  </span>
                  <span className="mt-1 inline-block rounded bg-dungeon-stone px-2 py-0.5 font-mono text-xs font-bold text-slate-200 border border-stone-700">
                    {formatModifier(ab.mod)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Testes de Resistência D&D 3.5 (Fortitude, Reflexos e Vontade) & Ataques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="dungeon-panel p-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
                Testes de Resistência (D&D 3.5)
              </h2>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    name: "Fortitude",
                    sub: "Constituição",
                    total: fortTotal,
                    base: fortBase,
                    ab: conMod,
                  },
                  {
                    name: "Reflexos",
                    sub: "Destreza",
                    total: refTotal,
                    base: refBase,
                    ab: dexMod,
                  },
                  {
                    name: "Vontade",
                    sub: "Sabedoria",
                    total: willTotal,
                    base: willBase,
                    ab: wisMod,
                  },
                ].map((sv) => (
                  <button
                    key={sv.name}
                    type="button"
                    onClick={() =>
                      triggerD20Check(`Resistência de ${sv.name}`, sv.total)
                    }
                    className="rounded-xl border border-stone-800 bg-dungeon-abyss p-3 text-center hover:border-torch/60 active:scale-95"
                  >
                    <span className="block font-display text-xs font-bold text-dungeon-parchment">
                      {sv.name} 🎲
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      ({sv.sub})
                    </span>
                    <span className="mt-1 block font-mono text-2xl font-extrabold text-torch-glow">
                      {formatModifier(sv.total)}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400">
                      Base +{sv.base} | Hab {formatModifier(sv.ab)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Armas e Ataques */}
            <div className="dungeon-panel p-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
                Ataques & Sucesso Decisivo
              </h2>
              <div className="space-y-2">
                {character.attacks.map((atk) => {
                  const numericBonus = parseInt(atk.attackBonus, 10) || 0;
                  return (
                    <div
                      key={atk.id}
                      className="flex items-center justify-between rounded-lg border border-stone-800 bg-dungeon-abyss p-3"
                    >
                      <div>
                        <p className="font-semibold text-sm text-dungeon-parchment">
                          {atk.name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          Dano: <strong className="text-slate-200">{atk.damage}</strong>{" "}
                          | Decisivo: {atk.critical} | {atk.range}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          triggerD20Check(`Ataque (${atk.name})`, numericBonus)
                        }
                        className="min-h-[40px] rounded-lg border border-torch/40 bg-torch/15 px-3 py-1.5 font-mono text-xs font-bold text-torch-glow hover:bg-torch/25 active:scale-95"
                      >
                        Atacar {atk.attackBonus} 🎲
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Talentos e Habilidades Especiais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="dungeon-panel p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-torch-glow mb-2">
                Talentos (Feats D&D 3.5)
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {character.feats.map((feat) => (
                  <li
                    key={feat}
                    className="rounded border border-stone-800 bg-dungeon-abyss px-3 py-2 font-medium"
                  >
                    • {feat}
                  </li>
                ))}
              </ul>
            </div>

            <div className="dungeon-panel p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-torch-glow mb-2">
                Traços Raciais & Habilidades de Classe
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300 max-h-48 overflow-y-auto">
                {character.specialAbilities.map((spec) => (
                  <li
                    key={spec}
                    className="rounded border border-stone-800 bg-dungeon-abyss px-3 py-1.5"
                  >
                    • {spec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 2: PERÍCIAS POR GRADUAÇÃO D&D 3.5
      ==================================================================== */}
      {activeTab === "skills" && (
        <div className="mt-4 dungeon-panel p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-stone-800">
            <div>
              <h2 className="font-display text-base font-bold text-dungeon-parchment">
                Planilha de Perícias D&D 3.5
              </h2>
              <p className="text-xs text-slate-400">
                Graduação Máxima no Nível {character.level}:{" "}
                <strong className="text-torch-glow">
                  {calculateMaxSkillRanks(character.level, true)}
                </strong>{" "}
                (Perícia de Classe) |{" "}
                <strong>
                  {calculateMaxSkillRanks(character.level, false)}
                </strong>{" "}
                (Outra Classe). Toque no nome para rolar 1d20!
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {DND_SKILLS.map((skill) => {
              const isClassSkill =
                cls?.classSkills.includes(skill.id) ?? false;
              const entry = character.skills[skill.id] || {
                ranks: 0,
                isClassSkill,
                miscMod: race?.skillBonuses[skill.id] ?? 0,
              };
              const abScore = character[skill.ability];
              const abMod = calculateAbilityModifier(abScore);
              const totalMod =
                Math.floor(entry.ranks) + abMod + entry.miscMod;

              return (
                <div
                  key={skill.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                    entry.ranks > 0
                      ? "border-torch/40 bg-torch/10"
                      : "border-stone-800 bg-dungeon-abyss/80"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => triggerD20Check(skill.name, totalMod)}
                    className="flex-1 text-left pr-2 hover:text-torch-glow"
                  >
                    <span className="font-semibold text-dungeon-parchment">
                      {skill.name}
                    </span>{" "}
                    <span className="text-[10px] text-slate-400">
                      ({skill.abilityShort}
                      {skill.armorCheckPenalty ? "*" : ""})
                    </span>
                    {isClassSkill && (
                      <span className="ml-1.5 rounded bg-stone-800 px-1.5 py-0.5 text-[9px] text-torch-glow">
                        Classe
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSkillRankDelta(skill.id, -1)}
                        className="h-6 w-6 rounded border border-stone-700 bg-dungeon-stone text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono text-[11px] text-slate-300">
                        {entry.ranks}g
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSkillRankDelta(skill.id, 1)}
                        className="h-6 w-6 rounded border border-stone-700 bg-dungeon-stone text-xs font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => triggerD20Check(skill.name, totalMod)}
                      className="w-11 text-right font-mono text-sm font-bold text-torch-glow"
                    >
                      {formatModifier(totalMod)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 3: GRIMÓRIO E RASTREADOR DE SLOTS DE MAGIA (0º AO 9º CÍRCULO)
      ==================================================================== */}
      {activeTab === "spells" && (
        <div className="mt-4 dungeon-panel p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-stone-800">
            <div>
              <h2 className="font-display text-base font-bold text-dungeon-parchment">
                Grimório & Espaços de Magia por Círculo (D&D 3.5)
              </h2>
              <p className="text-xs text-slate-400">
                CD do Teste de Resistência contra suas Magias:{" "}
                <strong className="text-arcane-bright">
                  10 + Nível da Magia + Mod. de Habilidade Chave
                </strong>
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const
            ).map((circleKey) => {
              const slot = character.spellSlots[circleKey];
              const remaining = Math.max(0, slot.max - slot.used);
              return (
                <div
                  key={circleKey}
                  className="rounded-xl border border-stone-800 bg-dungeon-abyss p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-arcane-bright">
                        {circleKey === "0"
                          ? "0º Círculo (Truques / Orisons)"
                          : `${circleKey}º Círculo`}
                      </span>
                      <span className="rounded border border-arcane/40 bg-arcane-deep/50 px-2 py-0.5 font-mono text-xs text-arcane-bright">
                        CD {slot.saveDc}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Slots Disponíveis:
                      </span>
                      <span className="font-mono text-base font-bold text-dungeon-parchment">
                        {remaining} / {slot.max}
                      </span>
                    </div>

                    {slot.preparedOrKnown.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {slot.preparedOrKnown.map((sp) => (
                          <span
                            key={sp}
                            className="rounded border border-stone-700 bg-dungeon-stone px-2 py-0.5 text-[11px] text-slate-200"
                          >
                            {sp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSpellSlot(circleKey, 1)}
                      disabled={remaining === 0}
                      className="min-h-[38px] flex-1 rounded-lg border border-arcane/40 bg-arcane/15 text-xs font-semibold text-arcane-bright disabled:opacity-40"
                    >
                      Conjurar (-1 Slot)
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSpellSlot(circleKey, -1)}
                      disabled={slot.used === 0}
                      className="min-h-[38px] px-3 rounded-lg border border-stone-700 bg-dungeon-stone text-xs text-slate-300 disabled:opacity-40"
                    >
                      Recuperar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 4: EQUIPAMENTO, ARMADURA, TESOURO (PC, PP, PO, PL) E IDIOMAS
      ==================================================================== */}
      {activeTab === "gear" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="dungeon-panel p-4 sm:p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-dungeon-parchment">
              Moedas & Riqueza (Padrão D&D 3.5)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(
                [
                  { key: "pc", label: "PC (Cobre)" },
                  { key: "pp", label: "PP (Prata)" },
                  { key: "po", label: "PO (Ouro)" },
                  { key: "pl", label: "PL (Platina)" },
                ] as const
              ).map((coin) => (
                <div
                  key={coin.key}
                  className="rounded-lg border border-stone-800 bg-dungeon-abyss p-2.5 text-center"
                >
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                    {coin.label}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={character.equipment.currency[coin.key]}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      saveChar({
                        ...character,
                        equipment: {
                          ...character.equipment,
                          currency: {
                            ...character.equipment.currency,
                            [coin.key]: val,
                          },
                        },
                      });
                    }}
                    className="carved-input text-center font-mono font-bold py-1"
                  />
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-display text-sm font-bold text-torch-glow mb-2">
                Itens e Equipamentos na Mochila
              </h3>
              <ul className="space-y-1.5 text-xs">
                {character.equipment.armor && (
                  <li className="flex items-center justify-between rounded border border-torch/30 bg-torch/10 px-3 py-2 text-dungeon-parchment">
                    <span>
                      <strong>Armadura:</strong>{" "}
                      {character.equipment.armor.name} (+
                      {character.equipment.armor.acBonus} CA)
                    </span>
                    <span className="font-mono text-slate-400">
                      {character.equipment.armor.weight} kg
                    </span>
                  </li>
                )}
                {character.equipment.shield && (
                  <li className="flex items-center justify-between rounded border border-torch/30 bg-torch/10 px-3 py-2 text-dungeon-parchment">
                    <span>
                      <strong>Escudo:</strong> {character.equipment.shield.name}{" "}
                      (+{character.equipment.shield.acBonus} CA)
                    </span>
                    <span className="font-mono text-slate-400">
                      {character.equipment.shield.weight} kg
                    </span>
                  </li>
                )}
                {character.equipment.items.map((item, idx) => (
                  <li
                    key={`${item.name}-${idx}`}
                    className="flex items-center justify-between rounded border border-stone-800 bg-dungeon-abyss px-3 py-2 text-slate-300"
                  >
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono text-slate-500">
                      {item.weight} kg
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="dungeon-panel p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="font-display text-sm font-bold text-torch-glow mb-2">
                Idiomas Conhecidos
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {character.languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded border border-stone-700 bg-dungeon-abyss px-2.5 py-1 text-xs text-slate-200"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold text-torch-glow mb-2">
                Anotações de Campanha
              </h3>
              <textarea
                rows={5}
                value={character.notes}
                onChange={(e) =>
                  saveChar({ ...character, notes: e.target.value })
                }
                className="carved-input"
                placeholder="Registre relíquias, aliados, missões e tesouros..."
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
