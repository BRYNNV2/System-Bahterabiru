"use client";

import React, { useEffect, useState } from "react";
import { Search, X, Menu, ShoppingBag } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";

export function HeaderBar() {
  const {
    searchQuery,
    setSearchQuery,
    cart,
    setIsMobileMenuOpen,
    setIsMobileCartOpen,
  } = usePosStore();
  const [currentDate, setCurrentDate] = useState("");

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
  }, []);

  return (
    <header className="flex items-center justify-between gap-2.5 sm:gap-4 bg-white px-3 sm:px-5 py-3 rounded-2xl border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      {/* Left: Mobile Hamburger Toggle (visible on < lg) */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-[#FCEAE3] hover:text-[#EE5728] flex items-center justify-center text-zinc-700 transition cursor-pointer shrink-0"
        aria-label="Buka Menu"
        title="Buka Navigasi"
      >
        <Menu className="w-5 h-5 stroke-[2]" />
      </button>

      {/* Middle: Search Food Input */}
      <div className="flex-1 max-w-[520px]">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food or menu..."
            className="w-full bg-[#F4F5F7] hover:bg-[#ECEEF2] focus:bg-white text-zinc-900 placeholder:text-gray-400 text-xs font-medium rounded-xl pl-3.5 sm:pl-4 pr-9 py-2 sm:py-2.5 border border-transparent focus:border-[#EE5728]/40 focus:outline-none transition"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          )}
        </div>
      </div>

      {/* Right Area: Date + Mobile Cart Trigger */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Date text (hidden on small mobile screens to keep layout clean) */}
        <span className="hidden sm:inline-block text-[11.5px] text-gray-400 font-semibold">
          {currentDate}
        </span>

        {/* Mobile Cart Trigger Button (visible on < xl) */}
        <button
          type="button"
          onClick={() => setIsMobileCartOpen(true)}
          className="xl:hidden relative w-9 h-9 rounded-xl bg-[#FCEAE3] text-[#EE5728] flex items-center justify-center transition hover:bg-[#fbd8cd] active:scale-95 cursor-pointer shadow-2xs"
          aria-label="Lihat Pesanan"
          title="Buka Invoice & Keranjang"
        >
          <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EE5728] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
              {totalCartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
