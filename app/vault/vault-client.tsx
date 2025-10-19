// app/vault/vault-client.tsx
"use client";

import { useState } from "react";

type Item = {
    id: string;
    title?: string | null;
    username?: string | null;
    url?: string | null;
    password: string;
    notes?: string | null;
};

export default function VaultClient({ initialItems }: { initialItems: Item[] }) {
    const [items, setItems] = useState<Item[]>(initialItems);

    async function remove(id: string) {
        if (!confirm("Delete this item?")) return;
        const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
        if (res.ok) setItems(items.filter((i) => i.id !== id));
    }

    return (
        <section aria-label="Saved passwords" className="space-y-4">
            {items.map((item) => (
                <VaultCard key={item.id} item={item} onDelete={() => remove(item.id)} />
            ))}
            {items.length === 0 && (
                <div className="py-6 text-sm text-muted-foreground">No items yet.</div>
            )}
        </section>
    );
}

function VaultCard({ item, onDelete }: { item: Item; onDelete: () => void }) {
    const [copied, setCopied] = useState<"username" | "password" | null>(null);
    const [showPw, setShowPw] = useState(false);

    const urlDisplay =
        item.url && !/^https?:\/\//i.test(item.url) ? `https://${item.url}` : item.url;

    async function copy(text: string, which: "username" | "password") {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(which);
            setTimeout(() => setCopied(null), 1000);
        } catch {}
    }

    return (
        <article className="rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm transition-colors">
            {/* HEADER: relative so we can absolutely position Show + Delete */}
            <div className="relative min-h-[44px]">
                {/* Title/URL (leave room on right so text doesn't collide with buttons) */}
                <div className="min-w-0 pr-[11rem]">
                    <h3 className="truncate text-lg font-semibold">{item.title || "(no title)"}</h3>
                    {item.url && (
                        <a
                            href={urlDisplay!}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all text-sm text-primary hover:underline"
                        >
                            {item.url}
                        </a>
                    )}
                </div>

                {/* SHOW: same size as Delete; align left edge to password column.
           Grid below uses gap-4 (1rem). Column 2 starts at 50% + gap/2. */}
                <button
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute top-0 rounded-lg border border-border bg-secondary px-4 py-2 text-foreground hover:bg-secondary/70 transition-colors hidden sm:block sm:left-[calc(50%+0.5rem)]"
                >
                    {showPw ? "Hide" : "Show"}
                </button>

                {/* On mobile, just keep Show next to Delete so it doesn't overlap */}
                <div className="sm:hidden absolute right-[8.5rem] top-0">
                    <button
                        onClick={() => setShowPw((s) => !s)}
                        className="rounded-lg border border-border bg-secondary px-4 py-2 text-foreground hover:bg-secondary/70 transition-colors"
                    >
                        {showPw ? "Hide" : "Show"}
                    </button>
                </div>

                {/* DELETE: top-right */}
                <button
                    onClick={onDelete}
                    className="absolute right-0 top-0 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-destructive hover:bg-destructive/20 transition-colors"
                >
                    Delete
                </button>
            </div>

            {/* BODY: two equal columns under the header */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Username */}
                <FieldBlock
                    label="Username"
                    hint={copied === "username" ? "Copied" : "Tap to copy"}
                    onClick={() => copy(item.username ?? "", "username")}
                    value={item.username || "—"}
                />

                {/* Password */}
                <div>
                    <div className="mb-1 flex h-7 items-center justify-between">
                        <div className="text-sm text-muted-foreground">Password</div>
                        <div className="text-xs text-muted-foreground/80">
                            {copied === "password" ? "Copied" : "Tap to copy"}
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => copy(item.password, "password")}
                        onKeyDown={(e) =>
                            (e.key === "Enter" || e.key === " ") && copy(item.password, "password")
                        }
                        className="min-h-[44px] w-full break-all rounded-lg border border-border bg-muted px-3 py-2 font-mono hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring flex items-center transition-colors"
                        aria-label="Password (tap to copy)"
                        title="Tap to copy"
                    >
                        {showPw ? item.password : mask(item.password)}
                    </div>
                </div>

                {/* Notes */}
                {item.notes && (
                    <div className="sm:col-span-2">
                        <div className="mb-1 text-sm text-muted-foreground">Notes</div>
                        <div className="whitespace-pre-wrap break-words rounded-lg border border-border bg-muted px-3 py-2">
                            {item.notes}
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}

/* ---------- helpers ---------- */

function FieldBlock({
                        label,
                        hint,
                        value,
                        onClick,
                    }: {
    label: string;
    hint: string;
    value: string;
    onClick: () => void;
}) {
    return (
        <div>
            <div className="mb-1 flex h-7 items-center justify-between">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="text-xs text-muted-foreground/80">{hint}</div>
            </div>

            <div
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
                className="min-h-[44px] break-all rounded-lg border border-border bg-muted px-3 py-2 font-mono hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring flex items-center transition-colors"
                aria-label={`${label} (tap to copy)`}
                title="Tap to copy"
            >
                {value}
            </div>
        </div>
    );
}

function mask(s: string) {
    if (!s) return "—";
    const visible = s.slice(-2);
    return "•".repeat(Math.max(0, s.length - 2)) + visible;
}
