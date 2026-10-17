"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, RotateCcw, Sparkles, Skull } from "lucide-react";
import { rollPolyhedralDice } from "@/lib/dnd/rules";
import type { PolyhedralRollResult } from "@/lib/dnd/types";

const DICE_TYPES: PolyhedralRollResult["die"][] = [
  "d4",
  "d6",
  "d8",
  "d10",
  "d12",
  "d20",
  "d100",
];

const QUICK_MODS = [-2, -1, 0, 1, 2, 3, 4, 5, 8];

export function FloatingDiceRoller() {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState<PolyhedralRollResult[]>([]);

  function handleRoll(die: PolyhedralRollResult["die"]) {
    const result = rollPolyhedralDice(die, count, modifier);
    setHistory((prev) => [result, ...prev.slice(0, 19)]);
  }

  const latest = history[0];

  return (
    <>
      {/* Botão Flutuante de Acesso Rápido com o Ícone Oficial d20 */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir Rolador de Dados d20"
        className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 flex h-13 w-13 md:h-14 md:w-14 items-center justify-center rounded-full border-2 border-torch-bright bg-dungeon-stone p-2 shadow-torch-glow transition-transform hover:scale-105 active:scale-95"
      >
        <Image
          src="/d20-icon.png"
          alt="Rolar Dados d20"
          width={36}
          height={36}
          className="h-8 w-8 object-contain"
        />
      </button>

      {/* Drawer / Modal Leve para Celulares e Desktop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-stone-800 bg-dungeon-stone p-4 sm:p-5 shadow-dungeon-card pb-safe max-h-[88dvh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/d20-icon.png"
                  alt="d20"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
                <h2 className="font-display text-base font-bold text-dungeon-parchment">
                  Rolador de Dados — Dragões & Masmorras
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-800 bg-dungeon-abyss text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Controles de Quantidade e Modificador */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Quantidade de Dados
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`min-h-[40px] flex-1 rounded-lg border text-xs font-bold transition-colors ${
                        count === n
                          ? "border-torch-bright bg-torch/20 text-torch-glow"
                          : "border-stone-800 bg-dungeon-abyss text-slate-300"
                      }`}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Modificador ({modifier >= 0 ? `+${modifier}` : modifier})
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setModifier((m) => m - 1)}
                    className="min-h-[40px] px-3 rounded-lg border border-stone-800 bg-dungeon-abyss text-sm font-bold text-slate-200 active:bg-stone-800"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => setModifier(0)}
                    className="min-h-[40px] flex-1 rounded-lg border border-stone-800 bg-dungeon-abyss text-xs font-mono text-slate-300"
                  >
                    {modifier >= 0 ? `+${modifier}` : modifier}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModifier((m) => m + 1)}
                    className="min-h-[40px] px-3 rounded-lg border border-stone-800 bg-dungeon-abyss text-sm font-bold text-slate-200 active:bg-stone-800"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>

            {/* Atalhos Rápidos de Modificadores */}
            <div className="mt-2 flex flex-wrap gap-1">
              {QUICK_MODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModifier(m)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border ${
                    modifier === m
                      ? "border-torch-bright bg-torch/20 text-torch-glow"
                      : "border-stone-800/80 bg-dungeon-abyss/70 text-slate-400"
                  }`}
                >
                  {m >= 0 ? `+${m}` : m}
                </button>
              ))}
            </div>

            {/* Grid de Dados Poliédricos (Toque Rápido) */}
            <div className="mt-3 grid grid-cols-4 sm:grid-cols-7 gap-2">
              {DICE_TYPES.map((die) => (
                <button
                  key={die}
                  type="button"
                  onClick={() => handleRoll(die)}
                  className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl border font-mono text-sm font-bold transition-all active:scale-95 ${
                    die === "d20"
                      ? "border-torch-bright bg-gradient-to-b from-torch/30 to-torch/10 text-torch-glow shadow-torch-glow col-span-2 sm:col-span-1"
                      : "border-stone-800 bg-dungeon-abyss hover:border-stone-700 text-dungeon-parchment"
                  }`}
                >
                  <span>{count > 1 ? `${count}${die}` : die}</span>
                </button>
              ))}
            </div>

            {/* Resultado Principal em Destaque */}
            {latest && (
              <div
                className={`mt-3 rounded-xl border p-3.5 text-center ${
                  latest.isCriticalHit
                    ? "border-vital bg-vital-deep/30"
                    : latest.isCriticalFumble
                    ? "border-crimson bg-crimson-blood/40"
                    : "border-stone-800 bg-dungeon-abyss"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider text-slate-400">
                  {latest.isCriticalHit && (
                    <span className="inline-flex items-center gap-1 text-vital font-bold">
                      <Sparkles className="h-3.5 w-3.5" /> 20 Natural! Ameaça de Sucesso Decisivo!
                    </span>
                  )}
                  {latest.isCriticalFumble && (
                    <span className="inline-flex items-center gap-1 text-crimson-soft font-bold">
                      <Skull className="h-3.5 w-3.5" /> 1 Natural! Falha Automática!
                    </span>
                  )}
                  {!latest.isCriticalHit && !latest.isCriticalFumble && (
                    <span>
                      Rolagem: {latest.count}
                      {latest.die}
                      {latest.modifier !== 0
                        ? latest.modifier > 0
                          ? ` + ${latest.modifier}`
                          : ` - ${Math.abs(latest.modifier)}`
                        : ""}
                    </span>
                  )}
                </div>
                <div className="mt-1 font-display text-4xl font-extrabold text-dungeon-parchment">
                  {latest.total}
                </div>
                <div className="mt-1 text-xs font-mono text-slate-400">
                  Dados: [{latest.individualRolls.join(", ")}]{" "}
                  {latest.modifier !== 0 &&
                    `(${latest.modifier >= 0 ? `+${latest.modifier}` : latest.modifier})`}
                </div>
              </div>
            )}

            {/* Histórico da Sessão */}
            <div className="mt-3 flex-1 overflow-y-auto min-h-[90px] max-h-[160px] rounded-lg border border-stone-800/80 bg-dungeon-abyss/60 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Histórico da Sessão ({history.length})
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    <RotateCcw className="h-3 w-3" /> Limpar
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Toque em qualquer dado acima para rolar.
                </p>
              ) : (
                <ul className="space-y-1 text-xs font-mono">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded px-2 py-1 bg-dungeon-stone/70 border border-stone-800/50"
                    >
                      <span className="text-slate-300">
                        {item.count}
                        {item.die}
                        {item.modifier !== 0
                          ? item.modifier > 0
                            ? `+${item.modifier}`
                            : item.modifier
                          : ""}{" "}
                        <span className="text-slate-500">
                          [{item.individualRolls.join(",")}]
                        </span>
                      </span>
                      <span
                        className={`font-bold ${
                          item.isCriticalHit
                            ? "text-vital"
                            : item.isCriticalFumble
                            ? "text-crimson-soft"
                            : "text-torch-glow"
                        }`}
                      >
                        = {item.total}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
