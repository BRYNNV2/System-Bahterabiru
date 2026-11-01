"use client";

import React from "react";
import { Plus, Minus, Trash2, Banknote, CreditCard, QrCode, RotateCcw } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

interface DetailItemsSidebarProps {
  onProcessTransaction: () => void;
}

export function DetailItemsSidebar({
  onProcessTransaction,
}: DetailItemsSidebarProps) {
  const {
    menuItems,
    cart,
    paymentMethod,
    setPaymentMethod,
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

  const totalItemCount = populatedCart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = populatedCart.reduce((sum, item) => sum + item.lineOriginal, 0);
  const discountSales = populatedCart.reduce((sum, item) => sum + item.lineDiscount, 0);
  const totalTax = Math.round((subtotal - discountSales) * 0.15);
  const finalTotal = Math.max(0, subtotal - discountSales + totalTax);

  const paymentMethods: { id: "Cash" | "Debit" | "QRIS"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "Cash", label: "Cash", icon: Banknote },
    { id: "Debit", label: "Debit", icon: CreditCard },
    { id: "QRIS", label: "QRIS", icon: QrCode },
  ];

  return (
    <aside className="w-full xl:w-[360px] 2xl:w-[380px] bg-white border-l border-gray-100 p-6 flex flex-col justify-between shrink-0 h-full overflow-hidden">
      {/* Top Section: Header & Scrollable Items */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with Title and Clear All Button */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 shrink-0">
          <h2 className="text-[17px] font-bold text-zinc-900 tracking-tight">
            Detail Items
          </h2>
          {populatedCart.length > 0 && (
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-semibold text-gray-400">
                {totalItemCount} Items
              </span>
              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-gray-400 hover:text-rose-600 transition cursor-pointer flex items-center gap-1 bg-gray-50 hover:bg-rose-50 px-2 py-0.5 rounded-lg"
                title="Hapus semua item di keranjang"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* List of Ordered Items */}
        <div className="mt-3.5 flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar">
          {populatedCart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-2">
                <Trash2 className="w-5 h-5 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-zinc-700">Keranjang masih kosong</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Pilih menu di samping untuk menambahkan item
              </p>
            </div>
          ) : (
            populatedCart.map(({ product, quantity, effectivePrice }) => {
              const isMaxReached = quantity >= product.stock && product.stock > 0;

              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-gray-50/80 transition group border border-transparent hover:border-gray-100"
                >
                  {/* Left: Fixed Thumbnail */}
                  <div className="w-12 h-12 min-w-[48px] max-w-[48px] rounded-2xl overflow-hidden bg-gray-100 shadow-2xs shrink-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Middle: Name, Category, Stepper */}
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-bold text-zinc-900 text-[13px] truncate"
                      title={product.name}
                    >
                      {product.name}
                    </h4>
                    <p className="text-[10.5px] text-gray-400 font-medium">
                      {product.category}
                    </p>

                    {/* Stepper with Coral Plus */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => decrementFromCart(product.id)}
                        className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-95"
                        aria-label="Kurangi kuantitas"
                        title={quantity === 1 ? "Hapus dari pesanan" : "Kurangi 1"}
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <span className="text-xs font-bold text-zinc-900 min-w-[14px] text-center tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={isMaxReached}
                        className="w-6 h-6 rounded-lg bg-[#FF5B35] hover:bg-[#e64c27] disabled:opacity-30 text-white flex items-center justify-center transition cursor-pointer active:scale-95"
                        aria-label="Tambah kuantitas"
                        title="Tambah 1"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Right: Line Price & Trash Action */}
                  <div className="text-right shrink-0 flex flex-col items-end justify-between h-full">
                    <span className="block font-bold text-[#FF5B35] text-[13px] tabular-nums">
                      {quantity > 1 && (
                        <span className="text-[10px] text-gray-400 font-medium mr-1">
                          {quantity} &times;
                        </span>
                      )}
                      {formatRupiah(effectivePrice)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(product.id);
                      }}
                      className="w-7 h-7 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer mt-1.5 active:scale-95"
                      title="Hapus dari pesanan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Area: Summary, Payment Method & Action CTA (Fixed Height) */}
      <div className="shrink-0 pt-3.5 border-t border-gray-100 space-y-3">
        {/* Calculation Summary matching reference */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span>Item</span>
            <span className="font-semibold text-zinc-800">
              {totalItemCount} (Items)
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-400">
            <span>Subtotal</span>
            <span className="font-semibold text-zinc-800 tabular-nums">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-400">
            <span>Discount</span>
            <span className="font-semibold text-rose-500 tabular-nums">
              {discountSales > 0 ? `-${formatRupiah(discountSales)}` : "Rp 0"}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-400">
            <span>Tax (15%)</span>
            <span className="font-semibold text-zinc-800 tabular-nums">
              {formatRupiah(totalTax)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100 font-extrabold text-[15px] text-zinc-900">
            <span>Total</span>
            <span className="tabular-nums text-[#FF5B35]">{formatRupiah(finalTotal)}</span>
          </div>
        </div>

        {/* Payment Method Cards */}
        <div>
          <h4 className="text-xs font-bold text-zinc-900 mb-1.5">Payment Method</h4>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;

              return (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 border transition cursor-pointer active:scale-95 ${
                    isSelected
                      ? "bg-[#FFF4F0] border-[#FFCCBF] text-[#FF5B35] shadow-2xs"
                      : "bg-white border-gray-200 hover:border-gray-300 text-zinc-600"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2]" />
                  <span className="text-[10.5px] font-bold">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main CTA: Proccess Transaction */}
        <button
          onClick={onProcessTransaction}
          disabled={populatedCart.length === 0}
          className="w-full bg-[#FF5B35] hover:bg-[#eb4a24] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs py-3.5 rounded-2xl transition shadow-md active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
        >
          Proccess Transaction
        </button>
      </div>
    </aside>
  );
}
