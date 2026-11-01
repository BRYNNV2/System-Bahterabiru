"use client";

import React from "react";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, RotateCcw } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

interface OrderSidebarProps {
  onOpenCheckout: () => void;
  orderMode: "DINE_IN" | "TAKEAWAY";
  setOrderMode: (mode: "DINE_IN" | "TAKEAWAY") => void;
}

export function OrderSidebar({
  onOpenCheckout,
  orderMode,
  setOrderMode,
}: OrderSidebarProps) {
  const {
    menuItems,
    cart,
    customerName,
    setCustomerName,
    personCount,
    incrementPerson,
    decrementPerson,
    addToCart,
    decrementFromCart,
    removeFromCart,
    clearCart,
  } = usePosStore();

  const populatedCart = cart
    .map((c) => {
      const product = menuItems.find((m) => m.id === c.productId);
      if (!product) return null;
      const effectivePrice = getEffectivePrice(product);
      return {
        ...c,
        product,
        effectivePrice,
        lineOriginal: product.price * c.quantity,
        lineEffective: effectivePrice * c.quantity,
        lineDiscount: (product.price - effectivePrice) * c.quantity,
      };
    })
    .filter(Boolean) as {
    productId: string;
    quantity: number;
    product: (typeof menuItems)[number];
    effectivePrice: number;
    lineOriginal: number;
    lineEffective: number;
    lineDiscount: number;
  }[];

  const totalQty = populatedCart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = populatedCart.reduce(
    (sum, item) => sum + item.lineOriginal,
    0
  );
  const discountSales = populatedCart.reduce(
    (sum, item) => sum + item.lineDiscount,
    0
  );
  const totalTax = populatedCart.length > 0 ? 40000 : 0;
  const finalTotal = Math.max(0, subtotal - discountSales + totalTax);

  return (
    <aside className="w-full bg-white border border-zinc-200/90 rounded-[28px] p-6 flex flex-col justify-between xl:sticky xl:top-28">
      <div>
        {/* Top Terminal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
              POS TERMINAL #01
            </p>
            <h2 className="text-lg font-black tracking-[-0.03em] text-zinc-950 uppercase mt-0.5">
              ORDER SUMMARY<span className="text-[#84CC16]">.</span>
            </h2>
          </div>

          {/* Dine-In / Takeaway Badge */}
          <button
            onClick={() =>
              setOrderMode(orderMode === "DINE_IN" ? "TAKEAWAY" : "DINE_IN")
            }
            className="px-3 py-1.5 rounded-full bg-zinc-950 text-white text-[10px] font-black tracking-widest uppercase cursor-pointer hover:bg-zinc-800 transition"
          >
            {orderMode === "DINE_IN" ? "DINE-IN" : "TAKEAWAY"}
          </button>
        </div>

        {/* Customer & Table Information */}
        <div className="mt-4 grid grid-cols-1 gap-2.5">
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-2.5 focus-within:bg-white focus-within:border-zinc-950 transition">
            <label className="block text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">
              NAMA PEMESAN
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masukkan nama..."
              className="w-full bg-transparent text-zinc-950 font-extrabold text-[13px] mt-0.5 focus:outline-none"
            />
          </div>

          {orderMode === "DINE_IN" && (
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-2.5 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">
                  KAPASITAS MEJA
                </span>
                <span className="block text-zinc-950 font-extrabold text-[13px] mt-0.5">
                  {personCount} ORANG
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={decrementPerson}
                  className="w-7 h-7 rounded-full border border-zinc-200 bg-white hover:border-zinc-950 text-zinc-900 flex items-center justify-center transition cursor-pointer"
                  aria-label="Kurangi orang"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="text-xs font-black text-zinc-950 min-w-[18px] text-center tabular-nums">
                  {personCount}
                </span>
                <button
                  onClick={incrementPerson}
                  className="w-7 h-7 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center transition cursor-pointer"
                  aria-label="Tambah orang"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Order List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black tracking-[0.16em] text-zinc-950 uppercase">
              DAFTAR MENU ({totalQty})
            </span>

            {populatedCart.length > 0 && (
              <button
                onClick={clearCart}
                className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider uppercase text-zinc-400 hover:text-[#FF2A5F] transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="max-h-[340px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {populatedCart.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-zinc-200 flex flex-col items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-zinc-300 mb-2" />
                <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                  Belum Ada Item
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Ketuk foto menu di sebelah kiri untuk menambahkan pesanan.
                </p>
              </div>
            ) : (
              populatedCart.map(({ product, quantity, effectivePrice }) => {
                const isMaxStock = quantity >= product.stock;
                return (
                  <div
                    key={product.id}
                    className="group rounded-2xl border border-zinc-100 hover:border-zinc-200 bg-zinc-50/40 p-2.5 flex items-center gap-3 transition"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-zinc-100"
                    />

                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-extrabold text-zinc-950 text-[12px] uppercase tracking-tight truncate"
                        title={product.name}
                      >
                        {product.name}
                      </h4>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-zinc-950 font-extrabold text-[12px] tabular-nums">
                          {formatRupiah(effectivePrice)}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-bold">
                          &times;{quantity}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decrementFromCart(product.id)}
                            className="w-6 h-6 rounded-lg border border-zinc-200 bg-white hover:border-zinc-950 text-zinc-900 flex items-center justify-center transition cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                          <span className="text-xs font-black text-zinc-950 min-w-[14px] text-center tabular-nums">
                            {quantity}
                          </span>
                          <button
                            onClick={() => addToCart(product.id)}
                            disabled={isMaxStock}
                            className="w-6 h-6 rounded-lg bg-zinc-950 hover:bg-zinc-800 disabled:opacity-30 text-white flex items-center justify-center transition cursor-pointer disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-zinc-300 hover:text-[#FF2A5F] transition p-1 cursor-pointer"
                          title="Hapus item"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Payment Breakdown & High-Contrast Checkout CTA */}
      <div className="mt-6 pt-4 border-t border-zinc-100">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Subtotal
            </span>
            <span className="font-bold text-zinc-800 tabular-nums">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Potongan Promo
            </span>
            <span className="font-bold text-zinc-800 tabular-nums">
              {discountSales > 0 ? `-${formatRupiah(discountSales)}` : "Rp 0"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Pajak & Layanan
            </span>
            <span className="font-bold text-zinc-800 tabular-nums">
              {formatRupiah(totalTax)}
            </span>
          </div>
        </div>

        {/* Final Total */}
        <div className="flex items-baseline justify-between pt-4 mt-3.5 border-t border-zinc-950">
          <span className="text-xs font-black tracking-[0.15em] text-zinc-950 uppercase">
            TOTAL BAYAR
          </span>
          <span className="text-xl font-black tracking-tight text-zinc-950 tabular-nums">
            {formatRupiah(finalTotal)}
          </span>
        </div>

        {/* Blitz / McD Kiosk Primary CTA */}
        <button
          onClick={onOpenCheckout}
          disabled={populatedCart.length === 0}
          className="w-full mt-4 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-black text-xs tracking-[0.15em] uppercase py-4 px-5 rounded-full flex items-center justify-between transition active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
        >
          <span>BAYAR SEKARANG</span>
          <span className="w-6 h-6 rounded-full bg-[#B4F03A] text-zinc-950 flex items-center justify-center">
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
        </button>
      </div>
    </aside>
  );
}
