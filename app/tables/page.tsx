"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Swords,
  Plus,
  KeyRound,
  Copy,
  Check,
  Users,
  Shield,
  Heart,
  Crown,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  X,
  UserPlus,
  Compass,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { VerificationCodeInput } from "@/components/auth/verification-code-input";
import {
  getUserCampaignsAction,
  lookupCampaignByCodeAction,
  joinCampaignWithCharacterAction,
} from "@/lib/actions/campaigns";
import {
  loadStoredCharacters,
  addStoredCharacter,
  createEmptySpellbook,
  type StoredCharacter35,
} from "@/lib/storage/characters-store";
import { getRaceById } from "@/lib/dnd/data/races";
import { getClassById } from "@/lib/dnd/data/classes";

interface DmCampaignCard {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  playerCount: number;
  totalMembers: number;
}

interface PlayerCampaignCard {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  dmName: string;
  dmUsername: string;
  joinedAt: string;
  character: {
    id: string;
    name: string;
    race: string;
    class: string;
    level: number;
    currentHp: number;
    maxHp: number;
  } | null;
}

interface LookupCampaignPreview {
  id: string;
  code: string;
  name: string;
  description: string;
  dmId: string;
  dmName: string;
  dmUsername: string;
  memberCount: number;
  alreadyMember: boolean;
  myRole?: "DM" | "PLAYER";
}

export default function TablesHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dm" | "player">("dm");
  const [loading, setLoading] = useState(true);
  const [asDm, setAsDm] = useState<DmCampaignCard[]>([]);
  const [asPlayer, setAsPlayer] = useState<PlayerCampaignCard[]>([]);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Modal de Entrar com Código (Validação em 2 etapas)
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinStep, setJoinStep] = useState<1 | 2>(1);
  const [inviteCode, setInviteCode] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [foundCampaign, setFoundCampaign] =
    useState<LookupCampaignPreview | null>(null);

  // Etapa 2: Seleção de Personagem
  const [myCharacters, setMyCharacters] = useState<StoredCharacter35[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>("");
  const [joiningBusy, setJoiningBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserCampaignsAction();
      setAsDm(res.asDm || []);
      setAsPlayer(res.asPlayer || []);
      if (res.asDm.length === 0 && res.asPlayer.length > 0) {
        setActiveTab("player");
      }
    } catch {
      // Silencioso caso offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
    const chars = loadStoredCharacters();
    setMyCharacters(chars);
    if (chars[0]) {
      setSelectedCharId(chars[0].id);
    }
  }, [loadCampaigns]);

  // Pré-busca automática quando o código de 6 dígitos é preenchido
  useEffect(() => {
    const clean = inviteCode.trim().toUpperCase();
    if (clean.length < 6) {
      setFoundCampaign(null);
      setLookupError(null);
      return;
    }

    let active = true;
    setLookupBusy(true);
    setLookupError(null);

    lookupCampaignByCodeAction(clean)
      .then((res) => {
        if (!active) return;
        if (!res.found || !res.campaign) {
          setFoundCampaign(null);
          setLookupError(
            res.error || "Nenhuma mesa ativa encontrada com este código."
          );
        } else {
          setFoundCampaign(res.campaign);
          setLookupError(null);
        }
      })
      .catch(() => {
        if (!active) return;
        setLookupError("Falha ao consultar o código da mesa.");
      })
      .finally(() => {
        if (active) setLookupBusy(false);
      });

    return () => {
      active = false;
    };
  }, [inviteCode]);

  function handleCopyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => {
      setCopiedCodeId((prev) => (prev === id ? null : prev));
    }, 2000);
  }

  function openJoinModal() {
    const chars = loadStoredCharacters();
    setMyCharacters(chars);
    if (chars[0] && !selectedCharId) {
      setSelectedCharId(chars[0].id);
    }
    setInviteCode("");
    setFoundCampaign(null);
    setLookupError(null);
    setJoinError(null);
    setJoinStep(1);
    setJoinModalOpen(true);
  }

  function handleQuickCreateCharacter() {
    const quickChar: StoredCharacter35 = {
      id: `pj-rapido-${Date.now()}`,
      name: "Valen, Lâmina da Guilda",
      race: "humano",
      class: "guerreiro",
      level: 1,
      alignment: "NB",
      deity: "Heironeous",
      background: "Guardião da Fronteira",
      size: "Médio",
      experiencePoints: 0,
      strength: 16,
      dexterity: 14,
      constitution: 14,
      intelligence: 12,
      wisdom: 11,
      charisma: 10,
      rollMethod: "virtual",
      maxHp: 12,
      currentHp: 12,
      nonlethalDamage: 0,
      armorClass: 17,
      touchArmorClass: 12,
      flatFootedArmorClass: 15,
      speed: "9m",
      baseAttackBonus: 1,
      spellResistance: 0,
      damageReduction: "",
      fortitudeMisc: 0,
      reflexMisc: 0,
      willMisc: 0,
      skills: {
        intimidar: { ranks: 4, isClassSkill: true, miscMod: 0 },
        ouvir: { ranks: 2, isClassSkill: false, miscMod: 2 },
        observar: { ranks: 2, isClassSkill: false, miscMod: 2 },
      },
      feats: ["Ataque Poderoso", "Iniciativa Aprimorada", "Prontidão"],
      specialAbilities: [
        "1 talento extra no 1º nível",
        "+4 pontos de perícia no 1º nível",
      ],
      proficiencies: ["Armas simples e comuns", "Todas as armaduras e escudos"],
      languages: ["Comum"],
      attacks: [
        {
          id: "atq-espada-longa",
          name: "Espada longa obra-prima",
          attackBonus: "+5",
          damage: "1d8+3",
          critical: "19-20/x2",
          range: "Corpo a corpo",
          damageType: "Cortante",
        },
      ],
      spellSlots: createEmptySpellbook(),
      equipment: {
        items: [{ name: "Mochila de aventureiro", quantity: 1, weight: 2 }],
        currency: { pc: 0, pp: 10, po: 120, pl: 0 },
      },
      notes: "Ficha rápida criada para ingresso imediato em mesa.",
      createdAt: new Date().toISOString(),
    };

    addStoredCharacter(quickChar);
    const next = loadStoredCharacters();
    setMyCharacters(next);
    setSelectedCharId(quickChar.id);
  }

  async function handleConfirmJoinTable() {
    if (!foundCampaign) return;
    const picked =
      myCharacters.find((c) => c.id === selectedCharId) || myCharacters[0];

    if (!picked) {
      setJoinError("Selecione ou crie uma ficha para entrar na mesa.");
      return;
    }

    setJoiningBusy(true);
    setJoinError(null);

    try {
      const res = await joinCampaignWithCharacterAction({
        code: foundCampaign.code,
        character: picked,
      });

      if (!res.success || !res.campaignId) {
        setJoinError(res.error || "Não foi possível vincular-se à mesa.");
        setJoiningBusy(false);
        return;
      }

      setJoinModalOpen(false);
      router.push(`/tables/${res.campaignId}`);
    } catch {
      setJoinError("Erro de conexão ao ingressar na mesa.");
      setJoiningBusy(false);
    }
  }

  const currentList = activeTab === "dm" ? asDm : asPlayer;

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Mesas" }]} />

      <div className="space-y-6">
        {/* Cabeçalho e Barra de Ações Superiores */}
        <div className="dungeon-panel p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-torch/40 bg-torch/10 px-2.5 py-0.5 text-[11px] font-semibold text-torch-glow">
                <Swords className="h-3.5 w-3.5" /> Hub de campanhas e sessões ao vivo
              </span>
              <h1 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-dungeon-parchment">
                Mesas de jogo D&D 3.5
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
                Forje sua própria campanha como mestre ou entre em uma sala com
                código de 6 dígitos usando seus personagens.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={openJoinModal}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-torch/50 bg-dungeon-abyss px-4 py-2.5 text-xs sm:text-sm font-semibold text-torch-glow hover:bg-torch/15 transition-colors"
              >
                <KeyRound className="h-4 w-4 text-torch-bright" />
                <span>Entrar com código</span>
              </button>

              <Link href="/tables/new" className="runic-button">
                <Plus className="h-4 w-4" />
                <span>+ Criar nova mesa</span>
              </Link>
            </div>
          </div>

          {/* Abas: Como Mestre vs Como Jogador */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-stone-800 bg-dungeon-abyss p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("dm")}
              className={`min-h-[42px] flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "dm"
                  ? "bg-torch text-dungeon-abyss shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Crown className="h-4 w-4 shrink-0" />
              <span>Como mestre ({asDm.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("player")}
              className={`min-h-[42px] flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "player"
                  ? "bg-torch text-dungeon-abyss shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span>Como jogador ({asPlayer.length})</span>
            </button>
          </div>
        </div>

        {/* Listagem de Mesas ou Estado Vazio */}
        {loading ? (
          <div className="dungeon-panel p-8 text-center text-xs text-slate-400">
            Consultando salões e campanhas ativas na cripta...
          </div>
        ) : currentList.length === 0 ? (
          <div className="dungeon-panel p-8 sm:p-10 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-torch/40 bg-torch/10 text-torch-glow shadow-torch-glow">
              <Compass className="h-7 w-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h2 className="font-display text-base sm:text-lg font-bold text-dungeon-parchment">
                Você ainda não faz parte de nenhuma mesa. Reúna seu grupo ou
                forje uma nova aventura!
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === "dm"
                  ? "Crie uma sala em segundos para gerar um código único de 6 dígitos e convidar seus jogadores."
                  : "Recebeu um código de convite do seu mestre? Clique em 'Entrar com código' e escolha sua ficha."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={openJoinModal}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-stone-700 bg-dungeon-abyss px-4 py-2 text-xs font-semibold text-slate-200 hover:border-torch/50"
              >
                <KeyRound className="h-4 w-4 text-torch-glow" />
                <span>Entrar com código</span>
              </button>

              <Link href="/tables/new" className="runic-button text-xs">
                <Plus className="h-4 w-4" />
                <span>+ Criar nova mesa</span>
              </Link>
            </div>
          </div>
        ) : activeTab === "dm" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {asDm.map((camp) => {
              const isCopied = copiedCodeId === camp.id;
              return (
                <article
                  key={camp.id}
                  className="dungeon-panel p-5 flex flex-col justify-between border-stone-800 hover:border-torch/40 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded border border-torch/40 bg-torch/15 px-2 py-0.5 text-[10px] font-semibold text-torch-glow">
                          <Crown className="h-3 w-3" /> Mestre da mesa
                        </span>
                        <h2 className="mt-1.5 font-display text-lg font-bold text-dungeon-parchment">
                          {camp.name}
                        </h2>
                      </div>

                      {/* Código de Convite com Cópia Rápida */}
                      <button
                        type="button"
                        onClick={() => handleCopyCode(camp.code, camp.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-torch/40 bg-dungeon-abyss px-2.5 py-1.5 font-mono text-xs font-bold text-torch-glow hover:bg-torch/15 transition-colors shrink-0"
                        title="Copiar código de convite"
                      >
                        <span>{camp.code}</span>
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-vital" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {camp.description && (
                      <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                        {camp.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between rounded-lg border border-stone-800 bg-dungeon-abyss/80 px-3 py-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-slate-300">
                        <Users className="h-3.5 w-3.5 text-torch-bright" />
                        <span>
                          <strong>{camp.playerCount}</strong>{" "}
                          {camp.playerCount === 1
                            ? "jogador conectado"
                            : "jogadores conectados"}
                        </span>
                      </span>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        ● Sala ativa
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                    <Link
                      href={`/tables/${camp.id}`}
                      className="runic-button w-full text-xs"
                    >
                      <Swords className="h-4 w-4" />
                      <span>Entrar na mesa</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {asPlayer.map((camp) => (
              <article
                key={camp.id}
                className="dungeon-panel p-5 flex flex-col justify-between border-stone-800 hover:border-torch/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded border border-vital/40 bg-vital-deep/30 px-2 py-0.5 text-[10px] font-semibold text-vital">
                        <Shield className="h-3 w-3" /> Jogador na campanha
                      </span>
                      <h2 className="mt-1.5 font-display text-lg font-bold text-dungeon-parchment">
                        {camp.name}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Mestre:{" "}
                        <span className="font-mono font-semibold text-torch-glow">
                          @{camp.dmUsername}
                        </span>{" "}
                        ({camp.dmName})
                      </p>
                    </div>

                    <span className="rounded border border-stone-800 bg-dungeon-abyss px-2.5 py-1 font-mono text-xs font-bold text-slate-300">
                      #{camp.code}
                    </span>
                  </div>

                  {camp.description && (
                    <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                      {camp.description}
                    </p>
                  )}

                  {/* Personagem Vinculado */}
                  <div className="mt-4 rounded-lg border border-stone-800 bg-dungeon-abyss/90 p-3 text-xs">
                    {camp.character ? (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                            Personagem vinculado
                          </span>
                          <p className="font-semibold text-dungeon-parchment">
                            {camp.character.name}
                          </p>
                          <p className="text-[11px] text-slate-400 capitalize">
                            {camp.character.race} • {camp.character.class} nv{" "}
                            {camp.character.level}
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="inline-flex items-center gap-1 rounded border border-vital/30 bg-vital-deep/20 px-2 py-0.5 text-xs font-bold text-vital">
                            <Heart className="h-3 w-3 text-crimson-soft" />
                            {camp.character.currentHp}/{camp.character.maxHp} PV
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400">
                        Nenhum personagem vinculado ainda.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800">
                  <Link
                    href={`/tables/${camp.id}`}
                    className="runic-button w-full text-xs"
                  >
                    <Swords className="h-4 w-4" />
                    <span>Entrar na mesa</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL EM 2 ETAPAS: ENTRAR EM MESA COM CÓDIGO DE 6 DÍGITOS
      ==================================================================== */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="dungeon-panel w-full max-w-lg p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-torch-glow">
                  Etapa {joinStep} de 2
                </span>
                <h3 className="font-display text-base sm:text-lg font-bold text-dungeon-parchment">
                  {joinStep === 1
                    ? "Entrar em mesa com código"
                    : "Escolher personagem para a aventura"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-stone-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {joinStep === 1 ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Digite o código de 6 caracteres alfanuméricos fornecido pelo
                  mestre da mesa:
                </p>

                <VerificationCodeInput
                  value={inviteCode}
                  onChange={setInviteCode}
                  disabled={lookupBusy}
                  autoFocus
                />

                {lookupBusy && (
                  <p className="text-center text-xs text-slate-400">
                    Buscando pergaminhos da mesa...
                  </p>
                )}

                {lookupError && (
                  <div className="flex items-start gap-2 rounded-lg border border-crimson/60 bg-crimson-blood/40 p-3 text-xs text-red-200">
                    <AlertCircle className="h-4 w-4 text-crimson-soft shrink-0 mt-0.5" />
                    <span>{lookupError}</span>
                  </div>
                )}

                {foundCampaign && (
                  <div className="rounded-xl border border-torch-bright bg-torch/15 p-4 space-y-2 shadow-torch-glow">
                    <div className="flex items-center justify-between">
                      <span className="rounded border border-torch/40 bg-dungeon-abyss px-2 py-0.5 font-mono text-[11px] font-bold text-torch-glow">
                        Mesa localizada • #{foundCampaign.code}
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        {foundCampaign.memberCount} participante(s)
                      </span>
                    </div>
                    <h4 className="font-display text-base font-bold text-dungeon-parchment">
                      {foundCampaign.name}
                    </h4>
                    <p className="text-xs text-slate-300">
                      Mestre:{" "}
                      <strong className="text-torch-glow font-mono">
                        @{foundCampaign.dmUsername}
                      </strong>{" "}
                      ({foundCampaign.dmName})
                    </p>
                    {foundCampaign.description && (
                      <p className="text-xs text-slate-400">
                        {foundCampaign.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setJoinModalOpen(false)}
                    className="rounded-lg border border-stone-800 bg-dungeon-abyss px-3.5 py-2 text-xs text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!foundCampaign}
                    onClick={() => setJoinStep(2)}
                    className="runic-button text-xs disabled:opacity-40"
                  >
                    <span>Selecionar personagem</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {foundCampaign && (
                  <div className="rounded-lg border border-stone-800 bg-dungeon-abyss px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Mesa: </span>
                      <strong className="text-dungeon-parchment">
                        {foundCampaign.name}
                      </strong>
                    </div>
                    <span className="font-mono text-torch-glow">
                      Mestre @{foundCampaign.dmUsername}
                    </span>
                  </div>
                )}

                {joinError && (
                  <div className="flex items-start gap-2 rounded-lg border border-crimson/60 bg-crimson-blood/40 p-3 text-xs text-red-200">
                    <AlertCircle className="h-4 w-4 text-crimson-soft shrink-0 mt-0.5" />
                    <span>{joinError}</span>
                  </div>
                )}

                {myCharacters.length === 0 ? (
                  <div className="rounded-xl border border-stone-800 bg-dungeon-abyss p-5 text-center space-y-3">
                    <p className="text-xs text-slate-300">
                      Você ainda não possui personagens salvos. Crie uma ficha
                      rápida com 1 clique ou abra o assistente completo:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleQuickCreateCharacter}
                        className="runic-button text-xs"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>+ Criar ficha rápida</span>
                      </button>
                      <Link
                        href="/characters/new"
                        className="rounded-lg border border-stone-700 bg-dungeon-stone px-3.5 py-2 text-xs font-semibold text-slate-200"
                      >
                        Assistente completo
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {myCharacters.map((char) => {
                      const race = getRaceById(char.race);
                      const cls = getClassById(char.class);
                      const isSelected = char.id === selectedCharId;
                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => setSelectedCharId(char.id)}
                          className={`w-full text-left rounded-xl border p-3.5 transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? "border-torch-bright bg-torch/15 shadow-torch-glow"
                              : "border-stone-800 bg-dungeon-abyss hover:border-stone-700"
                          }`}
                        >
                          <div>
                            <p className="font-display text-sm font-bold text-dungeon-parchment">
                              {char.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {race?.name || char.race} •{" "}
                              {cls?.name || char.class} (nível {char.level})
                            </p>
                          </div>
                          <div className="text-right font-mono text-xs shrink-0">
                            <span className="inline-flex items-center gap-1 rounded border border-vital/40 bg-vital-deep/30 px-2 py-0.5 font-bold text-vital">
                              <Heart className="h-3 w-3 text-crimson-soft" />
                              {char.currentHp}/{char.maxHp} PV
                            </span>
                            <span className="block mt-1 text-[10px] text-slate-400">
                              CA {char.armorClass}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    <div className="pt-1 flex justify-between items-center text-xs">
                      <button
                        type="button"
                        onClick={handleQuickCreateCharacter}
                        className="inline-flex items-center gap-1 text-torch-glow hover:underline"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>+ Criar ficha rápida</span>
                      </button>
                      <Link
                        href="/characters/new"
                        className="text-slate-400 hover:text-white"
                      >
                        Criar no assistente completo →
                      </Link>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setJoinStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-800 bg-dungeon-abyss px-3.5 py-2 text-xs text-slate-300"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Voltar ao código</span>
                  </button>

                  <button
                    type="button"
                    disabled={joiningBusy || myCharacters.length === 0}
                    onClick={handleConfirmJoinTable}
                    className="runic-button text-xs disabled:opacity-40"
                  >
                    <Swords className="h-4 w-4" />
                    <span>
                      {joiningBusy ? "Vinculando..." : "Juntar-se à mesa"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
