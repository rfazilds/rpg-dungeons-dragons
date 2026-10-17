import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/characters",
  "/tables",
  "/campaigns",
  "/dm",
  "/dm-screen",
  "/compendium",
  "/settings",
  "/account",
  "/community",
  "/onboarding",
];

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/",
    error: "/",
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
  ],
  callbacks: {
    authorized({ auth, request }) {
      const hasNextAuthSession = !!auth?.user;
      const hasLocalMesaCookie = Boolean(
        request.cookies.get("sanctum_mesa_session")?.value
      );
      const isLoggedIn = hasNextAuthSession || hasLocalMesaCookie;
      const pathname = request.nextUrl.pathname;

      const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (isProtectedRoute) {
        return isLoggedIn; // Redireciona para "/" se não autenticado
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
