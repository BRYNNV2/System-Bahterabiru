"use client";

import React from "react";
import dynamic from "next/dynamic";

const AdminDashboard = dynamic(
  () =>
    import("@/components/admin/AdminDashboard").then(
      (mod) => mod.AdminDashboard
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[100dvh] w-screen bg-[#0F172A] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full p-[3px] flex items-center justify-center animate-spin"
            style={{
              background:
                "conic-gradient(from 200deg, #1D4ED8, #2563EB, #38BDF8, #6366F1, #2563EB, #1D4ED8)",
            }}
          >
            <div className="w-full h-full rounded-full bg-[#0F172A]" />
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Memuat Portal Bahtera...
          </span>
        </div>
      </div>
    ),
  }
);

export default function PortalBahteraPage() {
  return <AdminDashboard />;
}

