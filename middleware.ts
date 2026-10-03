import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

function redirectTo(request: NextRequest, pathname: string, next?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAdmin = session?.role === "ADMIN";

  if (pathname === "/login") {
    return session
      ? redirectTo(request, isAdmin ? "/admin" : "/profile")
      : NextResponse.next();
  }

  if (!session) {
    return redirectTo(request, "/login", pathname + search);
  }

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/reports-print");

  if (isAdminRoute && !isAdmin) {
    return redirectTo(request, "/profile");
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
    "/reports-print/:path*",
  ],
};
