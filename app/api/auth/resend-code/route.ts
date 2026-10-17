import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { issueAndSendVerificationCode } from "@/lib/email/verification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type: "REGISTER" | "CHANGE_EMAIL" =
      body.type === "CHANGE_EMAIL" ? "CHANGE_EMAIL" : "REGISTER";
    const requestedEmail =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;

    const session = await auth();
    let userRecord:
      | { id: string; name: string | null; email: string }
      | undefined;

    if (session?.user?.id) {
      const [found] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      userRecord = found;
    } else if (requestedEmail) {
      const [found] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.email, requestedEmail))
        .limit(1);
      userRecord = found;
    }

    if (!userRecord) {
      return NextResponse.json(
        { error: "Conta não encontrada para envio do código." },
        { status: 404 }
      );
    }

    const destinationEmail =
      type === "CHANGE_EMAIL" && requestedEmail
        ? requestedEmail
        : userRecord.email;

    const result = await issueAndSendVerificationCode({
      userId: userRecord.id,
      email: destinationEmail,
      recipientName: userRecord.name,
      type,
      enforceCooldown: true,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Aguarde antes de reenviar o código.",
          cooldownRemainingSeconds: result.cooldownRemainingSeconds ?? 60,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      sentViaResend: result.sentViaResend,
      devPreviewCode: result.devPreviewCode,
      message: `Um novo código de 6 dígitos foi enviado para ${destinationEmail}.`,
    });
  } catch (err) {
    console.error("Erro ao reenviar código de verificação:", err);
    return NextResponse.json(
      { error: "Não foi possível reenviar o código agora." },
      { status: 500 }
    );
  }
}
