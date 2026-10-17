"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Users,
  Swords,
  Shield,
  Compass,
  LogOut,
  Settings,
  UsersRound,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  ScrollText,
} from "lucide-react";
import { FloatingDiceRoller } from "@/components/dice/floating-dice-roller";
import { AppFooter } from "@/components/navigation/app-footer";
import { GuildAvatar } from "@/components/account/guild-avatar";
import { VerificationCodeInput } from "@/components/auth/verification-code-input";

const DESKTOP_NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Salão principal",
    icon: Compass,
  },
  {
    href: "/characters",
    label: "Meus personagens",
    icon: ScrollText,
  },
  {
    href: "/tables",
    label: "Mesas",
    icon: Swords,
    featured: true,
  },
  {
    href: "/dm-screen",
    label: "Escudo do mestre",
    icon: Shield,
    matchPrefixes: ["/dm-screen", "/dm"],
  },
  {
    href: "/community",
    label: "Comunidade e amigos",
    icon: UsersRound,
  },
  {
    href: "/settings",
    label: "Minha conta",
    icon: Settings,
    matchPrefixes: ["/settings", "/account"],
  },
];

const MOBILE_NAV_ITEMS = [
  {
    href: "/dashboard",
    shortLabel: "Salão",
    icon: Compass,
  },
  {
    href: "/characters",
    shortLabel: "Heróis",
    icon: ScrollText,
  },
  {
    href: "/tables",
    shortLabel: "Mesas",
    icon: Swords,
  },
  {
    href: "/dm-screen",
    shortLabel: "Mestre",
    icon: Shield,
    matchPrefixes: ["/dm-screen", "/dm"],
  },
  {
    href: "/community",
    shortLabel: "Guilda",
    icon: UsersRound,
  },
];

interface AccountSummary {
  id: string;
  username: string;
  name: string;
  email: string;
  emailVerified: string | null;
  image?: string | null;
  avatarType?: string | null;
  avatarUrl?: string | null;
  statusPresence?: string;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [devPreviewCode, setDevPreviewCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        if (active && data?.authenticated && data?.user) {
          setAccount(data.user);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleLogout() {
    document.cookie =
      "sanctum_mesa_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    await signOut({ redirect: false });
    router.push("/");
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setVerifying(true);
    setVerifyError(null);
    setVerifySuccess(null);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type: "REGISTER",
          email: account?.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Código inválido ou expirado.");
        setVerifying(false);
        return;
      }

      setVerifySuccess("E-mail confirmado com sucesso!");
      setAccount((prev) =>
        prev ? { ...prev, emailVerified: new Date().toISOString() } : prev
      );
      setTimeout(() => {
        setVerifyModalOpen(false);
        setVerifying(false);
        setCode("");
      }, 900);
    } catch {
      setVerifyError("Falha ao validar código.");
      setVerifying(false);
    }
  }

  async function handleResendVerificationCode() {
    if (cooldown > 0) return;
    setVerifyError(null);
    setVerifySuccess(null);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "REGISTER",
          email: account?.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.cooldownRemainingSeconds) {
          setCooldown(data.cooldownRemainingSeconds);
        }
        setVerifyError(data.error || "Aguarde antes de reenviar.");
        return;
      }

      if (data.devPreviewCode) {
        setDevPreviewCode(data.devPreviewCode);
      }
      setCooldown(60);
      setVerifySuccess(data.message || "Novo código enviado para seu e-mail!");
    } catch {
      setVerifyError("Não foi possível reenviar o código.");
    }
  }

  const showUnverifiedBanner = Boolean(account && !account.emailVerified);

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
              {account ? `@${account.username}` : "Sistema D&D v.3.5"}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-full border border-stone-800 bg-dungeon-stone p-0.5 pr-2.5 text-xs text-dungeon-parchment"
            title="Minha conta"
          >
            <GuildAvatar
              avatarType={account?.avatarType}
              avatarUrl={account?.avatarUrl}
              oauthImage={account?.image}
              name={account?.name}
              size="sm"
            />
            <span className="max-w-[75px] truncate text-[11px] font-medium">
              {account ? account.name.split(" ")[0] : "Conta"}
            </span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-lg border border-stone-800 bg-dungeon-stone p-2 text-xs text-slate-300 active:bg-stone-800"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
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
              className="mx-auto w-44 h-auto drop-shadow-[0_4px_12px_rgba(217,119,6,0.3)]"
            />
            <div className="mt-1.5 inline-flex items-center justify-center gap-1.5">
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

        <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.matchPrefixes
                ? item.matchPrefixes.some((p) => pathname.startsWith(p))
                : item.href !== "/dashboard" &&
                  !item.href.includes("?") &&
                  pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-torch/20 text-torch-glow border border-torch/40"
                    : "text-slate-300 hover:bg-dungeon-slate hover:text-white border border-transparent"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.featured && (
                  <span className="rounded border border-torch/40 bg-torch/15 px-1.5 py-0.5 text-[10px] font-bold text-torch-glow">
                    Novo
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Card do Usuário na Guilda + Logout */}
        <div className="border-t border-stone-800 p-3.5 space-y-2.5">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-lg border border-stone-800 bg-dungeon-abyss/80 p-2.5 hover:border-torch/40 transition-colors"
          >
            <GuildAvatar
              avatarType={account?.avatarType}
              avatarUrl={account?.avatarUrl}
              oauthImage={account?.image}
              name={account?.name}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-dungeon-parchment">
                {account?.name || "Visitante da mesa"}
              </p>
              <p className="truncate font-mono text-[11px] text-torch-glow">
                {account ? `@${account.username}` : "Modo demonstração"}
              </p>
            </div>
            <span
              className="h-2 w-2 rounded-full bg-emerald-400 shrink-0"
              title="Online"
            />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-800 bg-dungeon-abyss px-3 py-2 text-xs font-medium text-slate-300 hover:border-stone-700 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Trocar conta / sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal + Banner de Verificação + Rodapé Institucional */}
      <main className="flex-1 flex flex-col justify-between md:pl-64 pb-24 md:pb-0">
        <div>
          {showUnverifiedBanner && (
            <div className="border-b border-amber-500/30 bg-amber-950/35 px-4 py-2.5">
              <div className="mx-auto flex max-w-6xl flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-200">
                  <ShieldAlert className="h-4 w-4 text-torch-glow shrink-0" />
                  <span>
                    Confirme seu e-mail (
                    <strong className="text-dungeon-parchment">
                      {account?.email}
                    </strong>
                    ) para desbloquear pedidos de amizade e mesas compartilhadas.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyModalOpen(true);
                    handleResendVerificationCode();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-md border border-torch/50 bg-torch/20 px-3 py-1 font-semibold text-torch-glow hover:bg-torch/30 transition-colors shrink-0"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Inserir código de 6 dígitos</span>
                </button>
              </div>
            </div>
          )}

          <div className="mx-auto w-full max-w-6xl px-3.5 py-4 sm:px-6 sm:py-6">
            {children}
          </div>
        </div>

        <AppFooter className="mt-8" />
      </main>

      {/* Modal Rápido de Inserção do Código de 6 Dígitos */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="dungeon-panel w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-torch-glow" />
                <h3 className="font-display text-base font-bold text-dungeon-parchment">
                  Confirmar e-mail da guilda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-stone-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Digite o código alfanumérico de 6 caracteres enviado para{" "}
              <span className="font-semibold text-torch-glow">
                {account?.email}
              </span>
              . O código é válido por 15 minutos.
            </p>

            {verifyError && (
              <div className="flex items-start gap-2 rounded-lg border border-crimson/60 bg-crimson-blood/40 p-3 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 text-crimson-soft shrink-0 mt-0.5" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifySuccess && (
              <div className="flex items-start gap-2 rounded-lg border border-vital/60 bg-vital-deep/40 p-3 text-xs text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-vital shrink-0 mt-0.5" />
                <span>{verifySuccess}</span>
              </div>
            )}

            {devPreviewCode && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-2.5 text-center text-xs text-amber-200">
                <span className="block text-[10px] uppercase tracking-wider text-amber-400">
                  Código gerado (modo de teste)
                </span>
                <span className="font-mono text-base font-bold tracking-widest text-torch-glow">
                  {devPreviewCode}
                </span>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <VerificationCodeInput
                value={code}
                onChange={setCode}
                disabled={verifying}
                autoFocus
              />

              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="runic-button w-full"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {verifying ? "Validando..." : "Ativar e-mail na guilda"}
                </span>
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
              <button
                type="button"
                onClick={handleResendVerificationCode}
                disabled={cooldown > 0}
                className="inline-flex items-center gap-1.5 text-torch-glow hover:underline disabled:text-slate-500 disabled:no-underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>
                  {cooldown > 0
                    ? `Reenviar em ${cooldown}s`
                    : "Reenviar código por e-mail"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Navegação Inferior Fixa para Todos os Celulares */}
      <nav
        aria-label="Navegação móvel"
        className="fixed bottom-0 inset-x-0 z-30 flex md:hidden items-center justify-around border-t border-stone-800 bg-dungeon-abyss/95 px-1 py-1 pb-safe"
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.matchPrefixes
              ? item.matchPrefixes.some((p) => pathname.startsWith(p))
              : item.href !== "/dashboard" && pathname.startsWith(item.href));
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
