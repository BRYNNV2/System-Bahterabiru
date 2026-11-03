"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!showFilterPopover) return;

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowFilterPopover(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowFilterPopover(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showFilterPopover]);

  const getActiveSortLabel = (sort: typeof sortBy) => {
    switch (sort) {
      case "price-asc":
        return "PRICE: LOW TO HIGH";
      case "price-desc":
        return "PRICE: HIGH TO LOW";
      case "stock-desc":
        return "MOST STOCK";
      default:
        return "NEWEST";
    }
  };

  const filteredItems = [...menuItems]
    .filter((item) => {
      // Filter by category first
      if (selectedCategory !== "All Menu" && item.category !== selectedCategory) {
        return false;
      }

      // Filter by search query if active
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory) return false;
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
    <section className="mt-5 sm:mt-7 relative">
      {/* Section Header */}
      <div className="relative z-40 flex flex-wrap items-center justify-between gap-2.5 mb-3 sm:mb-4">
        {/* Title and Active Search indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-[15px] sm:text-[17px] font-bold text-zinc-900 tracking-tight">
            Select Menu
          </h2>

          {searchQuery && (
            <div className="flex items-center gap-1.5 bg-[#FFF4F0] border border-[#FFCCBF] text-[#EE5728] px-2 py-0.5 rounded-full text-[10.5px] font-bold">
              <span>&ldquo;{searchQuery}&rdquo;</span>
              <button
                type="button"
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
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Item Count */}
          <span className="text-[10.5px] sm:text-[11.5px] font-bold tracking-[0.12em] sm:tracking-[0.16em] text-[#8E95A5] uppercase tabular-nums select-none">
            {filteredItems.length} ITEMS
          </span>

          {/* Vertical Separator */}
          <div className="h-3.5 sm:h-4 w-[1px] bg-gray-200" />

          {/* Pill Button + Dropdown Popover */}
          <div ref={dropdownRef} className="relative z-50">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterPopover((prev) => !prev);
              }}
              aria-expanded={showFilterPopover}
              className="inline-flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-200/90 bg-white hover:border-zinc-800 active:scale-[0.98] text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-zinc-900 transition cursor-pointer shadow-sm select-none"
            >
              <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2] shrink-0" />
              <span className="max-w-[90px] sm:max-w-none truncate">{getActiveSortLabel(sortBy)}</span>
              <span
                className={`text-[#84CC16] text-[8px] sm:text-[9px] transition-transform duration-200 ${
                  showFilterPopover ? "rotate-180" : ""
                }`}
              >
                &#9660;
              </span>
            </button>

            {showFilterPopover && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-[200px] sm:w-[215px] bg-white rounded-[24px] sm:rounded-[26px] shadow-[0_14px_44px_rgba(0,0,0,0.16)] border border-gray-100 p-2 z-50"
              >
                {/* Option 1: NEWEST ARRIVALS */}
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("default");
                    setShowFilterPopover(false);
                  }}
                  className={`w-full text-left p-2.5 sm:p-3 rounded-[16px] sm:rounded-[18px] transition cursor-pointer ${
                    sortBy === "default"
                      ? "bg-[#0D1117] text-white"
                      : "text-zinc-800 hover:bg-gray-100"
                  }`}
                >
                  <span className="block text-[10px] sm:text-[11px] font-black tracking-wider uppercase leading-tight">
                    NEWEST
                  </span>
                  <span className="block text-[10px] sm:text-[11px] font-black tracking-wider uppercase leading-tight">
                    ARRIVALS
                  </span>
                </button>

                {/* Option 2: PRICE: LOW TO HIGH */}
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("price-asc");
                    setShowFilterPopover(false);
                  }}
                  className={`w-full text-left p-2.5 sm:p-3 rounded-[16px] sm:rounded-[18px] transition cursor-pointer mt-1 ${
                    sortBy === "price-asc"
                      ? "bg-[#0D1117] text-white"
                      : "text-zinc-800 hover:bg-gray-100"
                  }`}
                >
                  <span className="block text-[10px] sm:text-[11px] font-black tracking-wider uppercase leading-tight">
                    PRICE: LOW TO
                  </span>
                  <span className="block text-[10px] sm:text-[11px] font-black tracking-wider uppercase leading-tight">
                    HIGH
                  </span>
                </button>

                {/* Option 3: PRICE: HIGH TO LOW */}
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("price-desc");
                    setShowFilterPopover(false);
                  }}
                  className={`w-full text-left p-2.5 sm:p-3 rounded-[16px] sm:rounded-[18px] transition cursor-pointer mt-1 ${
                    sortBy === "price-desc"
                      ? "bg-[#0D1117] text-white"
                      : "text-zinc-800 hover:bg-gray-100"
                  }`}
                >
                  <span className="block text-[10px] sm:text-[11px] font-black tracking-wider uppercase leading-tight">
                    PRICE: HIGH TO
                  </span>
                  <span className="block text-[10px] sm:text-[11px] font-black tracking-wider uppercase leading-tight">
                    LOW
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Columns Product Grid: 2 cols on mobile, 3 on md/tablet, up to 4 on large screens */}
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-4 pb-20 xl:pb-0">
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
                className={`group bg-white rounded-2xl p-2.5 sm:p-3 border transition-all flex flex-col justify-between ${
                  qtyInCart > 0
                    ? "border-[#EE5728]/60 shadow-[0_6px_20px_rgba(238,87,40,0.08)]"
                    : "border-gray-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-[#EE5728]/40 hover:shadow-md"
                } ${!isOutOfStock ? "cursor-pointer" : "opacity-75"}`}
              >
                <div>
                  {/* Food Image with Discount Badge */}
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F4F5F7]">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        isOutOfStock ? "grayscale" : ""
                      }`}
                      loading="lazy"
                    />

                    {/* Discount Badge */}
                    {item.discountPercent && (
                      <div className="absolute top-2 left-2 bg-[#EE5728] text-white text-[9.5px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
                        {item.discountPercent}% Off
                      </div>
                    )}

                    {/* Selected Quantity Badge in top-right when in cart */}
                    {qtyInCart > 0 && (
                      <div className="absolute top-2 right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#EE5728] text-white text-[10px] sm:text-[11px] font-extrabold flex items-center justify-center shadow-sm">
                        {qtyInCart}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="font-bold text-zinc-900 text-[12.5px] sm:text-[13.5px] mt-2 sm:mt-2.5 truncate"
                    title={item.name}
                  >
                    {item.name}
                  </h3>

                  {/* Stock & Sold Info */}
                  <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium mt-0.5">
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
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 gap-1">
                  <div className="flex items-baseline gap-1 flex-wrap min-w-0">
                    <span className="font-extrabold text-[#EE5728] text-[12.5px] sm:text-[14px]">
                      {formatRupiah(finalPrice)}
                    </span>
                    {item.discountPercent && (
                      <span className="text-[9.5px] sm:text-[10.5px] text-gray-400 line-through font-medium">
                        {formatRupiah(item.price)}
                      </span>
                    )}
                  </div>

                  {/* Stepper matching reference (- 2 +) */}
                  {qtyInCart > 0 ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 sm:gap-1.5 bg-[#FCEAE3] border border-[#EE5728]/40 px-1 sm:px-1.5 py-0.5 rounded-xl ml-1 shrink-0"
                    >
                      <button
                        type="button"
                        onClick={() => decrementFromCart(item.id)}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-white hover:bg-gray-100 text-zinc-700 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
                        aria-label="Kurangi"
                        title={
                          qtyInCart === 1 ? "Hapus dari pesanan" : "Kurangi 1"
                        }
                      >
                        <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                      </button>
                      <span className="text-[11px] sm:text-xs font-black text-[#EE5728] min-w-[12px] sm:min-w-[14px] text-center tabular-nums">
                        {qtyInCart}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(item.id)}
                        disabled={qtyInCart >= item.stock}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#EE5728] hover:bg-[#d94b1f] disabled:opacity-30 text-white flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
                        aria-label="Tambah"
                        title="Tambah 1"
                      >
                        <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) addToCart(item.id);
                      }}
                      disabled={isOutOfStock}
                      className="px-2 sm:px-2.5 py-1 rounded-lg bg-[#EE5728] hover:bg-[#d94b1f] text-white disabled:bg-gray-200 disabled:text-gray-400 text-[10px] sm:text-[10.5px] font-bold flex items-center gap-0.5 sm:gap-1 transition cursor-pointer shadow-xs active:scale-95 ml-1 shrink-0"
                      title={isOutOfStock ? "Stok Habis" : "Tambah ke Pesanan"}
                    >
                      <span className="hidden sm:inline">Order</span>
                      <Plus className="w-3 h-3 stroke-[2.5]" />
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
