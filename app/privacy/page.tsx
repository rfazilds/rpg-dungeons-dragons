import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Shield, ArrowLeft, Lock, Mail } from "lucide-react";
import { AppFooter } from "@/components/navigation/app-footer";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade e proteção de dados da plataforma Dragões & Masmorras (D&D 3.5).",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-dungeon-abyss text-dungeon-parchment">
      <header className="border-b border-stone-800/90 bg-dungeon-stone/90 px-4 py-3.5">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/d20-icon.png"
              alt="d20"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <span className="font-display text-sm sm:text-base font-bold tracking-wider text-dungeon-parchment">
              DRAGÕES & MASMORRAS
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-800 bg-dungeon-abyss px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-torch/50 hover:text-torch-glow transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar ao App</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="dungeon-panel p-5 sm:p-8 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-torch/40 bg-torch/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-torch-glow">
              <Lock className="h-3 w-3" /> Privacidade & Proteção de Dados (LGPD)
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-dungeon-parchment">
              Política de Privacidade
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Última atualização: 17 de outubro de 2026
            </p>
          </div>

          <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <h2 className="font-display text-base font-bold text-torch-glow">
              1. Visão Geral
            </h2>
            <p>
              A plataforma <strong>Dragões & Masmorras</strong> é uma ferramenta
              web de auxílio para mesas de RPG (Dungeons & Dragons Edição 3.5),
              projetada para criação e gerenciamento de fichas de personagens,
              cálculo de encontros e organização de sessões de jogo. Respeitamos
              integralmente a sua privacidade em conformidade com a Lei Geral de
              Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <h2 className="font-display text-base font-bold text-torch-glow">
              2. Dados Coletados
            </h2>
            <p>
              Coletamos apenas o mínimo estritamente necessário para autenticar
              sua conta e salvar suas fichas de personagem:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                <strong>Autenticação via Google OAuth:</strong> Ao optar por
                entrar com sua conta Google, recebemos apenas seu nome básico de
                perfil, endereço de e-mail e URL da foto de perfil pública
                fornecidos pelo Google. Não temos acesso à sua senha do Google
                nem a outros dados da sua conta.
              </li>
              <li>
                <strong>Autenticação por E-mail e Senha:</strong> Nome, endereço
                de e-mail e senha armazenada exclusivamente na forma de hash
                criptográfico (<code>bcrypt</code>).
              </li>
              <li>
                <strong>Dados de Jogo (RPG):</strong> Fichas de personagens,
                atributos, equipamentos e encontros de combate criados por você
                dentro da plataforma.
              </li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <h2 className="font-display text-base font-bold text-torch-glow">
              3. Finalidade e Armazenamento dos Dados
            </h2>
            <p>
              Os dados coletados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Identificar sua sessão e manter o isolamento seguro das suas fichas (multitenant por usuário).</li>
              <li>Sincronizar seus personagens e encontros no banco de dados PostgreSQL serverless (Neon) e no armazenamento local do seu navegador/celular.</li>
              <li>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros ou redes de publicidade.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <h2 className="font-display text-base font-bold text-torch-glow">
              4. Cookies Essenciais
            </h2>
            <p>
              Utilizamos apenas cookies técnicos de sessão (Auth.js / NextAuth)
              e armazenamento local (<code>localStorage</code>) estritamente
              necessários para manter você conectado e permitir que suas fichas
              funcionem com rapidez em conexões móveis.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <h2 className="font-display text-base font-bold text-torch-glow">
              5. Seus Direitos e Exclusão de Dados
            </h2>
            <p>
              Você pode visualizar, editar ou excluir qualquer ficha de
              personagem a qualquer momento diretamente pela interface do
              aplicativo. Caso deseje a exclusão completa da sua conta de
              usuário do banco de dados, basta entrar em contato pelo e-mail de
              suporte abaixo.
            </p>
          </section>

          <section className="rounded-xl border border-stone-800 bg-dungeon-abyss p-4 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2 font-display font-bold text-dungeon-parchment mb-1">
              <Mail className="h-4 w-4 text-torch-bright" />
              <span>Contato do Responsável / Suporte</span>
            </div>
            <p>
              Em caso de dúvidas sobre esta Política de Privacidade ou
              solicitações relativas aos seus dados, entre em contato pelo
              e-mail:{" "}
              <a
                href="mailto:rafaelaugusto.sobral@gmail.com"
                className="text-torch-glow underline"
              >
                rafaelaugusto.sobral@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
