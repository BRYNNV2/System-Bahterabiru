"use client";

import React, { useState } from "react";
import {
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ShoppingBag,
  X,
} from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

interface DetailItemsSidebarProps {
  onProcessTransaction: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function DetailItemsSidebar({
  onProcessTransaction,
  isOpenMobile = false,
  onCloseMobile,
}: DetailItemsSidebarProps) {
  const {
    cart,
    menuItems,
    addToCart,
    decrementFromCart,
    removeFromCart,
    clearCart,
    paymentMethod,
    setPaymentMethod,
    orderMode,
    setOrderMode,
    customerName,
    setCustomerName,
    selectedTable,
    setSelectedTable,
    orderNote,
    setOrderNote,
  } = usePosStore();

  const [showNoteInput, setShowNoteInput] = useState(false);

  const populatedCart = cart
    .map((c) => {
      const product = menuItems.find((m) => m.id === c.productId);
      if (!product) return null;
      const effectivePrice = getEffectivePrice(product);
      return {
        ...c,
        product,
        effectivePrice,
      };
    })
    .filter(Boolean) as {
    productId: string;
    quantity: number;
    product: (typeof menuItems)[number];
    effectivePrice: number;
  }[];

  const subTotal = populatedCart.reduce(
    (sum, item) => sum + item.effectivePrice * item.quantity,
    0
  );
  const finalTotal = subTotal;

  return (
    <>
      {/* Backdrop Overlay for Mobile & Tablet (< lg) */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="absolute inset-0 bg-black/45 backdrop-blur-[2px] z-40 lg:hidden"
        />
      )}

      <aside
        className={`${
          isOpenMobile
            ? "absolute inset-y-0 right-0 z-50 flex w-full max-w-[380px] shadow-2xl"
            : "hidden lg:flex lg:w-[325px] xl:w-[355px]"
        } shrink-0 bg-white border-l border-zinc-100 p-4 sm:p-5 flex-col justify-between h-full overflow-hidden select-none z-10`}
      >
        {/* Top & Middle Area */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Mobile Drawer Top Header (< lg) */}
          <div className="flex lg:hidden items-center justify-between pb-3 mb-3 border-b border-zinc-100 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-zinc-900" />
              <span className="text-sm font-extrabold text-zinc-900">
                Detail Pesanan
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center cursor-pointer"
              aria-label="Tutup panel pesanan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Segmented Toggle: Buy / Reservation */}
          <div className="bg-[#F4F4F5] p-1 rounded-full grid grid-cols-2 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setOrderMode("Buy")}
            className={`py-2 rounded-full text-xs transition cursor-pointer ${
              orderMode === "Buy"
                ? "bg-zinc-900 text-white font-bold shadow-xs"
                : "text-zinc-400 hover:text-zinc-700 font-medium"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setOrderMode("Reservation")}
            className={`py-2 rounded-full text-xs transition cursor-pointer ${
              orderMode === "Reservation"
                ? "bg-zinc-900 text-white font-bold shadow-xs"
                : "text-zinc-400 hover:text-zinc-700 font-medium"
            }`}
          >
            Reservation
          </button>
        </div>

        {/* 2. Customer Information */}
        <div className="mb-4 shrink-0 border-b border-zinc-100 pb-4">
          <h3 className="text-[13.5px] font-bold text-zinc-900 mb-2.5">
            Customer Information
          </h3>

          <div className="space-y-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="w-full rounded-full border border-zinc-200/80 px-4 py-2 text-xs text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-900 transition"
            />

            {showNoteInput ? (
              <div className="pt-0.5">
                <input
                  type="text"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Catatan pesanan (mis. pedas / tanpa es)..."
                  autoFocus
                  onBlur={() => {
                    if (!orderNote.trim()) setShowNoteInput(false);
                  }}
                  className="w-full rounded-full border border-zinc-900/40 bg-[#FAFAFA] px-4 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNoteInput(true)}
                className="w-full rounded-full bg-[#F4F4F5] hover:bg-zinc-200/80 text-zinc-800 font-semibold text-xs py-2.5 transition cursor-pointer active:scale-[0.99]"
              >
                {orderNote ? `Note: ${orderNote}` : "Add note"}
              </button>
            )}
          </div>
        </div>

        {/* 3. Orders details Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-[13.5px] font-bold text-zinc-900">
            Orders details
          </h3>
          {populatedCart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-900 transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-0">
          {populatedCart.length === 0 ? (
            <div className="h-36 rounded-2xl border border-dashed border-zinc-200 bg-[#FAFAFA] flex flex-col items-center justify-center text-center p-4 text-zinc-400">
              <ShoppingBag className="w-6 h-6 text-zinc-300 mb-1.5 stroke-[1.75]" />
              <p className="text-xs font-semibold text-zinc-500">
                Belum ada menu dipilih
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Klik foto menu di kiri untuk menambahkan
              </p>
            </div>
          ) : (
            populatedCart.map(({ product, quantity, effectivePrice }) => {
              const isMaxReached =
                quantity >= product.stock && product.stock > 0;

              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 py-1.5 group"
                >
                  {/* Left: Rounded Square Dish Image */}
                  <div className="w-13 h-13 min-w-[52px] max-w-[52px] rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Middle: Name, "Price" label, Monochrome price */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className="font-bold text-zinc-900 text-xs truncate"
                        title={product.name}
                      >
                        {product.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="text-zinc-300 hover:text-zinc-800 transition cursor-pointer p-0.5 shrink-0"
                        title="Hapus item"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="block text-[10px] text-zinc-400 mt-0.5 leading-tight">
                      Price
                    </span>
                    <span className="block font-extrabold text-zinc-900 text-xs tabular-nums">
                      {formatRupiah(effectivePrice)}
                    </span>
                  </div>

                  {/* Right: Circular Stepper (- 1 +) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => decrementFromCart(product.id)}
                      className="w-7 h-7 rounded-full bg-[#F4F4F5] hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-95"
                      aria-label="Kurangi"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="text-xs font-bold text-zinc-900 min-w-[14px] text-center tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(product.id)}
                      disabled={isMaxReached}
                      className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-700 disabled:opacity-30 text-white flex items-center justify-center transition cursor-pointer active:scale-95"
                      aria-label="Tambah"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Summary & CTA */}
      <div className="shrink-0 pt-3 border-t border-zinc-100 space-y-3">
        {/* Compact Payment Method Selector */}
        <div className="grid grid-cols-3 gap-1.5">
          {(["Cash", "QRIS", "Debit"] as const).map((method) => {
            const isDebitOngoing = method === "Debit";
            const isSelected = paymentMethod === method && !isDebitOngoing;
            return (
              <button
                type="button"
                key={method}
                disabled={isDebitOngoing}
                onClick={() => {
                  if (!isDebitOngoing) setPaymentMethod(method);
                }}
                title={
                  isDebitOngoing
                    ? "Pembayaran Debit sedang dalam pengembangan (On Going)"
                    : `Pilih pembayaran ${method}`
                }
                className={`py-1.5 rounded-full text-[11px] transition flex items-center justify-center gap-1 ${
                  isDebitOngoing
                    ? "bg-zinc-100 border border-zinc-200/60 text-zinc-400 cursor-not-allowed"
                    : isSelected
                    ? "bg-zinc-900 border border-zinc-900 text-white font-bold cursor-pointer"
                    : "bg-[#F4F4F5] border border-transparent text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 font-medium cursor-pointer"
                }`}
              >
                <span>{method}</span>
                {isDebitOngoing && (
                  <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-700 leading-tight">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub Total & Total */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-medium">Sub Total</span>
            <span className="font-extrabold text-zinc-900 tabular-nums">
              {formatRupiah(subTotal)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <span className="text-zinc-500 font-semibold">Total</span>
            <span className="font-black text-zinc-900 text-sm tabular-nums">
              {formatRupiah(finalTotal)}
            </span>
          </div>
        </div>

        {/* Full-Width Monochrome Black Pill Button */}
        <button
          type="button"
          onClick={onProcessTransaction}
          disabled={populatedCart.length === 0}
          className="w-full rounded-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs py-3.5 shadow-[0_8px_20px_rgba(24,24,27,0.18)] disabled:shadow-none transition active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
        >
          Pay Now
        </button>
      </div>
      </aside>
    </>
  );
}
