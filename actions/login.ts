// app/actions/login.ts (or wherever it is)
"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const login = async (
    values: z.infer<typeof LoginSchema>,
    callbackUrl?: string | null,
) => {
  const parsed = LoginSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid fields!" };

  const { email, password, code } = parsed.data;

  const user = await getUserByEmail(email);
  if (!user || !user.password) return { error: "Invalid credentials!" };

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return { error: "Invalid credentials!" };

  // Step 1: user has 2FA enabled but hasn't entered the code yet
  if (user.isTwoFactorEnabled && !code) {
    return { twoFactor: true };
  }

  // Step 2 (or no 2FA): finish with Credentials
  try {
    await signIn("credentials", {
      email,
      password,
      twoFactorCode: code || undefined, // let Credentials.authorize verify TOTP/backup
      redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    });
    // If signIn doesn’t redirect (e.g., testing), you could return success here.
    return { success: "Logged in!" };
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw err;
  }
};
