"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Users,
  UserPlus,
  Swords,
  BookOpen,
  Compass,
  LogOut,
} from "lucide-react";
import { FloatingDiceRoller } from "@/components/dice/floating-dice-roller";
import { AppFooter } from "@/components/navigation/app-footer";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Salão Principal",
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
  const router = useRouter();

  async function handleLogout() {
    document.cookie =
      "sanctum_mesa_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    await signOut({ redirect: false });
    router.push("/");
  }

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-dungeon-abyss text-dungeon-parchment">
      {/* Top Bar Compacta Mobile */}
      <header className="sticky top-0 z-30 flex md:hidden items-center justify-between border-b border-stone-800/90 bg-dungeon-abyss/95 px-3.5 py-2">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/d20-icon.png"
            alt="d20"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <div>
            <span className="font-display text-xs font-bold tracking-wider text-dungeon-parchment">
              DRAGÕES & MASMORRAS
            </span>
            <span className="block text-[10px] text-slate-400 leading-none">
              Sistema D&D v.3.5
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-800 bg-dungeon-stone px-2.5 py-1.5 text-xs text-slate-300 active:bg-stone-800"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-stone-800/90 bg-dungeon-stone/90">
        <div className="px-4 py-4 border-b border-stone-800 text-center">
          <Link href="/dashboard" className="block">
            <Image
              src="/Dungeons-Dragons-Logo-2000.png"
              alt="Dragões & Masmorras"
              width={220}
              height={67}
              className="mx-auto w-48 h-auto drop-shadow-[0_4px_12px_rgba(217,119,6,0.3)]"
            />
            <div className="mt-2 inline-flex items-center justify-center gap-1.5">
              <Image
                src="/d20-icon.png"
                alt="d20"
                width={18}
                height={18}
                className="h-4 w-4 object-contain"
              />
              <span className="font-display text-xs font-bold tracking-wider text-dungeon-parchment">
                DRAGÕES & MASMORRAS
              </span>
            </div>
          </Link>
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
            <div className="flex items-center gap-2">
              <Image
                src="/d20-icon.png"
                alt="d20"
                width={20}
                height={20}
                className="h-5 w-5 object-contain shrink-0"
              />
              <p className="font-semibold text-dungeon-parchment">
                Acervo D&D 3.5 Ativo
              </p>
            </div>
            <p className="mt-1 text-[11px]">
              3 Livros Básicos + Ficha 3.5 + 16 Aventuras (N1–N20).
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-800 bg-dungeon-abyss px-3 py-2 text-xs font-medium text-slate-300 hover:border-stone-700 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Trocar Conta / Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal + Rodapé Institucional */}
      <main className="flex-1 flex flex-col justify-between md:pl-64 pb-24 md:pb-0">
        <div className="mx-auto w-full max-w-6xl px-3.5 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
        <AppFooter className="mt-8" />
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
