"use client";

import React from "react";
import {
  Coffee,
  Wine,
  UtensilsCrossed,
  Soup,
  Croissant,
  Cookie,
} from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { SidebarGroupType } from "@/data/initialMenu";

export function SidebarRail() {
  const { activeSidebarGroup, setActiveSidebarGroup, isSidebarOpen } =
    usePosStore();

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
    <aside className="w-[88px] sm:w-[100px] bg-white border-r border-zinc-100 py-5 px-2 flex flex-col items-center shrink-0 h-full overflow-y-auto custom-scrollbar select-none z-20">
      {/* Main Vertical Category Rail for Buyer Self-Ordering */}
      <nav className="flex flex-col items-center gap-3 w-full">
        {menuGroups.map((group) => {
          const Icon = group.icon;
          const isActive = activeSidebarGroup === group.id;

          return (
            <button
              type="button"
              key={group.id}
              onClick={() => setActiveSidebarGroup(group.id)}
              className={`w-[68px] h-[68px] rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-zinc-900 text-white shadow-[0_8px_20px_rgba(24,24,27,0.18)] scale-[1.02]"
                  : "bg-transparent text-zinc-400 hover:text-zinc-900 hover:bg-[#F4F4F5]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                  isActive ? "bg-white/15" : "bg-transparent"
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
                  isActive ? "font-bold text-white" : "font-medium text-zinc-400"
                }`}
              >
                {group.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
