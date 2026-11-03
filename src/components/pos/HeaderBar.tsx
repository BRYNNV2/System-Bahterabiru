"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, ArrowUpDown } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { CategoryType } from "@/data/initialMenu";

const FILTER_PILLS: { id: CategoryType; label: string }[] = [
  { id: "All Menu", label: "All" },
  { id: "Chicken", label: "Chicken" },
  { id: "Seafood", label: "Seafood" },
  { id: "Pasta", label: "Pasta" },
  { id: "Rice bowl", label: "Rice bowl" },
];

export function HeaderBar() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    activeSidebarGroup,
    sortBy,
    setSortBy,
    setActiveTab,
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
      <div className="flex items-center gap-1.5 text-xs mb-3 px-0.5">
        <button
          type="button"
          onClick={() => setSelectedCategory("All Menu")}
          className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
        >
          Menu
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400 font-medium">{activeSidebarGroup}</span>
      </div>

      {/* Unified Search & Category Pill Bar */}
      <div className="bg-white rounded-2xl px-4 py-2.5 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.03)] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Left: Search Input */}
        <div className="relative flex-1 flex items-center xl:border-r xl:border-slate-100 xl:pr-4">
          <Search className="w-4 h-4 text-slate-400 shrink-0 stroke-[2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full bg-transparent text-slate-800 placeholder:text-slate-300 text-xs font-medium pl-2.5 pr-7 py-1.5 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Category Pills + Sort */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0.5 xl:pb-0">
          {FILTER_PILLS.map((pill) => {
            const isActive = selectedCategory === pill.id;
            return (
              <button
                type="button"
                key={pill.id}
                onClick={() => setSelectedCategory(pill.id)}
                className={`px-4 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "border border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-semibold shadow-[0_2px_8px_rgba(37,99,235,0.12)]"
                    : "border border-transparent bg-[#F8FAFC] hover:bg-[#EFF6FF]/60 hover:text-[#2563EB] text-slate-600 font-medium"
                }`}
              >
                {pill.label}
              </button>
            );
          })}

          {/* Compact Sort Dropdown */}
          <div className="relative shrink-0" ref={sortRef}>
            <button
              type="button"
              onClick={() => setShowSortMenu((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition cursor-pointer ${
                sortBy !== "default"
                  ? "border border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-semibold"
                  : "bg-[#F8FAFC] hover:bg-[#EFF6FF]/60 hover:text-[#2563EB] text-slate-500 font-medium"
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
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs">
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
                    className={`w-full text-left px-3.5 py-2 hover:bg-[#EFF6FF] transition cursor-pointer ${
                      sortBy === opt.id
                        ? "text-[#2563EB] font-bold bg-[#EFF6FF]/70"
                        : "text-slate-600 font-medium"
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
