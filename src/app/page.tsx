"use client";

import React, { useState, useEffect } from "react";
import { Menu, Flame, ShoppingBag } from "lucide-react";
import { SidebarRail } from "@/components/pos/SidebarRail";
import { HeaderBar } from "@/components/pos/HeaderBar";
import { CategoryCards } from "@/components/pos/CategoryCards";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { DetailItemsSidebar } from "@/components/pos/DetailItemsSidebar";
import { TransactionModal } from "@/components/pos/TransactionModal";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

export default function PosTerminalPage() {
  const {
    setActiveSidebarGroup,
    toggleSidebar,
    isModalBlurActive,
    cart,
    menuItems,
    syncFromServer,
  } = usePosStore();
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    void syncFromServer();

    const interval = setInterval(() => {
      void syncFromServer();
    }, 3000);

    const handleFocus = () => {
      void syncFromServer();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [syncFromServer]);

  const handleHamburgerClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      toggleSidebar();
    }
  };

  const isBackgroundBlurred = isModalBlurActive || isTransactionOpen;

  if (!isMounted) {
    return <div className="h-[100dvh] w-screen bg-[#F7F7F8]" />;
  }

  // Calculate live cart count & total
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subTotal = cart.reduce((sum, item) => {
    const prod = menuItems.find((m) => m.id === item.productId);
    return sum + (prod ? getEffectivePrice(prod) * item.quantity : 0);
  }, 0);
  const finalTotal = subTotal + Math.round(subTotal * 0.1);

  return (
    <div
      suppressHydrationWarning
      className="h-[100dvh] w-screen overflow-hidden bg-zinc-950 flex flex-col font-sans"
    >
      <div
        suppressHydrationWarning
        style={{
          filter: isBackgroundBlurred
            ? "blur(12px) brightness(0.86)"
            : "blur(0px) brightness(1)",
          transform: isBackgroundBlurred ? "scale(0.992)" : "scale(1)",
          transition:
            "filter 340ms cubic-bezier(0.16, 1, 0.3, 1), transform 340ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="h-full w-full overflow-hidden bg-[#F7F7F8] flex flex-col origin-center"
      >
        {/* Top Global Header Bar (Minimalist Monochrome Theme + Responsive Controls) */}
        <header className="h-14 bg-white border-b border-zinc-100 px-3.5 sm:px-6 flex items-center justify-between shrink-0 z-30 select-none">
          {/* Left: Single Hamburger Toggle + Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleHamburgerClick}
              className="w-9 h-9 rounded-xl bg-[#F4F4F5] hover:bg-zinc-200/70 text-zinc-700 hover:text-zinc-950 flex items-center justify-center transition cursor-pointer active:scale-95"
              aria-label="Buka/Tutup Sidebar"
              title="Buka/Tutup Sidebar"
            >
              <Menu className="w-5 h-5 stroke-[2]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSidebarGroup("Food")}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <span className="text-[15px] sm:text-[16px] font-extrabold text-zinc-900 tracking-tight">
                Coca{" "}
                <span className="font-medium text-zinc-500">coffeetalk</span>
              </span>
            </button>
          </div>

          {/* Right (Mobile & Tablet < lg): Order / Cart Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Pesanan</span>
            {isMounted && totalCartItems > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white text-zinc-900 text-[10px] font-extrabold leading-none">
                {totalCartItems}
              </span>
            )}
          </button>
        </header>

        {/* Main 3-Column Buyer Self-Ordering Workspace */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Left Vertical Icon Rail (Drawer on mobile, vertical rail on md+) */}
          <SidebarRail
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Center Main Catalog Area */}
          <main
            className={`flex-1 min-w-0 h-full overflow-y-auto px-3.5 sm:px-6 py-3.5 sm:py-5 custom-scrollbar bg-[#F7F7F8] ${
              totalCartItems > 0 ? "pb-24 lg:pb-6" : "pb-8"
            }`}
          >
            {/* Breadcrumb + Unified Search & Category Pill Bar */}
            <HeaderBar />

            {/* Category Cards (Unified inside HeaderBar) */}
            <CategoryCards />

            {/* Responsive Product Grid */}
            <ProductGrid />
          </main>

          {/* Right Panel: Customer Information & Orders Details (Docked on lg+, Slide-over Drawer on < lg) */}
          <DetailItemsSidebar
            isOpenMobile={isMobileCartOpen}
            onCloseMobile={() => setIsMobileCartOpen(false)}
            onProcessTransaction={() => {
              setIsMobileCartOpen(false);
              setIsTransactionOpen(true);
            }}
          />

          {/* Floating Bottom Checkout Bar for Mobile & Tablet (< lg) when Cart has items */}
          {isMounted && totalCartItems > 0 && !isMobileCartOpen && (
            <div className="lg:hidden absolute bottom-3.5 inset-x-3.5 sm:inset-x-6 z-30">
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(true)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl px-4 py-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] flex items-center justify-between transition active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center font-extrabold text-xs">
                    {totalCartItems}
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] text-zinc-400 font-medium leading-none">
                      Total Pesanan (Termasuk Pajak)
                    </span>
                    <span className="text-sm font-black text-white tabular-nums">
                      {formatRupiah(finalTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-white text-zinc-900 px-3.5 py-2 rounded-xl text-xs font-extrabold">
                  <ShoppingBag className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Checkout</span>
                </div>
              </button>
            </div>
          )}
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
