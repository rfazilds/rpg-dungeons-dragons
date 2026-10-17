"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Swords,
  Sparkles,
  BookOpen,
  ArrowLeft,
  AlertCircle,
  Crown,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { createCampaignAction } from "@/lib/actions/campaigns";
import { DND_ADVENTURES } from "@/lib/dnd/data/adventures";

export default function CreateNewTablePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAdventureSlug, setSelectedAdventureSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImportAdventure(slug: string) {
    setSelectedAdventureSlug(slug);
    const adv = DND_ADVENTURES.find((a) => a.slug === slug);
    if (adv) {
      setName(adv.title);
      setDescription(
        `${adv.synopsis} (Aventura oficial D&D 3.5 • ${adv.levelRangeLabel} • Cenário: ${adv.setting})`
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await createCampaignAction({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (!res.success || !res.campaignId) {
        setError(res.error || "Não foi possível criar a mesa.");
        setSubmitting(false);
        return;
      }

      // Redireciona imediatamente para dentro da sala (/tables/[id]) com sinalizador de recém-criada
      router.push(`/tables/${res.campaignId}?created=1`);
    } catch {
      setError("Erro de conexão ao forjar a mesa.");
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <Breadcrumbs
        items={[
          { label: "Mesas", href: "/tables" },
          { label: "Criar nova mesa" },
        ]}
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="dungeon-panel p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-torch/40 bg-torch/10 px-2.5 py-0.5 text-[11px] font-semibold text-torch-glow">
                <Crown className="h-3.5 w-3.5" /> Forja de campanha do mestre
              </span>
              <h1 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-dungeon-parchment">
                Criar nova mesa de jogo
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
                Ao criar a sala, um código único de 6 caracteres será gerado
                automaticamente e você entrará direto na mesa.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-crimson/60 bg-crimson-blood/40 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 text-crimson-soft shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome da campanha ou mesa *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: A Cripta dos Esquecidos"
                className="carved-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Descrição breve ou sinopse da aventura (opcional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o gancho inicial da campanha, nível recomendado ou regras da mesa..."
                className="carved-input"
              />
            </div>

            {/* Importação opcional de uma das 16 Aventuras Canônicas de /assets/Aventuras */}
            <div className="rounded-xl border border-stone-800 bg-dungeon-abyss/80 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-torch-glow">
                <BookOpen className="h-4 w-4 text-torch-bright" />
                <span>
                  Importar módulo oficial D&D 3.5 (opcional — 16 aventuras)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Deseja mestrar uma das 16 aventuras prontas da biblioteca?
                Selecione abaixo para preencher o nome e a sinopse com 1 clique:
              </p>
              <select
                value={selectedAdventureSlug}
                onChange={(e) => handleImportAdventure(e.target.value)}
                className="carved-input text-xs"
              >
                <option value="">
                  — Campanha autoral personalizada (em branco) —
                </option>
                {DND_ADVENTURES.map((adv) => (
                  <option key={adv.slug} value={adv.slug}>
                    [{adv.levelRangeLabel}] {adv.title} ({adv.setting})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-800">
              <Link
                href="/tables"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-800 bg-dungeon-abyss px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar para mesas</span>
              </Link>

              <button
                type="submit"
                disabled={submitting || name.trim().length < 2}
                className="runic-button px-6 disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {submitting
                    ? "Forjando sala..."
                    : "Forjar mesa e abrir sala"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
