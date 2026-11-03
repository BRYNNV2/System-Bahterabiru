"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  ArrowUpDown,
  LayoutGrid,
  Coffee,
  Wine,
  UtensilsCrossed,
  Soup,
  Croissant,
  Cookie,
} from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { CategoryType, SidebarGroupType } from "@/data/initialMenu";

const FILTER_PILLS: { id: CategoryType; label: string }[] = [
  { id: "All Menu", label: "All" },
  { id: "Chicken", label: "Chicken" },
  { id: "Seafood", label: "Seafood" },
  { id: "Pasta", label: "Pasta" },
  { id: "Rice bowl", label: "Rice bowl" },
];

const MOBILE_GROUPS: {
  id: SidebarGroupType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "All", label: "All", icon: LayoutGrid },
  { id: "Food", label: "Food", icon: UtensilsCrossed },
  { id: "Coffee", label: "Coffee", icon: Coffee },
  { id: "Beverages", label: "Beverages", icon: Wine },
  { id: "Appetizer", label: "Appetizer", icon: Soup },
  { id: "Bread", label: "Bread", icon: Croissant },
  { id: "Snack", label: "Snack", icon: Cookie },
];

export function HeaderBar() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    activeSidebarGroup,
    setActiveSidebarGroup,
    sortBy,
    setSortBy,
  } = usePosStore();

  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSortMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortMenu]);

  return (
    <div className="mb-4">
      {/* Top Breadcrumb for Buyer Self-Ordering */}
      <div className="flex items-center justify-between gap-2 mb-2.5 px-0.5">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("All Menu")}
            className="text-zinc-900 font-bold hover:underline cursor-pointer"
          >
            Menu
          </button>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-400 font-medium">{activeSidebarGroup}</span>
        </div>
      </div>

      {/* Mobile Horizontal Group Switcher (Visible on < md so phone users can switch groups with 1 tap) */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar mb-3 pb-0.5">
        {MOBILE_GROUPS.map((grp) => {
          const Icon = grp.icon;
          const isActive = activeSidebarGroup === grp.id;
          return (
            <button
              type="button"
              key={grp.id}
              onClick={() => setActiveSidebarGroup(grp.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs shrink-0 transition cursor-pointer ${
                isActive
                  ? "bg-zinc-900 text-white font-bold shadow-xs"
                  : "bg-white border border-zinc-200/70 text-zinc-600 font-medium"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{grp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Unified Search & Category Pill Bar */}
      <div className="bg-white rounded-2xl px-3.5 sm:px-4 py-2.5 border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3">
        {/* Left: Search Input */}
        <div className="relative flex-1 flex items-center border-b xl:border-b-0 xl:border-r border-zinc-100 pb-2 xl:pb-0 xl:pr-4">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full bg-transparent text-zinc-800 placeholder:text-zinc-300 text-xs font-medium pl-2.5 pr-7 py-1 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-zinc-400 hover:text-zinc-800 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Category Pills + Sort */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5 xl:pb-0">
            {FILTER_PILLS.map((pill) => {
              const isActive = selectedCategory === pill.id;
              return (
                <button
                  type="button"
                  key={pill.id}
                  onClick={() => setSelectedCategory(pill.id)}
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "border border-zinc-900 bg-zinc-900 text-white font-semibold shadow-2xs"
                      : "border border-transparent bg-[#F4F4F5] hover:bg-zinc-200/70 text-zinc-600 font-medium"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Compact Sort Dropdown */}
          <div className="relative shrink-0" ref={sortRef}>
            <button
              type="button"
              onClick={() => setShowSortMenu((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-[11px] sm:text-xs flex items-center gap-1.5 transition cursor-pointer ${
                sortBy !== "default"
                  ? "border border-zinc-900 bg-zinc-900 text-white font-semibold"
                  : "bg-[#F4F4F5] hover:bg-zinc-200/70 text-zinc-600 font-medium"
              }`}
              title="Urutkan Harga"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>
                {sortBy === "price-asc"
                  ? "Termurah"
                  : sortBy === "price-desc"
                  ? "Termahal"
                  : "Sort"}
              </span>
            </button>

            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-zinc-100 py-1.5 z-50 text-xs">
                {[
                  { id: "default", label: "Default" },
                  { id: "price-asc", label: "Harga Terendah" },
                  { id: "price-desc", label: "Harga Tertinggi" },
                  { id: "stock-desc", label: "Stok Terbanyak" },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => {
                      setSortBy(opt.id as typeof sortBy);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-zinc-100 transition cursor-pointer ${
                      sortBy === opt.id
                        ? "text-zinc-900 font-bold bg-zinc-100"
                        : "text-zinc-600 font-medium"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
