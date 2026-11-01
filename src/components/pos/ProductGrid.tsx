"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Check, Plus, Minus, Search, X, ArrowUpDown } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

export function ProductGrid() {
  const {
    menuItems,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    addToCart,
    decrementFromCart,
    getItemQuantity,
  } = usePosStore();

  const [showFilterPopover, setShowFilterPopover] = useState(false);

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
      {/* Section Header with Search status and Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Title and Result Counter */}
        <div className="flex items-center gap-2.5">
          <h2 className="text-[17px] font-bold text-zinc-900 tracking-tight">
            Select Menu
          </h2>
          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full tabular-nums">
            {filteredItems.length} items
          </span>

          {searchQuery && (
            <div className="flex items-center gap-1.5 bg-[#FFF4F0] border border-[#FFCCBF] text-[#FF5B35] px-2.5 py-0.5 rounded-full text-[11px] font-bold">
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

        {/* Sorting Controls matching exact user request */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick 1-Click Sort Pills */}
          <div className="flex items-center bg-[#F4F5F8] p-1 rounded-xl border border-gray-100">
            <button
              onClick={() => setSortBy("default")}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold tracking-wider transition cursor-pointer ${
                sortBy === "default"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-gray-400 hover:text-zinc-800"
              }`}
            >
              DEFAULT
            </button>

            <button
              onClick={() => setSortBy("price-asc")}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-extrabold tracking-wider transition cursor-pointer flex items-center gap-1 ${
                sortBy === "price-asc"
                  ? "bg-white text-[#FF5B35] shadow-2xs"
                  : "text-gray-400 hover:text-zinc-800"
              }`}
              title="Urutkan dari termurah ke termahal"
            >
              <span>PRICE: LOW TO HIGH</span>
            </button>

            <button
              onClick={() => setSortBy("price-desc")}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-extrabold tracking-wider transition cursor-pointer flex items-center gap-1 ${
                sortBy === "price-desc"
                  ? "bg-white text-[#FF5B35] shadow-2xs"
                  : "text-gray-400 hover:text-zinc-800"
              }`}
              title="Urutkan dari termahal ke termurah"
            >
              <span>PRICE: HIGH TO LOW</span>
            </button>
          </div>

          {/* More Filter Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterPopover((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                sortBy === "stock-desc"
                  ? "bg-[#FF5B35] text-white border-[#FF5B35]"
                  : "bg-white text-zinc-600 border-gray-200 hover:border-gray-300"
              }`}
              title="Filter tambahan"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>

            {showFilterPopover && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-2.5 z-30 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
                  Urutan Menu
                </p>
                {[
                  { id: "default", label: "Default / Rekomendasi" },
                  { id: "price-asc", label: "PRICE: LOW TO HIGH" },
                  { id: "price-desc", label: "PRICE: HIGH TO LOW" },
                  { id: "stock-desc", label: "STOK TERBANYAK" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortBy(
                        opt.id as
                          | "default"
                          | "price-asc"
                          | "price-desc"
                          | "stock-desc"
                      );
                      setShowFilterPopover(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                      sortBy === opt.id
                        ? "bg-[#FFF4F0] text-[#FF5B35]"
                        : "text-zinc-700 hover:bg-gray-50"
                    }`}
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
