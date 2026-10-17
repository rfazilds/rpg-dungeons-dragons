import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, inArray, ne, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";

async function resolveCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.id) {
    const [byId] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (byId) return byId;
  }

  if (session.user.email) {
    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);
    if (byEmail) return byEmail;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await resolveCurrentUser();
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim().replace(/^@+/, "");

    if (!currentUser) {
      return NextResponse.json({
        authenticated: false,
        emailVerified: false,
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
        searchResults: [],
      });
    }

    // Buscar todas as relações de amizade envolvendo o usuário atual
    const allRelations = await db
      .select()
      .from(friendships)
      .where(
        or(
          eq(friendships.userId, currentUser.id),
          eq(friendships.friendId, currentUser.id)
        )
      );

    // Se houver busca por @nickname ou nome
    if (query.length >= 2) {
      const matchingUsers = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          image: users.image,
          avatarType: users.avatarType,
          avatarUrl: users.avatarUrl,
          statusPresence: users.statusPresence,
          timezone: users.timezone,
        })
        .from(users)
        .where(
          and(
            ne(users.id, currentUser.id),
            or(
              ilike(users.username, `%${query}%`),
              ilike(users.name, `%${query}%`)
            )
          )
        )
        .limit(12);

      const searchResults = matchingUsers.map((candidate) => {
        const relation = allRelations.find(
          (r) =>
            (r.userId === currentUser.id && r.friendId === candidate.id) ||
            (r.friendId === currentUser.id && r.userId === candidate.id)
        );

        let relationState:
          | "NONE"
          | "ACCEPTED"
          | "PENDING_SENT"
          | "PENDING_RECEIVED"
          | "BLOCKED" = "NONE";

        if (relation) {
          if (relation.status === "ACCEPTED") {
            relationState = "ACCEPTED";
          } else if (relation.status === "BLOCKED") {
            relationState = "BLOCKED";
          } else if (relation.userId === currentUser.id) {
            relationState = "PENDING_SENT";
          } else {
            relationState = "PENDING_RECEIVED";
          }
        }

        return {
          ...candidate,
          friendshipId: relation?.id || null,
          relationState,
        };
      });

      return NextResponse.json({
        authenticated: true,
        emailVerified: Boolean(currentUser.emailVerified),
        searchResults,
      });
    }

    // Caso contrário, retornar a lista completa de Amigos + Pedidos Pendentes
    const peerIds = Array.from(
      new Set(
        allRelations.map((r) =>
          r.userId === currentUser.id ? r.friendId : r.userId
        )
      )
    );

    const peerUsers =
      peerIds.length > 0
        ? await db
            .select({
              id: users.id,
              username: users.username,
              name: users.name,
              image: users.image,
              avatarType: users.avatarType,
              avatarUrl: users.avatarUrl,
              statusPresence: users.statusPresence,
              timezone: users.timezone,
            })
            .from(users)
            .where(inArray(users.id, peerIds))
        : [];

    const peerMap = new Map(peerUsers.map((u) => [u.id, u]));

    const friends = [];
    const incomingRequests = [];
    const outgoingRequests = [];

    for (const rel of allRelations) {
      const peerId =
        rel.userId === currentUser.id ? rel.friendId : rel.userId;
      const peer = peerMap.get(peerId);
      if (!peer) continue;

      const entry = {
        friendshipId: rel.id,
        status: rel.status,
        createdAt: rel.createdAt,
        user: peer,
      };

      if (rel.status === "ACCEPTED") {
        friends.push(entry);
      } else if (rel.status === "PENDING") {
        if (rel.friendId === currentUser.id) {
          incomingRequests.push(entry);
        } else {
          outgoingRequests.push(entry);
        }
      }
    }

    return NextResponse.json({
      authenticated: true,
      emailVerified: Boolean(currentUser.emailVerified),
      friends,
      incomingRequests,
      outgoingRequests,
    });
  } catch (err) {
    console.error("Erro em GET /api/community/friends:", err);
    return NextResponse.json(
      { error: "Erro ao consultar a Guilda de Amigos." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await resolveCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Faça login na sua conta para adicionar amigos." },
        { status: 401 }
      );
    }

    if (!currentUser.emailVerified) {
      return NextResponse.json(
        {
          error:
            "Confirme seu e-mail para desbloquear pedidos de amizade e mesas compartilhadas.",
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const targetUserId = body.targetUserId as string | undefined;
    const targetUsername = (body.username as string | undefined)
      ?.trim()
      .replace(/^@+/, "")
      .toLowerCase();

    let targetUser: { id: string; username: string; name: string | null } | undefined;

    if (targetUserId) {
      const [found] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);
      targetUser = found;
    } else if (targetUsername) {
      const [found] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
        })
        .from(users)
        .where(ilike(users.username, targetUsername))
        .limit(1);
      targetUser = found;
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Aventureiro não encontrado na Guilda." },
        { status: 404 }
      );
    }

    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "Você não pode enviar pedido de amizade para si mesmo." },
        { status: 400 }
      );
    }

    // Verificar se já existe amizade ou convite em qualquer direção
    const [existing] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.userId, currentUser.id),
            eq(friendships.friendId, targetUser.id)
          ),
          and(
            eq(friendships.userId, targetUser.id),
            eq(friendships.friendId, currentUser.id)
          )
        )
      )
      .limit(1);

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return NextResponse.json(
          { error: `@${targetUser.username} já faz parte da sua Guilda de Amigos.` },
          { status: 409 }
        );
      }

      // Se a outra pessoa já havia enviado um pedido para mim, aceitamos automaticamente!
      if (existing.userId === targetUser.id && existing.status === "PENDING") {
        await db
          .update(friendships)
          .set({ status: "ACCEPTED" })
          .where(eq(friendships.id, existing.id));

        return NextResponse.json({
          success: true,
          status: "ACCEPTED",
          message: `Pedido mútuo! @${targetUser.username} agora faz parte da sua Guilda de Amigos.`,
        });
      }

      return NextResponse.json(
        { error: `Já existe um convite pendente para @${targetUser.username}.` },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(friendships)
      .values({
        userId: currentUser.id,
        friendId: targetUser.id,
        status: "PENDING",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        friendshipId: created.id,
        status: "PENDING",
        message: `Pedido de amizade enviado para @${targetUser.username}!`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro em POST /api/community/friends:", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o pedido de amizade." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await resolveCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const friendshipId = body.friendshipId as string;
    const action = body.action as "ACCEPT" | "REJECT" | "REMOVE";

    if (!friendshipId || !action) {
      return NextResponse.json(
        { error: "Parâmetros inválidos." },
        { status: 400 }
      );
    }

    const [relation] = await db
      .select()
      .from(friendships)
      .where(eq(friendships.id, friendshipId))
      .limit(1);

    if (
      !relation ||
      (relation.userId !== currentUser.id &&
        relation.friendId !== currentUser.id)
    ) {
      return NextResponse.json(
        { error: "Registro de amizade não encontrado." },
        { status: 404 }
      );
    }

    if (action === "ACCEPT") {
      if (relation.friendId !== currentUser.id) {
        return NextResponse.json(
          { error: "Apenas o destinatário pode aceitar o convite." },
          { status: 403 }
        );
      }

      await db
        .update(friendships)
        .set({ status: "ACCEPTED" })
        .where(eq(friendships.id, friendshipId));

      return NextResponse.json({
        success: true,
        message: "Convite aceito! Novo aliado adicionado à sua Guilda.",
      });
    }

    // REJECT ou REMOVE apaga o vínculo
    await db.delete(friendships).where(eq(friendships.id, friendshipId));

    return NextResponse.json({
      success: true,
      message:
        action === "REJECT"
          ? "Pedido de amizade recusado."
          : "Vínculo de amizade removido.",
    });
  } catch (err) {
    console.error("Erro em PATCH /api/community/friends:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar amizade." },
      { status: 500 }
    );
  }
}
