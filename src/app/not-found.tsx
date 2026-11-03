"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Utensils, ArrowLeft } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    // Otomatis redirect ke root POS dalam 2 detik jika tersasar
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4 font-sans select-none">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-zinc-200/80 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center shadow-xs">
          <Utensils className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">404</h1>
        <h2 className="text-base font-bold text-zinc-800 mt-1">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
          Rute yang Anda buka belum terdaftar atau Anda diarahkan dari URL lain. Mengalihkan Anda kembali ke aplikasi kasir utama...
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-3 px-5 rounded-xl transition shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Kembali ke Food Order / Kasir</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

