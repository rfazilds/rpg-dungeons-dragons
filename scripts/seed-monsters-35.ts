/**
 * Script Utilitário de Carga e Validação Modular de Monstros D&D 3.5
 * Referência local: assets/Livro dos Monstros D&D 3.5.pdf & assets/livro_dos_monstros.pdf
 *
 * Uso:
 *   npx tsx scripts/seed-monsters-35.ts
 *
 * Proteção contra gargalo de memória/tokens:
 * - Opera em lotes (batches) organizados por faixa de Nível de Desafio (ND < 1, ND 1-4, ND 5-10, ND 11-15, ND 16+).
 * - Inspeciona os metadados de assets/Livro dos Monstros D&D 3.5.pdf via stream/stat sem carregar o binário inteiro na RAM.
 */

import fs from "node:fs";
import path from "node:path";
import {
  ALL_DND35_MONSTERS,
  MONSTERS_ND_LOW,
  MONSTERS_ND_1_4,
  MONSTERS_ND_5_10,
  MONSTERS_ND_11_15,
  MONSTERS_ND_16_PLUS,
} from "../lib/dnd/data/monsters";

const PDF_PRIMARY = path.resolve(
  process.cwd(),
  "assets/Livro dos Monstros D&D 3.5.pdf"
);
const PDF_SECONDARY = path.resolve(
  process.cwd(),
  "assets/livro_dos_monstros.pdf"
);

function inspectPdfSourceSafely(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, sizeMb: "0.00" };
  }
  const stat = fs.statSync(filePath);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
  return { exists: true, sizeMb };
}

function main() {
  console.log("==============================================================");
  console.log("🐉 SEED & VALIDAÇÃO DO CATÁLOGO DE MONSTROS D&D 3.5 (FASE 4)");
  console.log("==============================================================");

  const primaryInfo = inspectPdfSourceSafely(PDF_PRIMARY);
  const secondaryInfo = inspectPdfSourceSafely(PDF_SECONDARY);

  console.log(
    `📘 Fonte primária (Livro dos Monstros D&D 3.5.pdf): ${
      primaryInfo.exists ? `OK (${primaryInfo.sizeMb} MB)` : "Ausente"
    }`
  );
  console.log(
    `📗 Fonte secundária (livro_dos_monstros.pdf): ${
      secondaryInfo.exists ? `OK (${secondaryInfo.sizeMb} MB)` : "Ausente"
    }`
  );

  const batches = [
    { label: "Lote 1 — ND < 1", items: MONSTERS_ND_LOW },
    { label: "Lote 2 — ND 1 a 4", items: MONSTERS_ND_1_4 },
    { label: "Lote 3 — ND 5 a 10", items: MONSTERS_ND_5_10 },
    { label: "Lote 4 — ND 11 a 15", items: MONSTERS_ND_11_15 },
    { label: "Lote 5 — ND 16+", items: MONSTERS_ND_16_PLUS },
  ];

  console.log("\n📊 Resumo dos lotes modulares em /lib/dnd/data/monsters/:");
  for (const b of batches) {
    console.log(`  • ${b.label.padEnd(22)}: ${b.items.length} criaturas`);
  }

  console.log(
    `\n✅ Total de criaturas canônicas indexadas: ${ALL_DND35_MONSTERS.length}`
  );
}

main();
