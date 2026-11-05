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
    loading: () => <div className="h-[100dvh] w-screen bg-[#F7F8FA]" />,
  }
);

export default function AdminPortalPage() {
  return <AdminDashboard />;
}

