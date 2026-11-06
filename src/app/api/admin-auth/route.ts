import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  clearFailedAttempts,
  clearSessionCookie,
  createSessionToken,
  getClientIp,
  getLockRemainingSec,
  isAdminLoginConfigured,
  registerFailedAttempt,
  setSessionCookie,
  verifyAdminCredentials,
  verifySessionToken,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/** Cek status sesi admin */
export async function GET(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  return NextResponse.json(
    { authenticated: Boolean(session) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/** Login admin */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const lockedSec = getLockRemainingSec(ip);
  if (lockedSec > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(lockedSec / 60)} menit.`,
        lockedSeconds: lockedSec,
      },
      { status: 429 }
    );
  }

  if (!isAdminLoginConfigured()) {
    return NextResponse.json(
      { success: false, error: "Login admin belum dikonfigurasi di server." },
      { status: 503 }
    );
  }

  let username = "";
  let password = "";
  try {
    const body = await req.json();
    username = typeof body?.username === "string" ? body.username.slice(0, 100) : "";
    password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
  } catch {
    return NextResponse.json({ success: false, error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (!username || !password || !verifyAdminCredentials(username, password)) {
    const remaining = registerFailedAttempt(ip);
    // Jeda kecil untuk memperlambat tebakan otomatis
    await new Promise((r) => setTimeout(r, 600));
    const lockedNow = getLockRemainingSec(ip);
    return NextResponse.json(
      {
        success: false,
        error:
          lockedNow > 0
            ? `Terlalu banyak percobaan gagal. Akses login dikunci ${Math.ceil(lockedNow / 60)} menit.`
            : `Username atau password salah. Sisa percobaan: ${remaining}.`,
        lockedSeconds: lockedNow,
      },
      { status: lockedNow > 0 ? 429 : 401 }
    );
  }

  clearFailedAttempts(ip);
  const res = NextResponse.json({ success: true });
  setSessionCookie(res, createSessionToken(username.trim().toLowerCase()));
  return res;
}

/** Logout admin */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  clearSessionCookie(res);
  return res;
}

