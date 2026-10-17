import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validations/auth";

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

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [created] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        passwordHash,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
      });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    console.error("Erro ao registrar usuário no Neon:", err);
    return NextResponse.json(
      { error: "Erro interno ao criar conta." },
      { status: 500 }
    );
  }
}
