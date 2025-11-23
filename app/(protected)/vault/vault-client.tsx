"use client";

import { Button } from "@/components/ui/button";
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
        if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
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
interface FieldBlockProps {
    label: string;
    hint: string;
    value: string;
    onClick: () => void;
}

function FieldBlock({ label, hint, value, onClick }: FieldBlockProps) {
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
                onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && onClick()
                }
                className="min-h-[44px] break-all rounded-lg border border-border bg-muted px-3 py-2 font-mono hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring flex items-center transition-colors"
                aria-label={`${label} (tap to copy)`}
                title="Tap to copy"
            >
                {value}
            </div>
        </div>
    );
}


function mask(s: string): string {
    if (!s) return "—";
    const visible = s.slice(-2);
    return "•".repeat(Math.max(0, s.length - 2)) + visible;
}

function VaultCard({ item, onDelete }: { item: Item; onDelete: () => void }) {
    const [copied, setCopied] = useState<"username" | "password" | null>(null);
    const [showPw, setShowPw] = useState(false);
    const [open, setOpen] = useState(false);

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
        <article className="rounded-xl border border-border bg-secondary/60 text-card-foreground p-4 shadow-sm transition-colors">
            {/* HEADER: whole row toggles details (except Delete button) */}
            <div
                className="flex items-center gap-3 cursor-pointer select-none"
                onClick={() => setOpen((o) => !o)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <h3 className="truncate text-lg font-semibold">
                            {item.title || "(no title)"}
                        </h3>

                        {item.url && (
                            <a
                                href={urlDisplay!}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate text-sm text-primary hover:underline max-w-xs"
                                onClick={(e) => e.stopPropagation()} // don't toggle when opening link
                            >
                                {item.url}
                            </a>
                        )}
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {/* small chevron indicator */}
                    <span className="text-xs text-muted-foreground">
            {open ? "Hide" : "Details"}
          </span>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                            e.stopPropagation(); // don't open/close when deleting
                            onDelete();
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </div>

            {/* BODY: only visible when open */}
            {open && (
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
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                                <button
                                    type="button"
                                    className="underline-offset-2 hover:underline"
                                    onClick={() => setShowPw((s) => !s)}
                                >
                                    {showPw ? "Hide" : "Show"}
                                </button>
                                <span>{copied === "password" ? "Copied" : "Tap to copy"}</span>
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
            )}
        </article>
    );
}



