// middleware.ts — Edge-safe and v5-compatible (no next-auth/jwt)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

// helper: look for any auth session cookie used by NextAuth/Auth.js
function hasSessionCookie(req: NextRequest) {
  // v5 cookies (dev/prod), plus legacy names just in case
  const names = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];
  return names.some((n) => req.cookies.get(n));
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Always allow NextAuth API
  if (pathname.startsWith(apiAuthPrefix)) return NextResponse.next();

  const isLoggedIn = hasSessionCookie(req);

  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.includes(pathname);
  const isTwoFARoute = pathname === "/2fa"; // keep if you use a dedicated page

  // Auth pages (login/register/etc.)
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
    }
    return NextResponse.next();
  }

  // Gate non-public routes
  if (!isLoggedIn && !isPublicRoute && !isTwoFARoute) {
    const login = new URL("/auth/login", req.url);
    // preserve callback
    login.searchParams.set("callbackUrl", pathname + (nextUrl.search || ""));
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

// Keep matcher simple
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)"],
};
