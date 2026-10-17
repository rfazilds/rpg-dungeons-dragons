import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import {
  loginSchema,
  sanitizeUsernameCandidate,
} from "@/lib/validations/auth";
import { authConfig } from "./auth.config";

const baseAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});

async function generateUniqueUsername(seed: string): Promise<string> {
  const base = sanitizeUsernameCandidate(seed);
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, base))
    .limit(1);

  if (existing.length === 0) {
    return base;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.floor(100 + Math.random() * 9000);
    const candidate = `${base.slice(0, 24)}_${suffix}`;
    const check = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1);
    if (check.length === 0) {
      return candidate;
    }
  }

  return `heroi_${Date.now().toString().slice(-6)}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: {
    ...baseAdapter,
    async createUser(data) {
      const seed = data.name || data.email?.split("@")[0] || "aventureiro";
      const username = await generateUniqueUsername(seed);
      const now = new Date();

      const [created] = await db
        .insert(users)
        .values({
          id: data.id,
          username,
          name: data.name ?? seed,
          email: data.email.toLowerCase(),
          emailVerified: data.emailVerified ?? now, // Login com Google já valida o e-mail
          image: data.image,
          avatarType: data.image ? "oauth" : "preset_d20",
          avatarUrl: data.image ?? "preset_d20",
          statusPresence: "online",
          timezone: "America/Sao_Paulo",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        id: created.id,
        name: created.name,
        email: created.email,
        emailVerified: created.emailVerified,
        image: created.image,
      };
    },
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
          return null;
        }

        await db
          .update(users)
          .set({ statusPresence: "online", updatedAt: new Date() })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
});
