"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Users,
  UserPlus,
  Swords,
  BookOpen,
  Compass,
  LogOut,
} from "lucide-react";
import { FloatingDiceRoller } from "@/components/dice/floating-dice-roller";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Salão",
    shortLabel: "Salão",
    icon: Compass,
  },
  {
    href: "/characters",
    label: "Meus Personagens",
    shortLabel: "Heróis",
    icon: Users,
  },
  {
    href: "/characters/new",
    label: "Criar Personagem",
    shortLabel: "Criar PJ",
    icon: UserPlus,
  },
  {
    href: "/dm",
    label: "Escudo do Mestre",
    shortLabel: "Mestre",
    icon: Swords,
  },
  {
    href: "/dm?tab=adventures",
    label: "Aventuras (N1-N20)",
    shortLabel: "Aventuras",
    icon: BookOpen,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-dungeon-abyss text-dungeon-parchment">
      {/* Top Bar Compacta Mobile */}
      <header className="sticky top-0 z-30 flex md:hidden items-center justify-between border-b border-stone-800/90 bg-dungeon-abyss/95 px-4 py-2.5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-torch/40 bg-torch/15 text-torch-bright">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="font-display text-sm font-bold tracking-wider text-dungeon-parchment">
              SANCTUM 3.5
            </span>
            <span className="block text-[10px] text-slate-400 leading-none">
              Dungeons & Dragons v.3.5
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-lg border border-stone-800 bg-dungeon-stone px-2.5 py-1.5 text-xs text-slate-300 active:bg-stone-800"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair</span>
        </Link>
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-stone-800/90 bg-dungeon-stone/90">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-stone-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-torch/50 bg-torch/15 text-torch-bright shadow-torch-glow">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold tracking-wider text-dungeon-parchment">
              SANCTUM 3.5
            </h1>
            <p className="text-xs text-slate-400">Grimório & Escudo D&D</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                !item.href.includes("?") &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-torch/20 text-torch-glow border border-torch/40"
                    : "text-slate-300 hover:bg-dungeon-slate hover:text-white border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-800 p-4">
          <div className="rounded-lg border border-stone-800 bg-dungeon-abyss/80 p-3 text-xs text-slate-400">
            <p className="font-semibold text-dungeon-parchment">
              Acervo Canônico D&D 3.5
            </p>
            <p className="mt-0.5 text-[11px]">
              3 Livros Básicos + Ficha 3.5 + 16 Aventuras (N1–N20) ativos.
            </p>
          </div>
          <Link
            href="/"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-800 bg-dungeon-abyss px-3 py-2 text-xs font-medium text-slate-300 hover:border-stone-700 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Trocar Conta / Sair</span>
          </Link>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 md:pl-64 pb-24 md:pb-10">
        <div className="mx-auto max-w-6xl px-3.5 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </main>

      {/* Barra de Navegação Inferior Fixa para Todos os Celulares */}
      <nav
        aria-label="Navegação Mobile"
        className="fixed bottom-0 inset-x-0 z-30 flex md:hidden items-center justify-around border-t border-stone-800 bg-dungeon-abyss/95 px-1 py-1 pb-safe"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-lg px-1 py-1 text-[11px] font-medium transition-colors ${
                active ? "text-torch-glow" : "text-slate-400 active:text-white"
              }`}
            >
              <Icon className="h-4 w-4 mb-0.5" />
              <span className="truncate max-w-[68px]">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rolador de Dados Integrado Flutuante */}
      <FloatingDiceRoller />
    </div>
  );
}
