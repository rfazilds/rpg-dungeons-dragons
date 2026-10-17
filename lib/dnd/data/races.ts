import type { DndRace } from "../types";

/**
 * Catálogo Canônico de Raças do Livro do Jogador D&D 3.5 (assets/Livro do Jogador D&D 3.5.pdf - Cap. 2)
 * Inclui modificadores exatos da 3.5, tamanho, deslocamento, visão, traços raciais,
 * classe favorecida e recomendações inteligentes para o Assistente de Criação.
 */
export const DND_RACES: DndRace[] = [
  {
    id: "humano",
    name: "Humano",
    pluralName: "Humanos",
    tagline: "Versáteis, ambiciosos e adaptáveis a qualquer vocação heroica.",
    description:
      "Os humanos são a raça mais adaptável, flexível e ambiciosa entre os povos comuns. Embora não possuam ajustes de atributo fixos, compensam com um Talento adicional no 1º nível e pontos de perícia extras em todos os níveis.",
    size: "Médio",
    speed: "9m",
    vision: "Normal",
    abilityModifiers: {},
    favoredClass: "Qualquer (a classe de nível mais alto)",
    extraFeatAtLevel1: true,
    extraSkillPointsAtLevel1: 4,
    extraSkillPointsPerLevel: 1,
    racialTraits: [
      "1 Talento adicional bônus no 1º nível",
      "+4 pontos de perícia adicionais no 1º nível e +1 ponto por nível subsequente",
      "Classe Favorecida: Qualquer (ignora a classe de maior nível para penalidades de multiclasse)",
    ],
    weaponProficiencies: [],
    skillBonuses: {},
    automaticLanguages: ["Comum"],
    bonusLanguages: [
      "Qualquer (exceto idiomas secretos, como o Druídico)",
    ],
    suggestedClasses: [
      {
        classId: "paladino",
        className: "Paladino",
        synergyBadge: "Talento Extra + Múltiplos Atributos",
        reason:
          "O Talento bônus de 1º nível e a ausência de penalidades de atributo ajudam o Paladino a equilibrar Força, Carisma e Sabedoria.",
      },
      {
        classId: "feiticeiro",
        className: "Feiticeiro",
        synergyBadge: "Versatilidade Arcana",
        reason:
          "Permite adquirir Foco em Magia ou Magias em Combate logo no 1º nível sem sacrificar Constituição ou Destreza.",
      },
      {
        classId: "guerreiro",
        className: "Guerreiro",
        synergyBadge: "Mestre de Combate (2 Talentos Nv 1)",
        reason:
          "Começa o 1º nível com 3 Talentos no total (1 base + 1 Humano + 1 bônus de Guerreiro), abrindo cadeias táticas completas imediatamente.",
      },
    ],
  },
  {
    id: "anao",
    name: "Anão",
    pluralName: "Anões",
    tagline: "Resilientes mestres da forja, da rocha e da guerra subterrânea.",
    description:
      "Conhecidos por sua eficiência militar, habilidade em mineração, metalurgia e resistência implacável contra venenos e magias. Mantêm seu deslocamento de 6m mesmo usando armaduras médias ou pesadas.",
    size: "Médio",
    speed: "6m",
    vision: "Visão no Escuro (18m)",
    abilityModifiers: {
      constitution: 2,
      charisma: -2,
    },
    favoredClass: "Guerreiro",
    racialTraits: [
      "+2 Constituição, -2 Carisma",
      "Deslocamento de 6m nunca é reduzido por armadura média/pesada ou carga média/pesada",
      "Visão no Escuro até 18 metros",
      "Ligação com Rochas (+2 em Procurar para notar trabalhos incomuns em pedra)",
      "Estabilidade (+4 de bônus racial para resistir a Encontrão ou Imobilização quando em pé no chão)",
      "+2 de bônus racial nos testes de resistência contra venenos",
      "+2 de bônus racial nos testes de resistência contra magias e efeitos similares a magia",
      "+1 de bônus racial nas jogadas de ataque contra orcs e goblinoides",
      "+4 de bônus de esquiva na CA contra monstros do tipo Gigante",
      "Familiaridade com Armas: Machado de Guerra Anão e Urgrosh Anão são consideradas armas marciais",
    ],
    weaponProficiencies: [
      "Machado de Guerra Anão (tratado como arma marcial)",
      "Urgrosh Anão (tratado como arma marcial)",
    ],
    skillBonuses: {
      avaliacao: 2,
      oficios: 2,
    },
    automaticLanguages: ["Comum", "Anão"],
    bonusLanguages: [
      "Gigante",
      "Gnomo",
      "Goblin",
      "Orc",
      "Terran",
      "Subterrâneo",
    ],
    suggestedClasses: [
      {
        classId: "guerreiro",
        className: "Guerreiro",
        synergyBadge: "Classe Favorecida + Alta Constituição",
        reason:
          "O bônus de +2 em Constituição, a estabilidade em combate e o deslocamento imune a armaduras pesadas tornam o Anão Guerreiro uma muralha na linha de frente.",
      },
      {
        classId: "clerigo",
        className: "Clérigo",
        synergyBadge: "Baluarte Divino",
        reason:
          "Alta vitalidade, uso de armaduras pesadas sem perda de deslocamento e +2 em testes de resistência contra magias combinam com o conjurador divino.",
      },
      {
        classId: "barbaro",
        className: "Bárbaro",
        synergyBadge: "Fúria Inabalável",
        reason:
          "A Constituição elevada prolonga a duração da Fúria Bárbara e maximiza os Pontos de Vida do Dado de Vida d12.",
      },
    ],
  },
  {
    id: "elfo",
    name: "Elfo",
    pluralName: "Elfos",
    tagline: "Graciosos arqueiros e estudiosos da arte arcana milenar.",
    description:
      "Seres longevos de sentidos aguçados, profundamente ligados às florestas e à magia arcana. Não dormem como humanos, meditando em transe por 4 horas diárias, e são imunes a efeitos mágicos de sono.",
    size: "Médio",
    speed: "9m",
    vision: "Visão na Penumbra",
    abilityModifiers: {
      dexterity: 2,
      constitution: -2,
    },
    favoredClass: "Mago",
    racialTraits: [
      "+2 Destreza, -2 Constituição",
      "Imunidade a magias e efeitos mágicos de sono",
      "+2 de bônus racial nos testes de resistência contra magias e efeitos de Encantamento",
      "Visão na Penumbra (enxerga duas vezes mais longe que um humano sob luz fraca)",
      "Proficiência automática com espada longa, sabre, arco longo e arco curto (inclusive compostos)",
      "+2 de bônus racial em Ouvir, Procurar e Observar",
      "Sentido para portas secretas: direito a teste automático de Procurar ao passar a até 1,5m de uma porta oculta",
    ],
    weaponProficiencies: [
      "Espada Longa",
      "Sabre",
      "Arco Longo",
      "Arco Longo Composto",
      "Arco Curto",
      "Arco Curto Composto",
    ],
    skillBonuses: {
      ouvir: 2,
      procurar: 2,
      observar: 2,
    },
    automaticLanguages: ["Comum", "Élfico"],
    bonusLanguages: [
      "Dracônico",
      "Gnoll",
      "Gnomo",
      "Goblin",
      "Orc",
      "Silvestre",
    ],
    suggestedClasses: [
      {
        classId: "mago",
        className: "Mago",
        synergyBadge: "Classe Favorecida + Precisão Arcana",
        reason:
          "Classe favorecida dos Elfos; o +2 em Destreza aumenta a CA, a Iniciativa e os ataques de toque à distância com raios mágicos.",
      },
      {
        classId: "ranger",
        className: "Ranger",
        synergyBadge: "Mestre Arqueiro Silvestre",
        reason:
          "Sinergia perfeita entre +2 Destreza, bônus em Observar/Ouvir e o Estilo de Combate de Arquearia do Ranger.",
      },
      {
        classId: "ladino",
        className: "Ladino",
        synergyBadge: "Sentidos Aguçados",
        reason:
          "A Destreza elevada e a detecção passiva de portas secretas (+2 Procurar/Ouvir/Observar) brilham na exploração de masmorras.",
      },
    ],
  },
  {
    id: "gnomo",
    name: "Gnomo",
    pluralName: "Gnomos",
    tagline: "Alquimistas engenhosos, ilusionistas natos e bardos curiosos.",
    description:
      "Pequenos, vigorosos e dotados de mente inventiva, os gnomos são famosos por seu talento com ilusões arcanas, alquimia e engenharia mecânica.",
    size: "Pequeno",
    speed: "6m",
    vision: "Visão na Penumbra",
    abilityModifiers: {
      constitution: 2,
      strength: -2,
    },
    favoredClass: "Bardo",
    racialTraits: [
      "+2 Constituição, -2 Força",
      "Tamanho Pequeno (+1 bônus de tamanho na CA, +1 nas jogadas de ataque, +4 em Esconder-se, -4 em Agarrar)",
      "Visão na Penumbra",
      "Familiaridade com Armas: Martelo com Gancho Gnomo é tratado como arma marcial",
      "+2 de bônus racial nos testes de resistência contra Ilusões",
      "+1 na CD dos testes de resistência contra magias de Ilusão conjuradas pelo gnomo",
      "+1 de bônus racial nas jogadas de ataque contra kobolds e goblinoides",
      "+4 de bônus de esquiva na CA contra monstros do tipo Gigante",
      "Habilidades Similares à Magia (1/dia com Car 10+): Falar com Animais (mamíferos de toca), Globos de Luz, Som Fantasma, Prestidigitação",
    ],
    weaponProficiencies: ["Martelo com Gancho Gnomo (tratado como arma marcial)"],
    skillBonuses: {
      ouvir: 2,
      oficios: 2, // Alquimia
    },
    automaticLanguages: ["Comum", "Gnomo"],
    bonusLanguages: [
      "Anão",
      "Dracônico",
      "Élfico",
      "Gigante",
      "Goblin",
      "Orc",
    ],
    suggestedClasses: [
      {
        classId: "bardo",
        className: "Bardo",
        synergyBadge: "Classe Favorecida + Ilusionista",
        reason:
          "Classe favorecida dos Gnomos; o +1 na CD de magias de Ilusão, o +1 de tamanho na CA e o +2 em Constituição tornam o Bardo Gnomo excelente em suporte.",
      },
      {
        classId: "mago",
        className: "Mago",
        synergyBadge: "Especialista em Ilusão",
        reason:
          "Tamanho Pequeno (+1 CA e +1 em ataques de toque) sem penalidade em Inteligência e com CD ampliada para magias da escola de Ilusão.",
      },
      {
        classId: "feiticeiro",
        className: "Feiticeiro",
        synergyBadge: "Conjurador Resiliente",
        reason:
          "Compensa o Dado de Vida d4 com +2 em Constituição e bônus de tamanho na CA.",
      },
    ],
  },
  {
    id: "meio-elfo",
    name: "Meio-Elfo",
    pluralName: "Meio-Elfos",
    tagline: "Embaixadores entre dois mundos, combinando graça élfica e diplomacia humana.",
    description:
      "Herdeiros do sangue humano e élfico, os meio-elfos possuem sentidos apurados, facilidade natural para negociações sociais e total liberdade de multiclasse.",
    size: "Médio",
    speed: "9m",
    vision: "Visão na Penumbra",
    abilityModifiers: {},
    favoredClass: "Qualquer (a classe de nível mais alto)",
    racialTraits: [
      "Imunidade a magias e efeitos mágicos de sono",
      "+2 de bônus racial nos testes de resistência contra magias e efeitos de Encantamento",
      "Visão na Penumbra",
      "+1 de bônus racial em Ouvir, Procurar e Observar",
      "+2 de bônus racial em Diplomacia e Obter Informação",
      "Sangue Élfico: considerado um elfo para todos os efeitos e itens relacionados à raça",
      "Classe Favorecida: Qualquer",
    ],
    weaponProficiencies: [],
    skillBonuses: {
      diplomacia: 2,
      obter_informacao: 2,
      ouvir: 1,
      procurar: 1,
      observar: 1,
    },
    automaticLanguages: ["Comum", "Élfico"],
    bonusLanguages: ["Qualquer (exceto idiomas secretos)"],
    suggestedClasses: [
      {
        classId: "bardo",
        className: "Bardo",
        synergyBadge: "Mestre da Diplomacia (+2 Social)",
        reason:
          "Os bônus nativos em Diplomacia e Obter Informação potencializam imediatamente o papel de porta-voz do grupo.",
      },
      {
        classId: "paladino",
        className: "Paladino",
        synergyBadge: "Líder Carismático",
        reason:
          "Sem penalidades de atributo, visão na penumbra, imunidade a sono e bônus em Diplomacia.",
      },
      {
        classId: "ranger",
        className: "Ranger",
        synergyBadge: "Batedor Versátil",
        reason:
          "Combina Visão na Penumbra, bônus em percepção e flexibilidade para qualquer estilo de combate.",
      },
    ],
  },
  {
    id: "meio-orc",
    name: "Meio-Orc",
    pluralName: "Meio-Orcs",
    tagline: "Força bruta descomunal e ferocidade indomável em combate corpo a corpo.",
    description:
      "Marcados por sua força física superior e visão no escuro, os meio-orcs destacam-se como combatentes implacáveis que esmagam defesas inimigas com armas de duas mãos.",
    size: "Médio",
    speed: "9m",
    vision: "Visão no Escuro (18m)",
    abilityModifiers: {
      strength: 2,
      intelligence: -2,
      charisma: -2,
    },
    favoredClass: "Bárbaro",
    racialTraits: [
      "+2 Força, -2 Inteligência (mínimo 3), -2 Carisma",
      "Visão no Escuro até 18 metros",
      "Sangue Orc: considerado um orc para todos os efeitos e itens relacionados à raça",
      "Classe Favorecida: Bárbaro",
    ],
    weaponProficiencies: [],
    skillBonuses: {},
    automaticLanguages: ["Comum", "Orc"],
    bonusLanguages: [
      "Abissal",
      "Anão",
      "Dracônico",
      "Gigante",
      "Gnoll",
      "Goblin",
    ],
    suggestedClasses: [
      {
        classId: "barbaro",
        className: "Bárbaro",
        synergyBadge: "Classe Favorecida + Força Máxima",
        reason:
          "A combinação de +2 em Força racial com a Fúria Bárbara (+4 For) permite alcançar até 24 de Força já no 1º nível.",
      },
      {
        classId: "guerreiro",
        className: "Guerreiro",
        synergyBadge: "Destruidor Corpo a Corpo",
        reason:
          "Maximiza o dano com armas de duas mãos (1,5x modificador de Força + Ataque Poderoso).",
      },
      {
        classId: "ranger",
        className: "Ranger",
        synergyBadge: "Caçador Implacável",
        reason:
          "Aproveita a Força superior e a Visão no Escuro para rastrear e abater presas em masmorras subterrâneas.",
      },
    ],
  },
  {
    id: "halfling",
    name: "Halfling",
    pluralName: "Halflings",
    tagline: "Ágeis, destemidos e abençoados com uma sorte lendária.",
    description:
      "Oportunistas audaciosos e viajantes incansáveis, os halflings usam seu tamanho reduzido, reflexos rápidos e sorte natural para escapar de perigos mortais.",
    size: "Pequeno",
    speed: "6m",
    vision: "Normal",
    abilityModifiers: {
      dexterity: 2,
      strength: -2,
    },
    favoredClass: "Ladino",
    racialTraits: [
      "+2 Destreza, -2 Força",
      "Tamanho Pequeno (+1 bônus de tamanho na CA, +1 nas jogadas de ataque, +4 em Esconder-se, -4 em Agarrar)",
      "+1 de bônus racial em TODOS os testes de resistência (Fortitude, Reflexos e Vontade)",
      "+2 de bônus de moral nos testes de resistência contra medo (acumula com o +1 geral)",
      "+1 de bônus racial nas jogadas de ataque com armas de arremesso e fundas",
      "+2 de bônus racial em Escalar, Furtividade, Ouvir e Saltar",
      "Classe Favorecida: Ladino",
    ],
    weaponProficiencies: [],
    skillBonuses: {
      escalar: 2,
      furtividade: 2,
      ouvir: 2,
      saltar: 2,
      esconder_se: 4, // Bônus de tamanho Pequeno
    },
    automaticLanguages: ["Comum", "Halfling"],
    bonusLanguages: ["Anão", "Élfico", "Gnomo", "Goblin", "Orc"],
    suggestedClasses: [
      {
        classId: "ladino",
        className: "Ladino",
        synergyBadge: "Classe Favorecida + Furtividade Suprema",
        reason:
          "Começa com +6 de bônus natural em Esconder-se (+4 tamanho, +2 Des) e +3 em Furtividade antes mesmo de investir graduações.",
      },
      {
        classId: "monge",
        className: "Monge",
        synergyBadge: "Esquiva + Resistências Totais",
        reason:
          "O +1 racial em todas as resistências somado às três resistências boas do Monge e +1 de tamanho na CA cria um combatente dificílimo de atingir.",
      },
      {
        classId: "feiticeiro",
        className: "Feiticeiro",
        synergyBadge: "Artilheiro Arcano Ágil",
        reason:
          "Ganha +2 nas jogadas de ataque de toque à distância (+1 tamanho, +1 Des) e +2 na CA sem depender de armaduras.",
      },
    ],
  },
];

export function getRaceById(raceId: string): DndRace | undefined {
  return DND_RACES.find((r) => r.id === raceId);
}
