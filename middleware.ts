import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "parsilon_session";

function readRawSessionToken(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || "";
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    const json =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");

    const payload = JSON.parse(json) as {
      id?: unknown;
      fullName?: unknown;
      phone?: unknown;
      role?: unknown;
      exp?: unknown;
    };

    if (
      typeof payload.id !== "string" ||
      typeof payload.fullName !== "string" ||
      typeof payload.phone !== "string" ||
      (payload.role !== "ADMIN" && payload.role !== "USER")
    ) {
      return null;
    }

    if (typeof payload.exp === "number") {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp <= nowInSeconds) {
        return null;
      }
    }

    return {
      id: payload.id,
      fullName: payload.fullName,
      phone: payload.phone,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

function readSessionFromRequest(request: NextRequest) {
  const token = readRawSessionToken(request);
  if (!token) return null;

  return decodeJwtPayload(token);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const session = readSessionFromRequest(request);
  const isLoggedIn = Boolean(session);
  const isAdmin = session?.role === "ADMIN";

  const isLoginPage = pathname === "/login";

  const isProtectedUserRoute =
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/payment" ||
    pathname.startsWith("/payment/") ||
    pathname === "/order-success" ||
    pathname.startsWith("/order-success/");

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isLoginPage && isLoggedIn) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isAdmin ? "/admin" : "/profile";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = "";
      redirectUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(redirectUrl);
    }

    if (!isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/profile";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isProtectedUserRoute && !isLoggedIn) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/profile/:path*",
    "/checkout/:path*",
    "/payment/:path*",
    "/order-success/:path*",
    "/admin/:path*",
  ],
};