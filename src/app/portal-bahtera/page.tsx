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
      <div className="h-[100dvh] w-screen bg-[#F7F8FA] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-md animate-pulse">
            <div className="w-4 h-4 rounded-full border-2 border-white" />
          </div>
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
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

