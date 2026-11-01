"use client";

import React from "react";
import {
  LayoutGrid,
  Clock,
  BarChart3,
  Package,
  Settings,
} from "lucide-react";
import { usePosStore, AppNavTab } from "@/store/usePosStore";

export function SidebarRail() {
  const { activeTab, setActiveTab } = usePosStore();

  const navLinks: {
    id: AppNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "pos", label: "Katalog Kasir", icon: LayoutGrid },
    { id: "history", label: "Riwayat Transaksi", icon: Clock },
    { id: "analytics", label: "Perkembangan & Omzet", icon: BarChart3 },
    { id: "inventory", label: "Manajemen Stok", icon: Package },
  ];

  return (
    <aside className="w-[72px] sm:w-[80px] bg-white border-r border-gray-100 flex flex-col items-center justify-between py-6 shrink-0 z-20 h-full">
      {/* Top Brand Emblem */}
      <div className="flex flex-col items-center gap-7">
        <button
          onClick={() => setActiveTab("pos")}
          title="Kantin Kampus POS"
          className="w-10 h-10 rounded-2xl bg-[#FFF2EE] flex items-center justify-center text-[#FF5B35] shadow-xs cursor-pointer hover:scale-105 transition"
        >
          {/* Coral Lotus / Clover glyph matching reference */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a5 5 0 0 1 5 5c0 3-5 9-5 9s-5-6-5-9a5 5 0 0 1 5-5Z" />
            <path d="M7 10c-3 0-5 2-5 5 0 2 3 5 7 5" />
            <path d="M17 10c3 0 5 2 5 5 0 2-3 5-7 5" />
          </svg>
        </button>

        {/* Navigation Item Icons */}
        <nav className="flex flex-col items-center gap-3">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#FFF0EB] text-[#FF5B35] shadow-2xs"
                    : "text-gray-400 hover:text-zinc-700 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "stroke-[2.5]" : "stroke-[1.8]"
                  }`}
                />
                {isActive && (
                  <span className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#FF5B35] rounded-l-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings Control */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => setActiveTab("settings")}
          title="Pengaturan Kantin"
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition cursor-pointer ${
            activeTab === "settings"
              ? "bg-[#FFF0EB] text-[#FF5B35]"
              : "text-gray-400 hover:text-zinc-700 hover:bg-gray-50"
          }`}
        >
          <Settings className="w-5 h-5 stroke-[1.8]" />
        </button>
      </div>
    </aside>
  );
}
