"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { redirect } from "next/navigation";

export default function TwoFA() {
    const { data } = useSession();
    const pending = Boolean((data as any)?.pending2FA);
    console.log({data})
    if (data && !pending) redirect("/");

    const [totp, setTotp] = useState("");
    const [backup, setBackup] = useState("");
    const [error, setError] = useState("");

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError("");


        const res = await signIn("credentials", {
            redirect: false,
            twoFactorCode: totp,
            backupCode: backup,
        });

        if (res?.ok) window.location.href = "/";
        else setError("Invalid code");
    }

    return (
        <form onSubmit={submit} className="max-w-sm space-y-3 p-4 border rounded-lg">
            <h1 className="text-xl font-semibold">Two-Factor Authentication</h1>
            <input
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
                placeholder="6-digit TOTP"
                inputMode="numeric"
                className="border rounded px-2 py-1 w-full"
            />
            <div className="text-xs text-gray-600">or use a backup code</div>
            <input
                value={backup}
                onChange={(e) => setBackup(e.target.value)}
                placeholder="Backup code"
                className="border rounded px-2 py-1 w-full"
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button className="px-3 py-2 rounded bg-black text-white w-full">Verify</button>
        </form>
    );
}
