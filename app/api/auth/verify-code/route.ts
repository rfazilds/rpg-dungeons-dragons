import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { emailVerificationCodes, users } from "@/lib/db/schema";
import { verifyCodeSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Informe o código de 6 dígitos corretamente.",
        },
        { status: 400 }
      );
    }

    const { code, type, email: rawEmail } = parsed.data;
    const session = await auth();
    let targetUserId = session?.user?.id;

    // Caso o usuário esteja validando logo após o registro via e-mail
    if (!targetUserId && rawEmail) {
      const [foundUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, rawEmail.toLowerCase()))
        .limit(1);
      targetUserId = foundUser?.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Sessão ou conta não localizada para verificação." },
        { status: 401 }
      );
    }

    // Buscar o código correspondente mais recente
    const [verificationRecord] = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.userId, targetUserId),
          eq(emailVerificationCodes.type, type),
          eq(emailVerificationCodes.code, code.toUpperCase())
        )
      )
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(1);

    if (!verificationRecord) {
      return NextResponse.json(
        {
          error:
            "Código inválido ou incorreto. Verifique as 6 letras/números e tente novamente.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    if (new Date(verificationRecord.expiresAt).getTime() < now.getTime()) {
      return NextResponse.json(
        {
          error:
            "Este código expirou (limite de 15 minutos). Solicite um novo código.",
        },
        { status: 410 }
      );
    }

    if (type === "REGISTER") {
      await db
        .update(users)
        .set({
          emailVerified: now,
          updatedAt: now,
        })
        .where(eq(users.id, targetUserId));
    } else if (type === "CHANGE_EMAIL") {
      const nextEmail = verificationRecord.email.toLowerCase();

      // Garantir que ninguém mais ocupou o novo e-mail nesse intervalo
      const [conflict] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, nextEmail), ne(users.id, targetUserId)))
        .limit(1);

      if (conflict) {
        return NextResponse.json(
          { error: "Este endereço de e-mail já está vinculado a outra conta." },
          { status: 409 }
        );
      }

      await db
        .update(users)
        .set({
          email: nextEmail,
          emailVerified: now,
          updatedAt: now,
        })
        .where(eq(users.id, targetUserId));
    }

    // Limpar códigos usados daquele tipo para o usuário
    await db
      .delete(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.userId, targetUserId),
          eq(emailVerificationCodes.type, type)
        )
      );

    return NextResponse.json({
      verified: true,
      type,
      email: verificationRecord.email,
      message:
        type === "REGISTER"
          ? "E-mail confirmado com sucesso! Os portões da Guilda estão abertos."
          : "Seu endereço de e-mail foi atualizado e verificado com sucesso!",
    });
  } catch (err) {
    console.error("Erro ao validar código de 6 dígitos:", err);
    return NextResponse.json(
      { error: "Erro interno ao validar o código." },
      { status: 500 }
    );
  }
}
