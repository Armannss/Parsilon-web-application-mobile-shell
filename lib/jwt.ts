import jwt, { type JwtPayload } from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set");
}

const JWT_SECRET: string = jwtSecret;

export type AuthTokenPayload = {
  userId: string;
  phone: string;
  role: "USER" | "ADMIN";
};

function isAuthTokenPayload(value: unknown): value is AuthTokenPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.userId === "string" &&
    typeof payload.phone === "string" &&
    (payload.role === "USER" || payload.role === "ADMIN")
  );
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;

    if (typeof decoded === "string") {
      return null;
    }

    if (!isAuthTokenPayload(decoded)) {
      return null;
    }

    return {
      userId: decoded.userId,
      phone: decoded.phone,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}