"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Swords,
  Calculator,
  BookOpen,
  Search,
  Plus,
  Trash2,
  Play,
  Dices,
  ExternalLink,
  Shield,
  Heart,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DND_ADVENTURES } from "@/lib/dnd/data/adventures";
import {
  DND_MONSTERS,
  DND_SPELLS,
  type DndMonsterEntry,
} from "@/lib/dnd/data/compendium";
import {
  calculateEncounterDifficulty35,
  formatModifier,
} from "@/lib/dnd/rules";
import type { CombatantEntry } from "@/lib/db/schema";

const INITIAL_COMBATANTS: CombatantEntry[] = [
  {
    id: "c-tordek",
    name: "Tordek (Anão Guerreiro 1)",
    type: "player",
    initiative: 15,
    initiativeMod: 1,
    armorClass: 18,
    currentHp: 14,
    maxHp: 14,
    conditions: [],
  },
  {
    id: "c-mialee",
    name: "Mialee (Elfa Maga 1)",
    type: "player",
    initiative: 18,
    initiativeMod: 3,
    armorClass: 13,
    currentHp: 5,
    maxHp: 5,
    conditions: [],
  },
  {
    id: "c-hob1",
    name: "Assaltante Hobgoblin #1",
    type: "monster",
    initiative: 12,
    initiativeMod: 1,
    armorClass: 15,
    currentHp: 6,
    maxHp: 6,
    challengeRating: "1/2",
    conditions: [],
  },
  {
    id: "c-boss",
    name: "O Cavaleiro Sombrio (Bugbear Zumbi)",
    type: "monster",
    initiative: 8,
    initiativeMod: 0,
    armorClass: 16,
    currentHp: 42,
    maxHp: 42,
    challengeRating: "2",
    conditions: ["RD 5/cortante"],
  },
];

function DmScreenContent() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<
    "tracker" | "calculator" | "adventures" | "compendium"
  >(
    initialTabParam === "calculator" ||
      initialTabParam === "adventures" ||
      initialTabParam === "compendium"
      ? initialTabParam
      : "tracker"
  );

  // ==========================================================================
  // ESTADO 1: RASTREADOR DE INICIATIVA (COMBAT TRACKER)
  // ==========================================================================
  const [combatants, setCombatants] =
    useState<CombatantEntry[]>(INITIAL_COMBATANTS);
  const [round, setRound] = useState(1);
  const [turnIndex, setTurnIndex] = useState(0);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"player" | "monster">("monster");
  const [newInit, setNewInit] = useState("12");
  const [newAc, setNewAc] = useState("15");
  const [newHp, setNewHp] = useState("12");

  const sortedCombatants = useMemo(() => {
    return [...combatants].sort((a, b) => b.initiative - a.initiative);
  }, [combatants]);

  function handleAddCombatant(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const hpNum = Math.max(1, parseInt(newHp, 10) || 10);
    const acNum = Math.max(1, parseInt(newAc, 10) || 10);
    const initNum = parseInt(newInit, 10) || 10;

    setCombatants((prev) => [
      ...prev,
      {
        id: `cmb-${Date.now()}`,
        name: newName.trim(),
        type: newType,
        initiative: initNum,
        initiativeMod: 0,
        armorClass: acNum,
        currentHp: hpNum,
        maxHp: hpNum,
        conditions: [],
      },
    ]);
    setNewName("");
  }

  function handleNextTurn() {
    if (sortedCombatants.length === 0) return;
    if (turnIndex + 1 >= sortedCombatants.length) {
      setTurnIndex(0);
      setRound((r) => r + 1);
    } else {
      setTurnIndex((t) => t + 1);
    }
  }

  function handleRollAllInitiatives() {
    setCombatants((prev) =>
      prev.map((c) => ({
        ...c,
        initiative:
          Math.floor(Math.random() * 20) + 1 + (c.initiativeMod || 0),
      }))
    );
    setTurnIndex(0);
    setRound(1);
  }

  function handleCombatantHpDelta(id: string, delta: number) {
    setCombatants((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              currentHp: Math.max(-10, Math.min(c.maxHp, c.currentHp + delta)),
            }
          : c
      )
    );
  }

  function addMonsterFromCompendiumToTracker(monster: DndMonsterEntry) {
    const rolledInit =
      Math.floor(Math.random() * 20) + 1 + monster.initiative;
    const parsedAc = parseInt(monster.armorClass, 10) || 15;
    setCombatants((prev) => [
      ...prev,
      {
        id: `mon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: monster.name,
        type: "monster",
        initiative: rolledInit,
        initiativeMod: monster.initiative,
        armorClass: parsedAc,
        currentHp: monster.hp,
        maxHp: monster.hp,
        challengeRating: monster.challengeRating,
        conditions: [],
      },
    ]);
    setActiveTab("tracker");
  }

  // ==========================================================================
  // ESTADO 2: CALCULADORA DE ENCONTRO (ND / NE / XP D&D 3.5)
  // ==========================================================================
  const [partySize, setPartySize] = useState(4);
  const [partyLevel, setPartyLevel] = useState(1);
  const [encounterGroups, setEncounterGroups] = useState<
    Array<{ id: string; label: string; cr: string; count: number }>
  >([
    { id: "g1", label: "Assaltantes Hobgoblins", cr: "1/2", count: 2 },
    { id: "g2", label: "Aranha Monstruosa Média", cr: "1", count: 1 },
  ]);

  const encounterResult = useMemo(() => {
    return calculateEncounterDifficulty35({
      partySize,
      partyLevel,
      monsters: encounterGroups.map((g) => ({ cr: g.cr, count: g.count })),
    });
  }, [partySize, partyLevel, encounterGroups]);

  // ==========================================================================
  // ESTADO 3 & 4: AVENTURAS (N1-N20) E COMPÊNDIO RÁPIDO
  // ==========================================================================
  const [adventureFilter, setAdventureFilter] = useState<
    "all" | "low" | "mid" | "high"
  >("all");
  const [compendiumSearch, setCompendiumSearch] = useState("");
  const [compendiumType, setCompendiumType] = useState<"monsters" | "spells">(
    "monsters"
  );

  const filteredAdventures = useMemo(() => {
    return DND_ADVENTURES.filter((adv) => {
      if (adventureFilter === "low") return adv.recommendedLevel <= 3;
      if (adventureFilter === "mid")
        return adv.recommendedLevel >= 4 && adv.recommendedLevel <= 8;
      if (adventureFilter === "high") return adv.recommendedLevel >= 9;
      return true;
    });
  }, [adventureFilter]);

  const filteredMonsters = useMemo(() => {
    const q = compendiumSearch.trim().toLowerCase();
    if (!q) return DND_MONSTERS;
    return DND_MONSTERS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.sizeAndType.toLowerCase().includes(q) ||
        m.challengeRating.toLowerCase().includes(q)
    );
  }, [compendiumSearch]);

  const filteredSpells = useMemo(() => {
    const q = compendiumSearch.trim().toLowerCase();
    if (!q) return DND_SPELLS;
    return DND_SPELLS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.school.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q)
    );
  }, [compendiumSearch]);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Escudo do mestre" }]} />
      {/* Cabeçalho e Abas do Escudo do Mestre */}
      <div className="dungeon-panel p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-dungeon-parchment">
              Escudo do mestre D&D 3.5
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Rastreador de iniciativa, calculadora de encontros (ND/NE/XP), 16
              aventuras oficiais e compêndio rápido.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-lg border border-stone-800 bg-dungeon-abyss p-1">
          {[
            { id: "tracker", label: "Iniciativa", icon: Swords },
            { id: "calculator", label: "Calculadora ND/XP", icon: Calculator },
            { id: "adventures", label: "16 aventuras (PDF)", icon: BookOpen },
            { id: "compendium", label: "Compêndio 3.5", icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | "tracker"
                      | "calculator"
                      | "adventures"
                      | "compendium"
                  )
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
          ABA 1: RASTREADOR DE INICIATIVA (COMBAT TRACKER)
      ==================================================================== */}
      {activeTab === "tracker" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lista Ordenada de Combatentes */}
          <div className="lg:col-span-2 dungeon-panel p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-torch-glow">
                  Rodada atual: {round}
                </span>
                <h2 className="font-display text-base font-bold text-dungeon-parchment">
                  Ordem de iniciativa ({sortedCombatants.length} combatentes)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRollAllInitiatives}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-stone-700 bg-dungeon-abyss px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-torch/50"
                >
                  <Dices className="h-3.5 w-3.5 text-torch-bright" />
                  <span>Rolar iniciativas</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextTurn}
                  className="runic-button text-xs py-2"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Próximo turno</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {sortedCombatants.map((c, idx) => {
                const isCurrentTurn = idx === turnIndex;
                const isDead = c.currentHp <= 0;
                return (
                  <div
                    key={c.id}
                    className={`rounded-xl border p-3 transition-all ${
                      isCurrentTurn
                        ? "border-torch-bright bg-torch/15 shadow-torch-glow"
                        : isDead
                        ? "border-crimson/40 bg-crimson-blood/20 opacity-75"
                        : "border-stone-800 bg-dungeon-abyss/90"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-stone-700 bg-dungeon-stone font-mono">
                          <span className="text-[9px] uppercase text-slate-400">
                            Inic
                          </span>
                          <span className="text-sm font-bold text-torch-glow">
                            {c.initiative}
                          </span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-sm text-dungeon-parchment">
                              {c.name}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                c.type === "player"
                                  ? "bg-vital-deep/50 text-vital border border-vital/30"
                                  : "bg-crimson-blood/50 text-crimson-soft border border-crimson/30"
                              }`}
                            >
                              {c.type === "player"
                                ? "Herói PJ"
                                : `Monstro${
                                    c.challengeRating
                                      ? ` ND ${c.challengeRating}`
                                      : ""
                                  }`}
                            </span>
                            {isCurrentTurn && (
                              <span className="rounded bg-torch px-1.5 py-0.5 text-[10px] font-bold text-dungeon-abyss">
                                Turno ativo
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs font-mono text-slate-400">
                            <span className="inline-flex items-center gap-1 text-slate-300">
                              <Shield className="h-3 w-3 text-torch-bright" />{" "}
                              CA {c.armorClass}
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-200">
                              <Heart className="h-3 w-3 text-crimson-soft" />{" "}
                              PV: {c.currentHp} / {c.maxHp}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controles Rápidos de Dano/Cura e Remoção */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleCombatantHpDelta(c.id, -5)}
                          className="h-8 px-2 rounded border border-crimson/40 bg-crimson-blood/30 font-mono text-xs font-bold text-crimson-soft"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCombatantHpDelta(c.id, -1)}
                          className="h-8 px-2 rounded border border-crimson/40 bg-crimson-blood/30 font-mono text-xs font-bold text-crimson-soft"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCombatantHpDelta(c.id, 1)}
                          className="h-8 px-2 rounded border border-vital/40 bg-vital-deep/30 font-mono text-xs font-bold text-vital"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCombatantHpDelta(c.id, 5)}
                          className="h-8 px-2 rounded border border-vital/40 bg-vital-deep/30 font-mono text-xs font-bold text-vital"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCombatants((prev) =>
                              prev.filter((item) => item.id !== c.id)
                            )
                          }
                          className="h-8 w-8 flex items-center justify-center rounded border border-stone-800 bg-dungeon-stone text-slate-500 hover:text-crimson-soft"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulário Rápido para Adicionar Combatente */}
          <div className="dungeon-panel p-4 sm:p-5 h-fit">
            <h3 className="font-display text-base font-bold text-dungeon-parchment">
              Adicionar combatente
            </h3>
            <p className="text-xs text-slate-400">
              Insira um jogador ou monstro manualmente ou adicione direto pelo
              compêndio 3.5.
            </p>

            <form onSubmit={handleAddCombatant} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Nome do combatente
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Ogro da Montanha"
                  className="carved-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewType("monster")}
                  className={`min-h-[38px] rounded-lg border text-xs font-semibold ${
                    newType === "monster"
                      ? "border-crimson bg-crimson-blood/40 text-crimson-soft"
                      : "border-stone-800 bg-dungeon-abyss text-slate-400"
                  }`}
                >
                  Monstro / PDM
                </button>
                <button
                  type="button"
                  onClick={() => setNewType("player")}
                  className={`min-h-[38px] rounded-lg border text-xs font-semibold ${
                    newType === "player"
                      ? "border-vital bg-vital-deep/40 text-vital"
                      : "border-stone-800 bg-dungeon-abyss text-slate-400"
                  }`}
                >
                  Jogador (PJ)
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Iniciativa
                  </label>
                  <input
                    type="number"
                    value={newInit}
                    onChange={(e) => setNewInit(e.target.value)}
                    className="carved-input text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    CA
                  </label>
                  <input
                    type="number"
                    value={newAc}
                    onChange={(e) => setNewAc(e.target.value)}
                    className="carved-input text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    PV máx
                  </label>
                  <input
                    type="number"
                    value={newHp}
                    onChange={(e) => setNewHp(e.target.value)}
                    className="carved-input text-center font-mono"
                  />
                </div>
              </div>

              <button type="submit" className="runic-button w-full">
                <Plus className="h-4 w-4" />
                <span>Inserir na iniciativa</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 2: CALCULADORA DE DIFICULDADE DE ENCONTRO (LIVRO DO MESTRE 3.5)
      ==================================================================== */}
      {activeTab === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 dungeon-panel p-4 sm:p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-dungeon-parchment">
              Configuração do grupo e monstros (regra D&D 3.5)
            </h2>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-stone-800 bg-dungeon-abyss p-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantidade de jogadores (PJs)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={partySize}
                  onChange={(e) =>
                    setPartySize(Math.max(1, parseInt(e.target.value, 10) || 4))
                  }
                  className="carved-input font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nível médio do grupo (NEP: 1 a 20)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={partyLevel}
                  onChange={(e) =>
                    setPartyLevel(
                      Math.max(
                        1,
                        Math.min(20, parseInt(e.target.value, 10) || 1)
                      )
                    )
                  }
                  className="carved-input font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Grupos de criaturas no encontro
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEncounterGroups((prev) => [
                      ...prev,
                      {
                        id: `eg-${Date.now()}`,
                        label: "Novo grupo de monstros",
                        cr: String(partyLevel),
                        count: 1,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-torch/40 bg-torch/15 px-2.5 py-1 text-xs font-semibold text-torch-glow"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar ND
                </button>
              </div>

              {encounterGroups.map((grp) => (
                <div
                  key={grp.id}
                  className="grid grid-cols-12 items-center gap-2 rounded-lg border border-stone-800 bg-dungeon-abyss p-2.5"
                >
                  <div className="col-span-5 sm:col-span-6">
                    <input
                      type="text"
                      value={grp.label}
                      onChange={(e) =>
                        setEncounterGroups((prev) =>
                          prev.map((item) =>
                            item.id === grp.id
                              ? { ...item, label: e.target.value }
                              : item
                          )
                        )
                      }
                      className="carved-input py-1.5 text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      value={grp.cr}
                      onChange={(e) =>
                        setEncounterGroups((prev) =>
                          prev.map((item) =>
                            item.id === grp.id
                              ? { ...item, cr: e.target.value }
                              : item
                          )
                        )
                      }
                      className="carved-input py-1.5 text-xs font-mono"
                    >
                      {[
                        "1/4",
                        "1/3",
                        "1/2",
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "10",
                        "12",
                        "13",
                        "15",
                        "20",
                      ].map((crOpt) => (
                        <option key={crOpt} value={crOpt}>
                          ND {crOpt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={grp.count}
                      onChange={(e) =>
                        setEncounterGroups((prev) =>
                          prev.map((item) =>
                            item.id === grp.id
                              ? {
                                  ...item,
                                  count: Math.max(
                                    1,
                                    parseInt(e.target.value, 10) || 1
                                  ),
                                }
                              : item
                          )
                        )
                      }
                      className="carved-input py-1.5 text-center font-mono text-xs"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setEncounterGroups((prev) =>
                          prev.filter((item) => item.id !== grp.id)
                        )
                      }
                      className="h-8 w-8 flex items-center justify-center rounded border border-stone-800 text-slate-400 hover:text-crimson-soft"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resultado do Cálculo Oficial D&D 3.5 */}
          <div className="dungeon-panel p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-arcane-bright">
                Resultado do Livro do Mestre 3.5
              </span>
              <h3 className="mt-1 font-display text-lg font-bold text-dungeon-parchment">
                Classificação: {encounterResult.difficulty}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {encounterResult.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2.5 text-center">
                <div className="rounded-xl border border-stone-800 bg-dungeon-abyss p-3">
                  <span className="block text-[10px] uppercase text-slate-400">
                    Nível de encontro (NE)
                  </span>
                  <span className="font-display text-3xl font-extrabold text-torch-glow">
                    NE {encounterResult.encounterLevel}
                  </span>
                </div>
                <div className="rounded-xl border border-stone-800 bg-dungeon-abyss p-3">
                  <span className="block text-[10px] uppercase text-slate-400">
                    XP por jogador
                  </span>
                  <span className="font-display text-2xl font-extrabold text-vital">
                    {encounterResult.xpPerCharacter} XP
                  </span>
                  <span className="block text-[10px] font-mono text-slate-500">
                    Total: {encounterResult.totalXp} XP
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-stone-800 bg-dungeon-abyss/80 p-3 text-[11px] text-slate-400">
              Regra D&D 3.5: dobrar o número de criaturas de mesmo ND aumenta o
              nível de encontro (NE) em +2.
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 3: CATÁLOGO DAS 16 AVENTURAS PRONTAS (/assets/Aventuras)
      ==================================================================== */}
      {activeTab === "adventures" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-slate-300">
              Todos os <strong>16 módulos de aventura em PDF</strong> da pasta{" "}
              <code>/assets/Aventuras</code> organizados por nível:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "Todas (16)" },
                { id: "low", label: "Níveis 1 a 3" },
                { id: "mid", label: "Níveis 4 a 8" },
                { id: "high", label: "Níveis 9 a 20" },
              ].map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() =>
                    setAdventureFilter(flt.id as "all" | "low" | "mid" | "high")
                  }
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    adventureFilter === flt.id
                      ? "border-torch-bright bg-torch/20 text-torch-glow"
                      : "border-stone-800 bg-dungeon-stone text-slate-400"
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAdventures.map((adv) => {
              const relativeFile = adv.pdfPath.replace(/^\/assets\//, "");
              return (
                <article
                  key={adv.slug}
                  className="dungeon-panel p-4 sm:p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded border border-torch/40 bg-torch/15 px-2.5 py-0.5 font-mono text-xs font-bold text-torch-glow">
                        {adv.code} • {adv.levelRangeLabel}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {adv.pages} págs • {adv.partySize}
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-lg font-bold text-dungeon-parchment">
                      {adv.title}
                    </h3>
                    <p className="text-xs text-torch-bright">
                      Cenário: {adv.setting} • Autor: {adv.author}
                    </p>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      {adv.synopsis}
                    </p>

                    <div className="mt-3 rounded-lg border border-stone-800 bg-dungeon-abyss/90 p-2.5 text-xs">
                      <p className="text-slate-300">
                        <strong className="text-torch-glow">
                          Ameaças principais:
                        </strong>{" "}
                        {adv.keyMonsters.join(", ")}
                      </p>
                      <p className="mt-1 text-slate-300">
                        <strong className="text-crimson-soft">
                          Encontro final:
                        </strong>{" "}
                        {adv.bossEncounter}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                    <a
                      href={`/api/pdf?file=${encodeURIComponent(relativeFile)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="runic-button w-full text-xs"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Abrir aventura completa (PDF)</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 4: COMPÊNDIO RÁPIDO (MONSTROS & MAGIAS D&D 3.5)
      ==================================================================== */}
      {activeTab === "compendium" && (
        <div className="space-y-4">
          <div className="dungeon-panel p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={compendiumSearch}
                onChange={(e) => setCompendiumSearch(e.target.value)}
                placeholder="Buscar monstro (ex: Hobgoblin, Dragão, Ogro) ou magia (ex: Mísseis, Cura)..."
                className="carved-input pl-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-stone-800 bg-dungeon-abyss p-1 shrink-0">
              <button
                type="button"
                onClick={() => setCompendiumType("monsters")}
                className={`min-h-[38px] rounded px-3 text-xs font-semibold ${
                  compendiumType === "monsters"
                    ? "bg-torch text-dungeon-abyss"
                    : "text-slate-400"
                }`}
              >
                Monstros ({filteredMonsters.length})
              </button>
              <button
                type="button"
                onClick={() => setCompendiumType("spells")}
                className={`min-h-[38px] rounded px-3 text-xs font-semibold ${
                  compendiumType === "spells"
                    ? "bg-arcane text-dungeon-abyss"
                    : "text-slate-400"
                }`}
              >
                Magias ({filteredSpells.length})
              </button>
            </div>
          </div>

          {compendiumType === "monsters" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMonsters.map((m) => (
                <div
                  key={m.id}
                  className="dungeon-panel p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-bold text-dungeon-parchment">
                          {m.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {m.sizeAndType} • {m.sourcePage}
                        </p>
                      </div>
                      <span className="rounded border border-crimson/40 bg-crimson-blood/40 px-2 py-0.5 font-mono text-xs font-bold text-crimson-soft shrink-0">
                        ND {m.challengeRating}
                      </span>
                    </div>

                    <div className="mt-3 rounded-lg border border-stone-800 bg-dungeon-abyss p-2.5 space-y-1 text-xs">
                      <p>
                        <strong>DV / PV:</strong> {m.hitDice} ({m.hp} PV) |{" "}
                        <strong>Inic:</strong> {formatModifier(m.initiative)} |{" "}
                        <strong>Desl:</strong> {m.speed}
                      </p>
                      <p>
                        <strong>CA:</strong> {m.armorClass}
                      </p>
                      <p>
                        <strong>BBA / agarrar:</strong> {m.baseAttackGrapple}
                      </p>
                      <p>
                        <strong>Ataque:</strong> {m.attack}
                      </p>
                      <p>
                        <strong>Qualidades especiais:</strong>{" "}
                        {m.specialQualities}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400">
                        Fort {formatModifier(m.saves.fort)}, Ref{" "}
                        {formatModifier(m.saves.ref)}, Von{" "}
                        {formatModifier(m.saves.will)} | For {m.abilities.str},
                        Des {m.abilities.dex}, Con {m.abilities.con}, Int{" "}
                        {m.abilities.int}, Sab {m.abilities.wis}, Car{" "}
                        {m.abilities.cha}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => addMonsterFromCompendiumToTracker(m)}
                    className="mt-3 min-h-[40px] w-full rounded-lg border border-torch/40 bg-torch/15 text-xs font-semibold text-torch-glow hover:bg-torch/25"
                  >
                    + Enviar para rastreador de iniciativa
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSpells.map((sp) => (
                <div key={sp.id} className="dungeon-panel p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-bold text-arcane-bright flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        {sp.name}
                      </h3>
                      <p className="text-xs text-slate-400">{sp.school}</p>
                    </div>
                    <span className="rounded border border-arcane/40 bg-arcane-deep/50 px-2 py-0.5 font-mono text-xs text-arcane-bright">
                      {sp.levelLabel}
                    </span>
                  </div>

                  <div className="rounded-lg border border-stone-800 bg-dungeon-abyss p-2.5 text-xs space-y-1 text-slate-300">
                    <p>
                      <strong>Componentes:</strong> {sp.components} |{" "}
                      <strong>Tempo:</strong> {sp.castingTime}
                    </p>
                    <p>
                      <strong>Alcance:</strong> {sp.range} |{" "}
                      <strong>Duração:</strong> {sp.duration}
                    </p>
                    <p>
                      <strong>Resistência:</strong> {sp.savingThrow} |{" "}
                      <strong>RM:</strong> {sp.spellResistance}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {sp.summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DmScreenPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="dungeon-panel p-6 text-center text-xs text-slate-400">
            Carregando escudo do mestre...
          </div>
        }
      >
        <DmScreenContent />
      </Suspense>
    </AppShell>
  );
}
