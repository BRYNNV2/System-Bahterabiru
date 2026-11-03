"use client";

import React from "react";
import { Search } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

export function ProductGrid() {
  const {
    menuItems,
    selectedCategory,
    activeSidebarGroup,
    searchQuery,
    setSearchQuery,
    sortBy,
    addToCart,
    getItemQuantity,
  } = usePosStore();

  const filteredItems = [...menuItems]
    .filter((item) => {
      // If user typed a search query, search across all items
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q)
        );
      }

      // If a specific sub-category pill is selected (e.g. Chicken, Seafood, Pasta, Rice bowl)
      if (selectedCategory !== "All Menu") {
        return item.category === selectedCategory;
      }

      // Otherwise filter by the active left sidebar group (Food, Coffee, Beverages, Appetizer, Bread, Snack)
      return item.group === activeSidebarGroup;
    })
    .sort((a, b) => {
      const priceA = getEffectivePrice(a);
      const priceB = getEffectivePrice(b);

      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      if (sortBy === "stock-desc") return b.stock - a.stock;
      return 0;
    });

  return (
    <section className="pb-6">
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 mt-2">
          <div className="w-11 h-11 rounded-full bg-[#FFF5EF] text-[#FF6B2C] flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-zinc-800">
            Menu tidak ditemukan
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Coba kata kunci lain atau pilih kategori berbeda
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-3.5 px-4 py-1.5 rounded-full bg-[#FF6B2C] text-white text-xs font-semibold transition hover:bg-[#e55a1f] cursor-pointer"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
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
                className={`group bg-white rounded-2xl p-3 border transition-all flex flex-col justify-between select-none ${
                  qtyInCart > 0
                    ? "border-[#FF6B2C]/60 shadow-[0_6px_20px_rgba(255,107,44,0.08)]"
                    : "border-gray-100/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-[#FF6B2C]/35 hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
                } ${!isOutOfStock ? "cursor-pointer active:scale-[0.99]" : "opacity-60 cursor-not-allowed"}`}
              >
                {/* Dish Photo */}
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F8F9FB]">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                      isOutOfStock ? "grayscale" : ""
                    }`}
                    loading="lazy"
                  />

                  {/* Subtle Quantity Pill when selected */}
                  {qtyInCart > 0 && (
                    <div className="absolute top-2 right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-[#FF6B2C] text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                      {qtyInCart}
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="px-2.5 py-1 rounded-full bg-white text-zinc-900 text-[10px] font-bold">
                        Habis
                      </span>
                    </div>
                  )}
                </div>

                {/* Centered Title & Orange Price matching Coca coffeetalk UI */}
                <div className="pt-3 pb-1 text-center">
                  <h3
                    className="font-bold text-zinc-800 text-[13px] sm:text-[13.5px] truncate px-1"
                    title={item.name}
                  >
                    {item.name}
                  </h3>
                  <p className="font-extrabold text-[#FF6B2C] text-[13px] sm:text-[13.5px] mt-1 tabular-nums">
                    {formatRupiah(finalPrice)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
