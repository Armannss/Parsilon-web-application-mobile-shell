const WEAK_SECRETS = new Set(["parsilon_super_secret_change_me_123456"]);

function readJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  if (secret.length < 32 || WEAK_SECRETS.has(secret)) {
    throw new Error(
      "JWT_SECRET is too weak. Generate one with: openssl rand -base64 48"
    );
  }

  return secret;
}

let cachedKey: Uint8Array | null = null;

// Resolved lazily so `next build` does not need the secret.
export function getJwtKey() {
  if (!cachedKey) {
    cachedKey = new TextEncoder().encode(readJwtSecret());
  }

  return cachedKey;
}
