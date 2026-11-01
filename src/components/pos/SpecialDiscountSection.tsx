"use client";

import React, { useEffect, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

export function SpecialDiscountSection() {
  const {
    menuItems,
    searchQuery,
    addToCart,
    decrementFromCart,
    getItemQuantity,
  } = usePosStore();

  // Countdown timer starting at 12:10:09
  const [secondsLeft, setSecondsLeft] = useState(12 * 3600 + 10 * 60 + 9);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 12 * 3600 + 10 * 60 + 9));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((secondsLeft % 3600) / 60)).padStart(
    2,
    "0"
  );
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const discountItems = menuItems.filter(
    (item) =>
      item.isSpecialDiscount &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (discountItems.length === 0) return null;

  return (
    <section className="mb-7">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[17px] font-bold text-zinc-900 tracking-tight">
          Special Discount Today
        </h2>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-gray-400 font-medium">Ends in</span>
          <span className="font-extrabold text-rose-500 tracking-wide tabular-nums text-[12px]">
            {hours} : {minutes} : {seconds}
          </span>
        </div>
      </div>

      {/* 4 Cards Grid - Direct clean grid matching reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {discountItems.map((item) => {
          const qty = getItemQuantity(item.id);
          const finalPrice = getEffectivePrice(item);
          const remainingStock = Math.max(0, item.stock);
          const isMaxReached = qty >= remainingStock;

          return (
            <div
              key={item.id}
              className="group bg-white rounded-2xl p-2.5 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Food Image with Available Badge */}
                <div className="relative h-32 w-full rounded-xl overflow-hidden bg-gray-50">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div
                    className={`absolute bottom-2 left-2 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                      remainingStock === 0
                        ? "bg-rose-600/85 text-white"
                        : "bg-black/45 text-white"
                    }`}
                  >
                    Available: {remainingStock}
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="font-bold text-zinc-900 text-[13px] mt-2.5 truncate"
                  title={item.name}
                >
                  {item.name}
                </h3>

                {/* Discount Percentage and Strikethrough Price */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-bold text-rose-500">
                    {item.discountPercent}%
                  </span>
                  <span className="text-[11px] text-gray-400 line-through font-medium">
                    {formatRupiah(item.price)}
                  </span>
                </div>
              </div>

              {/* Price & Action Control */}
              <div className="flex items-center justify-between gap-1 mt-2 pt-1">
                <span className="font-extrabold text-zinc-900 text-[13px] tracking-tight">
                  {formatRupiah(finalPrice)}
                </span>

                {qty === 0 ? (
                  <button
                    onClick={() => addToCart(item.id)}
                    disabled={remainingStock === 0}
                    className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-gray-300 text-white text-[11px] font-semibold px-4 py-1.5 rounded-full transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    {remainingStock === 0 ? "Habis" : "Order"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrementFromCart(item.id)}
                      className="text-zinc-600 hover:text-black transition p-0.5 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="text-xs font-bold text-zinc-900 min-w-[12px] text-center tabular-nums">
                      {qty}
                    </span>
                    <button
                      onClick={() => addToCart(item.id)}
                      disabled={isMaxReached}
                      className="w-5 h-5 rounded-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
