import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  changePasswordSchema,
  deleteAccountSchema,
  requestEmailChangeSchema,
  updateProfileSchema,
} from "@/lib/validations/auth";
import { issueAndSendVerificationCode } from "@/lib/email/verification";

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

export async function GET() {
  try {
    const user = await resolveCurrentUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name || "Aventureiro",
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        avatarType: user.avatarType || (user.image ? "oauth" : "preset_d20"),
        avatarUrl: user.avatarUrl || user.image || "preset_d20",
        statusPresence: user.statusPresence || "online",
        timezone: user.timezone || "America/Sao_Paulo",
        hasPassword: Boolean(user.passwordHash),
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Erro em GET /api/account:", err);
    return NextResponse.json(
      { error: "Erro ao carregar dados da conta." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await resolveCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Você precisa estar autenticado para alterar sua conta." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action || "update_profile";

    // 1. Atualização de Perfil e Identidade na Guilda
    if (action === "update_profile") {
      const parsed = updateProfileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error:
              parsed.error.issues[0]?.message ||
              "Dados de perfil inválidos.",
          },
          { status: 400 }
        );
      }

      const normalizedUsername = parsed.data.username.toLowerCase();

      // Verificar se o nickname já pertence a outro usuário
      const [conflict] = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            ilike(users.username, normalizedUsername),
            ne(users.id, user.id)
          )
        )
        .limit(1);

      if (conflict) {
        return NextResponse.json(
          {
            error: `O nickname @${normalizedUsername} já está sendo usado por outro membro da Guilda.`,
          },
          { status: 409 }
        );
      }

      const resolvedAvatarUrl =
        parsed.data.avatarType === "oauth"
          ? user.image || parsed.data.avatarUrl || null
          : parsed.data.avatarType;

      const [updated] = await db
        .update(users)
        .set({
          name: parsed.data.name,
          username: normalizedUsername,
          avatarType: parsed.data.avatarType,
          avatarUrl: resolvedAvatarUrl,
          statusPresence: parsed.data.statusPresence,
          timezone: parsed.data.timezone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: "Identidade da Guilda atualizada com sucesso!",
        user: {
          id: updated.id,
          username: updated.username,
          name: updated.name,
          email: updated.email,
          emailVerified: updated.emailVerified,
          image: updated.image,
          avatarType: updated.avatarType,
          avatarUrl: updated.avatarUrl,
          statusPresence: updated.statusPresence,
          timezone: updated.timezone,
          hasPassword: Boolean(updated.passwordHash),
        },
      });
    }

    // 2. Alteração de Senha
    if (action === "change_password") {
      const parsed = changePasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error:
              parsed.error.issues[0]?.message ||
              "Verifique os campos de senha.",
          },
          { status: 400 }
        );
      }

      if (user.passwordHash) {
        if (!parsed.data.currentPassword) {
          return NextResponse.json(
            { error: "Informe sua senha atual para confirmar a troca." },
            { status: 400 }
          );
        }

        const isCurrentValid = await bcrypt.compare(
          parsed.data.currentPassword,
          user.passwordHash
        );
        if (!isCurrentValid) {
          return NextResponse.json(
            { error: "A senha atual informada está incorreta." },
            { status: 403 }
          );
        }
      }

      const nextHash = await bcrypt.hash(parsed.data.newPassword, 10);
      await db
        .update(users)
        .set({
          passwordHash: nextHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return NextResponse.json({
        success: true,
        message: "Sua senha foi atualizada com segurança!",
      });
    }

    // 3. Solicitação de Troca de E-mail (Envia código de 6 dígitos para o novo e-mail)
    if (action === "request_email_change") {
      const parsed = requestEmailChangeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error:
              parsed.error.issues[0]?.message ||
              "Informe um novo e-mail válido.",
          },
          { status: 400 }
        );
      }

      const normalizedNewEmail = parsed.data.newEmail.toLowerCase();
      if (normalizedNewEmail === user.email.toLowerCase()) {
        return NextResponse.json(
          { error: "Este já é o seu endereço de e-mail atual." },
          { status: 400 }
        );
      }

      const [existingEmail] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedNewEmail))
        .limit(1);

      if (existingEmail) {
        return NextResponse.json(
          {
            error:
              "Este endereço de e-mail já está vinculado a outra conta na Guilda.",
          },
          { status: 409 }
        );
      }

      const verification = await issueAndSendVerificationCode({
        userId: user.id,
        email: normalizedNewEmail,
        recipientName: user.name,
        type: "CHANGE_EMAIL",
        enforceCooldown: true,
      });

      if (!verification.success) {
        return NextResponse.json(
          {
            error:
              verification.error ||
              "Aguarde antes de solicitar outro código.",
            cooldownRemainingSeconds:
              verification.cooldownRemainingSeconds ?? 60,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({
        success: true,
        pendingEmail: normalizedNewEmail,
        sentViaResend: verification.sentViaResend,
        devPreviewCode: verification.devPreviewCode,
        message: `Enviamos um código de 6 dígitos para ${normalizedNewEmail}. Confirme-o abaixo para concluir a troca.`,
      });
    }

    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (err) {
    console.error("Erro em PATCH /api/account:", err);
    return NextResponse.json(
      { error: "Erro interno ao atualizar conta." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await resolveCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Digite EXCLUIR ou seu nickname para confirmar." },
        { status: 400 }
      );
    }

    const input = parsed.data.confirmation.trim();
    const matchesKeyword = input.toUpperCase() === "EXCLUIR";
    const matchesUsername =
      input.toLowerCase() === user.username.toLowerCase() ||
      input.toLowerCase() === `@${user.username.toLowerCase()}`;

    if (!matchesKeyword && !matchesUsername) {
      return NextResponse.json(
        {
          error: `Confirmação incorreta. Digite exatamente EXCLUIR ou ${user.username}.`,
        },
        { status: 400 }
      );
    }

    // Exclusão em cascata (ON DELETE CASCADE remove personagens, amizades, sessões e tokens)
    await db.delete(users).where(eq(users.id, user.id));

    return NextResponse.json({
      deleted: true,
      message:
        "Sua conta, fichas e vínculos da Guilda foram permanentemente removidos.",
    });
  } catch (err) {
    console.error("Erro ao excluir conta:", err);
    return NextResponse.json(
      { error: "Não foi possível excluir a conta no momento." },
      { status: 500 }
    );
  }
}
