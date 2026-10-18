"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Swords,
  Shield,
  Heart,
  Crown,
  Copy,
  Check,
  Dices,
  Send,
  Users,
  BookOpen,
  Search,
  Sparkles,
  LogOut,
  Play,
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  X,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { GuildAvatar } from "@/components/account/guild-avatar";
import { SendToTableModal } from "@/components/dm/send-to-table-modal";
import {
  getCampaignRoomDataAction,
  sendCampaignMessageAction,
  updateCampaignCharacterHpAction,
  joinCampaignWithCharacterAction,
  leaveCampaignAction,
  updateTableCombatantHpAction,
  removeTableCombatantAction,
  rollAllTableInitiativesAction,
  syncPartyCharactersToTableCombatantsAction,
} from "@/lib/actions/campaigns";
import {
  calculateAbilityModifier,
  calculateBaseSave,
  formatModifier,
  rollPolyhedralDice,
} from "@/lib/dnd/rules";
import { getRaceById } from "@/lib/dnd/data/races";
import { getClassById } from "@/lib/dnd/data/classes";
import { DND_SKILLS } from "@/lib/dnd/data/skills";
import {
  DND_MONSTERS,
  DND_SPELLS,
  type DndMonsterEntry,
} from "@/lib/dnd/data/compendium";
import { DND_ADVENTURES } from "@/lib/dnd/data/adventures";
import {
  loadStoredCharacters,
  type StoredCharacter35,
} from "@/lib/storage/characters-store";
import type {
  CharacterAttackEntry,
  CharacterSkillEntry,
  CombatantEntry,
  MonsterStatBlockJson,
} from "@/lib/db/schema";

interface TableCombatantItem {
  id: string;
  campaignId: string;
  characterId: string | null;
  type: "PLAYER" | "MONSTER" | "NPC";
  faction: "ALLY" | "ENEMY" | "NEUTRAL";
  name: string;
  avatarUrl: string | null;
  initiative: number;
  initiativeModifier: number;
  hasActedThisRound: boolean;
  currentHp: number;
  maxHp: number;
  tempHp: number;
  armorClass: number;
  conditions: string[];
  statBlock: MonsterStatBlockJson | null;
  isHiddenFromPlayers: boolean;
}

interface RoomCharacterData {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  alignment: string;
  size: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  touchArmorClass: number;
  flatFootedArmorClass: number;
  speed: string;
  baseAttackBonus: number;
  fortitudeMisc: number;
  reflexMisc: number;
  willMisc: number;
  skills: Record<string, CharacterSkillEntry>;
  feats: string[];
  specialAbilities: string[];
  attacks: CharacterAttackEntry[];
}

interface RoomMember {
  memberId: string;
  userId: string;
  role: "DM" | "PLAYER";
  username: string;
  userName: string;
  avatarType?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  statusPresence?: string | null;
  character: RoomCharacterData | null;
}

interface RoomMessage {
  id: string;
  userId: string;
  username: string;
  characterName: string;
  content: string;
  type: "CHAT" | "DICE_ROLL" | "SYSTEM";
  createdAt: string;
  avatarType?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
}

interface DiceRollPayload {
  label: string;
  die: string;
  rolls: number[];
  modifier: number;
  total: number;
  natural20?: boolean;
  natural1?: boolean;
}

function parseDiceRollContent(raw: string): DiceRollPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.total === "number" && parsed.die) {
      return parsed as DiceRollPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export default function GameTableRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewlyCreated = searchParams.get("created") === "1";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreatedBanner, setShowCreatedBanner] = useState(isNewlyCreated);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [campaign, setCampaign] = useState<{
    id: string;
    code: string;
    name: string;
    description: string;
    dmId: string;
    dmName: string;
    dmUsername: string;
  } | null>(null);

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    name: string;
    role: "DM" | "PLAYER";
    myCharacter: RoomCharacterData | null;
  } | null>(null);

  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);

  // Controles do Painel Central
  const [viewMode, setViewMode] = useState<"role_default" | "alt_view">(
    "role_default"
  );
  const [playerTab, setPlayerTab] = useState<"sheet" | "skills" | "feats">(
    "sheet"
  );
  const [dmTab, setDmTab] = useState<
    "party_vision" | "initiative" | "compendium" | "adventures"
  >("party_vision");

  // Estado do Rastreador de Iniciativa Integrado do Mestre (Persistido em table_combatants)
  const [combatants, setCombatants] = useState<CombatantEntry[]>([]);
  const [dbCombatants, setDbCombatants] = useState<TableCombatantItem[]>([]);
  const [round, setRound] = useState(1);
  const [turnIdx, setTurnIdx] = useState(0);
  const [compendiumQuery, setCompendiumQuery] = useState("");
  const [compendiumMode, setCompendiumMode] = useState<"monsters" | "spells">(
    "monsters"
  );
  const [monsterToSend, setMonsterToSend] = useState<DndMonsterEntry | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Estado do Chat e Log de Rolagens
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Modal rápido para vincular/trocar personagem na sala
  const [charPickerOpen, setCharPickerOpen] = useState(false);
  const [localChars, setLocalChars] = useState<StoredCharacter35[]>([]);
  const [linkingChar, setLinkingChar] = useState(false);

  const fetchRoomData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await getCampaignRoomDataAction(params.id);
        if (!res.found || !res.campaign || !res.currentUser) {
          setError(res.error || "Mesa não encontrada.");
          return;
        }
        setCampaign(res.campaign);
        setCurrentUser(res.currentUser);
        setMembers(res.members || []);
        setMessages(res.messages || []);
        setDbCombatants(res.tableCombatants || []);

        // Sincroniza a lista visual de combatentes com table_combatants do banco + PJs da sala
        const persistedItems: CombatantEntry[] = (
          res.tableCombatants || []
        ).map((tc) => ({
          id: tc.id,
          name: tc.name,
          type:
            tc.type === "PLAYER"
              ? "player"
              : tc.type === "NPC"
              ? "npc"
              : "monster",
          initiative: tc.initiative,
          initiativeMod: tc.initiativeModifier,
          armorClass: tc.armorClass,
          currentHp: tc.currentHp,
          maxHp: tc.maxHp,
          challengeRating: tc.statBlock?.challengeRating,
          conditions: tc.conditions || [],
        }));

        const persistedCharIds = new Set(
          (res.tableCombatants || [])
            .map((tc) => tc.characterId)
            .filter(Boolean)
        );

        const unpersistedParty: CombatantEntry[] = (res.members || [])
          .filter((m) => m.character && !persistedCharIds.has(m.character.id))
          .map((m) => {
            const c = m.character!;
            const dexMod = calculateAbilityModifier(c.dexterity);
            return {
              id: `pj-${c.id}`,
              name: `${c.name} (@${m.username})`,
              type: "player",
              initiative: 10 + dexMod,
              initiativeMod: dexMod,
              armorClass: c.armorClass,
              currentHp: c.currentHp,
              maxHp: c.maxHp,
              conditions: [],
            };
          });

        setCombatants([...persistedItems, ...unpersistedParty]);
      } catch {
        if (!silent) setError("Erro ao carregar dados da mesa.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [params.id]
  );

  useEffect(() => {
    fetchRoomData(false);
    setLocalChars(loadStoredCharacters());
  }, [fetchRoomData]);

  // Atualização em tempo real do chat e status de vida (a cada 4 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoomData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchRoomData]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleCopyCode() {
    if (!campaign) return;
    navigator.clipboard.writeText(campaign.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleCopyInviteLink() {
    if (typeof window === "undefined" || !campaign) return;
    navigator.clipboard.writeText(window.location.href.split("?")[0]);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleSendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!campaign || !currentUser || !chatText.trim()) return;

    const text = chatText.trim();
    setChatText("");
    setSendingChat(true);

    const senderLabel =
      currentUser.role === "DM"
        ? `Mestre @${currentUser.username}`
        : currentUser.myCharacter?.name || `@${currentUser.username}`;

    try {
      const res = await sendCampaignMessageAction({
        campaignId: campaign.id,
        content: text,
        type: "CHAT",
        characterName: senderLabel,
      });
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message!]);
      }
    } finally {
      setSendingChat(false);
    }
  }

  async function broadcastDiceRoll(
    label: string,
    die: "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100",
    modifier = 0
  ) {
    if (!campaign || !currentUser) return;
    const rollRes = rollPolyhedralDice(die, 1, modifier, label);
    const dieVal = rollRes.individualRolls[0];

    const payload: DiceRollPayload = {
      label,
      die,
      rolls: rollRes.individualRolls,
      modifier,
      total: rollRes.total,
      natural20: die === "d20" && dieVal === 20,
      natural1: die === "d20" && dieVal === 1,
    };

    const senderLabel =
      currentUser.role === "DM" && viewMode === "role_default"
        ? `Mestre @${currentUser.username}`
        : currentUser.myCharacter?.name || `@${currentUser.username}`;

    const res = await sendCampaignMessageAction({
      campaignId: campaign.id,
      content: JSON.stringify(payload),
      type: "DICE_ROLL",
      characterName: senderLabel,
    });

    if (res.success && res.message) {
      setMessages((prev) => [...prev, res.message!]);
    }
  }

  async function handleCharacterHpChange(characterId: string, delta: number) {
    if (!campaign) return;
    const res = await updateCampaignCharacterHpAction({
      campaignId: campaign.id,
      characterId,
      delta,
    });
    if (res.success) {
      fetchRoomData(true);
    }
  }

  async function handleSelectCharacterForRoom(char: StoredCharacter35) {
    if (!campaign) return;
    setLinkingChar(true);
    try {
      const res = await joinCampaignWithCharacterAction({
        code: campaign.code,
        character: char,
      });
      if (res.success) {
        setCharPickerOpen(false);
        await fetchRoomData(false);
      }
    } finally {
      setLinkingChar(false);
    }
  }

  async function handleLeaveRoom() {
    if (!campaign || !currentUser) return;
    if (currentUser.role === "DM") {
      router.push("/tables");
      return;
    }
    if (
      window.confirm(
        `Deseja retirar-se da mesa "${campaign.name}"? Você poderá entrar novamente com o código ${campaign.code}.`
      )
    ) {
      await leaveCampaignAction(campaign.id);
      router.push("/tables");
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="dungeon-panel p-8 text-center text-xs text-slate-400">
          Abrindo portões da sala de jogo e sincronizando dados da mesa...
        </div>
      </AppShell>
    );
  }

  if (error || !campaign || !currentUser) {
    return (
      <AppShell>
        <Breadcrumbs
          items={[
            { label: "Mesas", href: "/tables" },
            { label: "Sala indisponível" },
          ]}
        />
        <div className="dungeon-panel p-6 text-center space-y-4">
          <p className="text-sm text-crimson-soft">
            {error || "Esta mesa não foi encontrada."}
          </p>
          <Link href="/tables" className="runic-button inline-flex text-xs">
            Voltar para minhas mesas
          </Link>
        </div>
      </AppShell>
    );
  }

  const isDm = currentUser.role === "DM";
  const showingDmPanel =
    (isDm && viewMode === "role_default") ||
    (!isDm && viewMode === "alt_view");

  const activeChar =
    currentUser.myCharacter ||
    members.find((m) => m.character)?.character ||
    null;

  const sortedCombatants = [...combatants].sort(
    (a, b) => b.initiative - a.initiative
  );

  const filteredMonsters = DND_MONSTERS.filter((m) => {
    const q = compendiumQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.sizeAndType.toLowerCase().includes(q)
    );
  });

  const filteredSpells = DND_SPELLS.filter((s) => {
    const q = compendiumQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.school.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell>
      {/* Breadcrumb Contextual: Salão principal › Mesas › [Nome da Campanha] */}
      <Breadcrumbs
        items={[
          { label: "Mesas", href: "/tables" },
          { label: `${campaign.name} (mesa de jogo)` },
        ]}
      />

      <div className="space-y-4">
        {/* Banner Flutuante de Sucesso no 1º Carregamento após criar a mesa */}
        {showCreatedBanner && (
          <div className="rounded-xl border border-torch-bright bg-torch/15 p-4 shadow-torch-glow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-torch-bright shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-dungeon-parchment">
                <strong>Mesa forjada com sucesso!</strong> Compartilhe o código{" "}
                <span className="rounded border border-torch/50 bg-dungeon-abyss px-2 py-0.5 font-mono font-bold text-torch-glow">
                  {campaign.code}
                </span>{" "}
                ou o link com seus jogadores.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-torch/50 bg-dungeon-abyss px-3 py-1.5 text-xs font-semibold text-torch-glow hover:bg-torch/20"
              >
                {copiedCode ? (
                  <Check className="h-3.5 w-3.5 text-vital" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedCode ? "Código copiado!" : "Copiar código"}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-dungeon-abyss px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-torch/40"
              >
                <span>{copiedLink ? "Link copiado!" : "Copiar link"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCreatedBanner(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
                title="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 1. CABEÇALHO DA MESA */}
        <div className="dungeon-panel p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-lg sm:text-2xl font-bold text-dungeon-parchment">
                  {campaign.name}
                </h1>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    isDm
                      ? "border-torch/50 bg-torch/15 text-torch-glow"
                      : "border-vital/50 bg-vital-deep/30 text-vital"
                  }`}
                >
                  {isDm ? (
                    <>
                      <Crown className="h-3 w-3" /> Mestre
                    </>
                  ) : (
                    <>
                      <Shield className="h-3 w-3" /> Jogador
                    </>
                  )}
                </span>

                {/* Badge do Código de Convite Copiável */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-dungeon-abyss px-2.5 py-1 font-mono text-xs font-bold text-torch-glow hover:border-torch-bright transition-colors"
                  title="Clique para copiar o código de convite"
                >
                  <span>Código: {campaign.code}</span>
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5 text-vital" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Mestre da campanha:{" "}
                <strong className="font-mono text-slate-200">
                  @{campaign.dmUsername}
                </strong>{" "}
                ({campaign.dmName})
                {campaign.description ? ` • ${campaign.description}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => {
                  setLocalChars(loadStoredCharacters());
                  setCharPickerOpen(true);
                }}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-stone-700 bg-dungeon-abyss px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-torch/50"
              >
                <Shield className="h-3.5 w-3.5 text-torch-glow" />
                <span>
                  {currentUser.myCharacter
                    ? "Trocar personagem"
                    : "Vincular ficha"}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setViewMode((prev) =>
                    prev === "role_default" ? "alt_view" : "role_default"
                  )
                }
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-stone-700 bg-dungeon-abyss px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                <Swords className="h-3.5 w-3.5 text-torch-bright" />
                <span>
                  {showingDmPanel
                    ? "Ver visão de ficha"
                    : "Ver escudo do mestre"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLeaveRoom}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-stone-800 bg-dungeon-stone px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-crimson-soft"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{isDm ? "Voltar às mesas" : "Sair da mesa"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* GRID PRINCIPAL DE 3 COLUNAS: PARTY (ESQUERDA) | PAINEL CENTRAL | CHAT & ROLAGENS (DIREITA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* ================================================================
              2. PAINEL DA PARTY / LISTA DE JOGADORES (3 COLUNAS NO DESKTOP)
          ================================================================ */}
          <aside className="lg:col-span-3 dungeon-panel p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-torch-glow" />
                <h2 className="font-display text-sm font-bold text-dungeon-parchment">
                  Grupo na mesa ({members.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                ● Ao vivo
              </span>
            </div>

            <div className="space-y-2.5">
              {members.map((m) => {
                const char = m.character;
                const hpPercent = char
                  ? Math.max(
                      0,
                      Math.min(100, Math.round((char.currentHp / char.maxHp) * 100))
                    )
                  : 100;
                const canEditHp = isDm || m.userId === currentUser.id;

                return (
                  <div
                    key={m.memberId}
                    className="rounded-xl border border-stone-800 bg-dungeon-abyss/90 p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <GuildAvatar
                        avatarType={m.avatarType}
                        avatarUrl={m.avatarUrl}
                        oauthImage={m.image}
                        name={m.userName}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-mono text-xs font-semibold text-torch-glow">
                            @{m.username}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              m.role === "DM"
                                ? "bg-torch/20 text-torch-glow border border-torch/30"
                                : "bg-stone-800 text-slate-300"
                            }`}
                          >
                            {m.role === "DM" ? "Mestre" : "Herói"}
                          </span>
                        </div>

                        {char ? (
                          <p className="truncate text-xs font-bold text-dungeon-parchment">
                            {char.name}
                          </p>
                        ) : (
                          <p className="truncate text-[11px] text-slate-400">
                            {m.role === "DM"
                              ? "Narrador da campanha"
                              : "Sem ficha vinculada"}
                          </p>
                        )}
                      </div>
                    </div>

                    {char && (
                      <div className="space-y-1.5 pt-1 border-t border-stone-800/80">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="capitalize">
                            {char.race} • {char.class} nv {char.level}
                          </span>
                          <span className="font-mono text-slate-300">
                            CA {char.armorClass}
                          </span>
                        </div>

                        {/* Barra Visual de Pontos de Vida (PV atual / PV máximo) */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                            <span className="inline-flex items-center gap-1 text-slate-300">
                              <Heart className="h-3 w-3 text-crimson-soft" />
                              PV
                            </span>
                            <span
                              className={`font-bold ${
                                char.currentHp <= 0
                                  ? "text-crimson-soft"
                                  : "text-vital"
                              }`}
                            >
                              {char.currentHp} / {char.maxHp}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-900 border border-stone-800">
                            <div
                              className={`h-full transition-all ${
                                hpPercent > 50
                                  ? "bg-emerald-500"
                                  : hpPercent > 20
                                  ? "bg-amber-500"
                                  : "bg-red-600"
                              }`}
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                        </div>

                        {canEditHp && (
                          <div className="flex items-center justify-end gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleCharacterHpChange(char.id, -1)
                              }
                              className="h-6 px-2 rounded border border-crimson/40 bg-crimson-blood/30 font-mono text-[10px] font-bold text-crimson-soft"
                            >
                              -1 PV
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleCharacterHpChange(char.id, 1)
                              }
                              className="h-6 px-2 rounded border border-vital/40 bg-vital-deep/30 font-mono text-[10px] font-bold text-vital"
                            >
                              +1 PV
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ================================================================
              3. PAINEL CENTRAL (VISÃO DIFERENCIADA POR PAPEL: MESTRE VS JOGADOR)
          ================================================================ */}
          <section className="lg:col-span-5 dungeon-panel p-4 sm:p-5 space-y-4">
            {showingDmPanel ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-800 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-torch-glow">
                      Controle tático da sessão
                    </span>
                    <h2 className="font-display text-base font-bold text-dungeon-parchment">
                      Escudo do mestre integrado
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-lg border border-stone-800 bg-dungeon-abyss p-1">
                  {[
                    { id: "party_vision", label: "Percepção", icon: Eye },
                    { id: "initiative", label: "Iniciativa", icon: Swords },
                    { id: "compendium", label: "Compêndio", icon: Search },
                    { id: "adventures", label: "Aventuras", icon: BookOpen },
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = dmTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setDmTab(
                            t.id as
                              | "party_vision"
                              | "initiative"
                              | "compendium"
                              | "adventures"
                          )
                        }
                        className={`min-h-[36px] flex items-center justify-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
                          active
                            ? "bg-torch text-dungeon-abyss"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ABA MESTRE 1: PERCEPÇÃO PASSIVA E DEFESAS DO GRUPO */}
                {dmTab === "party_vision" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                      Visão rápida de CA, resistências e percepção passiva
                      (Ouvir / Observar) de todos os heróis na mesa:
                    </p>

                    {members.filter((m) => m.character).length === 0 ? (
                      <div className="rounded-xl border border-stone-800 bg-dungeon-abyss p-4 text-center text-xs text-slate-400">
                        Nenhum jogador vinculou ficha ainda. Compartilhe o
                        código{" "}
                        <strong className="font-mono text-torch-glow">
                          {campaign.code}
                        </strong>{" "}
                        ou clique em &ldquo;Vincular ficha&rdquo; no topo.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {members
                          .filter((m) => m.character)
                          .map((m) => {
                            const c = m.character!;
                            const cls = getClassById(c.class);
                            const wisMod = calculateAbilityModifier(c.wisdom);
                            const dexMod = calculateAbilityModifier(
                              c.dexterity
                            );
                            const conMod = calculateAbilityModifier(
                              c.constitution
                            );
                            const ouvirRanks = c.skills?.ouvir?.ranks || 0;
                            const observarRanks =
                              c.skills?.observar?.ranks || 0;
                            const passiveListen =
                              10 + Math.floor(ouvirRanks) + wisMod;
                            const passiveSpot =
                              10 + Math.floor(observarRanks) + wisMod;

                            const fort =
                              (cls
                                ? calculateBaseSave(
                                    cls.saves.fortitude,
                                    c.level
                                  )
                                : 0) +
                              conMod +
                              c.fortitudeMisc;
                            const ref =
                              (cls
                                ? calculateBaseSave(cls.saves.reflex, c.level)
                                : 0) +
                              dexMod +
                              c.reflexMisc;
                            const will =
                              (cls
                                ? calculateBaseSave(cls.saves.will, c.level)
                                : 0) +
                              wisMod +
                              c.willMisc;

                            return (
                              <div
                                key={m.memberId}
                                className="rounded-xl border border-stone-800 bg-dungeon-abyss p-3 text-xs space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-bold text-dungeon-parchment">
                                      {c.name}
                                    </span>{" "}
                                    <span className="font-mono text-[11px] text-torch-glow">
                                      (@{m.username})
                                    </span>
                                  </div>
                                  <span className="font-mono text-[11px] text-vital">
                                    PV {c.currentHp}/{c.maxHp}
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px]">
                                  <div className="rounded bg-dungeon-stone p-1.5 border border-stone-800">
                                    <span className="block text-[9px] uppercase text-slate-400">
                                      CA (Toq/Surp)
                                    </span>
                                    <strong className="text-torch-glow">
                                      {c.armorClass} ({c.touchArmorClass}/
                                      {c.flatFootedArmorClass})
                                    </strong>
                                  </div>
                                  <div className="rounded bg-dungeon-stone p-1.5 border border-stone-800">
                                    <span className="block text-[9px] uppercase text-slate-400">
                                      Fort/Ref/Von
                                    </span>
                                    <strong className="text-slate-200">
                                      {formatModifier(fort)}/
                                      {formatModifier(ref)}/
                                      {formatModifier(will)}
                                    </strong>
                                  </div>
                                  <div className="rounded bg-dungeon-stone p-1.5 border border-stone-800">
                                    <span className="block text-[9px] uppercase text-slate-400">
                                      Ouvir/Observar
                                    </span>
                                    <strong className="text-arcane-bright">
                                      {passiveListen} / {passiveSpot}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* ABA MESTRE 2: RASTREADOR DE INICIATIVA RÁPIDA (PERSISTIDO EM TABLE_COMBATANTS) */}
                {dmTab === "initiative" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono text-torch-glow">
                        Rodada {round} • {sortedCombatants.length} em combate
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await syncPartyCharactersToTableCombatantsAction(
                              campaign.id
                            );
                            await fetchRoomData(true);
                          }}
                          className="rounded-lg border border-stone-700 bg-dungeon-abyss px-2 py-1 text-[11px] font-semibold text-slate-300 hover:border-torch/50"
                          title="Sincronizar todos os heróis da mesa no combate"
                        >
                          Sincronizar heróis
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (dbCombatants.length > 0) {
                              await rollAllTableInitiativesAction(campaign.id);
                              await fetchRoomData(true);
                            } else {
                              setCombatants((prev) =>
                                prev.map((c) => ({
                                  ...c,
                                  initiative:
                                    Math.floor(Math.random() * 20) +
                                    1 +
                                    (c.initiativeMod || 0),
                                }))
                              );
                            }
                            setTurnIdx(0);
                            setRound(1);
                          }}
                          className="rounded-lg border border-stone-700 bg-dungeon-abyss px-2.5 py-1 text-xs font-semibold text-slate-200"
                        >
                          Rolar todas
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (sortedCombatants.length === 0) return;
                            if (turnIdx + 1 >= sortedCombatants.length) {
                              setTurnIdx(0);
                              setRound((r) => r + 1);
                            } else {
                              setTurnIdx((t) => t + 1);
                            }
                          }}
                          className="runic-button text-xs py-1 px-2.5"
                        >
                          <Play className="h-3 w-3" />
                          <span>Próximo turno</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {sortedCombatants.map((c, idx) => {
                        const isTurn = idx === turnIdx;
                        const isPersisted = !c.id.startsWith("pj-") && !c.id.startsWith("mon-");
                        return (
                          <div
                            key={c.id}
                            className={`flex items-center justify-between rounded-lg border p-2.5 text-xs ${
                              isTurn
                                ? "border-torch-bright bg-torch/15"
                                : "border-stone-800 bg-dungeon-abyss"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded bg-dungeon-stone font-mono font-bold text-torch-glow border border-stone-700">
                                {c.initiative}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-dungeon-parchment">
                                    {c.name}
                                  </p>
                                  {c.challengeRating && (
                                    <span className="rounded bg-crimson-blood/40 px-1.5 py-0.5 font-mono text-[9px] text-crimson-soft border border-crimson/30">
                                      ND {c.challengeRating}
                                    </span>
                                  )}
                                </div>
                                <p className="font-mono text-[10px] text-slate-400">
                                  CA {c.armorClass} • PV {c.currentHp}/{c.maxHp}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (isPersisted) {
                                    await updateTableCombatantHpAction({
                                      campaignId: campaign.id,
                                      combatantId: c.id,
                                      delta: -2,
                                    });
                                    await fetchRoomData(true);
                                  } else {
                                    setCombatants((prev) =>
                                      prev.map((item) =>
                                        item.id === c.id
                                          ? {
                                              ...item,
                                              currentHp: Math.max(
                                                -10,
                                                item.currentHp - 2
                                              ),
                                            }
                                          : item
                                      )
                                    );
                                  }
                                }}
                                className="h-6 px-1.5 rounded border border-crimson/40 bg-crimson-blood/30 font-mono text-[10px] text-crimson-soft"
                              >
                                -2
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (isPersisted) {
                                    await updateTableCombatantHpAction({
                                      campaignId: campaign.id,
                                      combatantId: c.id,
                                      delta: 2,
                                    });
                                    await fetchRoomData(true);
                                  } else {
                                    setCombatants((prev) =>
                                      prev.map((item) =>
                                        item.id === c.id
                                          ? {
                                              ...item,
                                              currentHp: Math.min(
                                                item.maxHp,
                                                item.currentHp + 2
                                              ),
                                            }
                                          : item
                                      )
                                    );
                                  }
                                }}
                                className="h-6 px-1.5 rounded border border-vital/40 bg-vital-deep/30 font-mono text-[10px] text-vital"
                              >
                                +2
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (isPersisted) {
                                    await removeTableCombatantAction({
                                      campaignId: campaign.id,
                                      combatantId: c.id,
                                    });
                                    await fetchRoomData(true);
                                  } else {
                                    setCombatants((prev) =>
                                      prev.filter((item) => item.id !== c.id)
                                    );
                                  }
                                }}
                                className="h-6 w-6 flex items-center justify-center rounded border border-stone-800 text-slate-500 hover:text-crimson-soft"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ABA MESTRE 3: COMPÊNDIO RÁPIDO NA MESA */}
                {dmTab === "compendium" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={compendiumQuery}
                        onChange={(e) => setCompendiumQuery(e.target.value)}
                        placeholder="Buscar monstro ou magia 3.5..."
                        className="carved-input text-xs py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCompendiumMode(
                            compendiumMode === "monsters"
                              ? "spells"
                              : "monsters"
                          )
                        }
                        className="rounded-lg border border-stone-700 bg-dungeon-abyss px-2.5 py-2 text-xs font-semibold text-torch-glow shrink-0"
                      >
                        {compendiumMode === "monsters"
                          ? "Ver magias"
                          : "Ver monstros"}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {compendiumMode === "monsters"
                        ? filteredMonsters.map((m) => (
                            <div
                              key={m.id}
                              className="rounded-lg border border-stone-800 bg-dungeon-abyss p-3 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <strong className="text-dungeon-parchment">
                                  {m.name}
                                </strong>
                                <span className="rounded bg-crimson-blood/40 px-1.5 py-0.5 font-mono text-[10px] text-crimson-soft border border-crimson/30">
                                  ND {m.challengeRating}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                CA {m.armorClass} | PV {m.hp} | Atq: {m.attack}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setMonsterToSend(m)}
                                  className="inline-flex items-center gap-1 rounded border border-amber-500/60 bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:bg-amber-500/30"
                                >
                                  <Swords className="h-3 w-3" />
                                  <span>Enviar para mesa (1-10x)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    broadcastDiceRoll(
                                      `Ataque de ${m.name}`,
                                      "d20",
                                      4
                                    )
                                  }
                                  className="rounded border border-stone-700 bg-dungeon-stone px-2 py-1 text-[11px] text-slate-200"
                                >
                                  Rolar ataque no chat 🎲
                                </button>
                              </div>
                            </div>
                          ))
                        : filteredSpells.map((sp) => (
                            <div
                              key={sp.id}
                              className="rounded-lg border border-stone-800 bg-dungeon-abyss p-3 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <strong className="text-arcane-bright">
                                  {sp.name}
                                </strong>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {sp.levelLabel}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300">
                                {sp.summary}
                              </p>
                            </div>
                          ))}
                    </div>
                  </div>
                )}

                {/* ABA MESTRE 4: 16 AVENTURAS CANÔNICAS EM PDF (/assets/Aventuras) */}
                {dmTab === "adventures" && (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {DND_ADVENTURES.map((adv) => {
                      const relativeFile = adv.pdfPath.replace(
                        /^\/assets\//,
                        ""
                      );
                      return (
                        <div
                          key={adv.slug}
                          className="rounded-lg border border-stone-800 bg-dungeon-abyss p-3 text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-mono text-[10px] text-torch-glow">
                              {adv.code} • {adv.levelRangeLabel}
                            </span>
                            <p className="font-bold text-dungeon-parchment">
                              {adv.title}
                            </p>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {adv.synopsis}
                            </p>
                          </div>
                          <a
                            href={`/api/pdf?file=${encodeURIComponent(
                              relativeFile
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-torch/40 bg-torch/15 px-2.5 py-1.5 text-[11px] font-semibold text-torch-glow shrink-0"
                          >
                            <span>PDF</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* VISÃO DO JOGADOR: FICHA DIGITAL INTERATIVA COM ROLAGEM EM 1 CLIQUE */
              <>
                {!activeChar ? (
                  <div className="rounded-xl border border-stone-800 bg-dungeon-abyss p-6 text-center space-y-3">
                    <p className="text-xs text-slate-300">
                      Você ainda não vinculou um personagem a esta mesa.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLocalChars(loadStoredCharacters());
                        setCharPickerOpen(true);
                      }}
                      className="runic-button text-xs mx-auto"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Escolher minha ficha 3.5</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                      <div>
                        <span className="text-[11px] font-semibold text-torch-glow">
                          Ficha interativa na mesa (clique para rolar no chat)
                        </span>
                        <h2 className="font-display text-base font-bold text-dungeon-parchment">
                          {activeChar.name} • Nível {activeChar.level}
                        </h2>
                      </div>
                      <Link
                        href="/characters"
                        className="text-xs text-slate-400 hover:text-torch-glow"
                      >
                        Ver ficha completa →
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-1 rounded-lg border border-stone-800 bg-dungeon-abyss p-1">
                      {[
                        { id: "sheet", label: "Atributos e ataques" },
                        { id: "skills", label: "Perícias 3.5" },
                        { id: "feats", label: "Talentos" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setPlayerTab(t.id as "sheet" | "skills" | "feats")
                          }
                          className={`min-h-[36px] rounded px-2 py-1 text-xs font-semibold transition-colors ${
                            playerTab === t.id
                              ? "bg-torch text-dungeon-abyss"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {playerTab === "sheet" && (
                      <div className="space-y-3">
                        {/* Os 6 Atributos Clicáveis */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {[
                            {
                              short: "FOR",
                              label: "Força",
                              val: activeChar.strength,
                            },
                            {
                              short: "DES",
                              label: "Destreza",
                              val: activeChar.dexterity,
                            },
                            {
                              short: "CON",
                              label: "Constituição",
                              val: activeChar.constitution,
                            },
                            {
                              short: "INT",
                              label: "Inteligência",
                              val: activeChar.intelligence,
                            },
                            {
                              short: "SAB",
                              label: "Sabedoria",
                              val: activeChar.wisdom,
                            },
                            {
                              short: "CAR",
                              label: "Carisma",
                              val: activeChar.charisma,
                            },
                          ].map((ab) => {
                            const mod = calculateAbilityModifier(ab.val);
                            return (
                              <button
                                key={ab.short}
                                type="button"
                                onClick={() =>
                                  broadcastDiceRoll(
                                    `Teste de ${ab.label}`,
                                    "d20",
                                    mod
                                  )
                                }
                                className="rounded-lg border border-stone-800 bg-dungeon-abyss p-2 text-center hover:border-torch-bright active:scale-95 transition-all"
                              >
                                <span className="block text-[10px] font-bold text-torch-glow">
                                  {ab.short}
                                </span>
                                <span className="block font-display text-lg font-extrabold text-dungeon-parchment">
                                  {ab.val}
                                </span>
                                <span className="font-mono text-[11px] text-slate-300">
                                  {formatModifier(mod)}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Ataques Rápidos */}
                        <div className="space-y-2">
                          <span className="block text-xs font-semibold text-slate-300">
                            Ataques rápidos (envia rolagem para a mesa):
                          </span>
                          {(activeChar.attacks || []).map((atk) => {
                            const bonusNum =
                              parseInt(atk.attackBonus, 10) || 0;
                            return (
                              <div
                                key={atk.id}
                                className="flex items-center justify-between rounded-lg border border-stone-800 bg-dungeon-abyss p-2.5 text-xs"
                              >
                                <div>
                                  <p className="font-semibold text-dungeon-parchment">
                                    {atk.name}
                                  </p>
                                  <p className="font-mono text-[11px] text-slate-400">
                                    Dano {atk.damage} • Decisivo {atk.critical}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    broadcastDiceRoll(
                                      `Ataque: ${atk.name}`,
                                      "d20",
                                      bonusNum
                                    )
                                  }
                                  className="rounded-lg border border-torch/40 bg-torch/15 px-3 py-1.5 font-mono text-xs font-bold text-torch-glow hover:bg-torch/25 active:scale-95"
                                >
                                  Atacar {atk.attackBonus} 🎲
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {playerTab === "skills" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-80 overflow-y-auto pr-1">
                        {DND_SKILLS.map((sk) => {
                          const entry = activeChar.skills?.[sk.id];
                          const ranks = entry?.ranks || 0;
                          const abMod = calculateAbilityModifier(
                            activeChar[sk.ability]
                          );
                          const total =
                            Math.floor(ranks) + abMod + (entry?.miscMod || 0);
                          return (
                            <button
                              key={sk.id}
                              type="button"
                              onClick={() =>
                                broadcastDiceRoll(
                                  `Perícia: ${sk.name}`,
                                  "d20",
                                  total
                                )
                              }
                              className="flex items-center justify-between rounded-lg border border-stone-800 bg-dungeon-abyss px-2.5 py-2 text-xs hover:border-torch/50"
                            >
                              <span className="truncate text-dungeon-parchment">
                                {sk.name}
                              </span>
                              <span className="font-mono font-bold text-torch-glow">
                                {formatModifier(total)} 🎲
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {playerTab === "feats" && (
                      <div className="space-y-2 text-xs">
                        {(activeChar.feats || []).map((f) => (
                          <div
                            key={f}
                            className="rounded-lg border border-stone-800 bg-dungeon-abyss p-2.5 text-slate-200"
                          >
                            • {f}
                          </div>
                        ))}
                        {(activeChar.specialAbilities || []).map((sa) => (
                          <div
                            key={sa}
                            className="rounded-lg border border-stone-800 bg-dungeon-abyss/60 p-2 text-slate-400"
                          >
                            • {sa}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          {/* ================================================================
              4. CHAT AO VIVO E LOG DE ROLAGENS COMPARTILHADAS (4 COLUNAS)
          ================================================================ */}
          <aside className="lg:col-span-4 dungeon-panel p-4 flex flex-col h-[560px]">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Dices className="h-4 w-4 text-torch-bright" />
                <h2 className="font-display text-sm font-bold text-dungeon-parchment">
                  Chat ao vivo e rolagens da mesa
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Sincronizado
              </span>
            </div>

            {/* Barra de Rolagem Rápida Compartilhada */}
            <div className="my-2.5 flex items-center justify-between gap-1 rounded-lg border border-stone-800 bg-dungeon-abyss p-1.5">
              <span className="text-[10px] font-semibold text-slate-400 px-1">
                Rolar:
              </span>
              {(["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as const).map(
                (die) => (
                  <button
                    key={die}
                    type="button"
                    onClick={() =>
                      broadcastDiceRoll(`Rolagem de ${die}`, die, 0)
                    }
                    className={`rounded border px-2 py-1 font-mono text-[11px] font-bold transition-colors active:scale-95 ${
                      die === "d20"
                        ? "border-torch/50 bg-torch/20 text-torch-glow"
                        : "border-stone-700 bg-dungeon-stone text-slate-200 hover:border-torch/40"
                    }`}
                  >
                    {die}
                  </button>
                )
              )}
            </div>

            {/* Lista de Mensagens e Rolagens */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {messages.map((msg) => {
                if (msg.type === "SYSTEM") {
                  return (
                    <div
                      key={msg.id}
                      className="rounded-lg border border-stone-800/80 bg-dungeon-abyss/60 px-3 py-1.5 text-center text-[11px] text-slate-400"
                    >
                      {msg.content}
                    </div>
                  );
                }

                if (msg.type === "DICE_ROLL") {
                  const rollData = parseDiceRollContent(msg.content);
                  return (
                    <div
                      key={msg.id}
                      className="rounded-xl border border-torch/40 bg-dungeon-abyss p-3 shadow-torch-glow"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-torch-glow">
                          {msg.characterName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          @{msg.username}
                        </span>
                      </div>

                      {rollData ? (
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-torch/50 bg-torch/15 font-mono text-xs font-extrabold text-torch-glow">
                              {rollData.die}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-dungeon-parchment">
                                {rollData.label}
                              </p>
                              <p className="font-mono text-[10px] text-slate-400">
                                Dado [{rollData.rolls.join(", ")}]{" "}
                                {rollData.modifier !== 0
                                  ? formatModifier(rollData.modifier)
                                  : ""}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono text-xl font-extrabold text-torch-glow">
                              {rollData.total}
                            </span>
                            {rollData.natural20 && (
                              <span className="block text-[9px] font-bold uppercase text-vital">
                                20 natural!
                              </span>
                            )}
                            {rollData.natural1 && (
                              <span className="block text-[9px] font-bold uppercase text-crimson-soft">
                                Falha crítica
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 font-mono text-xs text-torch-glow">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className="rounded-xl border border-stone-800 bg-dungeon-abyss/90 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-dungeon-parchment">
                        {msg.characterName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        @{msg.username}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed break-words">
                      {msg.content}
                    </p>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Input de Envio de Mensagem */}
            <form
              onSubmit={handleSendChatMessage}
              className="mt-3 pt-2.5 border-t border-stone-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Enviar mensagem para a mesa..."
                className="carved-input text-xs py-2"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatText.trim()}
                className="runic-button px-3 py-2 text-xs shrink-0 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </aside>
        </div>
      </div>

      {/* Toast Flutuante de Envio de Criaturas */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 max-w-md rounded-xl border border-torch-bright bg-dungeon-abyss/95 px-4 py-3 shadow-torch-glow flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-torch-bright shrink-0" />
          <p className="text-xs sm:text-sm font-medium text-dungeon-parchment">
            {toastMessage}
          </p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modal de Envio Direto de Monstros para a Mesa */}
      <SendToTableModal
        monster={monsterToSend}
        defaultCampaignId={campaign.id}
        onClose={() => setMonsterToSend(null)}
        onSuccessToast={(msg) => {
          setToastMessage(msg);
          fetchRoomData(true);
        }}
      />

      {/* Modal Rápido para Vincular ou Trocar Personagem na Mesa */}
      {charPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="dungeon-panel w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-display text-base font-bold text-dungeon-parchment">
                Vincular personagem à mesa
              </h3>
              <button
                type="button"
                onClick={() => setCharPickerOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {localChars.length === 0 ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-xs text-slate-300">
                  Você ainda não possui fichas criadas.
                </p>
                <Link
                  href="/characters/new"
                  className="runic-button inline-flex text-xs"
                >
                  + Criar personagem D&D 3.5
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {localChars.map((c) => {
                  const race = getRaceById(c.race);
                  const cls = getClassById(c.class);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={linkingChar}
                      onClick={() => handleSelectCharacterForRoom(c)}
                      className="w-full text-left rounded-xl border border-stone-800 bg-dungeon-abyss p-3 hover:border-torch-bright transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="font-display text-sm font-bold text-dungeon-parchment">
                          {c.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {race?.name || c.race} • {cls?.name || c.class} nv{" "}
                          {c.level}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-torch-glow">
                        Selecionar →
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
