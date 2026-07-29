import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "parsilon_session";
const JWT_SECRET =
  process.env.JWT_SECRET || "parsilon_super_secret_change_me_123456";
export type SessionUser = {
  id: string;
  fullName: string;
  phone: string;
  role: "ADMIN" | "USER";
};

type JwtPayload = {
  id: string;
  fullName: string;
  phone: string;
  role: "ADMIN" | "USER";
  iat?: number;
  exp?: number;
};

type LegacyAuthCookiePayload = {
  userId: string;
  phone: string;
  role: "ADMIN" | "USER";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(user: SessionUser) {
  return jwt.sign(
    {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (
      !decoded ||
      typeof decoded.id !== "string" ||
      typeof decoded.fullName !== "string" ||
      typeof decoded.phone !== "string" ||
      (decoded.role !== "ADMIN" && decoded.role !== "USER")
    ) {
      return null;
    }

    return {
      id: decoded.id,
      fullName: decoded.fullName,
      phone: decoded.phone,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = signSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

// برای سازگاری با کدهای قبلی
export async function createAuthCookie(payload: LegacyAuthCookiePayload) {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new Error("User not found or inactive");
  }

  await setSessionCookie({
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUserFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
  };
}

export async function requireUser() {
  const user = await getCurrentUserFromCookie();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUserFromCookie();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return user;
}