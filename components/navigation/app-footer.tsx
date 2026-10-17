import React from "react";
import Link from "next/link";
import Image from "next/image";

export function AppFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`border-t border-stone-800/80 bg-dungeon-abyss/90 py-4 px-4 text-center text-xs text-slate-400 ${className}`}
    >
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Image
            src="/d20-icon.png"
            alt="d20"
            width={16}
            height={16}
            className="h-4 w-4 object-contain"
          />
          <span className="font-display font-semibold text-dungeon-parchment">
            Dragões & Masmorras
          </span>
          <span className="text-slate-500">• Sistema de apoio D&D v.3.5</span>
        </div>

        <nav
          aria-label="Links legais e institucionais"
          className="flex flex-wrap items-center justify-center gap-4 text-xs"
        >
          <Link
            href="/"
            className="text-slate-400 hover:text-torch-glow transition-colors"
          >
            Início
          </Link>
          <Link
            href="/privacy"
            className="text-slate-400 hover:text-torch-glow transition-colors"
          >
            Política de privacidade
          </Link>
          <Link
            href="/terms"
            className="text-slate-400 hover:text-torch-glow transition-colors"
          >
            Termos de serviço
          </Link>
        </nav>
      </div>
    </footer>
  );
}
