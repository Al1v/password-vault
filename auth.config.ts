import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { z } from "zod";

import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { authenticator } from "otplib"; // if you use TOTP

const Schema = LoginSchema.extend({
  twoFactorCode: z.string().optional(),
  backupCode: z.string().optional(),
});

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      // (optional) describes fields in the built-in signin page, but fine to keep
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA", type: "text" },
        backupCode: { label: "Backup", type: "text" },
      },
      async authorize(credentials) {
        try {
          console.log("[AUTH] authorize input:", credentials);
          const parsed = Schema.safeParse(credentials);
          if (!parsed.success) {
            console.log("[AUTH] zod failed:", parsed.error.flatten());
            return null;
          }

          const { email, password, twoFactorCode, backupCode } = parsed.data;
          const user = await getUserByEmail(email);
          console.log("[AUTH] user:", !!user, "hasPassword:", !!user?.password);

          if (!user || !user.password) return null;

          const ok = await bcrypt.compare(password, user.password);
          console.log("[AUTH] password ok:", ok);
          if (!ok) return null;

          if (!user.isTwoFactorEnabled) {
            console.log("[AUTH] 2FA disabled -> success");
            return user;
          }

          if (!twoFactorCode && !backupCode) {
            console.log("[AUTH] 2FA required -> pending2FA");
            return {
              id: user.id,
              email: user.email ?? undefined,
              name: user.name ?? undefined,
              pending2FA: true,
            } as any;
          }

          if (twoFactorCode) {
            if (!user.twoFactorSecret) return null;
            const valid = authenticator.verify({
              token: twoFactorCode,
              secret: user.twoFactorSecret,
            });
            console.log("[AUTH] totp valid:", valid);
            if (!valid) return null;
            return user;
          }

          if (backupCode) {
            const all = await db.twoFactorBackupCode.findMany({ where: { userId: user.id } });
            const match = all.find((c) => bcrypt.compareSync(backupCode, c.codeHash));
            console.log("[AUTH] backup match:", !!match);
            if (!match || match.usedAt) return null;

            await db.twoFactorBackupCode.update({
              where: { id: match.id },
              data: { usedAt: new Date() },
            });
            return user;
          }

          return null;
        } catch (e) {
          console.error("[AUTH] authorize error:", e);
          return null;
        }
      },
    }),
  ],
};
