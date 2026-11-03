"use client";

import React, { useState } from "react";
import {
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

interface DetailItemsSidebarProps {
  onProcessTransaction: () => void;
}

export function DetailItemsSidebar({
  onProcessTransaction,
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

  // 10% Tax matching the reference UI ("Tax (10%)")
  const taxAmount = Math.round(subTotal * 0.1);
  const finalTotal = subTotal + taxAmount;

  return (
    <aside className="w-[330px] lg:w-[355px] shrink-0 bg-white border-l border-gray-100 p-5 flex flex-col justify-between h-full overflow-hidden select-none z-10">
      {/* Top & Middle Area */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* 1. Segmented Toggle: Buy / Reservation */}
        <div className="bg-[#F7F8FA] p-1 rounded-full grid grid-cols-2 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setOrderMode("Buy")}
            className={`py-2 rounded-full text-xs transition cursor-pointer ${
              orderMode === "Buy"
                ? "bg-white text-zinc-900 font-bold shadow-2xs"
                : "text-gray-400 hover:text-zinc-600 font-medium"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setOrderMode("Reservation")}
            className={`py-2 rounded-full text-xs transition cursor-pointer ${
              orderMode === "Reservation"
                ? "bg-white text-zinc-900 font-bold shadow-2xs"
                : "text-gray-400 hover:text-zinc-600 font-medium"
            }`}
          >
            Reservation
          </button>
        </div>

        {/* 2. Customer Information */}
        <div className="mb-4 shrink-0 border-b border-gray-100 pb-4">
          <h3 className="text-[13.5px] font-bold text-zinc-900 mb-2.5">
            Customer Information
          </h3>

          <div className="space-y-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="w-full rounded-full border border-gray-200/80 px-4 py-2 text-xs text-zinc-800 placeholder:text-gray-300 focus:outline-none focus:border-[#FF6B2C] transition"
            />

            <div className="relative">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className={`w-full appearance-none rounded-full border border-gray-200/80 px-4 py-2 pr-9 text-xs bg-white focus:outline-none focus:border-[#FF6B2C] transition cursor-pointer ${
                  selectedTable ? "text-zinc-800 font-medium" : "text-gray-300"
                }`}
              >
                <option value="">Select table</option>
                <option value="Table 01">Table 01</option>
                <option value="Table 02">Table 02</option>
                <option value="Table 03">Table 03</option>
                <option value="Table 04">Table 04</option>
                <option value="Table 05">Table 05</option>
                <option value="Takeaway">Takeaway / Bungkus</option>
              </select>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

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
                  className="w-full rounded-full border border-[#FF6B2C]/50 bg-[#FFF9F6] px-4 py-2 text-xs text-zinc-800 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNoteInput(true)}
                className="w-full rounded-full bg-[#FFF1E8] hover:bg-[#FFE5D4] text-[#FF6B2C] font-semibold text-xs py-2.5 transition cursor-pointer active:scale-[0.99]"
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
              className="text-[11px] font-semibold text-gray-400 hover:text-rose-500 transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-0">
          {populatedCart.length === 0 ? (
            <div className="h-36 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-4 text-gray-400">
              <ShoppingBag className="w-6 h-6 text-gray-300 mb-1.5 stroke-[1.75]" />
              <p className="text-xs font-semibold text-zinc-500">
                Belum ada menu dipilih
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
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
                  <div className="w-13 h-13 min-w-[52px] max-w-[52px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Middle: Name, "Price" label, Orange price */}
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
                        className="text-gray-300 hover:text-rose-500 transition cursor-pointer p-0.5 shrink-0"
                        title="Hapus item"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="block text-[10px] text-gray-400 mt-0.5 leading-tight">
                      Price
                    </span>
                    <span className="block font-extrabold text-[#FF6B2C] text-xs tabular-nums">
                      {formatRupiah(effectivePrice)}
                    </span>
                  </div>

                  {/* Right: Circular Stepper (- 1 +) matching Coca coffeetalk UI */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => decrementFromCart(product.id)}
                      className="w-7 h-7 rounded-full bg-[#EFEFEF] hover:bg-gray-200 text-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-95"
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
                      className="w-7 h-7 rounded-full bg-[#18181B] hover:bg-zinc-700 disabled:opacity-30 text-white flex items-center justify-center transition cursor-pointer active:scale-95"
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
      <div className="shrink-0 pt-3 border-t border-gray-100 space-y-3">
        {/* Compact Payment Method Selector */}
        <div className="grid grid-cols-3 gap-1.5">
          {(["Cash", "QRIS", "Debit"] as const).map((method) => {
            const isSelected = paymentMethod === method;
            return (
              <button
                type="button"
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-1.5 rounded-full text-[11px] transition cursor-pointer ${
                  isSelected
                    ? "bg-[#FFF5EF] border border-[#FF6B2C] text-[#FF6B2C] font-bold"
                    : "bg-[#F7F8FA] border border-transparent text-zinc-500 hover:bg-gray-100 font-medium"
                }`}
              >
                {method}
              </button>
            );
          })}
        </div>

        {/* Sub Total, Tax (10%), Total */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Sub Total</span>
            <span className="font-extrabold text-zinc-900 tabular-nums">
              {formatRupiah(subTotal)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Tax (10%)</span>
            <span className="font-extrabold text-zinc-900 tabular-nums">
              {formatRupiah(taxAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-400 font-medium">Total</span>
            <span className="font-extrabold text-[#FF6B2C] text-sm tabular-nums">
              {formatRupiah(finalTotal)}
            </span>
          </div>
        </div>

        {/* Full-Width Orange Pill Button */}
        <button
          type="button"
          onClick={onProcessTransaction}
          disabled={populatedCart.length === 0}
          className="w-full rounded-full bg-gradient-to-r from-[#FF7A18] to-[#FF5500] hover:from-[#FF6A00] hover:to-[#E04800] disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-bold text-xs py-3.5 shadow-[0_8px_20px_rgba(255,94,26,0.26)] disabled:shadow-none transition active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
        >
          Pay Now
        </button>
      </div>
    </aside>
  );
}
