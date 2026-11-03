"use client";

import React from "react";
import {
  Coffee,
  Wine,
  UtensilsCrossed,
  Soup,
  Croissant,
  Cookie,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { SidebarGroupType } from "@/data/initialMenu";

export function SidebarRail() {
  const {
    activeTab,
    setActiveTab,
    activeSidebarGroup,
    setActiveSidebarGroup,
    isSidebarOpen,
  } = usePosStore();

  // Collapsible via the single hamburger icon in the top header
  if (!isSidebarOpen) return null;

  const menuGroups: {
    id: SidebarGroupType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "Coffee", label: "Coffee", icon: Coffee },
    { id: "Beverages", label: "Beverages", icon: Wine },
    { id: "Food", label: "Food", icon: UtensilsCrossed },
    { id: "Appetizer", label: "Appetizer", icon: Soup },
    { id: "Bread", label: "Bread", icon: Croissant },
    { id: "Snack", label: "Snack", icon: Cookie },
  ];

  return (
    <aside className="w-[88px] sm:w-[100px] bg-white border-r border-gray-100 py-5 px-2 flex flex-col items-center justify-between shrink-0 h-full overflow-y-auto custom-scrollbar select-none z-20">
      {/* Main Vertical Category Rail matching Coca coffeetalk UI */}
      <nav className="flex flex-col items-center gap-3 w-full">
        {menuGroups.map((group) => {
          const Icon = group.icon;
          const isActive =
            activeTab === "pos" && activeSidebarGroup === group.id;

          return (
            <button
              type="button"
              key={group.id}
              onClick={() => setActiveSidebarGroup(group.id)}
              className={`w-[68px] h-[68px] rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-b from-[#FF8C42] to-[#FF5511] text-white shadow-[0_8px_20px_rgba(255,94,26,0.28)] scale-[1.02]"
                  : "bg-transparent text-gray-400 hover:text-zinc-700 hover:bg-[#F8F9FB]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                  isActive ? "bg-white/20" : "bg-transparent"
                }`}
              >
                <Icon
                  className={`w-[19px] h-[19px] ${
                    isActive ? "text-white stroke-[2.1]" : "stroke-[1.7]"
                  }`}
                />
              </div>
              <span
                className={`text-[11px] leading-none tracking-tight ${
                  isActive ? "font-bold text-white" : "font-medium text-gray-400"
                }`}
              >
                {group.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Utility Rail: Dashboard & Settings */}
      <div className="flex flex-col items-center gap-2 pt-4 mt-4 border-t border-gray-100 w-full">
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`w-[68px] py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "analytics" || activeTab === "inventory"
              ? "bg-gradient-to-b from-[#FF8C42] to-[#FF5511] text-white shadow-[0_8px_20px_rgba(255,94,26,0.25)]"
              : "text-gray-400 hover:text-zinc-700 hover:bg-[#F8F9FB]"
          }`}
          title="Dashboard & Stok"
        >
          <LayoutDashboard className="w-[18px] h-[18px] stroke-[1.8]" />
          <span className="text-[10px] font-medium leading-none">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`w-[68px] py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "bg-gradient-to-b from-[#FF8C42] to-[#FF5511] text-white shadow-[0_8px_20px_rgba(255,94,26,0.25)]"
              : "text-gray-400 hover:text-zinc-700 hover:bg-[#F8F9FB]"
          }`}
          title="Pengaturan"
        >
          <Settings className="w-[18px] h-[18px] stroke-[1.8]" />
          <span className="text-[10px] font-medium leading-none">Settings</span>
        </button>
      </div>
    </aside>
  );
}
