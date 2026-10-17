import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, ScrollText, Mail } from "lucide-react";
import { AppFooter } from "@/components/navigation/app-footer";

export const metadata: Metadata = {
  title: "Termos de serviço",
  description:
    "Termos de serviço e condições de uso da plataforma Dragões & Masmorras (D&D 3.5).",
};

export default function TermsOfServicePage() {
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
            <span>Voltar ao app</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="dungeon-panel p-5 sm:p-8 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-torch/40 bg-torch/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-torch-glow">
              <ScrollText className="h-3 w-3" /> Regras de utilização da plataforma
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-dungeon-parchment">
              Termos de serviço
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Última atualização: 17 de outubro de 2026
            </p>
          </div>

          <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <h2 className="font-display text-base font-bold text-torch-glow">
              1. Aceitação dos termos
            </h2>
            <p>
              Ao acessar e utilizar a plataforma <strong>Dragões & Masmorras</strong>,
              você concorda com estes termos de serviço. O sistema foi criado
              como ferramenta digital gratuita de apoio para jogadores e mestres
              em sessões de RPG de mesa.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <h2 className="font-display text-base font-bold text-torch-glow">
              2. Uso da plataforma e conta do usuário
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                Você pode acessar a plataforma utilizando sua conta Google
                (OAuth 2.0) ou criando uma conta com e-mail e senha.
              </li>
              <li>
                Você é responsável por manter a segurança de suas credenciais de
                acesso e pelo conteúdo inserido nas suas fichas de personagem e
                notas de campanha.
              </li>
              <li>
                É proibido utilizar a plataforma para fins ilícitos, tentativas
                de invasão, sobrecarga deliberada do servidor ou distribuição de
                conteúdo malicioso.
              </li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <h2 className="font-display text-base font-bold text-torch-glow">
              3. Propriedade intelectual e referências de sistema (D&D 3.5 / SRD)
            </h2>
            <p>
              <strong>Dragões & Masmorras</strong> é um projeto independente de
              auxílio a mesas de jogo baseado nas mecânicas do System Reference
              Document (SRD v3.5 / Open Game License). Marcas citadas como{" "}
              <em>Dungeons & Dragons</em> e <em>Wizards of the Coast</em>{" "}
              pertencem aos seus respectivos titulares e são referenciadas
              exclusivamente para fins recreativos e de compatibilidade de
              regras em mesa pessoal.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <h2 className="font-display text-base font-bold text-torch-glow">
              4. Disponibilidade do serviço
            </h2>
            <p>
              O serviço é fornecido &ldquo;no estado em que se encontra&rdquo;
              (<em>as is</em>), podendo receber melhorias, atualizações de
              regras ou manutenções periódicas sem aviso prévio.
            </p>
          </section>

          <section className="rounded-xl border border-stone-800 bg-dungeon-abyss p-4 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2 font-display font-bold text-dungeon-parchment mb-1">
              <Mail className="h-4 w-4 text-torch-bright" />
              <span>Contato e suporte</span>
            </div>
            <p>
              Dúvidas sobre estes termos de serviço podem ser enviadas para:{" "}
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
