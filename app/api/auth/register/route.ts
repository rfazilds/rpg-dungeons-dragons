import { NextRequest, NextResponse } from "next/server";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validations/auth";
import { issueAndSendVerificationCode } from "@/lib/email/verification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Dados inválidos para cadastro.",
        },
        { status: 400 }
      );
    }

    const { name, username, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    // 1. Verificar duplicidade de e-mail
    const existingEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail." },
        { status: 409 }
      );
    }

    // 2. Verificar duplicidade de @username
    const existingUsername = await db
      .select({ id: users.id })
      .from(users)
      .where(ilike(users.username, normalizedUsername))
      .limit(1);

    if (existingUsername.length > 0) {
      return NextResponse.json(
        {
          error: `O nickname @${normalizedUsername} já está em uso na Guilda. Escolha outro.`,
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Criar conta com email_verified = NULL até confirmar o código de 6 dígitos
    const [created] = await db
      .insert(users)
      .values({
        name,
        username: normalizedUsername,
        email: normalizedEmail,
        emailVerified: null,
        passwordHash,
        avatarType: "preset_d20",
        avatarUrl: "preset_d20",
        statusPresence: "online",
        timezone: "America/Sao_Paulo",
      })
      .returning({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
      });

    // 4. Gerar e disparar código de 6 caracteres via Resend (validade 15 min)
    const verification = await issueAndSendVerificationCode({
      userId: created.id,
      email: created.email,
      recipientName: created.name,
      type: "REGISTER",
      enforceCooldown: false,
    });

    return NextResponse.json(
      {
        user: created,
        verification: {
          sentViaResend: verification.sentViaResend,
          devPreviewCode: verification.devPreviewCode,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro ao registrar usuário no Neon:", err);
    return NextResponse.json(
      { error: "Erro interno ao criar conta." },
      { status: 500 }
    );
  }
}
