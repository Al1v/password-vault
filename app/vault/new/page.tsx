"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewVaultItemPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        title: "",
        username: "",
        url: "",
        password: "",
        notes: "",
    });
    const [saving, setSaving] = useState(false);

    const payload = useMemo(() => {
        const url = form.url.trim();
        return { ...form, url: url.length ? url : undefined };
    }, [form]);

    async function submit() {
        setSaving(true);
        const res = await fetch("/api/vault", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        setSaving(false);

        if (res.ok) {
            router.push("/vault");
            router.refresh();
        } else {
            const data = await res.json().catch(() => ({}));
            alert(`Failed to save: ${data.error ?? res.statusText}`);
        }
    }

    return (
        <div className="mx-auto max-w-3xl p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold">Add New</h1>
                <a href="/vault" className="rounded-xl border border-border bg-secondary px-4 py-2 hover:opacity-90">
                    Back
                </a>
            </div>

            <section className="rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                        label="Title"
                        placeholder="Gmail"
                        value={form.title}
                        onChange={(v) => setForm({ ...form, title: v })}
                    />
                    <Input
                        label="Username"
                        placeholder="me@gmail.com"
                        value={form.username}
                        onChange={(v) => setForm({ ...form, username: v })}
                    />
                    <Input
                        label="URL"
                        placeholder="https://mail.google.com"
                        value={form.url}
                        onChange={(v) => setForm({ ...form, url: v })}
                        className="sm:col-span-2"
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(v) => setForm({ ...form, password: v })}
                        className="sm:col-span-2"
                    />
                    <Textarea
                        label="Notes"
                        placeholder="Any extra info…"
                        value={form.notes}
                        onChange={(v) => setForm({ ...form, notes: v })}
                        className="sm:col-span-2"
                    />
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                        onClick={submit}
                        disabled={saving}
                        className="w-full sm:w-auto rounded-xl bg-primary px-5 py-2.5 text-primary-foreground disabled:opacity-60"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                        onClick={() => setForm({ title: "", username: "", url: "", password: "", notes: "" })}
                        className="w-full sm:w-auto rounded-xl border border-border bg-secondary px-5 py-2.5 hover:opacity-90"
                    >
                        Clear
                    </button>
                </div>
            </section>
        </div>
    );
}

/* --- small inputs styled for dark tokens --- */

function Input({
                   label,
                   value,
                   onChange,
                   placeholder,
                   type = "text",
                   className = "",
               }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: "text" | "password";
    className?: string;
}) {
    return (
        <label className={"block " + className}>
            <div className="mb-1 text-sm text-muted-foreground">{label}</div>
            <input
                type={type}
                className="w-full rounded-xl border border-border bg-muted px-3 py-2 outline-none ring-0 focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/70"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                inputMode={type === "password" ? "text" : undefined}
                autoComplete={type === "password" ? "new-password" : "off"}
            />
        </label>
    );
}

function Textarea({
                      label,
                      value,
                      onChange,
                      placeholder,
                      className = "",
                  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <label className={"block " + className}>
            <div className="mb-1 text-sm text-muted-foreground">{label}</div>
            <textarea
                rows={4}
                className="w-full rounded-xl border border-border bg-muted px-3 py-2 outline-none ring-0 focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/70"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}
