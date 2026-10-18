/**
 * Compêndio Rápido Canônico D&D 3.5 (Livro dos Monstros 3.5 & Livro do Jogador 3.5)
 * Estruturado de forma modular para busca e paginação de alta performance.
 */

import {
  ALL_DND35_MONSTERS,
  MONSTER_CR_BRACKET_OPTIONS,
  queryMonstersCatalog,
  matchesCrBracket,
  type DndMonsterEntry,
  type MonsterCrBracket,
} from "./monsters";

export {
  ALL_DND35_MONSTERS as DND_MONSTERS,
  MONSTER_CR_BRACKET_OPTIONS,
  queryMonstersCatalog,
  matchesCrBracket,
  type DndMonsterEntry,
  type MonsterCrBracket,
};

export interface DndSpellEntry {
  id: string;
  name: string;
  school: string;
  levelLabel: string;
  circle: number;
  components: string;
  castingTime: string;
  range: string;
  duration: string;
  savingThrow: string;
  spellResistance: string;
  summary: string;
}

export const DND_SPELLS: DndSpellEntry[] = [
  {
    id: "detectar-magia",
    name: "Detectar Magia",
    school: "Adivinhação",
    levelLabel: "Bardo 0, Clr 0, Drd 0, Fet/Mag 0",
    circle: 0,
    components: "V, G",
    castingTime: "1 ação padrão",
    range: "18 m (Cone)",
    duration: "Concentração, até 1 min/nível (D)",
    savingThrow: "Nenhum",
    spellResistance: "Não",
    summary:
      "Detecta auras mágicas em um cone de 18m. Na 1ª rodada revela presença; na 2ª quantidade e poder da aura mais forte; na 3ª a força e localização de cada aura (Identificar Magia CD 15 + nível da magia revela a escola).",
  },
  {
    id: "luz",
    name: "Luz",
    school: "Evocação [Luz]",
    levelLabel: "Bardo 0, Clr 0, Drd 0, Fet/Mag 0",
    circle: 0,
    components: "V, M/FD",
    castingTime: "1 ação padrão",
    range: "Toque",
    duration: "10 min/nível (D)",
    savingThrow: "Nenhum",
    spellResistance: "Não",
    summary:
      "Faz um objeto brilhar como uma tocha, iluminando claramente 6m de raio e fornecendo penumbra por mais 6m.",
  },
  {
    id: "misseis-magicos",
    name: "Mísseis Mágicos",
    school: "Evocação [Essência]",
    levelLabel: "Fet/Mag 1",
    circle: 1,
    components: "V, G",
    castingTime: "1 ação padrão",
    range: "Médio (30 m + 3 m/nível)",
    duration: "Instantânea",
    savingThrow: "Nenhum",
    spellResistance: "Sim",
    summary:
      "Dispara projéteis de energia arcana que atingem infalivelmente o alvo (1d4+1 de dano de essência por míssil). Ganha 1 míssil extra nos níveis 3, 5, 7 e 9 (máximo 5 mísseis no 9º nível).",
  },
  {
    id: "armadura-arcana",
    name: "Armadura Arcana",
    school: "Conjuração (Criação) [Essência]",
    levelLabel: "Fet/Mag 1",
    circle: 1,
    components: "V, G, F",
    castingTime: "1 ação padrão",
    range: "Toque",
    duration: "1 hora/nível (D)",
    savingThrow: "Vontade anula (inofensivo)",
    spellResistance: "Não",
    summary:
      "Um campo invisível mas tangível de força envolve o alvo, concedendo +4 de bônus de armadura na CA (inclusive contra ataques de toque incorpóreos).",
  },
  {
    id: "escudo-arcano",
    name: "Escudo Arcano",
    school: "Abjuração [Essência]",
    levelLabel: "Fet/Mag 1",
    circle: 1,
    components: "V, G",
    castingTime: "1 ação padrão",
    range: "Pessoal",
    duration: "1 min/nível (D)",
    savingThrow: "Nenhum",
    spellResistance: "Não",
    summary:
      "Cria um disco invisível de essência que concede +4 de bônus de escudo na CA (aplicável contra ataques incorpóreos) e anula completamente Mísseis Mágicos direcionados a você.",
  },
  {
    id: "sono",
    name: "Sono",
    school: "Encantamento (Compulsão) [Ação Mental]",
    levelLabel: "Bardo 1, Fet/Mag 1",
    circle: 1,
    components: "V, G, M",
    castingTime: "1 rodada completa",
    range: "Médio (30 m + 3 m/nível)",
    duration: "1 min/nível",
    savingThrow: "Vontade anula",
    spellResistance: "Sim",
    summary:
      "Faz cair em sono mágico até 4 DV de criaturas vivas numa explosão de 3m de raio, afetando primeiro as de menor DV.",
  },
  {
    id: "curar-ferimentos-leves",
    name: "Curar Ferimentos Leves",
    school: "Conjuração (Cura)",
    levelLabel: "Bardo 1, Clr 1, Drd 1, Pal 1, Rgr 2",
    circle: 1,
    components: "V, G",
    castingTime: "1 ação padrão",
    range: "Toque",
    duration: "Instantânea",
    savingThrow: "Vontade reduz à metade (inofensivo ou dano em mortos-vivos)",
    spellResistance: "Sim",
    summary:
      "Canaliza energia positiva que recupera 1d8 + 1 por nível de conjurador (máximo +5) Pontos de Vida em criaturas vivas (ou causa o mesmo dano a mortos-vivos).",
  },
  {
    id: "bencao",
    name: "Bênção",
    school: "Encantamento (Compulsão) [Ação Mental]",
    levelLabel: "Clr 1, Pal 1",
    circle: 1,
    components: "V, G, FD",
    castingTime: "1 ação padrão",
    range: "15 m (Explosão centrada em você)",
    duration: "1 min/nível",
    savingThrow: "Nenhum",
    spellResistance: "Sim (inofensivo)",
    summary:
      "Enche os aliados de coragem: cada aliado recebe +1 de bônus de moral nas jogadas de ataque e nos testes de resistência contra efeitos de medo.",
  },
  {
    id: "forca-do-touro",
    name: "Força do Touro",
    school: "Transmutação",
    levelLabel: "Clr 2, Drd 2, Fet/Mag 2, Pal 2",
    circle: 2,
    components: "V, G, M/FD",
    castingTime: "1 ação padrão",
    range: "Toque",
    duration: "1 min/nível",
    savingThrow: "Vontade anula (inofensivo)",
    spellResistance: "Sim (inofensivo)",
    summary:
      "A criatura tocada torna-se mais forte, recebendo +4 de bônus de aprimoramento em Força (+2 no ataque e dano corpo a corpo).",
  },
  {
    id: "bola-de-fogo",
    name: "Bola de Fogo",
    school: "Evocação [Fogo]",
    levelLabel: "Fet/Mag 3",
    circle: 3,
    components: "V, G, M",
    castingTime: "1 ação padrão",
    range: "Longo (120 m + 12 m/nível)",
    duration: "Instantânea",
    savingThrow: "Reflexos reduz à metade",
    spellResistance: "Sim",
    summary:
      "Detona uma explosão de chamas com 6m de raio que causa 1d6 pontos de dano de fogo por nível de conjurador (máximo 10d6) a todas as criaturas na área.",
  },
  {
    id: "relampago",
    name: "Relâmpago",
    school: "Evocação [Eletricidade]",
    levelLabel: "Fet/Mag 3",
    circle: 3,
    components: "V, G, M",
    castingTime: "1 ação padrão",
    range: "36 m (Linha)",
    duration: "Instantânea",
    savingThrow: "Reflexos reduz à metade",
    spellResistance: "Sim",
    summary:
      "Dispara uma poderosa descarga elétrica em linha de 36m causando 1d6 pontos de dano de eletricidade por nível de conjurador (máximo 10d6).",
  },
];
