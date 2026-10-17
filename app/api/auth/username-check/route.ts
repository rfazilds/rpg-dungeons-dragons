import { NextRequest, NextResponse } from "next/server";
import { and, ilike, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { usernameSchema } from "@/lib/validations/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUsername = (searchParams.get("username") || "").trim();
    const excludeUserId = searchParams.get("excludeUserId") || undefined;

    const parsed = usernameSchema.safeParse(rawUsername);
    if (!parsed.success) {
      return NextResponse.json({
        available: false,
        valid: false,
        message:
          parsed.error.issues[0]?.message ||
          "Use de 3 a 30 letras, números ou underscores (_).",
      });
    }

    const normalized = parsed.data.toLowerCase();

    const existing = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(
        excludeUserId
          ? and(ilike(users.username, normalized), ne(users.id, excludeUserId))
          : ilike(users.username, normalized)
      )
      .limit(1);

    const available = existing.length === 0;

    return NextResponse.json({
      available,
      valid: true,
      username: normalized,
      message: available
        ? `@${normalized} está disponível na Guilda!`
        : `@${normalized} já pertence a outro aventureiro.`,
    });
  } catch (err) {
    console.error("Erro ao verificar disponibilidade de username:", err);
    return NextResponse.json(
      {
        available: false,
        valid: false,
        message: "Não foi possível verificar o nickname agora.",
      },
      { status: 500 }
    );
  }
}
