import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Providers from "../providers";
import { Navbar } from "./_components/navbar";

interface Props {
    children: React.ReactNode;
}

const ProtectedLayout = async ({ children }: Props) => {
    const session = await auth();

    if (!session) redirect("/auth/login");

    return (
        <html lang="en" className="dark" suppressHydrationWarning>
        <body className="min-h-screen bg-black text-white antialiased">
        <Providers>
            {/* shared centered container */}
            <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
                <Navbar />
                <main className="space-y-10">
                    {children}
                </main>
            </div>
        </Providers>
        </body>
        </html>
    );
};

export default ProtectedLayout;
