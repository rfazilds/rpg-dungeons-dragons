"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AtSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  GuildAvatar,
  GUILD_AVATAR_PRESETS,
  type GuildAvatarType,
} from "@/components/account/guild-avatar";
import { USERNAME_REGEX } from "@/lib/validations/auth";
import { AppFooter } from "@/components/navigation/app-footer";

export default function OnboardingPage() {
  const router = useRouter();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [oauthImage, setOauthImage] = useState<string | null>(null);
  const [avatarType, setAvatarType] = useState<GuildAvatarType>("oauth");
  const [timezone, setTimezone] = useState<string>("America/Sao_Paulo");

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(true);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurrentAccount() {
      try {
        const res = await fetch("/api/account");
        const data = await res.json();
        if (!data.authenticated || !data.user) {
          router.replace("/dashboard");
          return;
        }

        const u = data.user;
        const confirmedKey = `guild_nickname_confirmed_${u.id}`;
        if (
          typeof window !== "undefined" &&
          window.localStorage.getItem(confirmedKey) === "true"
        ) {
          router.replace("/dashboard");
          return;
        }

        setUserId(u.id);
        setName(u.name || "Aventureiro");
        setUsername(u.username || "");
        setOauthImage(u.image || null);
        setAvatarType(
          (u.avatarType as GuildAvatarType) ||
            (u.image ? "oauth" : "preset_d20")
        );
        setTimezone(
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
            u.timezone ||
            "America/Sao_Paulo"
        );
        setLoadingProfile(false);
      } catch {
        router.replace("/dashboard");
      }
    }

    loadCurrentAccount();
  }, [router]);

  useEffect(() => {
    if (!userId || !username) return;
    if (!USERNAME_REGEX.test(username)) {
      setAvailable(false);
      setStatusMessage("Use de 3 a 30 letras, números ou underscores (_).");
      return;
    }

    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/username-check?username=${encodeURIComponent(
            username
          )}&excludeUserId=${encodeURIComponent(userId)}`
        );
        const data = await res.json();
        setChecking(false);
        setAvailable(Boolean(data.available));
        setStatusMessage(data.message || "");
      } catch {
        setChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, userId]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          name,
          username,
          avatarType,
          avatarUrl: avatarType === "oauth" ? oauthImage : avatarType,
          statusPresence: "online",
          timezone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível confirmar o nickname.");
        setSaving(false);
        return;
      }

      if (typeof window !== "undefined" && userId) {
        window.localStorage.setItem(
          `guild_nickname_confirmed_${userId}`,
          "true"
        );
      }

      router.push("/dashboard");
    } catch {
      setError("Erro de conexão ao salvar seu nickname.");
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-dungeon-abyss text-xs text-slate-400">
        Preparando seu registro no salão da guilda...
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-dungeon-abyss px-4 py-8 text-dungeon-parchment">
      <div className="mx-auto my-auto w-full max-w-md">
        <div className="text-center mb-5">
          <Image
            src="/d20-icon.png"
            alt="d20"
            width={44}
            height={44}
            className="mx-auto h-11 w-11 object-contain"
          />
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-torch/40 bg-torch/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-torch-glow">
            <Sparkles className="h-3 w-3" /> Boas-vindas ao salão da guilda
          </span>
          <h1 className="mt-2 font-display text-xl sm:text-2xl font-bold text-dungeon-parchment">
            Escolha seu nickname na guilda
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Seu identificador único <span className="text-torch-glow">@nickname</span> permite que mestres e amigos encontrem você na comunidade.
          </p>
        </div>

        <form onSubmit={handleConfirm} className="dungeon-panel p-5 sm:p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-crimson/60 bg-crimson-blood/40 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 text-crimson-soft shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Resumo Visual do Perfil */}
          <div className="flex items-center gap-3.5 rounded-lg border border-stone-800 bg-dungeon-abyss/80 p-3">
            <GuildAvatar
              avatarType={avatarType}
              oauthImage={oauthImage}
              name={name}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-dungeon-parchment">
                {name}
              </p>
              <p className="truncate font-mono text-xs text-torch-glow">
                @{username || "aventureiro"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Seu nickname único (apenas letras, números e _)
            </label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-torch-glow" />
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "")
                      .slice(0, 30)
                  )
                }
                className="carved-input pl-9 font-mono text-sm"
                placeholder="ex.: mago_supremo"
                autoFocus
              />
            </div>
            <p
              className={`mt-1.5 flex items-center gap-1 text-[11px] ${
                checking
                  ? "text-slate-400"
                  : available
                  ? "text-emerald-400"
                  : "text-crimson-soft"
              }`}
            >
              {!checking && available && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>
                {checking
                  ? "Verificando disponibilidade..."
                  : statusMessage || `@${username} pronto para uso!`}
              </span>
            </p>
          </div>

          {/* Escolha rápida de Avatar (Google ou Presets da Guilda) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Emblema ou avatar inicial
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {oauthImage && (
                <button
                  type="button"
                  onClick={() => setAvatarType("oauth")}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                    avatarType === "oauth"
                      ? "border-torch bg-torch/15 text-torch-glow"
                      : "border-stone-800 bg-dungeon-abyss text-slate-400 hover:text-white"
                  }`}
                >
                  <GuildAvatar
                    avatarType="oauth"
                    oauthImage={oauthImage}
                    size="sm"
                  />
                  <span>Foto do Google</span>
                </button>
              )}

              {GUILD_AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAvatarType(preset.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                    avatarType === preset.id
                      ? "border-torch bg-torch/15 text-torch-glow"
                      : "border-stone-800 bg-dungeon-abyss text-slate-400 hover:text-white"
                  }`}
                >
                  <GuildAvatar avatarType={preset.id} size="sm" />
                  <span>{preset.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || checking || !available}
            className="runic-button w-full"
          >
            <span>
              {saving
                ? "Gravando nos arquivos da guilda..."
                : "Confirmar com 1 clique e entrar"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      <AppFooter className="mt-8 border-t-0 bg-transparent" />
    </div>
  );
}
