"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  TrendingUp,
  User,
  UtensilsCrossed,
} from "lucide-react";

interface AdminLoginViewProps {
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  loginError: string;
  isLoggingIn: boolean;
  handleLoginSubmit: (e: React.FormEvent) => void;
  menuCount: number;
}

const PHONE_CHART_BARS = [
  { day: "Sen", totalH: 60, activeH: 32 },
  { day: "Sel", totalH: 74, activeH: 46 },
  { day: "Rab", totalH: 66, activeH: 52 },
  { day: "Kam", totalH: 78, activeH: 40 },
  { day: "Jum", totalH: 70, activeH: 60 },
  { day: "Sab", totalH: 76, activeH: 68, badge: "+24%" },
  { day: "Min", totalH: 62, activeH: 38 },
];

// ============================================================================
// Mockup HP 3D + Genggaman Tangan (Khusus Panel Kiri Desktop lg+)
// ============================================================================
function PhoneMockupWithHand({ menuCount }: { menuCount: number }) {
  return (
    <div className="relative w-[320px] h-[350px] flex items-end justify-center">
      {/* Ambient Dark Glow Behind Phone */}
      <div className="w-72 h-72 rounded-full bg-black/60 blur-3xl absolute -bottom-12 left-1/2 -translate-x-1/2" />

      {/* Stylized Hand Silhouette Holding Phone (Left Side) */}
      <div
        className="absolute -bottom-14 left-[6%] w-[220px] h-[270px] rounded-tr-[72px] z-10"
        style={{
          background:
            "linear-gradient(145deg, #334155 0%, #1E293B 45%, #090D16 100%)",
          transform: "rotate(12deg)",
          boxShadow: "inset 4px 6px 18px rgba(148,163,184,0.18)",
        }}
      />
      {/* Thumb Grip Overlays on Left Edge of Phone */}
      <div
        className="absolute bottom-[90px] left-[13%] w-[54px] h-[30px] rounded-full z-30"
        style={{
          background:
            "linear-gradient(135deg, #475569 0%, #1E293B 70%, #0F172A 100%)",
          transform: "rotate(-22deg)",
          boxShadow: "0 6px 14px rgba(0,0,0,0.65)",
        }}
      />
      <div
        className="absolute bottom-[46px] left-[11%] w-[50px] h-[28px] rounded-full z-30"
        style={{
          background:
            "linear-gradient(135deg, #334155 0%, #1E293B 75%, #090D16 100%)",
          transform: "rotate(-18deg)",
          boxShadow: "0 6px 14px rgba(0,0,0,0.65)",
        }}
      />

      {/* Tilted Smartphone Frame */}
      <div
        className="relative z-20 w-[252px] bg-[#090D16] rounded-[40px] p-[6px] border-[3px] border-[#475569] shadow-[22px_28px_65px_rgba(0,0,0,0.88)]"
        style={{ transform: "rotate(14deg) translateY(20px)" }}
      >
        {/* Metallic Right Side Highlight & Button */}
        <div className="absolute -right-[4px] top-20 w-[3px] h-12 bg-[#64748B] rounded-r-sm" />

        {/* Inner Screen */}
        <div className="w-full bg-[#0B0F19] rounded-[33px] overflow-hidden flex flex-col">
          {/* Top White Card inside Phone (POS Revenue Preview) */}
          <div className="bg-[#F8FAFC] rounded-[28px] px-4 pt-2.5 pb-3.5 text-slate-900 shadow-sm">
            {/* Dynamic Island */}
            <div className="w-14 h-3.5 bg-[#0B0F19] rounded-full mx-auto mb-2.5 flex items-center justify-end pr-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            </div>

            {/* Date / Status Row */}
            <div className="flex items-center justify-between text-[8px] text-slate-400 font-semibold mb-0.5">
              <span>Omzet Mingguan • POS</span>
              <span className="w-4 h-4 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                <TrendingUp className="w-2.5 h-2.5" />
              </span>
            </div>

            {/* Main Balance (Rupiah POS) */}
            <div className="flex items-baseline gap-1 mb-2.5">
              <span className="text-[10px] font-bold text-[#2563EB]">Rp</span>
              <span className="text-[21px] font-extrabold tracking-tight text-slate-900 leading-none">
                2.890.000
              </span>
            </div>

            {/* 7-Bar Mini Chart */}
            <div className="flex items-end justify-between gap-1.5 h-[66px] pt-2 px-0.5">
              {PHONE_CHART_BARS.map((bar) => (
                <div
                  key={bar.day}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-slate-200/90 rounded-t-[4px] rounded-b-[2px] relative flex items-end overflow-visible"
                    style={{ height: `${bar.totalH * 0.68}px` }}
                  >
                    <div
                      className="w-full rounded-t-[4px] rounded-b-[2px]"
                      style={{
                        height: `${bar.activeH * 0.68}px`,
                        background:
                          "linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)",
                      }}
                    />
                    {bar.badge && (
                      <span className="absolute -bottom-1 -left-1.5 px-1 py-[1px] rounded-full bg-[#2563EB] text-white text-[5.5px] font-bold leading-none shadow">
                        {bar.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[6.5px] text-slate-400 font-medium leading-none">
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Dark Area inside Phone (Menu Categories) */}
          <div className="px-3.5 pt-3 pb-2.5 bg-[#0B0F19] text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8.5px] text-slate-300 font-medium">
                Kategori Menu
              </span>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center text-[7px] text-slate-300">
                  ↑
                </span>
                <span className="w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center text-[7px] text-slate-300">
                  ⊞
                </span>
              </div>
            </div>

            {/* 3 Category Mini Cards */}
            <div className="grid grid-cols-3 gap-1.5 items-end mb-3">
              <div className="bg-gradient-to-b from-white/[0.09] to-sky-500/20 border border-white/10 rounded-xl p-2 h-[74px] flex flex-col justify-between">
                <span className="text-[7.5px] font-bold text-white text-center">
                  142 Porsi
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[6px] text-sky-300 font-medium leading-tight">
                      Rice Bowl
                    </div>
                    <div className="text-[5px] text-slate-400">Terlaris</div>
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-white/15 flex items-center justify-center text-[6.5px]">
                    🍚
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-b from-white/[0.14] to-blue-600/30 border border-blue-400/25 rounded-xl p-2 h-[86px] flex flex-col justify-between -translate-y-1 shadow-md">
                <span className="text-[8px] font-bold text-white text-center">
                  {menuCount} Menu
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[6px] text-blue-300 font-medium leading-tight">
                      Stok Aktif
                    </div>
                    <div className="text-[5px] text-slate-400">Siap Jual</div>
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500/30 flex items-center justify-center text-[6.5px]">
                    🔥
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-b from-white/[0.08] to-indigo-500/20 border border-white/10 rounded-xl p-2 h-[66px] flex flex-col justify-between">
                <span className="text-[7.5px] font-bold text-white text-center">
                  98 Cup
                </span>
                <div>
                  <div className="text-[6px] text-indigo-300 font-medium leading-tight">
                    Minuman
                  </div>
                  <div className="text-[5px] text-slate-400">& Snack</div>
                </div>
              </div>
            </div>

            {/* Phone Bottom Navigation */}
            <div className="flex items-center justify-between px-1.5 pt-1.5 border-t border-white/5">
              <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[7px] text-slate-400">
                ⌂
              </span>
              <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[7px] text-slate-400">
                🧾
              </span>
              <div
                className="w-6 h-6 rounded-full p-[2px] flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.65)]"
                style={{
                  background:
                    "conic-gradient(from 180deg, #2563EB, #38BDF8, #6366F1, #1D4ED8, #38BDF8, #2563EB)",
                }}
              >
                <div className="w-full h-full rounded-full bg-[#0B0F19]" />
              </div>
              <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[7px] text-slate-400">
                ⊟
              </span>
              <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[7px] text-slate-400">
                ☷
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminLoginView({
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loginError,
  isLoggingIn,
  handleLoginSubmit,
  menuCount,
}: AdminLoginViewProps) {
  // Kunci scroll 1 halaman & sesuaikan warna status bar (Putih di Mobile, Navy di Desktop)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlBg: html.style.backgroundColor,
      bodyBg: body.style.backgroundColor,
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    let metaTheme = document.querySelector(
      'meta[name="theme-color"]'
    ) as HTMLMetaElement | null;
    const prevThemeContent = metaTheme?.getAttribute("content") ?? null;
    if (!metaTheme) {
      metaTheme = document.createElement("meta");
      metaTheme.name = "theme-color";
      document.head.appendChild(metaTheme);
    }

    const syncThemeColor = () => {
      const isDesktop = window.innerWidth >= 1024;
      const bg = isDesktop ? "#0F172A" : "#FFFFFF";
      html.style.backgroundColor = bg;
      body.style.backgroundColor = bg;
      metaTheme?.setAttribute("content", bg);
    };

    syncThemeColor();
    window.addEventListener("resize", syncThemeColor);

    return () => {
      window.removeEventListener("resize", syncThemeColor);
      html.style.backgroundColor = prev.htmlBg;
      body.style.backgroundColor = prev.bodyBg;
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      if (metaTheme) {
        if (prevThemeContent !== null) {
          metaTheme.setAttribute("content", prevThemeContent);
        } else {
          metaTheme.remove();
        }
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-white lg:bg-[#0F172A] flex flex-col lg:flex-row font-sans select-none overflow-hidden overscroll-none">
      {/* ================================================================
          1. DESKTOP LEFT DARK PANEL (lg+): Full 3D Tilted Phone Showcase
      ================================================================ */}
      <div
        className="hidden lg:flex lg:w-[48%] xl:w-[47%] lg:h-full relative flex-col items-center justify-between pt-10 pb-0 px-12 overflow-hidden shrink-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, #1E293B 0%, #0F172A 65%, #090D16 100%)",
        }}
      >
        {/* Top Tagline */}
        <p className="text-[13px] text-slate-400 font-normal tracking-wide text-center max-w-[420px] relative z-20">
          Sistem kasir & manajemen pintar – solusi operasional kuliner Bahtera Biru.
        </p>

        {/* Concentric Subtle Circles + Headline */}
        <div className="relative flex items-center justify-center my-auto py-8 w-full">
          <div className="w-[260px] h-[260px] rounded-full bg-[#2563EB]/15 blur-3xl absolute pointer-events-none" />
          <div className="w-[330px] h-[330px] xl:w-[380px] xl:h-[380px] rounded-full border border-white/[0.04] absolute pointer-events-none" />
          <div className="w-[245px] h-[245px] xl:w-[280px] xl:h-[280px] rounded-full border border-blue-400/[0.08] absolute pointer-events-none" />
          <div className="w-[160px] h-[160px] xl:w-[185px] xl:h-[185px] rounded-full border border-white/[0.05] absolute pointer-events-none" />

          <h2 className="text-[46px] xl:text-[56px] font-medium text-white tracking-[-0.025em] leading-[1.12] text-center relative z-10">
            Kelola bisnis
            <br />
            lebih cerdas
          </h2>
        </div>

        {/* 3D Tilted Phone & Hand Composition at Bottom */}
        <div className="relative w-full h-[300px] xl:h-[345px] flex items-end justify-center z-20 pointer-events-none">
          <div className="origin-bottom scale-[0.86] xl:scale-[0.96]">
            <PhoneMockupWithHand menuCount={menuCount} />
          </div>

          <div className="absolute bottom-6 right-6 w-7 h-7 rounded-full border border-blue-400/40 bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs">
            ★
          </div>
        </div>
      </div>

      {/* ================================================================
          2. FULL WHITE PANEL ON MOBILE (< lg) / RIGHT WHITE CARD ON DESKTOP (lg+)
      ================================================================ */}
      <div className="w-full h-full lg:w-[52%] xl:w-[53%] bg-white lg:rounded-l-[44px] px-6 pt-5 pb-5 sm:px-10 sm:py-8 lg:p-14 xl:p-16 flex flex-col justify-between lg:shadow-[-20px_0_60px_rgba(0,0,0,0.32)] relative z-30">
        {/* Top Bar (Tombol Halaman Kasir) */}
        <div className="flex items-center justify-end shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#2563EB] transition"
          >
            <span className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-500">
              <UtensilsCrossed className="w-3 h-3" />
            </span>
            <span>Halaman Kasir</span>
          </Link>
        </div>

        {/* Sign In Form (Centered Vertically) */}
        <div className="w-full max-w-[380px] mx-auto my-auto py-4">
          <h1 className="text-[28px] sm:text-[32px] lg:text-[36px] font-bold lg:font-semibold text-slate-900 tracking-tight mb-1.5">
            Sign In
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 mb-7 leading-relaxed">
            Masuk ke portal manajemen menu, stok produk, dan laporan keuangan.
          </p>

          {loginError && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-medium text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username Admin"
                required
                autoComplete="username"
                className="w-full rounded-full bg-slate-50/70 lg:bg-white border border-slate-200/90 pl-12 pr-6 py-4 text-[13px] font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete="current-password"
                className="w-full rounded-full bg-slate-50/70 lg:bg-white border border-slate-200/90 pl-12 pr-12 py-4 text-[13px] font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 px-6 mt-2 rounded-full text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait"
              style={{
                background:
                  "linear-gradient(90deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)",
                boxShadow: "0 14px 30px -6px rgba(37, 99, 235, 0.48)",
              }}
            >
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>
                {isLoggingIn ? "Memverifikasi..." : "Masuk ke Dashboard"}
              </span>
            </button>
          </form>

          {/* Security Badge Pill */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
            <span>Sesi terenkripsi • Akses khusus pengelola</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100 shrink-0">
          <span>© 2026 Bahtera Biru POS.</span>
          <span className="text-slate-500 font-medium">Indonesia</span>
        </div>
      </div>
    </div>
  );
}
