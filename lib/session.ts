import { SignJWT, jwtVerify } from "jose";
import { getJwtKey } from "@/lib/env";

// Edge-safe: shared by middleware and the Node route handlers.

export const SESSION_COOKIE_NAME = "parsilon_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  fullName: string;
  phone: string;
  role: "ADMIN" | "USER";
};

export async function signSessionToken(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.id !== "string" ||
      typeof payload.fullName !== "string" ||
      typeof payload.phone !== "string" ||
      (payload.role !== "ADMIN" && payload.role !== "USER")
    ) {
      return null;
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

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
