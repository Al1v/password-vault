"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/user-button";

export const Navbar = () => {
  const pathname = usePathname();

  return (
      // full-width bar
      <nav className="w-full bg-transparent">
        {/* centered inner container matches page width */}
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="bg-secondary rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div className="flex gap-x-2">
              <Button asChild variant={pathname.startsWith("/info") ? "default" : "outline"}>
                <Link href="/info">Info</Link>
              </Button>
              <Button asChild variant={pathname.startsWith("/vault") ? "default" : "outline"}>
                <Link href="/vault">Vault</Link>
              </Button>
            </div>
            <UserButton />
          </div>
        </div>
      </nav>
  );
};
