import "server-only";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "@/auth.config";
import { db } from "@/lib/db";
import { UserRole } from "@/lib/roles";
import { getUserById } from "@/data/user";
import { getAccountByUserId } from "@/data/account";

const authResult = NextAuth({
  // --- pages (optional) ---
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  // --- events ---
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },

  // --- callbacks ---
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;

      const existingUser = await getUserById(user.id);
      if (!existingUser) return false;

      return true;
    },

    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.isOAuth = token.isOAuth as boolean;
      }
      // expose pending 2FA to client
      (session as any).pending2FA = Boolean((token as any).pending2FA);
      return session;
    },

    async jwt({ token, user }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;

      const existingAccount = await getAccountByUserId(existingUser.id);

      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      // carry pending2FA flag from Credentials authorize
      if (user && (user as any).pending2FA) {
        (token as any).pending2FA = true;
      } else if (user) {
        delete (token as any).pending2FA;
      }

      return token;
    },
  },

  // --- adapter & session ---
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },

  // --- providers & anything else from your auth.config ---
  ...authConfig,
});

// exports
export const auth = authResult.auth;
export const signIn = authResult.signIn;
export const signOut = authResult.signOut;
export const update = authResult.update;

export const GET = authResult.handlers.GET;
export const POST = authResult.handlers.POST;
