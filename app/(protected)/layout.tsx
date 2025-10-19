import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Providers from "../providers";
import { Navbar } from "./_components/navbar";

interface Props { children: React.ReactNode }

const ProtectedLayout = async ({ children }: Props) => {
    const session = await auth();

    if (!session) redirect("/auth/login");

    return (
        <html lang="en" className="dark" suppressHydrationWarning>
        <body className="min-h-screen bg-black text-white antialiased">
        <Providers>
            <Navbar />
            <main className="flex flex-col items-center justify-center w-full h-full gap-y-10">
                {children}
            </main>
        </Providers>
        </body>
        </html>
    );
};

export default ProtectedLayout;
