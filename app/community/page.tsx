"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UsersRound,
  Search,
  UserPlus,
  Check,
  X,
  Clock,
  Globe,
  CheckCircle2,
  AlertCircle,
  UserMinus,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { GuildAvatar } from "@/components/account/guild-avatar";

interface CommunityUser {
  id: string;
  username: string;
  name: string | null;
  image?: string | null;
  avatarType?: string | null;
  avatarUrl?: string | null;
  statusPresence?: string | null;
  timezone?: string | null;
}

interface SearchCandidate extends CommunityUser {
  friendshipId: string | null;
  relationState:
    | "NONE"
    | "ACCEPTED"
    | "PENDING_SENT"
    | "PENDING_RECEIVED"
    | "BLOCKED";
}

interface FriendshipEntry {
  friendshipId: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
  user: CommunityUser;
}

function renderPresenceBadge(presence?: string | null) {
  switch (presence) {
    case "online":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Online
        </span>
      );
    case "in_game":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-torch/50 bg-torch/15 px-2.5 py-0.5 text-[11px] font-medium text-torch-glow">
          <span className="h-1.5 w-1.5 rounded-full bg-torch animate-pulse" />
          Em Mesa D&D
        </span>
      );
    case "away":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Ausente
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-700 bg-dungeon-abyss px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          Offline
        </span>
      );
  }
}

export default function CommunityPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);

  const [friends, setFriends] = useState<FriendshipEntry[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendshipEntry[]>(
    []
  );
  const [outgoingRequests, setOutgoingRequests] = useState<FriendshipEntry[]>(
    []
  );

  // Busca por @nickname
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchCandidate[]>([]);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadFriendsList = useCallback(async () => {
    try {
      const res = await fetch("/api/community/friends");
      const data = await res.json();
      setAuthenticated(Boolean(data.authenticated));
      setEmailVerified(Boolean(data.emailVerified));
      setFriends(data.friends || []);
      setIncomingRequests(data.incomingRequests || []);
      setOutgoingRequests(data.outgoingRequests || []);
    } catch {
      // ignora erro silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriendsList();
  }, [loadFriendsList]);

  // Busca reativa por @nickname
  useEffect(() => {
    const clean = searchQuery.trim().replace(/^@+/, "");
    if (clean.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/community/friends?q=${encodeURIComponent(clean)}`
        );
        const data = await res.json();
        setSearchResults(data.searchResults || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleAddFriend(targetUserId: string) {
    setFeedback(null);
    setActionBusyId(targetUserId);

    try {
      const res = await fetch("/api/community/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Não foi possível enviar o pedido.",
        });
      } else {
        setFeedback({
          type: "success",
          text: data.message || "Pedido de amizade enviado!",
        });
        // Atualiza estado do card buscado e recarrega lista
        setSearchResults((prev) =>
          prev.map((item) =>
            item.id === targetUserId
              ? {
                  ...item,
                  relationState:
                    data.status === "ACCEPTED" ? "ACCEPTED" : "PENDING_SENT",
                }
              : item
          )
        );
        await loadFriendsList();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Erro de conexão ao enviar pedido de amizade.",
      });
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleFriendshipAction(
    friendshipId: string,
    action: "ACCEPT" | "REJECT" | "REMOVE"
  ) {
    setFeedback(null);
    setActionBusyId(friendshipId);

    try {
      const res = await fetch("/api/community/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Erro ao atualizar amizade.",
        });
      } else {
        setFeedback({
          type: "success",
          text: data.message || "Lista da Guilda atualizada!",
        });
        await loadFriendsList();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Erro ao processar ação.",
      });
    } finally {
      setActionBusyId(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Cabeçalho do Módulo de Comunidade */}
        <div className="dungeon-panel p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-torch/40 bg-torch/10 px-2.5 py-0.5 text-[11px] font-semibold text-torch-glow">
                <UsersRound className="h-3.5 w-3.5" /> Rede Social & Multiplayer
              </span>
              <h1 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-dungeon-parchment">
                Comunidade & Guilda de Amigos
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
                Encontre aventureiros pelo{" "}
                <span className="font-mono text-torch-glow">@nickname</span>,
                forme seu grupo e prepare-se para sessões compartilhadas de D&D
                3.5.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto rounded-lg border border-stone-800 bg-dungeon-abyss/80 px-3.5 py-2 text-xs">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                  Aliados na Guilda
                </span>
                <span className="font-display text-base font-bold text-torch-glow">
                  {friends.length}
                </span>
              </div>
              <div className="h-7 w-px bg-stone-800" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                  Convites Pendentes
                </span>
                <span className="font-display text-base font-bold text-dungeon-parchment">
                  {incomingRequests.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3.5 text-xs ${
              feedback.type === "success"
                ? "border-vital/60 bg-vital-deep/40 text-emerald-200"
                : "border-crimson/60 bg-crimson-blood/40 text-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-vital shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-crimson-soft shrink-0 mt-0.5" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {loading ? (
          <div className="dungeon-panel p-8 text-center text-xs text-slate-400">
            Consultando registros do Salão da Guilda...
          </div>
        ) : !authenticated ? (
          <div className="dungeon-panel p-6 text-center space-y-3">
            <p className="text-sm text-slate-300">
              Para buscar jogadores por{" "}
              <span className="font-mono text-torch-glow">@nickname</span> e
              formar sua Guilda de Amigos, entre com sua conta Google ou e-mail!
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="runic-button mx-auto"
            >
              <span>Entrar ou Criar Conta</span>
            </button>
          </div>
        ) : (
          <>
            {!emailVerified && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-200">
                <ShieldAlert className="h-4 w-4 text-torch-glow shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-dungeon-parchment">
                    Verificação de E-mail Pendente
                  </p>
                  <p className="mt-0.5 text-amber-200/80">
                    Confirme seu e-mail através do botão no topo da tela para
                    desbloquear o envio de pedidos de amizade.
                  </p>
                </div>
              </div>
            )}

            {/* 1. BARRA DE BUSCA RÁPIDA POR @NICKNAME */}
            <div className="dungeon-panel p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-display text-base font-bold text-dungeon-parchment flex items-center gap-2">
                  <Search className="h-4 w-4 text-torch-glow" />
                  <span>Buscar Aventureiros na Guilda</span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Pesquise pelo <code className="text-torch-glow">@nickname</code>{" "}
                  (ex: <code className="text-slate-300">@mago_supremo</code>,{" "}
                  <code className="text-slate-300">@thorin</code>) ou pelo nome.
                </p>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-torch-glow" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite @nickname ou nome do jogador..."
                  className="carved-input pl-10 font-mono text-sm"
                />
              </div>

              {searching && (
                <p className="text-xs text-slate-400">
                  Vasculhando a Taverna por &ldquo;{searchQuery}&rdquo;...
                </p>
              )}

              {!searching &&
                searchQuery.trim().replace(/^@+/, "").length >= 2 &&
                searchResults.length === 0 && (
                  <div className="rounded-lg border border-stone-800 bg-dungeon-abyss/70 p-4 text-center text-xs text-slate-400">
                    Nenhum aventureiro encontrado com esse nickname.
                  </div>
                )}

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {searchResults.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-stone-800 bg-dungeon-abyss/90 p-3.5 hover:border-stone-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <GuildAvatar
                          avatarType={candidate.avatarType}
                          avatarUrl={candidate.avatarUrl}
                          oauthImage={candidate.image}
                          name={candidate.name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-bold text-dungeon-parchment">
                            {candidate.name || "Aventureiro"}
                          </p>
                          <p className="truncate font-mono text-xs text-torch-glow">
                            @{candidate.username}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            {renderPresenceBadge(candidate.statusPresence)}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {candidate.relationState === "NONE" && (
                          <button
                            type="button"
                            disabled={
                              actionBusyId === candidate.id || !emailVerified
                            }
                            onClick={() => handleAddFriend(candidate.id)}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-torch/50 bg-torch/15 px-3 py-1.5 text-xs font-semibold text-torch-glow hover:bg-torch/25 transition-colors disabled:opacity-50"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Adicionar Amigo</span>
                          </button>
                        )}

                        {candidate.relationState === "PENDING_SENT" && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-stone-700 bg-dungeon-stone px-2.5 py-1.5 text-[11px] text-slate-300">
                            <Clock className="h-3.5 w-3.5 text-amber-400" />
                            <span>Convite Enviado</span>
                          </span>
                        )}

                        {candidate.relationState === "PENDING_RECEIVED" &&
                          candidate.friendshipId && (
                            <button
                              type="button"
                              onClick={() =>
                                handleFriendshipAction(
                                  candidate.friendshipId!,
                                  "ACCEPT"
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Aceitar Pedido</span>
                            </button>
                          )}

                        {candidate.relationState === "ACCEPTED" && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-medium text-emerald-300">
                            <Check className="h-3.5 w-3.5" />
                            <span>Na sua Guilda</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. SEÇÃO "PEDIDOS PENDENTES" */}
            {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
              <div className="dungeon-panel p-5 sm:p-6 space-y-4">
                <div className="border-b border-stone-800 pb-3">
                  <h2 className="font-display text-base font-bold text-dungeon-parchment flex items-center gap-2">
                    <Clock className="h-4 w-4 text-torch-glow" />
                    <span>
                      Pedidos Pendentes ({incomingRequests.length} recebidos)
                    </span>
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Aceite convites de aliados para adicioná-los à sua Guilda de
                    Amigos.
                  </p>
                </div>

                {incomingRequests.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {incomingRequests.map((req) => (
                      <div
                        key={req.friendshipId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-torch/40 bg-dungeon-abyss/90 p-3.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GuildAvatar
                            avatarType={req.user.avatarType}
                            avatarUrl={req.user.avatarUrl}
                            oauthImage={req.user.image}
                            name={req.user.name}
                            size="md"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-bold text-dungeon-parchment">
                              {req.user.name || "Aventureiro"}
                            </p>
                            <p className="truncate font-mono text-xs text-torch-glow">
                              @{req.user.username}
                            </p>
                            <span className="text-[10px] text-amber-300">
                              Convite recebido
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={actionBusyId === req.friendshipId}
                            onClick={() =>
                              handleFriendshipAction(
                                req.friendshipId,
                                "ACCEPT"
                              )
                            }
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Aceitar</span>
                          </button>

                          <button
                            type="button"
                            disabled={actionBusyId === req.friendshipId}
                            onClick={() =>
                              handleFriendshipAction(
                                req.friendshipId,
                                "REJECT"
                              )
                            }
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-stone-700 bg-dungeon-stone px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-crimson/60 hover:text-red-300 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Recusar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {outgoingRequests.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Convites Enviados por Você ({outgoingRequests.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {outgoingRequests.map((req) => (
                        <div
                          key={req.friendshipId}
                          className="flex items-center justify-between gap-3 rounded-lg border border-stone-800 bg-dungeon-abyss/60 p-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <GuildAvatar
                              avatarType={req.user.avatarType}
                              avatarUrl={req.user.avatarUrl}
                              oauthImage={req.user.image}
                              name={req.user.name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-dungeon-parchment">
                                {req.user.name}
                              </p>
                              <p className="truncate font-mono text-[11px] text-torch-glow">
                                @{req.user.username}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={actionBusyId === req.friendshipId}
                            onClick={() =>
                              handleFriendshipAction(
                                req.friendshipId,
                                "REMOVE"
                              )
                            }
                            className="text-[11px] text-slate-400 hover:text-red-300"
                          >
                            Cancelar envio
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. SEÇÃO "GUILDA DE AMIGOS" */}
            <div className="dungeon-panel p-5 sm:p-6 space-y-4">
              <div className="border-b border-stone-800 pb-3">
                <h2 className="font-display text-base font-bold text-dungeon-parchment flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-torch-glow" />
                  <span>Guilda de Amigos ({friends.length})</span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Seus companheiros de aventura confirmados e disponibilidade de
                  mesa.
                </p>
              </div>

              {friends.length === 0 ? (
                <div className="rounded-lg border border-dashed border-stone-800 bg-dungeon-abyss/50 p-8 text-center space-y-2">
                  <UsersRound className="mx-auto h-7 w-7 text-slate-500" />
                  <p className="text-sm font-medium text-dungeon-parchment">
                    Sua Guilda de Amigos ainda está vazia
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Use a barra de busca acima para procurar seus amigos pelo{" "}
                    <span className="font-mono text-torch-glow">@nickname</span>{" "}
                    e enviar um convite de aliança!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {friends.map((entry) => (
                    <div
                      key={entry.friendshipId}
                      className="flex items-center justify-between gap-3 rounded-lg border border-stone-800 bg-dungeon-abyss/85 p-4 hover:border-torch/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <GuildAvatar
                          avatarType={entry.user.avatarType}
                          avatarUrl={entry.user.avatarUrl}
                          oauthImage={entry.user.image}
                          name={entry.user.name}
                          size="md"
                        />
                        <div className="min-w-0 space-y-1">
                          <div>
                            <p className="truncate font-display text-sm font-bold text-dungeon-parchment">
                              {entry.user.name || "Aventureiro"}
                            </p>
                            <p className="truncate font-mono text-xs text-torch-glow">
                              @{entry.user.username}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {renderPresenceBadge(entry.user.statusPresence)}
                            {entry.user.timezone && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                <Globe className="h-3 w-3" />
                                {entry.user.timezone.replace("America/", "")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={actionBusyId === entry.friendshipId}
                        onClick={() =>
                          handleFriendshipAction(entry.friendshipId, "REMOVE")
                        }
                        title="Remover da Guilda"
                        className="rounded-lg border border-stone-800 bg-dungeon-stone p-2 text-slate-400 hover:border-crimson/50 hover:text-red-300 transition-colors"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
