"use client";

import React, { useState } from "react";
import { ExploreMenuSection } from "@/components/pos/ExploreMenuSection";
import { OrderSidebar } from "@/components/pos/OrderSidebar";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { RecentOrdersModal } from "@/components/pos/RecentOrdersModal";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function BuyerPosPage() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(true);
  const [promoOnly, setPromoOnly] = useState(false);
  const [orderMode, setOrderMode] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");

  const { cart, menuItems } = usePosStore();

  const totalItems = cart.reduce((acc, c) => acc + c.quantity, 0);
  const totalAmount = cart.reduce((acc, c) => {
    const product = menuItems.find((m) => m.id === c.productId);
    if (!product) return acc;
    return acc + getEffectivePrice(product) * c.quantity;
  }, 0);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Main Content Container (Full-width, edge-to-edge aligned, no top header) */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-5 sm:px-8 lg:px-12 pt-8 sm:pt-10 pb-24">
        <div className="flex flex-col xl:flex-row gap-10 items-start justify-between w-full">
          {/* Left / Main Product Showcase (Berakit Series style) */}
          <div className="flex-1 w-full min-w-0">
            <ExploreMenuSection
              promoOnly={promoOnly}
              setPromoOnly={setPromoOnly}
              isOrderPanelOpen={isOrderPanelOpen}
              onOpenRecentOrders={() => setIsRecentOrdersOpen(true)}
            />
          </div>

          {/* Right POS Terminal Dock */}
          {isOrderPanelOpen && (
            <div className="w-full xl:w-[390px] shrink-0">
              <OrderSidebar
                onOpenCheckout={() => setIsCheckoutOpen(true)}
                orderMode={orderMode}
                setOrderMode={setOrderMode}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Floating Kiosk Bar (When panel is hidden or on small screens) */}
      {totalItems > 0 && !isOrderPanelOpen && (
        <div className="fixed bottom-6 inset-x-0 z-40 px-5 flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl bg-zinc-950 text-white rounded-full p-2.5 pl-6 pr-3 shadow-2xl flex items-center justify-between gap-4 border border-zinc-800">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-[#B4F03A] text-zinc-950 font-black text-xs flex items-center justify-center">
                {totalItems}
              </div>
              <div>
                <span className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                  RINGKASAN PESANAN
                </span>
                <span className="block text-sm font-black tracking-tight tabular-nums">
                  {formatRupiah(totalAmount + 40000)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOrderPanelOpen(true)}
                className="px-4 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-[11px] font-extrabold tracking-wider uppercase transition cursor-pointer"
              >
                Lihat Detail
              </button>
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="px-5 py-2.5 rounded-full bg-[#B4F03A] hover:bg-[#c5f85a] text-zinc-950 text-[11px] font-black tracking-wider uppercase flex items-center gap-2 transition cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Bayar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
      <RecentOrdersModal
        isOpen={isRecentOrdersOpen}
        onClose={() => setIsRecentOrdersOpen(false)}
      />
    </div>
  );
}
