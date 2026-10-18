"use server";

import { cookies } from "next/headers";
import { and, desc, eq, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  campaigns,
  campaignMembers,
  campaignMessages,
  tableCombatants,
  characters,
  users,
  type CharacterAttackEntry,
  type CharacterSkillEntry,
  type CharacterSpellbook,
  type CharacterEquipmentData,
  type MonsterStatBlockJson,
} from "@/lib/db/schema";
import { generateSixCharCode } from "@/lib/email/verification";
import {
  ALL_DND35_MONSTERS,
  queryMonstersCatalog,
  type DndMonsterEntry,
  type MonsterCrBracket,
} from "@/lib/dnd/data/monsters";

export interface ClientCharacterInput {
  id?: string;
  name: string;
  race: string;
  class: string;
  level: number;
  alignment?: string;
  deity?: string;
  background?: string;
  size?: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  touchArmorClass?: number;
  flatFootedArmorClass?: number;
  speed?: string;
  baseAttackBonus?: number;
  fortitudeMisc?: number;
  reflexMisc?: number;
  willMisc?: number;
  skills?: Record<string, CharacterSkillEntry>;
  feats?: string[];
  specialAbilities?: string[];
  attacks?: CharacterAttackEntry[];
  spellSlots?: CharacterSpellbook;
  equipment?: CharacterEquipmentData;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveCurrentGuildUser() {
  const session = await auth();

  if (session?.user?.id) {
    const [byId] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (byId) return byId;
  }

  if (session?.user?.email) {
    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);
    if (byEmail) return byEmail;
  }

  // Suporte ao modo rápido de mesa (cookie sanctum_mesa_session)
  const cookieStore = await cookies();
  const hasMesaCookie = Boolean(
    cookieStore.get("sanctum_mesa_session")?.value
  );

  if (hasMesaCookie) {
    const demoEmail = "aventureiro.mesa@guilda.local";
    const [existingDemo] = await db
      .select()
      .from(users)
      .where(eq(users.email, demoEmail))
      .limit(1);

    if (existingDemo) return existingDemo;

    const [createdDemo] = await db
      .insert(users)
      .values({
        username: "aventureiro_mesa",
        name: "Aventureiro da Mesa",
        email: demoEmail,
        emailVerified: new Date(),
        avatarType: "preset_d20",
        statusPresence: "online",
      })
      .returning();

    return createdDemo;
  }

  return null;
}

async function generateUniqueCampaignCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = generateSixCharCode();
    const [existing] = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.code, candidate))
      .limit(1);
    if (!existing) {
      return candidate;
    }
  }
  return generateSixCharCode();
}

export async function getUserCampaignsAction() {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return {
      authenticated: false,
      asDm: [],
      asPlayer: [],
      currentUser: null,
    };
  }

  // 1. Campanhas criadas pelo usuário como Mestre
  const dmCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.dmId, user.id))
    .orderBy(desc(campaigns.createdAt));

  const asDm = await Promise.all(
    dmCampaigns.map(async (camp) => {
      const members = await db
        .select({
          id: campaignMembers.id,
          role: campaignMembers.role,
        })
        .from(campaignMembers)
        .where(eq(campaignMembers.campaignId, camp.id));

      const playerCount = members.filter((m) => m.role === "PLAYER").length;

      return {
        id: camp.id,
        code: camp.code,
        name: camp.name,
        description: camp.description || "",
        isActive: camp.isActive,
        createdAt: camp.createdAt.toISOString(),
        playerCount,
        totalMembers: members.length,
      };
    })
  );

  // 2. Campanhas onde o usuário participa como Jogador
  const memberships = await db
    .select({
      memberId: campaignMembers.id,
      role: campaignMembers.role,
      joinedAt: campaignMembers.joinedAt,
      characterId: campaignMembers.characterId,
      campaignId: campaigns.id,
      code: campaigns.code,
      name: campaigns.name,
      description: campaigns.description,
      isActive: campaigns.isActive,
      dmId: campaigns.dmId,
      dmName: users.name,
      dmUsername: users.username,
    })
    .from(campaignMembers)
    .innerJoin(campaigns, eq(campaignMembers.campaignId, campaigns.id))
    .innerJoin(users, eq(campaigns.dmId, users.id))
    .where(
      and(
        eq(campaignMembers.userId, user.id),
        eq(campaignMembers.role, "PLAYER")
      )
    )
    .orderBy(desc(campaignMembers.joinedAt));

  const asPlayer = await Promise.all(
    memberships.map(async (m) => {
      let charSummary: {
        id: string;
        name: string;
        race: string;
        class: string;
        level: number;
        currentHp: number;
        maxHp: number;
      } | null = null;

      if (m.characterId) {
        const [charRow] = await db
          .select({
            id: characters.id,
            name: characters.name,
            race: characters.race,
            class: characters.class,
            level: characters.level,
            currentHp: characters.currentHp,
            maxHp: characters.maxHp,
          })
          .from(characters)
          .where(eq(characters.id, m.characterId))
          .limit(1);
        if (charRow) {
          charSummary = charRow;
        }
      }

      return {
        id: m.campaignId,
        code: m.code,
        name: m.name,
        description: m.description || "",
        isActive: m.isActive,
        dmName: m.dmName || m.dmUsername,
        dmUsername: m.dmUsername,
        joinedAt: m.joinedAt.toISOString(),
        character: charSummary,
      };
    })
  );

  return {
    authenticated: true,
    currentUser: {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
    },
    asDm,
    asPlayer,
  };
}

export async function createCampaignAction(input: {
  name: string;
  description?: string;
}): Promise<{
  success: boolean;
  error?: string;
  campaignId?: string;
  code?: string;
}> {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return {
      success: false,
      error: "Sua sessão expirou. Faça login para criar uma mesa.",
    };
  }

  const trimmedName = input.name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return {
      success: false,
      error: "O nome da campanha deve ter entre 2 e 100 caracteres.",
    };
  }

  const trimmedDesc = input.description?.trim() || null;
  const code = await generateUniqueCampaignCode();

  const [created] = await db
    .insert(campaigns)
    .values({
      code,
      name: trimmedName,
      description: trimmedDesc,
      dmId: user.id,
      isActive: true,
    })
    .returning();

  // Vincula o criador como DM na tabela campaign_members
  await db.insert(campaignMembers).values({
    campaignId: created.id,
    userId: user.id,
    characterId: null,
    role: "DM",
  });

  // Registra mensagem inaugural no histórico da mesa
  await db.insert(campaignMessages).values({
    campaignId: created.id,
    userId: user.id,
    characterName: `Mestre @${user.username}`,
    content: `A mesa "${trimmedName}" foi forjada! Compartilhe o código ${code} com os aventureiros.`,
    type: "SYSTEM",
  });

  return {
    success: true,
    campaignId: created.id,
    code: created.code,
  };
}

export async function lookupCampaignByCodeAction(rawCode: string): Promise<{
  found: boolean;
  error?: string;
  campaign?: {
    id: string;
    code: string;
    name: string;
    description: string;
    dmId: string;
    dmName: string;
    dmUsername: string;
    memberCount: number;
    alreadyMember: boolean;
    myRole?: "DM" | "PLAYER";
  };
}> {
  const normalizedCode = rawCode
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  if (normalizedCode.length !== 6) {
    return {
      found: false,
      error: "O código de convite deve conter exatamente 6 caracteres.",
    };
  }

  const [row] = await db
    .select({
      id: campaigns.id,
      code: campaigns.code,
      name: campaigns.name,
      description: campaigns.description,
      isActive: campaigns.isActive,
      dmId: campaigns.dmId,
      dmName: users.name,
      dmUsername: users.username,
    })
    .from(campaigns)
    .innerJoin(users, eq(campaigns.dmId, users.id))
    .where(eq(campaigns.code, normalizedCode))
    .limit(1);

  if (!row || !row.isActive) {
    return {
      found: false,
      error: "Nenhuma mesa ativa encontrada com este código de convite.",
    };
  }

  const members = await db
    .select({
      userId: campaignMembers.userId,
      role: campaignMembers.role,
    })
    .from(campaignMembers)
    .where(eq(campaignMembers.campaignId, row.id));

  const user = await resolveCurrentGuildUser();
  const existingMembership = user
    ? members.find((m) => m.userId === user.id)
    : undefined;

  return {
    found: true,
    campaign: {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description || "",
      dmId: row.dmId,
      dmName: row.dmName || row.dmUsername,
      dmUsername: row.dmUsername,
      memberCount: members.length,
      alreadyMember: Boolean(existingMembership),
      myRole: existingMembership?.role,
    },
  };
}

export async function joinCampaignWithCharacterAction(input: {
  code: string;
  character: ClientCharacterInput;
}): Promise<{
  success: boolean;
  error?: string;
  campaignId?: string;
}> {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return {
      success: false,
      error: "Faça login para entrar em uma mesa.",
    };
  }

  const normalizedCode = input.code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.code, normalizedCode))
    .limit(1);

  if (!campaign || !campaign.isActive) {
    return {
      success: false,
      error: "Mesa não encontrada ou encerrada.",
    };
  }

  // Sincroniza/cria a ficha do personagem no banco PostgreSQL para que character_id seja válido
  const charInput = input.character;
  let dbCharacterId: string | null = null;

  if (charInput.id && UUID_REGEX.test(charInput.id)) {
    const [existingChar] = await db
      .select({ id: characters.id })
      .from(characters)
      .where(
        and(eq(characters.id, charInput.id), eq(characters.userId, user.id))
      )
      .limit(1);
    if (existingChar) {
      dbCharacterId = existingChar.id;
    }
  }

  if (!dbCharacterId) {
    // Verifica se o usuário já possui um personagem com o mesmo nome no banco
    const [sameNameChar] = await db
      .select({ id: characters.id })
      .from(characters)
      .where(
        and(
          eq(characters.userId, user.id),
          eq(characters.name, charInput.name.trim())
        )
      )
      .limit(1);

    if (sameNameChar) {
      dbCharacterId = sameNameChar.id;
      await db
        .update(characters)
        .set({
          race: charInput.race,
          class: charInput.class,
          level: charInput.level,
          strength: charInput.strength,
          dexterity: charInput.dexterity,
          constitution: charInput.constitution,
          intelligence: charInput.intelligence,
          wisdom: charInput.wisdom,
          charisma: charInput.charisma,
          maxHp: charInput.maxHp,
          currentHp: charInput.currentHp,
          armorClass: charInput.armorClass,
          touchArmorClass: charInput.touchArmorClass ?? 10,
          flatFootedArmorClass: charInput.flatFootedArmorClass ?? 10,
          speed: charInput.speed ?? "9m",
          baseAttackBonus: charInput.baseAttackBonus ?? 0,
          fortitudeMisc: charInput.fortitudeMisc ?? 0,
          reflexMisc: charInput.reflexMisc ?? 0,
          willMisc: charInput.willMisc ?? 0,
          skills: charInput.skills ?? {},
          feats: charInput.feats ?? [],
          specialAbilities: charInput.specialAbilities ?? [],
          attacks: charInput.attacks ?? [],
          updatedAt: new Date(),
        })
        .where(eq(characters.id, dbCharacterId));
    } else {
      const [insertedChar] = await db
        .insert(characters)
        .values({
          userId: user.id,
          name: charInput.name.trim(),
          race: charInput.race,
          class: charInput.class,
          level: charInput.level,
          alignment: charInput.alignment || "N",
          deity: charInput.deity || "",
          background: charInput.background || "",
          size: charInput.size || "Médio",
          strength: charInput.strength,
          dexterity: charInput.dexterity,
          constitution: charInput.constitution,
          intelligence: charInput.intelligence,
          wisdom: charInput.wisdom,
          charisma: charInput.charisma,
          maxHp: charInput.maxHp,
          currentHp: charInput.currentHp,
          armorClass: charInput.armorClass,
          touchArmorClass: charInput.touchArmorClass ?? 10,
          flatFootedArmorClass: charInput.flatFootedArmorClass ?? 10,
          speed: charInput.speed ?? "9m",
          baseAttackBonus: charInput.baseAttackBonus ?? 0,
          fortitudeMisc: charInput.fortitudeMisc ?? 0,
          reflexMisc: charInput.reflexMisc ?? 0,
          willMisc: charInput.willMisc ?? 0,
          skills: charInput.skills ?? {},
          feats: charInput.feats ?? [],
          specialAbilities: charInput.specialAbilities ?? [],
          attacks: charInput.attacks ?? [],
        })
        .returning({ id: characters.id });

      dbCharacterId = insertedChar.id;
    }
  }

  // Verifica se o usuário já é membro da mesa
  const [existingMember] = await db
    .select()
    .from(campaignMembers)
    .where(
      and(
        eq(campaignMembers.campaignId, campaign.id),
        eq(campaignMembers.userId, user.id)
      )
    )
    .limit(1);

  if (existingMember) {
    await db
      .update(campaignMembers)
      .set({
        characterId: dbCharacterId,
      })
      .where(eq(campaignMembers.id, existingMember.id));
  } else {
    const role = campaign.dmId === user.id ? "DM" : "PLAYER";
    await db.insert(campaignMembers).values({
      campaignId: campaign.id,
      userId: user.id,
      characterId: dbCharacterId,
      role,
    });

    await db.insert(campaignMessages).values({
      campaignId: campaign.id,
      userId: user.id,
      characterName: charInput.name,
      content: `${charInput.name} (@${user.username}) juntou-se à mesa de jogo!`,
      type: "SYSTEM",
    });
  }

  return {
    success: true,
    campaignId: campaign.id,
  };
}

export async function getCampaignRoomDataAction(campaignId: string) {
  if (!UUID_REGEX.test(campaignId)) {
    return { found: false, error: "Identificador de mesa inválido." };
  }

  const user = await resolveCurrentGuildUser();
  if (!user) {
    return { found: false, error: "Não autenticado." };
  }

  const [camp] = await db
    .select({
      id: campaigns.id,
      code: campaigns.code,
      name: campaigns.name,
      description: campaigns.description,
      dmId: campaigns.dmId,
      isActive: campaigns.isActive,
      createdAt: campaigns.createdAt,
      dmName: users.name,
      dmUsername: users.username,
    })
    .from(campaigns)
    .innerJoin(users, eq(campaigns.dmId, users.id))
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!camp) {
    return { found: false, error: "Mesa não encontrada." };
  }

  const memberRows = await db
    .select({
      memberId: campaignMembers.id,
      userId: campaignMembers.userId,
      role: campaignMembers.role,
      joinedAt: campaignMembers.joinedAt,
      characterId: campaignMembers.characterId,
      username: users.username,
      userName: users.name,
      avatarType: users.avatarType,
      avatarUrl: users.avatarUrl,
      image: users.image,
      statusPresence: users.statusPresence,
    })
    .from(campaignMembers)
    .innerJoin(users, eq(campaignMembers.userId, users.id))
    .where(eq(campaignMembers.campaignId, camp.id))
    .orderBy(asc(campaignMembers.joinedAt));

  const enrichedMembers = await Promise.all(
    memberRows.map(async (m) => {
      let charData = null;
      if (m.characterId) {
        const [c] = await db
          .select()
          .from(characters)
          .where(eq(characters.id, m.characterId))
          .limit(1);
        if (c) {
          charData = {
            id: c.id,
            name: c.name,
            race: c.race,
            class: c.class,
            level: c.level,
            alignment: c.alignment,
            size: c.size,
            strength: c.strength,
            dexterity: c.dexterity,
            constitution: c.constitution,
            intelligence: c.intelligence,
            wisdom: c.wisdom,
            charisma: c.charisma,
            maxHp: c.maxHp,
            currentHp: c.currentHp,
            armorClass: c.armorClass,
            touchArmorClass: c.touchArmorClass,
            flatFootedArmorClass: c.flatFootedArmorClass,
            speed: c.speed,
            baseAttackBonus: c.baseAttackBonus,
            fortitudeMisc: c.fortitudeMisc,
            reflexMisc: c.reflexMisc,
            willMisc: c.willMisc,
            skills: c.skills,
            feats: c.feats,
            specialAbilities: c.specialAbilities,
            attacks: c.attacks,
            spellSlots: c.spellSlots,
            equipment: c.equipment,
          };
        }
      }

      return {
        memberId: m.memberId,
        userId: m.userId,
        role: m.role,
        username: m.username,
        userName: m.userName || m.username,
        avatarType: m.avatarType,
        avatarUrl: m.avatarUrl,
        image: m.image,
        statusPresence: m.statusPresence,
        character: charData,
      };
    })
  );

  // Busca as últimas 80 mensagens do chat e log de rolagens
  const rawMessages = await db
    .select({
      id: campaignMessages.id,
      userId: campaignMessages.userId,
      characterName: campaignMessages.characterName,
      content: campaignMessages.content,
      type: campaignMessages.type,
      createdAt: campaignMessages.createdAt,
      username: users.username,
      avatarType: users.avatarType,
      avatarUrl: users.avatarUrl,
      image: users.image,
    })
    .from(campaignMessages)
    .innerJoin(users, eq(campaignMessages.userId, users.id))
    .where(eq(campaignMessages.campaignId, camp.id))
    .orderBy(desc(campaignMessages.createdAt))
    .limit(80);

  const messages = rawMessages.reverse().map((msg) => ({
    id: msg.id,
    userId: msg.userId,
    username: msg.username,
    characterName: msg.characterName || `@${msg.username}`,
    content: msg.content,
    type: msg.type,
    createdAt: msg.createdAt.toISOString(),
    avatarType: msg.avatarType,
    avatarUrl: msg.avatarUrl,
    image: msg.image,
  }));

  const myMembership = enrichedMembers.find((m) => m.userId === user.id);
  const myRole: "DM" | "PLAYER" =
    camp.dmId === user.id ? "DM" : myMembership?.role || "PLAYER";

  // Busca todos os combatentes persistidos da mesa (table_combatants)
  const rawCombatants = await db
    .select()
    .from(tableCombatants)
    .where(eq(tableCombatants.campaignId, camp.id))
    .orderBy(desc(tableCombatants.initiative), asc(tableCombatants.createdAt));

  const visibleCombatants = rawCombatants
    .filter((c) => myRole === "DM" || !c.isHiddenFromPlayers)
    .map((c) => ({
      id: c.id,
      campaignId: c.campaignId,
      characterId: c.characterId,
      type: c.type,
      faction: c.faction,
      name: c.name,
      avatarUrl: c.avatarUrl,
      initiative: c.initiative,
      initiativeModifier: c.initiativeModifier,
      hasActedThisRound: c.hasActedThisRound,
      currentHp: c.currentHp,
      maxHp: c.maxHp,
      tempHp: c.tempHp,
      armorClass: c.armorClass,
      conditions: c.conditions || [],
      statBlock: c.statBlock || null,
      isHiddenFromPlayers: c.isHiddenFromPlayers,
    }));

  return {
    found: true,
    currentUser: {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      role: myRole,
      myCharacter: myMembership?.character || null,
    },
    campaign: {
      id: camp.id,
      code: camp.code,
      name: camp.name,
      description: camp.description || "",
      dmId: camp.dmId,
      dmName: camp.dmName || camp.dmUsername,
      dmUsername: camp.dmUsername,
      isActive: camp.isActive,
    },
    members: enrichedMembers,
    messages,
    tableCombatants: visibleCombatants,
  };
}

export async function sendCampaignMessageAction(input: {
  campaignId: string;
  content: string;
  type?: "CHAT" | "DICE_ROLL" | "SYSTEM";
  characterName?: string;
}) {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return { success: false, error: "Sessão expirada." };
  }

  const trimmed = input.content.trim();
  if (!trimmed) {
    return { success: false, error: "Mensagem vazia." };
  }

  const [inserted] = await db
    .insert(campaignMessages)
    .values({
      campaignId: input.campaignId,
      userId: user.id,
      characterName: input.characterName || user.name || `@${user.username}`,
      content: trimmed,
      type: input.type || "CHAT",
    })
    .returning();

  return {
    success: true,
    message: {
      id: inserted.id,
      userId: user.id,
      username: user.username,
      characterName: inserted.characterName || `@${user.username}`,
      content: inserted.content,
      type: inserted.type,
      createdAt: inserted.createdAt.toISOString(),
      avatarType: user.avatarType,
      avatarUrl: user.avatarUrl,
      image: user.image,
    },
  };
}

export async function updateCampaignCharacterHpAction(input: {
  campaignId: string;
  characterId: string;
  delta: number;
}) {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return { success: false, error: "Não autenticado." };
  }

  const [charRow] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, input.characterId))
    .limit(1);

  if (!charRow) {
    return { success: false, error: "Personagem não encontrado." };
  }

  const nextHp = Math.max(
    -10,
    Math.min(charRow.maxHp, charRow.currentHp + input.delta)
  );

  await db
    .update(characters)
    .set({
      currentHp: nextHp,
      updatedAt: new Date(),
    })
    .where(eq(characters.id, charRow.id));

  // Sincroniza também com table_combatants caso o personagem esteja no combate da mesa
  await db
    .update(tableCombatants)
    .set({
      currentHp: nextHp,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tableCombatants.campaignId, input.campaignId),
        eq(tableCombatants.characterId, charRow.id)
      )
    );

  return {
    success: true,
    currentHp: nextHp,
    maxHp: charRow.maxHp,
  };
}

export async function leaveCampaignAction(campaignId: string) {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return { success: false, error: "Não autenticado." };
  }

  const [camp] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!camp) {
    return { success: false, error: "Mesa não encontrada." };
  }

  if (camp.dmId === user.id) {
    return {
      success: true,
      isDm: true,
    };
  }

  await db
    .delete(campaignMembers)
    .where(
      and(
        eq(campaignMembers.campaignId, campaignId),
        eq(campaignMembers.userId, user.id)
      )
    );

  await db.insert(campaignMessages).values({
    campaignId,
    userId: user.id,
    characterName: `@${user.username}`,
    content: `@${user.username} retirou-se da mesa.`,
    type: "SYSTEM",
  });

  return {
    success: true,
    isDm: false,
  };
}

// ============================================================================
// FASE 4: BUSCA PAGINADA DE MONSTROS & INTEGRAÇÃO COMPÊNDIO ↔ MESAS DE JOGO
// ============================================================================

export async function searchMonstersCompendiumAction(input: {
  query?: string;
  crBracket?: MonsterCrBracket;
  page?: number;
  pageSize?: number;
}) {
  return queryMonstersCatalog(input);
}

export async function getActiveDmTablesAction(): Promise<{
  authenticated: boolean;
  tables: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
  }>;
}> {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return { authenticated: false, tables: [] };
  }

  const rows = await db
    .select({
      id: campaigns.id,
      code: campaigns.code,
      name: campaigns.name,
      description: campaigns.description,
    })
    .from(campaigns)
    .where(and(eq(campaigns.dmId, user.id), eq(campaigns.isActive, true)))
    .orderBy(desc(campaigns.createdAt));

  return {
    authenticated: true,
    tables: rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description || "",
    })),
  };
}

export async function sendMonstersToTableAction(input: {
  campaignId: string;
  monsterId: string;
  quantity: number;
  faction?: "ENEMY" | "NEUTRAL" | "ALLY";
  isHiddenFromPlayers?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  addedCount?: number;
  monsterName?: string;
  campaignName?: string;
  createdNames?: string[];
}> {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return {
      success: false,
      error: "Sua sessão expirou. Faça login novamente.",
    };
  }

  if (!UUID_REGEX.test(input.campaignId)) {
    return {
      success: false,
      error: "Mesa selecionada inválida.",
    };
  }

  const quantity = Math.max(1, Math.min(10, Math.floor(input.quantity || 1)));

  // Validação estrita de permissão: garantir que quem está enviando é realmente o Mestre da mesa
  const [camp] = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, input.campaignId),
        eq(campaigns.dmId, user.id),
        eq(campaigns.isActive, true)
      )
    )
    .limit(1);

  if (!camp) {
    return {
      success: false,
      error:
        "Permissão negada: apenas o Mestre criador de uma mesa ativa pode enviar criaturas para o combate.",
    };
  }

  const monster: DndMonsterEntry | undefined = ALL_DND35_MONSTERS.find(
    (m) => m.id === input.monsterId
  );

  if (!monster) {
    return {
      success: false,
      error: "Criatura não encontrada no Compêndio D&D 3.5.",
    };
  }

  // Verifica quantos combatentes com o mesmo nome-base já existem na mesa para numerar sequencialmente
  const existingCombatants = await db
    .select({ name: tableCombatants.name })
    .from(tableCombatants)
    .where(eq(tableCombatants.campaignId, camp.id));

  const baseName = monster.name;
  const existingSameBaseCount = existingCombatants.filter(
    (c) =>
      c.name === baseName ||
      c.name.startsWith(`${baseName} `)
  ).length;

  const statBlockPayload: MonsterStatBlockJson = {
    challengeRating: monster.challengeRating,
    sizeAndType: monster.sizeAndType,
    hitDice: monster.hitDice,
    speed: monster.speed,
    touchArmorClass: monster.touchAc,
    flatFootedArmorClass: monster.flatFootedAc,
    armorClassText: monster.armorClass,
    baseAttackGrapple: monster.baseAttackGrapple,
    attacks: monster.attack,
    specialAttacks: monster.specialAttacks,
    specialQualities: monster.specialQualities,
    saves: monster.saves,
    abilities: monster.abilities,
    sourcePage: monster.sourcePage,
  };

  const rowsToInsert = [];
  const createdNames: string[] = [];

  for (let i = 1; i <= quantity; i++) {
    const seqNumber = existingSameBaseCount + i;
    const numberedName =
      quantity > 1 || existingSameBaseCount > 0
        ? `${baseName} ${seqNumber}`
        : baseName;

    const rolledInitiative =
      Math.floor(Math.random() * 20) + 1 + monster.initiative;

    createdNames.push(numberedName);
    rowsToInsert.push({
      campaignId: camp.id,
      characterId: null,
      type: "MONSTER" as const,
      faction: input.faction || ("ENEMY" as const),
      name: numberedName.slice(0, 120),
      avatarUrl: null,
      initiative: rolledInitiative,
      initiativeModifier: monster.initiative,
      hasActedThisRound: false,
      currentHp: monster.hp,
      maxHp: monster.hp,
      tempHp: 0,
      armorClass: monster.acValue || parseInt(monster.armorClass, 10) || 15,
      conditions: [] as string[],
      statBlock: statBlockPayload,
      isHiddenFromPlayers: Boolean(input.isHiddenFromPlayers),
    });
  }

  await db.insert(tableCombatants).values(rowsToInsert);

  if (!input.isHiddenFromPlayers) {
    await db.insert(campaignMessages).values({
      campaignId: camp.id,
      userId: user.id,
      characterName: `Mestre @${user.username}`,
      content: `⚔️ O Mestre adicionou ${quantity}x ${baseName} (ND ${monster.challengeRating}) ao combate da mesa!`,
      type: "SYSTEM",
    });
  }

  return {
    success: true,
    addedCount: quantity,
    monsterName: baseName,
    campaignName: camp.name,
    createdNames,
  };
}

export async function updateTableCombatantHpAction(input: {
  campaignId: string;
  combatantId: string;
  delta: number;
}) {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return { success: false, error: "Não autenticado." };
  }

  const [combatant] = await db
    .select()
    .from(tableCombatants)
    .where(
      and(
        eq(tableCombatants.id, input.combatantId),
        eq(tableCombatants.campaignId, input.campaignId)
      )
    )
    .limit(1);

  if (!combatant) {
    return { success: false, error: "Combatente não encontrado." };
  }

  const nextHp = Math.max(
    -20,
    Math.min(combatant.maxHp, combatant.currentHp + input.delta)
  );

  await db
    .update(tableCombatants)
    .set({
      currentHp: nextHp,
      updatedAt: new Date(),
    })
    .where(eq(tableCombatants.id, combatant.id));

  if (combatant.characterId) {
    await db
      .update(characters)
      .set({
        currentHp: nextHp,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, combatant.characterId));
  }

  return {
    success: true,
    currentHp: nextHp,
    maxHp: combatant.maxHp,
  };
}

export async function removeTableCombatantAction(input: {
  campaignId: string;
  combatantId: string;
}) {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return { success: false, error: "Não autenticado." };
  }

  const [camp] = await db
    .select()
    .from(campaigns)
    .where(
      and(eq(campaigns.id, input.campaignId), eq(campaigns.dmId, user.id))
    )
    .limit(1);

  if (!camp) {
    return {
      success: false,
      error: "Apenas o Mestre pode remover combatentes da mesa.",
    };
  }

  await db
    .delete(tableCombatants)
    .where(
      and(
        eq(tableCombatants.id, input.combatantId),
        eq(tableCombatants.campaignId, input.campaignId)
      )
    );

  return { success: true };
}

export async function rollAllTableInitiativesAction(campaignId: string) {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return { success: false, error: "Não autenticado." };
  }

  const [camp] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.dmId, user.id)))
    .limit(1);

  if (!camp) {
    return {
      success: false,
      error: "Apenas o Mestre pode rolar iniciativas da mesa.",
    };
  }

  const allCombatants = await db
    .select()
    .from(tableCombatants)
    .where(eq(tableCombatants.campaignId, campaignId));

  await Promise.all(
    allCombatants.map((c) => {
      const rolled =
        Math.floor(Math.random() * 20) + 1 + (c.initiativeModifier || 0);
      return db
        .update(tableCombatants)
        .set({
          initiative: rolled,
          hasActedThisRound: false,
          updatedAt: new Date(),
        })
        .where(eq(tableCombatants.id, c.id));
    })
  );

  return { success: true };
}

export async function syncPartyCharactersToTableCombatantsAction(
  campaignId: string
) {
  const user = await resolveCurrentGuildUser();
  if (!user) {
    return { success: false, error: "Não autenticado." };
  }

  const [camp] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!camp) {
    return { success: false, error: "Mesa não encontrada." };
  }

  const membersWithChars = await db
    .select({
      characterId: campaignMembers.characterId,
      username: users.username,
      charName: characters.name,
      dexterity: characters.dexterity,
      currentHp: characters.currentHp,
      maxHp: characters.maxHp,
      armorClass: characters.armorClass,
    })
    .from(campaignMembers)
    .innerJoin(users, eq(campaignMembers.userId, users.id))
    .innerJoin(characters, eq(campaignMembers.characterId, characters.id))
    .where(eq(campaignMembers.campaignId, campaignId));

  const existing = await db
    .select({ characterId: tableCombatants.characterId })
    .from(tableCombatants)
    .where(eq(tableCombatants.campaignId, campaignId));

  const existingCharIds = new Set(
    existing.map((e) => e.characterId).filter(Boolean)
  );

  for (const m of membersWithChars) {
    if (!m.characterId || existingCharIds.has(m.characterId)) continue;
    const dexMod = Math.floor((m.dexterity - 10) / 2);
    const rolledInit = Math.floor(Math.random() * 20) + 1 + dexMod;
    await db.insert(tableCombatants).values({
      campaignId,
      characterId: m.characterId,
      type: "PLAYER",
      faction: "ALLY",
      name: `${m.charName} (@${m.username})`.slice(0, 120),
      initiative: rolledInit,
      initiativeModifier: dexMod,
      currentHp: m.currentHp,
      maxHp: m.maxHp,
      armorClass: m.armorClass,
      conditions: [],
      statBlock: null,
      isHiddenFromPlayers: false,
    });
  }

  return { success: true };
}

