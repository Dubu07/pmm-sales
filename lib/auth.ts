export const SESSION_COOKIE = "pmm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type AuthConfig = {
  userId: string;
  password: string;
  sessionSecret: string;
};

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

function getEnvironmentValue(name: string) {
  return process.env[name];
}

export function getAuthConfig(): AuthConfig {
  const userId = getEnvironmentValue("AUTH_USER_ID")?.trim();
  const password = getEnvironmentValue("AUTH_PASSWORD");
  const sessionSecret = getEnvironmentValue("AUTH_SESSION_SECRET");

  if (!userId || !password || !sessionSecret) {
    throw new Error("Authentication is not configured.");
  }

  return { userId, password, sessionSecret };
}

export function safeEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    const leftCode = index < left.length ? left.charCodeAt(index) : 0;
    const rightCode = index < right.length ? right.charCodeAt(index) : 0;
    difference |= leftCode ^ rightCode;
  }

  return difference === 0;
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function createSessionValue(userId: string) {
  const { sessionSecret } = getAuthConfig();
  const payload = encodeBase64Url(JSON.stringify({ userId, expiresAt: Date.now() + SESSION_MAX_AGE * 1000 }));
  return `${payload}.${await sign(payload, sessionSecret)}`;
}

export async function verifySessionValue(value: string | undefined) {
  if (!value) return false;

  try {
    const { userId, sessionSecret } = getAuthConfig();
    const separator = value.lastIndexOf(".");
    if (separator < 1) return false;

    const payload = value.slice(0, separator);
    const signature = value.slice(separator + 1);
    const expectedSignature = await sign(payload, sessionSecret);
    if (!safeEqual(signature, expectedSignature)) return false;

    const parsed = JSON.parse(decodeBase64Url(payload)) as Partial<SessionPayload>;
    return parsed.userId === userId && typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function sessionCookieOptions(request: Request) {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: new URL(request.url).protocol === "https:",
  };
}