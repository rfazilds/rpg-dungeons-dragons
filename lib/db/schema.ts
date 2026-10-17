import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  primaryKey,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ============================================================================
// ENUMS DO BANCO DE DADOS (FASE 2 — VERIFICAÇÃO & COMUNIDADE)
// ============================================================================

export const verificationCodeTypeEnum = pgEnum("verification_code_type", [
  "REGISTER",
  "CHANGE_EMAIL",
]);

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "PENDING",
  "ACCEPTED",
  "BLOCKED",
]);

// ============================================================================
// TIPOS AUXILIARES JSONB (FICHA CANÔNICA D&D 3.5)
// ============================================================================

export interface CharacterSkillEntry {
  ranks: number;         // Graduações investidas na perícia
  isClassSkill: boolean; // Perícia de classe (custo 1 pt/graduação) vs outra classe (2 pts)
  miscMod: number;       // Outros modificadores (sinergia, talento, racial, item)
}

export interface CharacterAttackEntry {
  id: string;
  name: string;
  attackBonus: string; // Ex: "+4" ou "+6/+1"
  damage: string;      // Ex: "1d8+3"
  critical: string;    // Ex: "19-20/x2" ou "x3"
  range: string;       // Ex: "Corpo a corpo" ou "18m"
  damageType: string;  // Ex: "Cortante", "Perfurante", "Contusão"
  ammo?: number;
  notes?: string;
}

export interface SpellLevelSlot {
  max: number;
  used: number;
  bonusSpells: number;
  saveDc: number;
  preparedOrKnown: string[];
}

export type CharacterSpellbook = Record<
  "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9",
  SpellLevelSlot
>;

export interface CharacterEquipmentData {
  armor?: {
    name: string;
    type: "Leve" | "Média" | "Pesada";
    acBonus: number;
    maxDex: number;
    checkPenalty: number;
    spellFailure: number;
    speed: string;
    weight: number;
  };
  shield?: {
    name: string;
    acBonus: number;
    checkPenalty: number;
    spellFailure: number;
    weight: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    weight: number;
    notes?: string;
  }>;
  currency: {
    pc: number; // Peças de Cobre
    pp: number; // Peças de Prata
    po: number; // Peças de Ouro
    pl: number; // Peças de Platina
  };
}

export interface CombatantEntry {
  id: string;
  name: string;
  type: "player" | "monster" | "npc";
  initiative: number;
  initiativeMod: number;
  armorClass: number;
  currentHp: number;
  maxHp: number;
  challengeRating?: string; // ND (ex: "1/2", "1", "5")
  conditions: string[];
}

// ============================================================================
// 1. TABELAS DE AUTENTICAÇÃO E IDENTIDADE (AUTH.JS v5 + PERFIL DA GUILDA)
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", {
    withTimezone: true,
    mode: "date",
  }),
  passwordHash: text("password_hash"), // Nulo caso conta seja exclusiva via Google OAuth
  image: text("image"),
  avatarType: varchar("avatar_type", { length: 50 })
    .default("preset")
    .notNull(), // 'oauth' | 'preset_warrior' | 'preset_mage' | 'preset_rogue' | 'preset_cleric' | 'preset_d20' | 'preset'
  avatarUrl: text("avatar_url"),
  statusPresence: varchar("status_presence", { length: 20 })
    .default("offline")
    .notNull(), // 'online' | 'in_game' | 'away' | 'offline'
  timezone: varchar("timezone", { length: 50 })
    .default("America/Sao_Paulo")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ============================================================================
// 2. TABELA DE CÓDIGOS DE VERIFICAÇÃO POR E-MAIL (6 DÍGITOS / RESEND)
// ============================================================================

export const emailVerificationCodes = pgTable(
  "email_verification_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    code: varchar("code", { length: 6 }).notNull(),
    type: verificationCodeTypeEnum("type").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("email_verification_codes_user_id_idx").on(table.userId),
    index("email_verification_codes_email_idx").on(table.email),
  ]
);

// ============================================================================
// 3. TABELA DE AMIZADES (REDE DE COMUNIDADE & MULTIPLAYER)
// ============================================================================

export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    friendId: uuid("friend_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendshipStatusEnum("status").default("PENDING").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("friendships_user_friend_unique_idx").on(
      table.userId,
      table.friendId
    ),
    index("friendships_user_id_idx").on(table.userId),
    index("friendships_friend_id_idx").on(table.friendId),
  ]
);

// ============================================================================
// 4. TABELA DE PERSONAGENS (D&D 3.5 — MULTITENANT POR USER_ID)
// ============================================================================

export const characters = pgTable(
  "characters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Cabeçalho da Planilha D&D 3.5 (assets/ficha-personagem-dnd-35.pdf)
    name: text("name").notNull(),
    race: text("race").notNull(),                        // ID/Nome da Raça (ex: "anao", "elfo")
    class: text("class").notNull(),                      // ID/Nome da Classe (ex: "guerreiro", "mago")
    level: integer("level").default(1).notNull(),
    alignment: text("alignment").default("N").notNull(), // LB, NB, CB, LN, N, CN, LM, NM, CM
    deity: text("deity").default(""),
    background: text("background").default(""),          // Antecedente / Origem regional
    size: text("size").default("Médio").notNull(),       // "Pequeno" | "Médio"
    experiencePoints: integer("experience_points").default(0).notNull(),

    // Atributos Finais (Já somados aos Modificadores Raciais D&D 3.5)
    strength: integer("strength").default(10).notNull(),
    dexterity: integer("dexterity").default(10).notNull(),
    constitution: integer("constitution").default(10).notNull(),
    intelligence: integer("intelligence").default(10).notNull(),
    wisdom: integer("wisdom").default(10).notNull(),
    charisma: integer("charisma").default(10).notNull(),
    rollMethod: text("roll_method").default("virtual").notNull(), // "virtual" | "physical"

    // Vitalidade, Combate e Defesa (D&D 3.5)
    maxHp: integer("max_hp").default(10).notNull(),
    currentHp: integer("current_hp").default(10).notNull(),
    nonlethalDamage: integer("nonlethal_damage").default(0).notNull(), // Dano por Contusão
    armorClass: integer("armor_class").default(10).notNull(),
    touchArmorClass: integer("touch_armor_class").default(10).notNull(), // CA de Toque
    flatFootedArmorClass: integer("flat_footed_armor_class").default(10).notNull(), // CA Surpresa
    speed: text("speed").default("9m").notNull(), // Deslocamento (6m ou 9m)
    baseAttackBonus: integer("base_attack_bonus").default(0).notNull(), // BBA
    spellResistance: integer("spell_resistance").default(0).notNull(),  // RM
    damageReduction: text("damage_reduction").default(""),              // RD (ex: "2/-")

    // Modificadores Extras de Testes de Resistência (Fortitude, Reflexos, Vontade)
    fortitudeMisc: integer("fortitude_misc").default(0).notNull(),
    reflexMisc: integer("reflex_misc").default(0).notNull(),
    willMisc: integer("will_misc").default(0).notNull(),

    // Estruturas Ricas da Ficha 3.5 (JSONB)
    skills: jsonb("skills").$type<Record<string, CharacterSkillEntry>>().default({}).notNull(),
    feats: jsonb("feats").$type<string[]>().default([]).notNull(), // Talentos
    specialAbilities: jsonb("special_abilities").$type<string[]>().default([]).notNull(), // Traços Raciais & Habilidades de Classe
    proficiencies: jsonb("proficiencies").$type<string[]>().default([]).notNull(),
    languages: jsonb("languages").$type<string[]>().default(["Comum"]).notNull(),
    attacks: jsonb("attacks").$type<CharacterAttackEntry[]>().default([]).notNull(),
    spellSlots: jsonb("spell_slots").$type<CharacterSpellbook>().default({
      "0": { max: 0, used: 0, bonusSpells: 0, saveDc: 10, preparedOrKnown: [] },
      "1": { max: 0, used: 0, bonusSpells: 0, saveDc: 11, preparedOrKnown: [] },
      "2": { max: 0, used: 0, bonusSpells: 0, saveDc: 12, preparedOrKnown: [] },
      "3": { max: 0, used: 0, bonusSpells: 0, saveDc: 13, preparedOrKnown: [] },
      "4": { max: 0, used: 0, bonusSpells: 0, saveDc: 14, preparedOrKnown: [] },
      "5": { max: 0, used: 0, bonusSpells: 0, saveDc: 15, preparedOrKnown: [] },
      "6": { max: 0, used: 0, bonusSpells: 0, saveDc: 16, preparedOrKnown: [] },
      "7": { max: 0, used: 0, bonusSpells: 0, saveDc: 17, preparedOrKnown: [] },
      "8": { max: 0, used: 0, bonusSpells: 0, saveDc: 18, preparedOrKnown: [] },
      "9": { max: 0, used: 0, bonusSpells: 0, saveDc: 19, preparedOrKnown: [] },
    }).notNull(),
    equipment: jsonb("equipment")
      .$type<CharacterEquipmentData>()
      .default({
        items: [],
        currency: { pc: 0, pp: 0, po: 100, pl: 0 },
      })
      .notNull(),
    notes: text("notes").default(""),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("characters_user_id_idx").on(table.userId)]
);

// ============================================================================
// 5. TABELA DE ENCONTROS DE COMBATE DO MESTRE (DM SCREEN)
// ============================================================================

export const combatEncounters = pgTable(
  "combat_encounters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    adventureSlug: text("adventure_slug"), // Referência opcional às 16 aventuras de /assets/Aventuras
    round: integer("round").default(1).notNull(),
    activeTurnIndex: integer("active_turn_index").default(0).notNull(),
    partySize: integer("party_size").default(4).notNull(),
    partyLevel: integer("party_level").default(1).notNull(),
    combatants: jsonb("combatants").$type<CombatantEntry[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("combat_encounters_user_id_idx").on(table.userId)]
);

// ============================================================================
// RELAÇÕES DRIZZLE ORM
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  characters: many(characters),
  combatEncounters: many(combatEncounters),
  emailVerificationCodes: many(emailVerificationCodes),
  sentFriendRequests: many(friendships, { relationName: "sentFriendships" }),
  receivedFriendRequests: many(friendships, {
    relationName: "receivedFriendships",
  }),
}));

export const emailVerificationCodesRelations = relations(
  emailVerificationCodes,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerificationCodes.userId],
      references: [users.id],
    }),
  })
);

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  sender: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "sentFriendships",
  }),
  receiver: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "receivedFriendships",
  }),
}));

export const charactersRelations = relations(characters, ({ one }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
}));

export const combatEncountersRelations = relations(
  combatEncounters,
  ({ one }) => ({
    user: one(users, {
      fields: [combatEncounters.userId],
      references: [users.id],
    }),
  })
);
