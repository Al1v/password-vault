// app/(protected)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Providers from "../providers";
import { Navbar } from "./_components/navbar";
import { SessionProvider } from "@/components/session-provider";

interface Props {
    children: React.ReactNode;
}

const ProtectedLayout = async ({ children }: Props) => {
    let session = null;

    try {
        session = await auth();
    } catch (e) {
        console.error("[ProtectedLayout] auth() error, treating as no session:", e);
    }

    if (!session) {
        redirect("/auth/login");
    }

    return (
        <html lang="en" className="dark" suppressHydrationWarning>
        <body className="min-h-screen bg-black text-white antialiased">
        <Providers>
            {/* Add SessionProvider for automatic logout */}
            <SessionProvider>
                <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
                    <Navbar />
                    <main className="space-y-10">{children}</main>
                </div>
            </SessionProvider>
        </Providers>
        </body>
        </html>
    );
};

export default ProtectedLayout;