"use client";

import { useState } from "react";
import Image from 'next/image';

export default function TwoFactorCard() {
    const [qr, setQr] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    async function start() {
        setErr("");
        setBusy(true);
        try {
            const r = await fetch("/api/2fa/setup", { method: "POST" });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || "Failed to start 2FA");
            setQr(j.qr);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setBusy(false);
        }
    }

    async function verify() {
        setErr("");
        try {
            const r = await fetch("/api/2fa/verify", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ token: code }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error || "Invalid code");

            alert(`2FA enabled! Save these backup codes NOW:\n\n${j.backupCodes.join("\n")}`);
            setQr(null);
            setCode("");
        } catch (e: any) {
            setErr(e.message);
        }
    }

    return (
        <div className="space-y-3 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">Two-Factor Authentication (TOTP)</h2>
            {!qr ? (
                <button
                    disabled={busy}
                    onClick={start}
                    className="px-3 py-2 rounded bg-black text-white"
                >
                    {busy ? "Preparing…" : "Enable 2FA"}
                </button>
            ) : (
                <>
                    <p className="text-sm text-gray-600">
                        Scan this QR with Google Authenticator / 1Password / Authy, then enter the 6-digit code:
                    </p>
                    <Image src={qr} alt="Authenticator QR" className="w-44 h-44 border" />
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="123456"
                        inputMode="numeric"
                        className="border rounded px-2 py-1 w-44"
                    />
                    <div>
                        <button onClick={verify} className="px-3 py-2 rounded bg-black text-white">
                            Verify & Enable
                        </button>
                    </div>
                </>
            )}
            {err && <div className="text-red-600 text-sm">{err}</div>}
        </div>
    );
}
