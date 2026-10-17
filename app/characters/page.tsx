"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  Shield,
  Heart,
  Swords,
  Trash2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import {
  loadStoredCharacters,
  deleteStoredCharacter,
  saveStoredCharacters,
  DEFAULT_DEMO_CHARACTERS,
  type StoredCharacter35,
} from "@/lib/storage/characters-store";
import { getRaceById } from "@/lib/dnd/data/races";
import { getClassById } from "@/lib/dnd/data/classes";
import {
  calculateAbilityModifier,
  calculateBaseSave,
  formatModifier,
} from "@/lib/dnd/rules";

export default function CharactersListPage() {
  const [characters, setCharacters] = useState<StoredCharacter35[]>([]);

  useEffect(() => {
    setCharacters(loadStoredCharacters());
  }, []);

  function handleDelete(id: string, name: string) {
    if (
      window.confirm(`Deseja realmente excluir a ficha de "${name}" da cripta?`)
    ) {
      const updated = deleteStoredCharacter(id);
      setCharacters(updated);
    }
  }

  function handleRestoreDefaults() {
    saveStoredCharacters(DEFAULT_DEMO_CHARACTERS);
    setCharacters(DEFAULT_DEMO_CHARACTERS);
  }

  return (
    <AppShell>
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-dungeon-parchment">
            Meus Personagens D&D 3.5
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Fichas interativas baseadas na planilha oficial D&D 3.5 com cálculo
            automático de modificadores, BBA, TRs e perícias.
          </p>
        </div>

        <Link href="/characters/new" className="runic-button shrink-0">
          <UserPlus className="h-4 w-4" />
          <span>+ Criar Novo Personagem</span>
        </Link>
      </div>

      {/* Grid de Cartões de Personagens */}
      {characters.length === 0 ? (
        <div className="mt-6 dungeon-panel p-8 text-center">
          <p className="font-display text-base text-dungeon-parchment">
            Nenhum personagem registrado ainda.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Use o Assistente Inteligente 3.5 para criar seu primeiro herói ou
            restaure os personagens icônicos de demonstração.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/characters/new" className="runic-button">
              <UserPlus className="h-4 w-4" />
              <span>Criar Novo Personagem</span>
            </Link>
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-700 bg-dungeon-slate px-4 py-2 text-xs font-semibold text-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar Tordek & Mialee</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => {
            const race = getRaceById(char.race);
            const cls = getClassById(char.class);
            const hpPercent = Math.max(
              0,
              Math.min(100, Math.round((char.currentHp / char.maxHp) * 100))
            );

            const fortSave =
              (cls ? calculateBaseSave(cls.saves.fortitude, char.level) : 0) +
              calculateAbilityModifier(char.constitution) +
              char.fortitudeMisc;
            const refSave =
              (cls ? calculateBaseSave(cls.saves.reflex, char.level) : 0) +
              calculateAbilityModifier(char.dexterity) +
              char.reflexMisc;
            const willSave =
              (cls ? calculateBaseSave(cls.saves.will, char.level) : 0) +
              calculateAbilityModifier(char.wisdom) +
              char.willMisc;

            return (
              <article
                key={char.id}
                className="dungeon-panel p-4 sm:p-5 flex flex-col justify-between hover:border-torch/50 transition-colors"
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded border border-torch/40 bg-torch/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-torch-glow">
                        Nível {char.level} • {char.alignment}
                      </span>
                      <h2 className="mt-1.5 font-display text-lg font-bold text-dungeon-parchment">
                        {char.name}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {race?.name || char.race} • {cls?.name || char.class}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(char.id, char.name)}
                      aria-label={`Excluir ${char.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-800 bg-dungeon-abyss text-slate-500 hover:border-crimson/60 hover:text-crimson-soft transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Barra de PV e CA */}
                  <div className="mt-4 rounded-lg border border-stone-800 bg-dungeon-abyss/90 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                        <Heart className="h-3.5 w-3.5 text-crimson-soft" />{" "}
                        Pontos de Vida (PV)
                      </span>
                      <span className="font-mono font-bold text-dungeon-parchment">
                        {char.currentHp} / {char.maxHp}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-800">
                      <div
                        className={`h-full transition-all ${
                          hpPercent <= 25
                            ? "bg-crimson-soft"
                            : hpPercent <= 50
                            ? "bg-torch-bright"
                            : "bg-vital"
                        }`}
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 pt-2.5 border-t border-stone-800/80 text-center">
                      <div>
                        <span className="block text-[10px] uppercase text-slate-400">
                          CA (Toque/Surp)
                        </span>
                        <span className="font-mono text-sm font-bold text-torch-glow">
                          {char.armorClass}{" "}
                          <span className="text-[11px] font-normal text-slate-400">
                            ({char.touchArmorClass}/{char.flatFootedArmorClass})
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase text-slate-400">
                          BBA
                        </span>
                        <span className="font-mono text-sm font-bold text-dungeon-parchment">
                          {formatModifier(char.baseAttackBonus)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase text-slate-400">
                          Fort / Ref / Von
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-200">
                          {formatModifier(fortSave)}/{formatModifier(refSave)}/
                          {formatModifier(willSave)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Resumo dos 6 Atributos */}
                  <div className="mt-3 grid grid-cols-6 gap-1 text-center">
                    {[
                      { label: "FOR", val: char.strength },
                      { label: "DES", val: char.dexterity },
                      { label: "CON", val: char.constitution },
                      { label: "INT", val: char.intelligence },
                      { label: "SAB", val: char.wisdom },
                      { label: "CAR", val: char.charisma },
                    ].map((ab) => (
                      <div
                        key={ab.label}
                        className="rounded border border-stone-800/90 bg-dungeon-abyss/70 py-1"
                      >
                        <span className="block text-[9px] font-semibold text-slate-400">
                          {ab.label}
                        </span>
                        <span className="font-mono text-xs font-bold text-dungeon-parchment">
                          {ab.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botão Abrir Ficha Completa */}
                <div className="mt-4 pt-3 border-t border-stone-800/80">
                  <Link
                    href={`/characters/${char.id}`}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-torch/40 bg-torch/15 px-3 py-2 text-xs font-semibold text-torch-glow hover:bg-torch/25 transition-colors"
                  >
                    <Swords className="h-4 w-4" />
                    <span>Abrir Ficha Interativa 3.5</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
