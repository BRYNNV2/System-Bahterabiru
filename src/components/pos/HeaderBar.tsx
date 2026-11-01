"use client";

import React from "react";
import { Search, ShoppingBag, ReceiptText, Utensils } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { CategoryFilter } from "@/data/initialMenu";

interface HeaderBarProps {
  onOpenRecentOrders: () => void;
  onToggleOrderPanel: () => void;
  isOrderPanelOpen: boolean;
  promoOnly: boolean;
  setPromoOnly: (val: boolean) => void;
  orderMode: "DINE_IN" | "TAKEAWAY";
  setOrderMode: (mode: "DINE_IN" | "TAKEAWAY") => void;
}

const NAV_ITEMS: {
  label: string;
  category?: CategoryFilter;
  isPromo?: boolean;
}[] = [
  { label: "Semua Menu", category: "All" },
  { label: "Promo Hari Ini", isPromo: true },
  { label: "Main Course", category: "Main Course" },
  { label: "Appetizer", category: "Appetizer" },
  { label: "Dessert", category: "Dessert" },
  { label: "Beverages", category: "Beverages" },
];

export function HeaderBar({
  onOpenRecentOrders,
  onToggleOrderPanel,
  isOrderPanelOpen,
  promoOnly,
  setPromoOnly,
  orderMode,
  setOrderMode,
}: HeaderBarProps) {
  const {
    selectedCategory,
    setSelectedCategory,
    cart,
    recentOrders,
  } = usePosStore();

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleNavClick = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.isPromo) {
      setPromoOnly(true);
      setSelectedCategory("All");
    } else if (item.category) {
      setPromoOnly(false);
      setSelectedCategory(item.category);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-zinc-100">
      <div className="w-full max-w-[1720px] mx-auto px-5 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-6">
        {/* Left: Bold Editorial Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setPromoOnly(false);
              setSelectedCategory("All");
            }}
            className="text-left group cursor-pointer"
          >
            <span className="text-[20px] sm:text-[22px] font-black tracking-[-0.04em] text-zinc-950 uppercase">
              KANS RESTO
              <span className="text-[#84CC16]">.</span>
            </span>
          </button>
        </div>

        {/* Center: Clean Editorial Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = item.isPromo
              ? promoOnly
              : !promoOnly && selectedCategory === item.category;

            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`relative py-2 text-[13px] transition-colors cursor-pointer ${
                  isActive
                    ? "font-bold text-zinc-950"
                    : "font-medium text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#A3E635] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Kiosk Order Type Switch, History & Cart Counter */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Dine-In / Takeaway Pill Switch (McD / Blitz Kiosk style) */}
          <div className="hidden sm:flex items-center bg-zinc-100 p-1 rounded-full border border-zinc-200/70">
            <button
              onClick={() => setOrderMode("DINE_IN")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase transition cursor-pointer ${
                orderMode === "DINE_IN"
                  ? "bg-zinc-950 text-white shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Utensils className="w-3 h-3" />
              <span>Makan Sini</span>
            </button>
            <button
              onClick={() => setOrderMode("TAKEAWAY")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase transition cursor-pointer ${
                orderMode === "TAKEAWAY"
                  ? "bg-zinc-950 text-white shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Bungkus
            </button>
          </div>

          {/* Riwayat Struk Button */}
          <button
            onClick={onOpenRecentOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold tracking-widest uppercase text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
            title="Riwayat Transaksi"
          >
            <ReceiptText className="w-4 h-4" />
            <span className="hidden md:inline">
              Struk {recentOrders.length > 0 ? `(${recentOrders.length})` : ""}
            </span>
          </button>

          {/* Cart / POS Dock Trigger with Lime Counter Badge */}
          <button
            onClick={onToggleOrderPanel}
            className={`relative flex items-center gap-2.5 pl-3.5 pr-4 py-2 rounded-full border text-xs font-extrabold tracking-wider uppercase transition cursor-pointer ${
              isOrderPanelOpen
                ? "bg-zinc-950 text-white border-zinc-950"
                : "bg-white text-zinc-950 border-zinc-200 hover:border-zinc-950"
            }`}
            aria-label="Toggle Order Panel"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {totalCartItems > 0 && (
                <span className=" -top-2 -right-2.5 absolute min-w-[18px] h-[18px] px-1 rounded-full bg-[#B4F03A] text-zinc-950 text-[10px] font-black flex items-center justify-center leading-none border border-white">
                  {totalCartItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline ml-1">Pesanan</span>
          </button>
        </div>
      </div>
    </header>
  );
}
