"use client";

import React, { useState } from "react";
import { Menu, Flame } from "lucide-react";
import { SidebarRail } from "@/components/pos/SidebarRail";
import { HeaderBar } from "@/components/pos/HeaderBar";
import { CategoryCards } from "@/components/pos/CategoryCards";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { DetailItemsSidebar } from "@/components/pos/DetailItemsSidebar";
import { TransactionModal } from "@/components/pos/TransactionModal";
import { usePosStore } from "@/store/usePosStore";

export default function PosTerminalPage() {
  const { setActiveSidebarGroup, toggleSidebar, isModalBlurActive } =
    usePosStore();
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);

  const isBackgroundBlurred = isModalBlurActive || isTransactionOpen;

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col font-sans">
      <div
        style={{
          filter: isBackgroundBlurred
            ? "blur(12px) brightness(0.86)"
            : "blur(0px) brightness(1)",
          transform: isBackgroundBlurred ? "scale(0.992)" : "scale(1)",
          transition:
            "filter 340ms cubic-bezier(0.16, 1, 0.3, 1), transform 340ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="h-full w-full overflow-hidden bg-[#F8F9FB] flex flex-col origin-center"
      >
        {/* Top Global Header Bar (Coca coffeetalk style + Single Hamburger Toggle) */}
        <header className="h-14 bg-white border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 select-none">
          {/* Left: Single Hamburger Toggle + Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="w-9 h-9 rounded-xl bg-[#F8F9FB] hover:bg-[#FFF5EF] text-zinc-700 hover:text-[#FF6B2C] flex items-center justify-center transition cursor-pointer active:scale-95"
              aria-label="Buka/Tutup Sidebar"
              title="Buka/Tutup Sidebar"
            >
              <Menu className="w-5 h-5 stroke-[2]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSidebarGroup("Food")}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF8C42] to-[#FF5511] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <span className="text-[16px] font-extrabold text-zinc-900 tracking-tight">
                Coca{" "}
                <span className="font-bold text-zinc-700">coffeetalk</span>
              </span>
            </button>
          </div>
        </header>

        {/* Main 3-Column Buyer Self-Ordering Workspace */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Vertical Icon Rail */}
          <SidebarRail />

          {/* Center Main Catalog Area */}
          <main className="flex-1 min-w-0 h-full overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 custom-scrollbar bg-[#F8F9FB]">
            {/* Breadcrumb + Unified Search & Category Pill Bar */}
            <HeaderBar />

            {/* Category Cards (Unified inside HeaderBar) */}
            <CategoryCards />

            {/* Clean 4-Column Product Grid */}
            <ProductGrid />
          </main>

          {/* Right Panel: Customer Information & Orders Details */}
          <DetailItemsSidebar
            onProcessTransaction={() => setIsTransactionOpen(true)}
          />
        </div>
      </div>

      {/* Checkout / Order Confirmation Modal */}
      <TransactionModal
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
      />
    </div>
  );
}
