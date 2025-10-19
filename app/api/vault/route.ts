import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const CreateSchema = z.object({
    title: z.string().max(200).optional(),
    username: z.string().max(200).optional(),
    url: z.string().max(1000).optional(),
    password: z.string().min(1).max(500),
    notes: z.string().max(2000).optional(),
});

// GET /api/vault
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const items = await prisma.vaultItem.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    const res = NextResponse.json(items);
    res.headers.set("Cache-Control", "no-store");
    return res;
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const item = await prisma.vaultItem.create({
        data: { userId: session.user.id, ...parsed.data },
    });

    const res = NextResponse.json({ id: item.id }, { status: 201 });
    res.headers.set("Cache-Control", "no-store");
    return res;
}
