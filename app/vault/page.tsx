import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import VaultClient from "./vault-client";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const items = await prisma.vaultItem.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="mx-auto max-w-3xl p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold">Password Vault</h1>
                <Link
                    href="/vault/new"
                    className="rounded-xl border border-border bg-secondary text-secondary-foreground px-4 py-2 hover:bg-secondary/70 transition-colors"
                >
                    New
                </Link>
            </div>


            <VaultClient initialItems={items} />
        </div>
    );
}
