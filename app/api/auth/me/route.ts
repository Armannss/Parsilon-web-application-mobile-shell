import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCurrentUserFromCookie,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUserFromCookie();

  // 200 for visitors too: "not signed in" is a normal answer, not an error.
  const response = NextResponse.json(
    { success: Boolean(user), user },
    { headers: { "Cache-Control": "no-store" } }
  );

  // A cookie that no longer maps to an active account (deleted or disabled
  // user, rotated secret) is dropped, so the browser is not bounced between
  // /login and the protected pages by a token that looks valid.
  if (!user && (await cookies()).has(SESSION_COOKIE_NAME)) {
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      ...sessionCookieOptions,
      maxAge: 0,
    });
  }

  return response;
}
