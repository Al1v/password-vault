import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyTotp } from "@/lib/totp";
import crypto from "crypto";

const hash = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

function generateBackupCodes(n = 5) {
    return Array.from({ length: n }, () =>
        Math.floor(1e7 + Math.random() * 9e7).toString() // 8-digit numeric
    );
}

export async function POST(req: Request) {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) return NextResponse.json({ error: "No secret" }, { status: 400 });

    const ok = verifyTotp(token, user.twoFactorSecret);
    if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    const backup = generateBackupCodes();

    await db.$transaction(
        backup.map((c) =>
            db.twoFactorBackupCode.create({
                data: { userId: user.id, codeHash: hash(c) },
            })
        )
    );

    await db.user.update({
        where: { id: user.id },
        data: { isTwoFactorEnabled: true },
    });

    return NextResponse.json({ enabled: true, backupCodes: backup });
}
