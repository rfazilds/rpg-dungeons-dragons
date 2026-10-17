"use client";

import React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const normalizedItems: BreadcrumbItem[] =
    items[0]?.href === "/dashboard"
      ? items
      : [{ label: "Salão principal", href: "/dashboard" }, ...items];

  return (
    <nav
      aria-label="Navegação estrutural"
      className={`mb-3.5 flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-800/80 bg-dungeon-stone/75 px-3 py-1.5 text-xs ${className}`}
    >
      {normalizedItems.map((item, idx) => {
        const isLast = idx === normalizedItems.length - 1;
        const isHome = idx === 0 && item.href === "/dashboard";

        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && (
              <span
                aria-hidden="true"
                className="select-none px-0.5 font-mono text-sm font-bold text-stone-600"
              >
                ›
              </span>
            )}

            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1.5 text-slate-400 transition-colors hover:text-torch-glow"
              >
                {isHome && <Compass className="h-3.5 w-3.5 text-slate-400" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className="inline-flex items-center gap-1.5 font-semibold text-torch-glow truncate max-w-[260px] sm:max-w-[420px]"
              >
                {isHome && <Compass className="h-3.5 w-3.5 text-torch-bright" />}
                <span className="truncate">{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
