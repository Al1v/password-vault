// auth.config.ts
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

const Schema = LoginSchema.extend({
  twoFactorCode: z.string().optional(),
  backupCode: z.string().optional(),
});

const authConfig = {
  providers: [
    Credentials({
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

          //  Fetch user
          const user = await getUserByEmail(email);
          console.log("[AUTH] user:", !!user, "hasPassword:", !!user?.password, "is2FAEnabled:", user?.isTwoFactorEnabled);
          if (!user || !user.password) return null;

          //  Dynamic import bcryptjs
          const bcryptModule = await import("bcryptjs");
          const bcrypt = bcryptModule.default || bcryptModule;

          const ok = await bcrypt.compare(password, user.password);
          console.log("[AUTH] password ok:", ok);
          if (!ok) return null;

          // 2FA disabled -> success immediately
          if (!user.isTwoFactorEnabled) {
            console.log("[AUTH] 2FA disabled -> success");
            return user;
          }

          console.log("[AUTH] 2FA is enabled, checking codes...");
          console.log("[AUTH] twoFactorCode:", twoFactorCode, "backupCode:", backupCode);

          // 2FA enabled but no code provided -> return special object to trigger 2FA UI
          const hasNo2FACode = (!twoFactorCode || twoFactorCode === "undefined" || twoFactorCode.trim() === "") && !backupCode;

          if (hasNo2FACode) {
            console.log("[AUTH] 2FA required but no code provided -> returning pending2FA");
            return {
              id: user.id,
              email: user.email ?? undefined,
              name: user.name ?? undefined,
              pending2FA: true,
            } as any;
          }

          //  Validate TOTP code
          if (twoFactorCode && twoFactorCode !== "undefined" && twoFactorCode.trim() !== "") {
            if (!user.twoFactorSecret) {
              console.log("[AUTH] No 2FA secret found for user");
              return null;
            }

            const otplibModule = await import("otplib");
            const authenticator = otplibModule.authenticator || (otplibModule as any).authenticator;

            const valid = authenticator.verify({
              token: twoFactorCode,
              secret: user.twoFactorSecret,
            });
            console.log("[AUTH] totp valid:", valid);
            if (!valid) return null;

            console.log("[AUTH] 2FA validation successful -> returning user");
            return user;
          }

          //  Validate backup codes
          if (backupCode) {
            const [{ PrismaClient }, bcryptModule] = await Promise.all([
              import("@prisma/client"),
              import("bcryptjs"),
            ]);
            const bcrypt = bcryptModule.default || bcryptModule;
            const db = new PrismaClient();

            const all = await db.twoFactorBackupCode.findMany({
              where: { userId: user.id },
            });

            const match = all.find((c) =>
                bcrypt.compareSync(backupCode, c.codeHash),
            );
            console.log("[AUTH] backup match:", !!match);
            if (!match || match.usedAt) return null;

            await db.twoFactorBackupCode.update({
              where: { id: match.id },
              data: { usedAt: new Date() },
            });

            await db.$disconnect();
            return user;
          }

          console.log("[AUTH] No valid 2FA method found");
          return null;
        } catch (e) {
          console.error("[AUTH] authorize error:", e);
          return null;
        }
      },
    }),
  ],
};

export default authConfig;