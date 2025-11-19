// lib/mail.ts (no imports, no external libs)

// For now we just log to server console.
// This avoids any runtime issues with Resend / env / constructors.

export const sendTwoFactorTokenEmail = async (
    email: string,
    token: string,
) => {
    console.log("[MAIL] sendTwoFactorTokenEmail", { email, token });
};

export const sendPasswordResetEmail = async (
    email: string,
    token: string,
) => {
    console.log("[MAIL] sendPasswordResetEmail", { email, token });
};

export const sendVerificationEmail = async (
    email: string,
    token: string,
) => {
    console.log("[MAIL] sendVerificationEmail", { email, token });
};
