"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Check, Plus, Minus } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

export function ProductGrid() {
  const {
    menuItems,
    selectedCategory,
    searchQuery,
    sortBy,
    setSortBy,
    addToCart,
    decrementFromCart,
    getItemQuantity,
  } = usePosStore();

  const [showFilterPopover, setShowFilterPopover] = useState(false);

  const filteredItems = menuItems
    .filter((item) => {
      if (selectedCategory !== "All Menu" && item.category !== selectedCategory) {
        return false;
      }
      if (
        searchQuery.trim() &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        return getEffectivePrice(a) - getEffectivePrice(b);
      }
      if (sortBy === "price-desc") {
        return getEffectivePrice(b) - getEffectivePrice(a);
      }
      if (sortBy === "stock-desc") {
        return b.stock - a.stock;
      }
      return 0;
    });

  return (
    <section className="mt-7">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[17px] font-bold text-zinc-900 tracking-tight">
          Select Menu
        </h2>

        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowFilterPopover((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              sortBy !== "default"
                ? "bg-[#FF5B35] text-white border-[#FF5B35]"
                : "bg-white text-zinc-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          {showFilterPopover && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2.5 z-30 animate-in fade-in zoom-in-95">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                Urutan Menu
              </p>
              {[
                { id: "default", label: "Default" },
                { id: "price-asc", label: "Harga Termurah" },
                { id: "price-desc", label: "Harga Tertinggi" },
                { id: "stock-desc", label: "Stok Terbanyak" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSortBy(
                      opt.id as "default" | "price-asc" | "price-desc" | "stock-desc"
                    );
                    setShowFilterPopover(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-[#FFF4F0] hover:text-[#FF5B35] rounded-xl transition cursor-pointer"
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && (
                    <Check className="w-3.5 h-3.5 text-[#FF5B35]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 Columns Product Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm font-bold text-zinc-700">Menu tidak ditemukan</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Coba pilih kategori lain atau ubah kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const qtyInCart = getItemQuantity(item.id);
            const isOutOfStock = item.stock <= 0;
            const finalPrice = getEffectivePrice(item);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!isOutOfStock) {
                    addToCart(item.id);
                  }
                }}
                className={`group bg-white rounded-2xl p-2.5 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between ${
                  !isOutOfStock ? "cursor-pointer hover:border-gray-200" : "opacity-75"
                }`}
              >
                <div>
                  {/* Food Image with Discount Badge */}
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        isOutOfStock ? "grayscale" : ""
                      }`}
                      loading="lazy"
                    />

                    {/* Blue Discount Badge */}
                    {item.discountPercent && (
                      <div className="absolute top-2.5 left-2.5 bg-[#2B7FFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        {item.discountPercent}% Off
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="font-bold text-zinc-900 text-[13.5px] mt-2.5 truncate"
                    title={item.name}
                  >
                    {item.name}
                  </h3>

                  {/* Stock & Sold Info */}
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    <span className={item.stock === 0 ? "text-rose-500 font-semibold" : ""}>
                      {item.stock} Available
                    </span>{" "}
                    &bull; {item.soldCount} Sold
                  </p>
                </div>

                {/* Price Row matching reference */}
                <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-gray-50">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {item.discountPercent && (
                      <span className="text-[11px] text-gray-400 line-through font-medium">
                        {formatRupiah(item.price)}
                      </span>
                    )}
                    <span className="font-extrabold text-zinc-900 text-[14px]">
                      {formatRupiah(finalPrice)}
                    </span>
                    <span className="text-[10.5px] text-gray-400 font-medium">
                      / Portion
                    </span>
                  </div>

                  {/* Quantity adjustment buttons if in cart */}
                  {qtyInCart > 0 && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 ml-1"
                    >
                      <button
                        onClick={() => decrementFromCart(item.id)}
                        className="w-5 h-5 rounded-md bg-gray-100 hover:bg-gray-200 text-zinc-700 flex items-center justify-center transition"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <button
                        onClick={() => addToCart(item.id)}
                        disabled={qtyInCart >= item.stock}
                        className="w-5 h-5 rounded-md bg-[#FF5B35] hover:bg-[#e04d28] disabled:opacity-40 text-white flex items-center justify-center transition"
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
      )}
    </section>
  );
}

