import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  signSessionToken,
  verifySessionToken,
  type SessionUser,
} from "@/lib/session";

export { SESSION_COOKIE_NAME, signSessionToken, sessionCookieOptions };
export type { SessionUser };

// Compared against when the phone is unknown, so login takes the same time
// whether or not the account exists.
const DUMMY_PASSWORD_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8rj6Yk1e0rQq0bJ0mXGZcQ8v1x7b1G";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string | null) {
  const matches = await bcrypt
    .compare(password, hash ?? DUMMY_PASSWORD_HASH)
    .catch(() => false);

  return Boolean(hash) && matches;
}

export async function getCurrentUserFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  // Role and active flag always come from the database, never from the token.
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

export async function getCurrentAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUserFromCookie();
  return user && user.role === "ADMIN" ? user : null;
}
