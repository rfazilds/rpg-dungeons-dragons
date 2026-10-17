"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Swords,
  BookOpen,
  FileText,
  Calculator,
  ChevronRight,
  Shield,
  Heart,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import {
  loadStoredCharacters,
  type StoredCharacter35,
} from "@/lib/storage/characters-store";
import { DND_ADVENTURES } from "@/lib/dnd/data/adventures";
import { getRaceById } from "@/lib/dnd/data/races";
import { getClassById } from "@/lib/dnd/data/classes";

const CORE_BOOKS = [
  {
    title: "Livro do Jogador D&D 3.5",
    pages: "268 págs",
    file: "Livro do Jogador D&D 3.5.pdf",
    badge: "Regras de Personagem",
  },
  {
    title: "Livro do Mestre D&D 3.5",
    pages: "321 págs",
    file: "Livro do Mestre D&D 3.5.pdf",
    badge: "Encontros, XP & Tesouros",
  },
  {
    title: "Livro dos Monstros D&D 3.5",
    pages: "322 págs",
    file: "Livro dos Monstros D&D 3.5.pdf",
    badge: "Bestiário Canônico",
  },
  {
    title: "Ficha Oficial D&D 3.5",
    pages: "2 págs",
    file: "ficha-personagem-dnd-35.pdf",
    badge: "Planilha Oficial",
  },
];

export default function DashboardPage() {
  const [characters, setCharacters] = useState<StoredCharacter35[]>([]);

  useEffect(() => {
    setCharacters(loadStoredCharacters());
  }, []);

  return (
    <AppShell>
      {/* Banner Principal Responsivo */}
      <section className="dungeon-panel p-4 sm:p-6 border-torch/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-torch/40 bg-torch/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-torch-glow">
              <Image
                src="/d20-icon.png"
                alt="d20"
                width={14}
                height={14}
                className="h-3.5 w-3.5 object-contain"
              />
              Dragões & Masmorras • D&D Edição 3.5
            </span>
            <h1 className="mt-2 font-display text-xl sm:text-2xl font-bold text-dungeon-parchment">
              Salão da Guilda & Escudo do Mestre
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
              Gerencie suas fichas 3.5 interativas, crie personagens com o
              assistente inteligente de sinergias raciais ou conduza combates e
              aventuras pelo celular ou PC.
            </p>
          </div>

          <div className="flex flex-col xs:flex-row sm:flex-shrink-0 gap-2.5">
            <Link href="/characters/new" className="runic-button">
              <UserPlus className="h-4 w-4" />
              <span>+ Criar Personagem</span>
            </Link>
            <Link
              href="/dm"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-stone-700 bg-dungeon-slate px-4 py-2.5 text-sm font-semibold text-dungeon-parchment hover:border-torch/60 transition-colors"
            >
              <Swords className="h-4 w-4 text-torch-bright" />
              <span>Escudo do Mestre</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Atalhos Principais: Jogador vs Mestre */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Módulo A: Área do Jogador */}
        <section className="dungeon-panel p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-torch/40 bg-torch/15 text-torch-bright">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-dungeon-parchment">
                    Módulo do Jogador
                  </h2>
                  <p className="text-xs text-slate-400">
                    {characters.length} personagem(ns) pronto(s) para jogo
                  </p>
                </div>
              </div>
              <Link
                href="/characters"
                className="text-xs font-semibold text-torch-bright hover:underline inline-flex items-center gap-1"
              >
                Ver todos <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {characters.slice(0, 2).map((char) => {
                const race = getRaceById(char.race);
                const cls = getClassById(char.class);
                return (
                  <Link
                    key={char.id}
                    href={`/characters/${char.id}`}
                    className="flex items-center justify-between rounded-lg border border-stone-800 bg-dungeon-abyss/80 p-3 hover:border-torch/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-dungeon-parchment truncate">
                        {char.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {race?.name || char.race} • {cls?.name || char.class}{" "}
                        Nv. {char.level} ({char.alignment})
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-vital">
                        <Heart className="h-3.5 w-3.5" /> {char.currentHp}/
                        {char.maxHp}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-torch-glow">
                        <Shield className="h-3.5 w-3.5" /> CA {char.armorClass}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800/80 grid grid-cols-2 gap-2">
            <Link
              href="/characters"
              className="flex min-h-[42px] items-center justify-center rounded-lg border border-stone-800 bg-dungeon-abyss text-xs font-semibold text-slate-200 hover:border-stone-700"
            >
              Meus Personagens
            </Link>
            <Link
              href="/characters/new"
              className="flex min-h-[42px] items-center justify-center rounded-lg border border-torch/40 bg-torch/15 text-xs font-semibold text-torch-glow hover:bg-torch/25"
            >
              + Assistente 3.5
            </Link>
          </div>
        </section>

        {/* Card Módulo B: Apoio ao Mestre */}
        <section className="dungeon-panel p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-arcane/40 bg-arcane/15 text-arcane-bright">
                  <Swords className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-dungeon-parchment">
                    Escudo do Mestre (DM Screen)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Iniciativa, Calculadora ND/NE, Compêndio e 16 Aventuras
                  </p>
                </div>
              </div>
              <Link
                href="/dm"
                className="text-xs font-semibold text-arcane-bright hover:underline inline-flex items-center gap-1"
              >
                Abrir Escudo <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/dm?tab=tracker"
                className="rounded-lg border border-stone-800 bg-dungeon-abyss/80 p-3 hover:border-torch/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-torch-glow">
                  <Swords className="h-4 w-4" /> Rastreador de Iniciativa
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Ordem automática de turnos, rodadas, PV e condições.
                </p>
              </Link>

              <Link
                href="/dm?tab=calculator"
                className="rounded-lg border border-stone-800 bg-dungeon-abyss/80 p-3 hover:border-arcane/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-arcane-bright">
                  <Calculator className="h-4 w-4" /> Calculadora de Encontro 3.5
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Cálculo oficial de NE, dificuldade e XP por jogador.
                </p>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800/80 grid grid-cols-2 gap-2">
            <Link
              href="/dm?tab=adventures"
              className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-stone-800 bg-dungeon-abyss text-xs font-semibold text-slate-200 hover:border-stone-700"
            >
              <BookOpen className="h-3.5 w-3.5 text-torch-bright" />
              <span>16 Aventuras (N1–N20)</span>
            </Link>
            <Link
              href="/dm?tab=compendium"
              className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-arcane/40 bg-arcane/15 text-xs font-semibold text-arcane-bright hover:bg-arcane/25"
            >
              <span>Compêndio Monstros & Magias</span>
            </Link>
          </div>
        </section>
      </div>

      {/* Biblioteca de Manuais Canônicos em /assets */}
      <section className="mt-5 dungeon-panel p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h2 className="font-display text-base font-bold text-dungeon-parchment">
              Acervo Canônico D&D 3.5 (`/assets`)
            </h2>
            <p className="text-xs text-slate-400">
              Consulte os livros oficiais ou carregue qualquer uma das{" "}
              {DND_ADVENTURES.length} aventuras prontas no Escudo do Mestre.
            </p>
          </div>
          <Link
            href="/dm?tab=adventures"
            className="text-xs font-semibold text-torch-bright hover:underline"
          >
            Explorar as 16 Aventuras Prontas →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {CORE_BOOKS.map((book) => (
            <a
              key={book.file}
              href={`/api/pdf?file=${encodeURIComponent(book.file)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-lg border border-stone-800 bg-dungeon-abyss/80 p-3 hover:border-torch/50 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-700 bg-dungeon-stone text-torch-bright">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-torch-glow">
                  {book.badge}
                </span>
                <p className="text-xs font-semibold text-dungeon-parchment truncate">
                  {book.title}
                </p>
                <p className="text-[11px] text-slate-500">{book.pages} • PDF</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
