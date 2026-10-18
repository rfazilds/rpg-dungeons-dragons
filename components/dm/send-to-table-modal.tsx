"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Swords,
  X,
  Minus,
  Plus,
  Crown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  EyeOff,
} from "lucide-react";
import type { DndMonsterEntry } from "@/lib/dnd/data/monsters";
import {
  getActiveDmTablesAction,
  sendMonstersToTableAction,
} from "@/lib/actions/campaigns";

interface SendToTableModalProps {
  monster: DndMonsterEntry | null;
  defaultCampaignId?: string;
  onClose: () => void;
  onSuccessToast: (message: string) => void;
}

export function SendToTableModal({
  monster,
  defaultCampaignId,
  onClose,
  onSuccessToast,
}: SendToTableModalProps) {
  const [loadingTables, setLoadingTables] = useState(true);
  const [tables, setTables] = useState<
    Array<{ id: string; code: string; name: string; description: string }>
  >([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    defaultCampaignId || ""
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [faction, setFaction] = useState<"ENEMY" | "NEUTRAL" | "ALLY">("ENEMY");
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!monster) return;
    let active = true;
    setLoadingTables(true);
    setError(null);
    setQuantity(1);
    setFaction("ENEMY");
    setIsHidden(false);

    getActiveDmTablesAction()
      .then((res) => {
        if (!active) return;
        setTables(res.tables || []);
        if (defaultCampaignId) {
          setSelectedCampaignId(defaultCampaignId);
        } else if (res.tables && res.tables.length > 0) {
          setSelectedCampaignId(res.tables[0].id);
        }
      })
      .catch(() => {
        if (active) setError("Erro ao buscar suas mesas ativas.");
      })
      .finally(() => {
        if (active) setLoadingTables(false);
      });

    return () => {
      active = false;
    };
  }, [monster, defaultCampaignId]);

  if (!monster) return null;

  function adjustQuantity(delta: number) {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)));
  }

  async function handleConfirmSend(e: React.FormEvent) {
    e.preventDefault();
    if (!monster || !selectedCampaignId) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await sendMonstersToTableAction({
        campaignId: selectedCampaignId,
        monsterId: monster.id,
        quantity,
        faction,
        isHiddenFromPlayers: isHidden,
      });

      if (!res.success) {
        setError(res.error || "Não foi possível enviar a criatura.");
        return;
      }

      onSuccessToast(
        `${res.addedCount}x ${res.monsterName} adicionado(s) com sucesso ao combate da mesa ${res.campaignName}`
      );
      onClose();
    } catch {
      setError("Falha de conexão ao enviar criaturas para a mesa.");
    } finally {
      setSubmitting(false);
    }
  }

  const previewNames =
    quantity === 1
      ? [monster.name]
      : Array.from({ length: quantity }, (_, i) => `${monster.name} ${i + 1}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="dungeon-panel w-full max-w-md p-5 space-y-4 border-torch/40 shadow-torch-glow">
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-3">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-torch-glow">
              <Swords className="h-3.5 w-3.5" /> Integração compêndio ↔ mesa
            </span>
            <h3 className="font-display text-base sm:text-lg font-bold text-dungeon-parchment">
              Enviar para mesa de jogo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Resumo da Criatura Selecionada */}
        <div className="rounded-xl border border-stone-800 bg-dungeon-abyss p-3 flex items-center justify-between gap-2">
          <div>
            <p className="font-display text-sm font-bold text-dungeon-parchment">
              {monster.name}
            </p>
            <p className="text-[11px] text-slate-400">
              {monster.sizeAndType} • PV {monster.hp} • CA {monster.acValue}
            </p>
          </div>
          <span className="rounded border border-crimson/40 bg-crimson-blood/40 px-2 py-0.5 font-mono text-xs font-bold text-crimson-soft shrink-0">
            ND {monster.challengeRating}
          </span>
        </div>

        {loadingTables ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-torch-bright" />
            <span>Buscando suas mesas ativas como Mestre...</span>
          </div>
        ) : tables.length === 0 ? (
          /* Aviso caso o usuário não tenha mesas ativas como DM */
          <div className="rounded-xl border border-torch/40 bg-torch/10 p-4 space-y-3 text-center">
            <AlertCircle className="h-6 w-6 text-torch-bright mx-auto" />
            <p className="text-xs sm:text-sm text-dungeon-parchment leading-relaxed">
              Você não possui nenhuma mesa ativa como Mestre. Crie uma mesa no
              menu Mesas primeiro.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Link href="/tables/new" className="runic-button text-xs">
                <Crown className="h-3.5 w-3.5" />
                <span>Criar nova mesa agora</span>
              </Link>
              <Link
                href="/tables"
                className="rounded-lg border border-stone-700 bg-dungeon-abyss px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Ir para o menu Mesas
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmSend} className="space-y-4">
            {/* 1. Seletor de Mesas Ativas onde o usuário é Mestre */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mesa ativa de destino (você como Mestre)
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="carved-input text-xs font-semibold"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Código: {t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Seletor de Quantidade (1 a 10 cópias) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Quantidade de cópias no encontro (1 a 10)
                </label>
                <span className="font-mono text-xs font-bold text-torch-glow">
                  {quantity}x criatura(s)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustQuantity(-1)}
                  disabled={quantity <= 1}
                  className="h-10 w-10 flex items-center justify-center rounded-lg border border-stone-700 bg-dungeon-abyss text-slate-200 hover:border-torch/50 disabled:opacity-40"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1))
                    )
                  }
                  className="carved-input text-center font-mono text-base font-bold text-torch-glow"
                />

                <button
                  type="button"
                  onClick={() => adjustQuantity(1)}
                  disabled={quantity >= 10}
                  className="h-10 w-10 flex items-center justify-center rounded-lg border border-stone-700 bg-dungeon-abyss text-slate-200 hover:border-torch/50 disabled:opacity-40"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Prévia dos registros numerados */}
              <div className="mt-2 rounded-lg border border-stone-800 bg-dungeon-abyss/80 p-2 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">
                  Registros em combate:{" "}
                </span>
                <span className="font-mono text-torch-glow">
                  {previewNames.slice(0, 4).join(", ")}
                  {previewNames.length > 4
                    ? ` ... (+${previewNames.length - 4})`
                    : ""}
                </span>
              </div>
            </div>

            {/* 3. Facção e Visibilidade Opcional */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "ENEMY", label: "Inimigo" },
                { id: "NEUTRAL", label: "Neutro" },
                { id: "ALLY", label: "Aliado" },
              ].map((fac) => (
                <button
                  key={fac.id}
                  type="button"
                  onClick={() =>
                    setFaction(fac.id as "ENEMY" | "NEUTRAL" | "ALLY")
                  }
                  className={`min-h-[34px] rounded-lg border text-xs font-semibold transition-colors ${
                    faction === fac.id
                      ? "border-torch-bright bg-torch/20 text-torch-glow"
                      : "border-stone-800 bg-dungeon-abyss text-slate-400"
                  }`}
                >
                  {fac.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                className="rounded border-stone-700 bg-dungeon-abyss text-torch focus:ring-torch"
              />
              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
              <span>Inserir oculto dos jogadores (emboscada)</span>
            </label>

            {error && (
              <div className="rounded-lg border border-crimson/50 bg-crimson-blood/25 p-2.5 text-xs text-crimson-soft">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-800 bg-dungeon-stone px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedCampaignId}
                className="runic-button text-xs py-2 px-4 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Confirmar envio ({quantity}x)
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
