"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Plus, Minus, Search, X } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

export function ProductGrid() {
  const {
    menuItems,
    selectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    addToCart,
    decrementFromCart,
    getItemQuantity,
  } = usePosStore();

  const [showFilterPopover, setShowFilterPopover] = useState(false);

  const getActiveSortLabel = (sort: typeof sortBy) => {
    switch (sort) {
      case "price-asc":
        return "PRICE: LOW";
      case "price-desc":
        return "PRICE: HIGH";
      case "stock-desc":
        return "MOST STOCK";
      default:
        return "NEWEST";
    }
  };

  const filteredItems = menuItems
    .filter((item) => {
      // If user typed in search, search across catalog or within category
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory) return false;
        return true;
      }

      // If no search, filter strictly by selected category
      if (selectedCategory !== "All Menu" && item.category !== selectedCategory) {
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
      {/* Section Header matching exact user screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Title and Active Search indicator */}
        <div className="flex items-center gap-3">
          <h2 className="text-[17px] font-bold text-zinc-900 tracking-tight">
            Select Menu
          </h2>

          {searchQuery && (
            <div className="flex items-center gap-1.5 bg-[#FFF4F0] border border-[#FFCCBF] text-[#FF5B35] px-2.5 py-0.5 rounded-full text-[11px] font-bold animate-in fade-in">
              <span>Cari: &ldquo;{searchQuery}&rdquo;</span>
              <button
                onClick={() => setSearchQuery("")}
                className="hover:text-zinc-900 cursor-pointer ml-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Sort Controls (3 ITEMS | [NEWEST ▼] with Popover) */}
        <div className="flex items-center gap-3.5 self-end sm:self-auto">
          {/* Item Count */}
          <span className="text-[11.5px] font-bold tracking-[0.16em] text-[#8E95A5] uppercase tabular-nums">
            {filteredItems.length} ITEMS
          </span>

          {/* Vertical Separator */}
          <div className="h-4 w-[1px] bg-gray-200" />

          {/* Pill Button + Dropdown Popover matching screenshot */}
          <div className="relative">
            <button
              onClick={() => setShowFilterPopover((prev) => !prev)}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-gray-200/90 bg-white hover:border-zinc-800 text-[11px] font-black tracking-wider uppercase text-zinc-900 transition cursor-pointer shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{getActiveSortLabel(sortBy)}</span>
              <span className="text-[#84CC16] text-[9px] transform scale-y-90">&#9660;</span>
            </button>

            {showFilterPopover && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div
                  onClick={() => setShowFilterPopover(false)}
                  className="fixed inset-0 z-30"
                />

                {/* The Exact Popover Card matching reference screenshot */}
                <div className="absolute right-0 top-full mt-2 w-[210px] bg-white rounded-[26px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-2 z-40 animate-in fade-in zoom-in-95">
                  {/* Option 1: NEWEST ARRIVALS */}
                  <button
                    onClick={() => {
                      setSortBy("default");
                      setShowFilterPopover(false);
                    }}
                    className={`w-full text-left p-3 rounded-[18px] transition cursor-pointer ${
                      sortBy === "default"
                        ? "bg-[#0D1117] text-white shadow-xs"
                        : "text-zinc-800 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-[11px] font-black tracking-wider uppercase leading-tight">
                      NEWEST
                    </span>
                    <span className="block text-[11px] font-black tracking-wider uppercase leading-tight">
                      ARRIVALS
                    </span>
                  </button>

                  {/* Option 2: PRICE: LOW TO HIGH */}
                  <button
                    onClick={() => {
                      setSortBy("price-asc");
                      setShowFilterPopover(false);
                    }}
                    className={`w-full text-left p-3 rounded-[18px] transition cursor-pointer mt-1 ${
                      sortBy === "price-asc"
                        ? "bg-[#0D1117] text-white shadow-xs"
                        : "text-zinc-800 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-[11px] font-black tracking-wider uppercase leading-tight">
                      PRICE: LOW TO
                    </span>
                    <span className="block text-[11px] font-black tracking-wider uppercase leading-tight">
                      HIGH
                    </span>
                  </button>

                  {/* Option 3: PRICE: HIGH TO LOW */}
                  <button
                    onClick={() => {
                      setSortBy("price-desc");
                      setShowFilterPopover(false);
                    }}
                    className={`w-full text-left p-3 rounded-[18px] transition cursor-pointer mt-1 ${
                      sortBy === "price-desc"
                        ? "bg-[#0D1117] text-white shadow-xs"
                        : "text-zinc-800 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-[11px] font-black tracking-wider uppercase leading-tight">
                      PRICE: HIGH TO
                    </span>
                    <span className="block text-[11px] font-black tracking-wider uppercase leading-tight">
                      LOW
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4 Columns Product Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-zinc-800">
            Menu tidak ditemukan
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {searchQuery
              ? `Tidak ada menu yang cocok dengan kata kunci "${searchQuery}"`
              : "Coba pilih kategori lain atau reset filter."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-bold transition hover:bg-zinc-800 cursor-pointer"
            >
              Reset Pencarian
            </button>
          )}
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
                  {/* Food Image with Blue Discount Badge */}
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
                    <span
                      className={
                        item.stock === 0 ? "text-rose-500 font-semibold" : ""
                      }
                    >
                      {item.stock} Available
                    </span>{" "}
                    &bull; {item.soldCount} Sold
                  </p>
                </div>

                {/* Price Row & Action Controls */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50">
                  <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                    {item.discountPercent && (
                      <span className="text-[11px] text-gray-400 line-through font-medium">
                        {formatRupiah(item.price)}
                      </span>
                    )}
                    <span className="font-extrabold text-zinc-900 text-[13.5px]">
                      {formatRupiah(finalPrice)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      / Portion
                    </span>
                  </div>

                  {/* Stepper matching reference (- 2 +) */}
                  {qtyInCart > 0 ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 bg-[#FFF4F0] border border-[#FFCCBF] px-1.5 py-0.5 rounded-xl ml-1 shrink-0"
                    >
                      <button
                        onClick={() => decrementFromCart(item.id)}
                        className="w-5 h-5 rounded-lg bg-white hover:bg-gray-100 text-zinc-700 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
                        aria-label="Kurangi"
                        title={
                          qtyInCart === 1 ? "Hapus dari pesanan" : "Kurangi 1"
                        }
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="text-xs font-black text-[#FF5B35] min-w-[14px] text-center tabular-nums">
                        {qtyInCart}
                      </span>
                      <button
                        onClick={() => addToCart(item.id)}
                        disabled={qtyInCart >= item.stock}
                        className="w-5 h-5 rounded-lg bg-[#FF5B35] hover:bg-[#e04d28] disabled:opacity-30 text-white flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
                        aria-label="Tambah"
                        title="Tambah 1"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) addToCart(item.id);
                      }}
                      disabled={isOutOfStock}
                      className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-[#FF5B35] text-zinc-600 hover:text-white disabled:opacity-30 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95 ml-1 shrink-0"
                      title={isOutOfStock ? "Stok Habis" : "Tambah ke Pesanan"}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
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
