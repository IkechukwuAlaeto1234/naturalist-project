/**
 * lookup-token.ts
 *
 * Signs and verifies short-lived HMAC-SHA256 lookup tokens used in the
 * forgot-password flow.  The token travels in the URL as a base64url string.
 *
 * Payload stored (never includes the plaintext email):
 *   { name, maskedEmail, emailHash, exp }
 *
 * emailHash is SHA-256(email) — enough for the send-passcode route to re-look
 * up the user in the database without ever putting the real address in the URL.
 */

const ALG = { name: "HMAC", hash: "SHA-256" };
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return s;
}

async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret), ALG, false, [
    "sign",
    "verify",
  ]);
}

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  return Buffer.from(buf as any)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlDecode(str: string): Buffer {
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export interface LookupPayload {
  name: string;
  maskedEmail: string;
  /** SHA-256 hex of the real email — used server-side to re-find the user */
  emailHash: string;
  exp: number;
}

/** Hash the email so the real address never appears in the URL. */
export async function hashEmail(email: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(email.toLowerCase().trim())
  );
  return Buffer.from(buf).toString("hex");
}

/** Create a signed, base64url-encoded lookup token. */
export async function signLookupToken(
  payload: Omit<LookupPayload, "exp">
): Promise<string> {
  const full: LookupPayload = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const encodedPayload = b64urlEncode(new TextEncoder().encode(JSON.stringify(full)));
  const key = await importKey(getSecret());
  const sig = await crypto.subtle.sign(
    ALG,
    key,
    new TextEncoder().encode(encodedPayload)
  );
  return `${encodedPayload}.${b64urlEncode(sig)}`;
}

/** Verify the token and return its payload, or null if invalid / expired. */
export async function verifyLookupToken(
  token: string
): Promise<LookupPayload | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;

    const encodedPayload = token.slice(0, dot);
    const encodedSig = token.slice(dot + 1);

    const key = await importKey(getSecret());
    const valid = await crypto.subtle.verify(
      ALG,
      key,
      new Uint8Array(b64urlDecode(encodedSig)),
      new TextEncoder().encode(encodedPayload)
    );
    if (!valid) return null;

    const payload: LookupPayload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(encodedPayload))
    );

    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}
