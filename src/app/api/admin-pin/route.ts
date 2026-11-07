import { NextRequest, NextResponse } from "next/server";
import {
  clearFailedAttempts,
  getClientIp,
  getLockRemainingSec,
  isAdminRequest,
  registerFailedAttempt,
  verifyAdminPin,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/** Verifikasi PIN Supervisor / Owner untuk aksi sensitif (CRUD Menu, Stok, Hapus Transaksi) */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: "Sesi admin tidak valid. Silakan login ulang." },
      { status: 401 }
    );
  }

  const ip = `${getClientIp(req)}:pin`;
  const lockedSec = getLockRemainingSec(ip);
  if (lockedSec > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Terlalu banyak percobaan PIN salah. Coba lagi dalam ${Math.ceil(lockedSec / 60)} menit.`,
      },
      { status: 429 }
    );
  }

  let pin = "";
  try {
    const body = await req.json();
    pin = typeof body?.pin === "string" ? body.pin.slice(0, 32) : "";
  } catch {
    return NextResponse.json(
      { success: false, error: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  if (!pin || !verifyAdminPin(pin)) {
    const remaining = registerFailedAttempt(ip);
    await new Promise((r) => setTimeout(r, 450));
    const lockedNow = getLockRemainingSec(ip);
    return NextResponse.json(
      {
        success: false,
        error:
          lockedNow > 0
            ? `Terlalu banyak percobaan gagal. PIN dikunci ${Math.ceil(lockedNow / 60)} menit.`
            : `PIN salah. Sisa percobaan: ${remaining}.`,
      },
      { status: lockedNow > 0 ? 429 : 401 }
    );
  }

  clearFailedAttempts(ip);
  return NextResponse.json({ success: true });
}

