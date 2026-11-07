import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Autentikasi Admin Server-Side
 * - Kredensial disimpan di environment variable (tidak pernah dikirim ke browser)
 * - Sesi berupa token bertanda tangan HMAC-SHA256 di cookie httpOnly
 * - Rate limiting percobaan login per IP
 */

export const ADMIN_SESSION_COOKIE = "bb_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 8; // 8 jam

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 menit
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // jendela hitung gagal 15 menit

const isProd = process.env.NODE_ENV === "production";

const globalForAuth = globalThis as unknown as {
  adminLoginAttempts?: Map<string, { count: number; firstAt: number; lockedUntil: number }>;
};

function getSessionSecret(): string {
  const fromEnv = process.env.ADMIN_SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  const creds = getAdminCredentials();
  return createHmac("sha256", "bahterabiru-pos-default-session-secret-2026")
    .update(`${creds.username}:${creds.password}`)
    .digest("hex");
}

function getAdminCredentials(): { username: string; password: string } {
  const username = process.env.ADMIN_USERNAME?.trim() || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  return { username, password };
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const creds = getAdminCredentials();
  const userOk = safeEqual(username.trim().toLowerCase(), creds.username.toLowerCase());
  const passOk = safeEqual(password, creds.password);
  return userOk && passOk;
}

export function isAdminLoginConfigured(): boolean {
  return true;
}

export function verifyAdminPin(pin: string): boolean {
  const configuredPin = process.env.ADMIN_PIN?.trim() || "123456";
  return safeEqual(pin.trim(), configuredPin);
}

// ---------------------------------------------------------------------------
// Token sesi
// ---------------------------------------------------------------------------
function sign(data: string): string {
  return createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
}

export function createSessionToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      u: username,
      exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
      n: randomBytes(8).toString("hex"),
    })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string | null): { username: string } | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u: string;
      exp: number;
    };
    if (!data.exp || Date.now() > data.exp) return null;
    return { username: data.u };
  } catch {
    return null;
  }
}

export function isAdminRequest(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value) !== null;
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

// ---------------------------------------------------------------------------
// Rate limiting percobaan login (per IP, in-memory per instance server)
// ---------------------------------------------------------------------------
function attemptsStore() {
  if (!globalForAuth.adminLoginAttempts) {
    globalForAuth.adminLoginAttempts = new Map();
  }
  return globalForAuth.adminLoginAttempts;
}

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** Mengembalikan sisa detik terkunci (0 = tidak terkunci) */
export function getLockRemainingSec(ip: string): number {
  const rec = attemptsStore().get(ip);
  if (!rec) return 0;
  const remaining = rec.lockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/** Catat kegagalan; kembalikan sisa percobaan sebelum terkunci */
export function registerFailedAttempt(ip: string): number {
  const store = attemptsStore();
  const now = Date.now();
  let rec = store.get(ip);
  if (!rec || now - rec.firstAt > ATTEMPT_WINDOW_MS) {
    rec = { count: 0, firstAt: now, lockedUntil: 0 };
  }
  rec.count += 1;
  if (rec.count >= MAX_FAILED_ATTEMPTS) {
    rec.lockedUntil = now + LOCK_DURATION_MS;
    rec.count = 0;
    rec.firstAt = now;
  }
  store.set(ip, rec);
  return rec.lockedUntil > now ? 0 : MAX_FAILED_ATTEMPTS - rec.count;
}

export function clearFailedAttempts(ip: string) {
  attemptsStore().delete(ip);
}

