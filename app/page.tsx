"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Shield,
  Flame,
  KeyRound,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

function AuthGateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (!urlError) return;

    if (urlError === "Configuration") {
      setError(
        "O login com Google requer as variáveis AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET configuradas no .env.local e na Vercel."
      );
    } else if (urlError === "OAuthAccountNotLinked") {
      setError(
        "Este e-mail já está vinculado a outro método de login."
      );
    } else if (urlError === "AccessDenied") {
      setError("Acesso cancelado ou negado pelo Google.");
    } else {
      setError(`Não foi possível concluir a autenticação (${urlError}).`);
    }
  }, [searchParams]);

  function setSessionCookieAndRedirect(userName: string, userEmail: string) {
    document.cookie = `sanctum_mesa_session=${encodeURIComponent(
      JSON.stringify({ name: userName, email: userEmail })
    )}; path=/; max-age=604800; SameSite=Lax`;
    router.push("/dashboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message || "Dados inválidos.");
          setLoading(false);
          return;
        }

        const res = await signIn("credentials", {
          email: parsed.data.email,
          password: parsed.data.password,
          redirect: false,
        });

        if (res?.error) {
          setError("E-mail ou senha incorretos.");
          setLoading(false);
          return;
        }

        setSessionCookieAndRedirect(
          parsed.data.email.split("@")[0],
          parsed.data.email
        );
      } else {
        const parsed = registerSchema.safeParse({
          name,
          email,
          password,
          confirmPassword,
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message || "Verifique os campos.");
          setLoading(false);
          return;
        }

        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          setError(regData.error || "Não foi possível criar a conta.");
          setLoading(false);
          return;
        }

        // Autentica automaticamente após cadastrar no Neon
        await signIn("credentials", {
          email: parsed.data.email,
          password: parsed.data.password,
          redirect: false,
        });

        setSuccessMsg("Conta criada com sucesso! Entrando no Salão...");
        setSessionCookieAndRedirect(parsed.data.name, parsed.data.email);
      }
    } catch {
      setError("Falha ao autenticar. Verifique sua conexão.");
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError(
        "Erro ao redirecionar para o Google. Verifique AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET."
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        {/* Emblema da Fortaleza */}
        <div className="text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-torch/50 bg-torch/15 text-torch-bright shadow-torch-glow">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold tracking-wider text-dungeon-parchment">
            SANCTUM D&D 3.5
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Grimório de Personagens, Escudo do Mestre & Acervo Canônico v.3.5
          </p>
        </div>

        {/* Painel de Pedra Esculpida */}
        <div className="mt-6 dungeon-panel p-5 sm:p-7">
          {/* Alternância Entrar / Cadastrar */}
          <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-stone-800 bg-dungeon-abyss p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`min-h-[42px] rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "bg-torch text-dungeon-abyss shadow"
                  : "text-slate-400 hover:text-dungeon-parchment"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`min-h-[42px] rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                mode === "register"
                  ? "bg-torch text-dungeon-abyss shadow"
                  : "text-slate-400 hover:text-dungeon-parchment"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Login / Cadastro 1-Clique com Google */}
          <div className="mt-5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-lg border border-stone-700 bg-dungeon-slate px-4 py-2.5 text-sm font-semibold text-dungeon-parchment hover:border-torch/60 hover:bg-stone-800 transition-colors active:scale-[0.99] disabled:opacity-60"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.9 7.4 24 12 24z"
                />
              </svg>
              <span>
                {mode === "login"
                  ? "Continuar com o Google"
                  : "Cadastrar com o Google"}
              </span>
            </button>
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-800" />
            <span className="text-[11px] uppercase tracking-widest text-slate-500">
              ou e-mail e senha
            </span>
            <div className="h-px flex-1 bg-stone-800" />
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-crimson/60 bg-crimson-blood/40 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 text-crimson-soft shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-vital/60 bg-vital-deep/40 p-3 text-xs text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-vital shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Formulário com Validação Zod + Banco Neon */}
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Completo ou Título de Aventureiro
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Sir Roland de Cormyr"
                    className="carved-input pl-9"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aventureiro@reinos.com"
                  className="carved-input pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "register"
                      ? "Mínimo 8 caracteres (letras e números)"
                      : "••••••••"
                  }
                  className="carved-input pl-9"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                />
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="carved-input pl-9"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="runic-button w-full mt-2"
            >
              <Flame className="h-4 w-4" />
              <span>
                {loading
                  ? "Autenticando..."
                  : mode === "login"
                  ? "Abrir Portões da Cripta"
                  : "Forjar Conta & Entrar"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Acesso Instantâneo para Teste Rápido Mobile/Mesa */}
          <div className="mt-5 pt-4 border-t border-stone-800/80">
            <button
              type="button"
              onClick={() =>
                setSessionCookieAndRedirect(
                  "Mestre & Jogador D&D 3.5",
                  "mesa@sanctum.dnd"
                )
              }
              className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-torch/30 bg-torch/10 px-3 py-2 text-xs font-medium text-torch-glow hover:bg-torch/20 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Acesso Rápido de Mesa (Entrar com 1 Toque)</span>
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-500">
          Otimizado para celulares e conexões móveis • Regras oficiais D&D v.3.5
        </p>
      </div>
    </div>
  );
}

export default function AuthGatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center text-xs text-slate-400">
          Carregando portões do Sanctum...
        </div>
      }
    >
      <AuthGateContent />
    </Suspense>
  );
}
