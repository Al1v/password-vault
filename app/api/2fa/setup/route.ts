import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createTotpSecret, otpauthToDataURL } from "@/lib/totp";

export async function POST() {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.isTwoFactorEnabled) {
        return NextResponse.json({ error: "2FA already enabled" }, { status: 400 });
    }

    const email = user.email ?? "user@example.com";
    const { secret, otpauth } = createTotpSecret(email);
    await db.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret },
    });

    const qr = await otpauthToDataURL(otpauth);
    return NextResponse.json({ otpauth, qr });
}

export const dynamic = 'force-dynamic';