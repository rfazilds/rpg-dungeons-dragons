"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  User,
  AtSign,
  Globe,
  Shield,
  Mail,
  KeyRound,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  GuildAvatar,
  GUILD_AVATAR_PRESETS,
  type GuildAvatarType,
} from "@/components/account/guild-avatar";
import { VerificationCodeInput } from "@/components/auth/verification-code-input";
import { USERNAME_REGEX } from "@/lib/validations/auth";

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília / São Paulo (BRT, UTC-3)" },
  { value: "America/Manaus", label: "Manaus / Amazônia (AMT, UTC-4)" },
  { value: "America/Cuiaba", label: "Cuiabá / Mato Grosso (UTC-4)" },
  { value: "America/Fortaleza", label: "Nordeste / Fortaleza (UTC-3)" },
  { value: "America/Rio_Branco", label: "Acre / Rio Branco (ACT, UTC-5)" },
  { value: "Europe/Lisbon", label: "Lisboa / Portugal (WET/WEST)" },
  { value: "America/New_York", label: "Nova York (EST/EDT)" },
  { value: "UTC", label: "Tempo universal coordenado (UTC)" },
];

const PRESENCE_OPTIONS = [
  { value: "online", label: "🟢 Online (disponível na taverna)" },
  { value: "in_game", label: "⚔️ Em sessão de mesa D&D 3.5" },
  { value: "away", label: "🌙 Ausente (acampando)" },
  { value: "offline", label: "⚫ Invisível / offline" },
] as const;

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [oauthImage, setOauthImage] = useState<string | null>(null);

  // 1. Perfil e identidade
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [avatarType, setAvatarType] = useState<GuildAvatarType>("preset_d20");
  const [statusPresence, setStatusPresence] = useState<
    "online" | "in_game" | "away" | "offline"
  >("online");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    true
  );
  const [usernameHint, setUsernameHint] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 2. Segurança — senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 3. Segurança — fluxo seguro de troca de e-mail (código de 6 dígitos)
  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailDevCode, setEmailDevCode] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 4. Zona de perigo — exclusão de conta
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccount() {
      try {
        const res = await fetch("/api/account");
        const data = await res.json();
        if (data?.authenticated && data?.user) {
          const u = data.user;
          setAuthenticated(true);
          setUserId(u.id);
          setName(u.name || "");
          setUsername(u.username || "");
          setInitialUsername(u.username || "");
          setCurrentEmail(u.email || "");
          setEmailVerified(u.emailVerified || null);
          setHasPassword(Boolean(u.hasPassword));
          setOauthImage(u.image || null);
          setAvatarType((u.avatarType as GuildAvatarType) || "preset_d20");
          setStatusPresence(u.statusPresence || "online");
          setTimezone(u.timezone || "America/Sao_Paulo");
        }
      } catch {
        // Modo visitante / mesa rápida
      } finally {
        setLoading(false);
      }
    }
    fetchAccount();
  }, []);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  useEffect(() => {
    if (!authenticated || !username) return;
    if (username.toLowerCase() === initialUsername.toLowerCase()) {
      setUsernameAvailable(true);
      setUsernameHint(`@${username} é o seu nickname atual.`);
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      setUsernameAvailable(false);
      setUsernameHint("Use de 3 a 30 letras, números ou underscores (_).");
      return;
    }

    setUsernameChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/username-check?username=${encodeURIComponent(
            username
          )}&excludeUserId=${encodeURIComponent(userId)}`
        );
        const data = await res.json();
        setUsernameChecking(false);
        setUsernameAvailable(Boolean(data.available));
        setUsernameHint(data.message || "");
      } catch {
        setUsernameChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, initialUsername, userId, authenticated]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);

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
          statusPresence,
          timezone,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setProfileMessage({
          type: "error",
          text: data.error || "Não foi possível salvar o perfil.",
        });
      } else {
        setInitialUsername(data.user.username);
        setProfileMessage({
          type: "success",
          text:
            data.message || "Identidade da guilda atualizada com sucesso!",
        });
      }
    } catch {
      setProfileMessage({
        type: "error",
        text: "Erro de conexão ao salvar o perfil.",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordSaving(true);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          currentPassword: currentPassword || undefined,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPasswordMessage({
          type: "error",
          text: data.error || "Não foi possível alterar a senha.",
        });
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setHasPassword(true);
        setPasswordMessage({
          type: "success",
          text: data.message || "Senha atualizada com segurança!",
        });
      }
    } catch {
      setPasswordMessage({
        type: "error",
        text: "Erro de conexão ao alterar a senha.",
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleRequestEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailMessage(null);
    setEmailSending(true);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_email_change",
          newEmail,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.cooldownRemainingSeconds) {
          setEmailCooldown(data.cooldownRemainingSeconds);
        }
        setEmailMessage({
          type: "error",
          text: data.error || "Não foi possível enviar o código.",
        });
      } else {
        setPendingEmail(data.pendingEmail || newEmail.toLowerCase());
        setEmailCooldown(60);
        setEmailCode("");
        if (data.devPreviewCode) {
          setEmailDevCode(data.devPreviewCode);
        }
        setEmailMessage({
          type: "success",
          text:
            data.message ||
            "Código de 6 dígitos enviado para o novo endereço de e-mail!",
        });
      }
    } catch {
      setEmailMessage({
        type: "error",
        text: "Erro ao solicitar alteração de e-mail.",
      });
    } finally {
      setEmailSending(false);
    }
  }

  async function handleConfirmEmailChange(e: React.FormEvent) {
    e.preventDefault();
    if (emailCode.length !== 6) return;
    setEmailMessage(null);
    setEmailVerifying(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: emailCode,
          type: "CHANGE_EMAIL",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEmailMessage({
          type: "error",
          text: data.error || "Código inválido ou expirado.",
        });
      } else {
        setCurrentEmail(data.email || pendingEmail || currentEmail);
        setEmailVerified(new Date().toISOString());
        setPendingEmail(null);
        setNewEmail("");
        setEmailCode("");
        setEmailDevCode(null);
        setEmailMessage({
          type: "success",
          text:
            data.message ||
            "Novo endereço de e-mail confirmado e ativado na sua conta!",
        });
      }
    } catch {
      setEmailMessage({
        type: "error",
        text: "Erro ao confirmar o código de troca de e-mail.",
      });
    } finally {
      setEmailVerifying(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    setDeleting(true);

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(
          data.error || "Confirmação incorreta. Digite EXCLUIR ou seu nickname."
        );
        setDeleting(false);
        return;
      }

      document.cookie =
        "sanctum_mesa_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      await signOut({ redirect: false });
      router.push("/");
    } catch {
      setDeleteError("Erro ao processar exclusão de conta.");
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Minha conta" }]} />
      <div className="space-y-6">
        {/* Cabeçalho da Página */}
        <div className="dungeon-panel p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <GuildAvatar
                avatarType={avatarType}
                oauthImage={oauthImage}
                name={name}
                size="lg"
              />
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-torch/40 bg-torch/10 px-2.5 py-0.5 text-[11px] font-semibold text-torch-glow">
                  Registro oficial da guilda
                </span>
                <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-dungeon-parchment">
                  Minha conta e identidade
                </h1>
                <p className="text-xs text-slate-400">
                  {authenticated
                    ? `@${initialUsername} • ${currentEmail}`
                    : "Conecte-se com Google ou e-mail para sincronizar sua conta na nuvem."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="dungeon-panel p-8 text-center text-xs text-slate-400">
            Consultando pergaminhos da sua conta no Neon PostgreSQL...
          </div>
        ) : !authenticated ? (
          <div className="dungeon-panel p-6 text-center space-y-3">
            <p className="text-sm text-slate-300">
              Você está navegando no <strong>modo rápido de mesa</strong>. Para
              escolher seu <span className="text-torch-glow">@nickname</span>,
              avatar da guilda e adicionar amigos, entre com sua conta Google ou
              e-mail!
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="runic-button mx-auto"
            >
              <span>Entrar ou criar conta na guilda</span>
            </button>
          </div>
        ) : (
          <>
            {/* SEÇÃO 1: PERFIL E IDENTIDADE NA GUILDA */}
            <form
              onSubmit={handleSaveProfile}
              className="dungeon-panel p-5 sm:p-6 space-y-5"
            >
              <div className="border-b border-stone-800 pb-3">
                <h2 className="font-display text-base sm:text-lg font-bold text-dungeon-parchment flex items-center gap-2">
                  <User className="h-4 w-4 text-torch-glow" />
                  <span>1. Perfil e identidade na guilda</span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Defina como mestres e jogadores encontram você nas mesas e na
                  comunidade.
                </p>
              </div>

              {profileMessage && (
                <div
                  className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                    profileMessage.type === "success"
                      ? "border-vital/60 bg-vital-deep/40 text-emerald-200"
                      : "border-crimson/60 bg-crimson-blood/40 text-red-200"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-vital shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-crimson-soft shrink-0 mt-0.5" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome completo ou título de aventureiro
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="carved-input pl-9"
                      placeholder="Ex.: Rafael, mestre da cripta"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nickname único (@username)
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
                      placeholder="mago_supremo"
                    />
                  </div>
                  <p
                    className={`mt-1 text-[11px] ${
                      usernameChecking
                        ? "text-slate-400"
                        : usernameAvailable
                        ? "text-emerald-400"
                        : "text-crimson-soft"
                    }`}
                  >
                    {usernameChecking
                      ? "Verificando disponibilidade..."
                      : usernameHint}
                  </p>
                </div>
              </div>

              {/* Seletor de Avatar da Guilda */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Seletor de avatar da guilda
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {oauthImage && (
                    <button
                      type="button"
                      onClick={() => setAvatarType("oauth")}
                      className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                        avatarType === "oauth"
                          ? "border-torch bg-torch/15 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                          : "border-stone-800 bg-dungeon-abyss/80 hover:border-stone-700"
                      }`}
                    >
                      <GuildAvatar
                        avatarType="oauth"
                        oauthImage={oauthImage}
                        name={name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-dungeon-parchment">
                          Foto do Google
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          Conta Google
                        </p>
                      </div>
                    </button>
                  )}

                  {GUILD_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarType(preset.id)}
                      className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                        avatarType === preset.id
                          ? "border-torch bg-torch/15 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                          : "border-stone-800 bg-dungeon-abyss/80 hover:border-stone-700"
                      }`}
                    >
                      <GuildAvatar avatarType={preset.id} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-dungeon-parchment">
                          {preset.label}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {preset.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status de Presença & Fuso Horário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Status na taverna
                  </label>
                  <select
                    value={statusPresence}
                    onChange={(e) =>
                      setStatusPresence(
                        e.target.value as
                          | "online"
                          | "in_game"
                          | "away"
                          | "offline"
                      )
                    }
                    className="carved-input"
                  >
                    {PRESENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    <Globe className="inline h-3.5 w-3.5 mr-1 text-torch-glow" />
                    Fuso horário (agendamento de mesas)
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="carved-input"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={
                    profileSaving || usernameChecking || !usernameAvailable
                  }
                  className="runic-button"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {profileSaving
                      ? "Salvando alterações..."
                      : "Salvar identidade da guilda"}
                  </span>
                </button>
              </div>
            </form>

            {/* SEÇÃO 2: SEGURANÇA & ALTERAÇÃO DE E-MAIL E SENHA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fluxo Seguro de Troca de E-mail */}
              <div className="dungeon-panel p-5 sm:p-6 space-y-4">
                <div className="border-b border-stone-800 pb-3">
                  <h2 className="font-display text-base font-bold text-dungeon-parchment flex items-center gap-2">
                    <Mail className="h-4 w-4 text-torch-glow" />
                    <span>2. Alteração segura de e-mail</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    E-mail atual:{" "}
                    <strong className="text-dungeon-parchment">
                      {currentEmail}
                    </strong>{" "}
                    {emailVerified ? (
                      <span className="ml-1 inline-flex items-center gap-1 rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/30">
                        ✓ Verificado
                      </span>
                    ) : (
                      <span className="ml-1 inline-flex items-center gap-1 rounded bg-amber-950/60 px-1.5 py-0.5 text-[10px] text-amber-300 border border-amber-500/30">
                        Pendente
                      </span>
                    )}
                  </p>
                </div>

                {emailMessage && (
                  <div
                    className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                      emailMessage.type === "success"
                        ? "border-vital/60 bg-vital-deep/40 text-emerald-200"
                        : "border-crimson/60 bg-crimson-blood/40 text-red-200"
                    }`}
                  >
                    {emailMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-vital shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-crimson-soft shrink-0 mt-0.5" />
                    )}
                    <span>{emailMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleRequestEmailChange} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Novo endereço de e-mail
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="novo.email@reinos.com"
                      className="carved-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={emailSending || !newEmail.trim()}
                    className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-torch/50 bg-torch/15 px-4 py-2 text-xs font-semibold text-torch-glow hover:bg-torch/25 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {emailSending
                        ? "Enviando código..."
                        : "Enviar código de 6 dígitos para o novo e-mail"}
                    </span>
                  </button>
                </form>

                {pendingEmail && (
                  <form
                    onSubmit={handleConfirmEmailChange}
                    className="mt-4 space-y-3 rounded-lg border border-torch/40 bg-dungeon-abyss/90 p-4"
                  >
                    <p className="text-xs text-slate-300 text-center">
                      Insira o código enviado para{" "}
                      <strong className="text-torch-glow">
                        {pendingEmail}
                      </strong>{" "}
                      (válido por 15 min):
                    </p>

                    {emailDevCode && (
                      <div className="rounded border border-amber-500/40 bg-amber-950/30 p-2 text-center text-xs text-amber-200">
                        <span className="block text-[10px] uppercase text-amber-400">
                          Código de teste:
                        </span>
                        <span className="font-mono font-bold tracking-widest text-torch-glow">
                          {emailDevCode}
                        </span>
                      </div>
                    )}

                    <VerificationCodeInput
                      value={emailCode}
                      onChange={setEmailCode}
                      disabled={emailVerifying}
                      autoFocus
                    />

                    <button
                      type="submit"
                      disabled={emailVerifying || emailCode.length !== 6}
                      className="runic-button w-full"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        {emailVerifying
                          ? "Confirmando..."
                          : "Confirmar código e atualizar e-mail"}
                      </span>
                    </button>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <button
                        type="button"
                        disabled={emailCooldown > 0}
                        onClick={handleRequestEmailChange}
                        className="inline-flex items-center gap-1 text-torch-glow hover:underline disabled:text-slate-500"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>
                          {emailCooldown > 0
                            ? `Reenviar em ${emailCooldown}s`
                            : "Reenviar código"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingEmail(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Troca de Senha */}
              <form
                onSubmit={handleSavePassword}
                className="dungeon-panel p-5 sm:p-6 space-y-4"
              >
                <div className="border-b border-stone-800 pb-3">
                  <h2 className="font-display text-base font-bold text-dungeon-parchment flex items-center gap-2">
                    <Shield className="h-4 w-4 text-torch-glow" />
                    <span>
                      {hasPassword
                        ? "Alterar senha de acesso"
                        : "Definir senha de acesso"}
                    </span>
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {hasPassword
                      ? "Informe sua senha atual para forjar uma nova senha."
                      : "Sua conta foi criada via Google. Você pode definir uma senha opcional para entrar também por e-mail."}
                  </p>
                </div>

                {passwordMessage && (
                  <div
                    className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                      passwordMessage.type === "success"
                        ? "border-vital/60 bg-vital-deep/40 text-emerald-200"
                        : "border-crimson/60 bg-crimson-blood/40 text-red-200"
                    }`}
                  >
                    {passwordMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-vital shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-crimson-soft shrink-0 mt-0.5" />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                {hasPassword && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Senha atual
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="carved-input pl-9"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nova senha (mínimo de 8 caracteres, letras e números)
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="carved-input pl-9"
                      placeholder="Nova senha segura"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="carved-input pl-9"
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving || !newPassword}
                  className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-stone-700 bg-dungeon-slate px-4 py-2 text-xs font-semibold text-dungeon-parchment hover:border-torch/50 transition-colors disabled:opacity-50"
                >
                  <KeyRound className="h-3.5 w-3.5 text-torch-glow" />
                  <span>
                    {passwordSaving
                      ? "Atualizando senha..."
                      : "Salvar nova senha"}
                  </span>
                </button>
              </form>
            </div>

            {/* SEÇÃO 3: ZONA DE PERIGO (EXCLUSÃO DE CONTA) */}
            <div className="rounded-xl border border-crimson/70 bg-crimson-blood/20 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-display text-base font-bold text-red-200 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-crimson-soft" />
                    <span>3. Zona de perigo — exclusão permanente</span>
                  </h2>
                  <p className="text-xs text-red-200/80 max-w-2xl">
                    Ao excluir sua conta, todos os seus personagens D&D 3.5,
                    encontros de combate, vínculos de amizade na guilda e
                    credenciais de acesso serão apagados permanentemente. Esta
                    ação não pode ser desfeita.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmation("");
                    setDeleteError(null);
                    setDeleteModalOpen(true);
                  }}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-crimson bg-crimson/20 px-4 py-2 text-xs font-bold text-red-200 hover:bg-crimson hover:text-white transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir minha conta</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Confirmação Explícita de Exclusão de Conta */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-md rounded-xl border border-crimson bg-dungeon-stone p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-red-300">
                <AlertTriangle className="h-5 w-5 text-crimson-soft shrink-0" />
                <h3 className="font-display text-base font-bold">
                  Confirmar exclusão permanente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-stone-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-lg border border-crimson/50 bg-crimson-blood/30 p-3 text-xs text-red-200 space-y-1.5">
              <p className="font-semibold">
                Atenção: esta ação é irreversível!
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-red-200/90">
                <li>
                  Todas as suas fichas de personagem e grimórios serão apagados.
                </li>
                <li>
                  Sua lista de amigos e convites na guilda serão desfeitos.
                </li>
                <li>
                  Seu nickname <strong>@{initialUsername}</strong> será liberado.
                </li>
              </ul>
            </div>

            {deleteError && (
              <div className="rounded-lg border border-crimson bg-crimson-blood/60 p-2.5 text-xs text-red-100">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Para confirmar, digite{" "}
                  <strong className="font-mono text-red-300">EXCLUIR</strong> ou
                  seu nickname{" "}
                  <strong className="font-mono text-red-300">
                    {initialUsername}
                  </strong>
                  :
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={`Digite EXCLUIR ou ${initialUsername}`}
                  className="carved-input border-crimson/60 font-mono text-sm"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="rounded-lg border border-stone-700 bg-dungeon-abyss px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleting || !deleteConfirmation.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-crimson px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>
                    {deleting
                      ? "Apagando registros..."
                      : "Apagar conta permanentemente"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
