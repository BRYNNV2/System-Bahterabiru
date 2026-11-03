"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Eye, X, Plus, Minus, ShoppingBag } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import {
  formatRupiah,
  getEffectivePrice,
  MenuItem,
} from "@/data/initialMenu";

export function ProductGrid() {
  const {
    menuItems,
    selectedCategory,
    activeSidebarGroup,
    searchQuery,
    setSearchQuery,
    sortBy,
    addToCartWithQty,
    getItemQuantity,
    setIsModalBlurActive,
  } = usePosStore();

  const [quickViewItem, setQuickViewItem] = useState<MenuItem | null>(null);
  const [isQuickViewVisible, setIsQuickViewVisible] = useState<boolean>(false);
  const [selectedServing, setSelectedServing] = useState<string>("");
  const [buyQty, setBuyQty] = useState<number>(1);

  const getValidServingOptions = (item: MenuItem): string[] => {
    const raw = item.servingOptions || [];
    if (raw.length === 0) return [];
    const isOldDefaultPlaceholder =
      raw.length === 3 &&
      raw[0] === "Porsi Reguler" &&
      raw[1] === "Pedas Normal" &&
      raw[2] === "Extra Bumbu";
    if (
      isOldDefaultPlaceholder &&
      (item.category === "Snack" ||
        item.group === "Snack" ||
        item.category === "Bread" ||
        item.group === "Bread" ||
        item.category === "Beverages" ||
        item.group === "Beverages" ||
        item.category === "Coffee" ||
        item.group === "Coffee")
    ) {
      return [];
    }
    return raw;
  };

  // Open Quick View modal with smooth enter animation & deep background blur
  const handleOpenQuickView = (item: MenuItem) => {
    setQuickViewItem(item);
    const validOptions = getValidServingOptions(item);
    setSelectedServing(validOptions.length > 0 ? validOptions[0] : "");
    setBuyQty(1);
    setIsModalBlurActive(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsQuickViewVisible(true);
      });
    });
  };

  // Close Quick View modal with smooth exit animation
  const handleCloseQuickView = () => {
    setIsQuickViewVisible(false);
    setIsModalBlurActive(false);
    setTimeout(() => {
      setQuickViewItem(null);
    }, 260);
  };

  // Close Quick View on Escape key
  useEffect(() => {
    if (!quickViewItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseQuickView();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickViewItem]);

  const filteredItems = [...menuItems]
    .filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q)
        );
      }

      if (selectedCategory !== "All Menu") {
        return item.category === selectedCategory;
      }

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
    <section className="pb-8">
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-zinc-100 mt-2">
          <div className="w-11 h-11 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-zinc-900">
            Menu tidak ditemukan
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Coba kata kunci lain atau pilih kategori berbeda
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-3.5 px-4 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold transition hover:bg-zinc-800 cursor-pointer"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {filteredItems.map((item) => {
            const qtyInCart = getItemQuantity(item.id);
            const isOutOfStock = item.stock <= 0;
            const finalPrice = getEffectivePrice(item);

            return (
              <div
                key={item.id}
                onClick={() => handleOpenQuickView(item)}
                className="group cursor-pointer select-none flex flex-col"
              >
                {/* Rounded Image Card with Badges & Hover QUICK VIEW */}
                <div className="relative aspect-[4/4.2] w-full rounded-[18px] sm:rounded-[22px] overflow-hidden bg-[#ECEEF2] shadow-[0_4px_16px_rgba(0,0,0,0.04)] group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] transition-all duration-300">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                      isOutOfStock ? "brightness-90 grayscale-[25%]" : ""
                    }`}
                    loading="lazy"
                  />

                  {/* Subtle dark gradient at bottom on hover so Quick View pill pops */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Top-Left Badge: STOK HABIS or FEATURED (Clean Monochrome Pill) */}
                  <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 flex flex-col gap-1.5">
                    {isOutOfStock ? (
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-zinc-900/90 text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                        STOK HABIS
                      </span>
                    ) : item.featured ? (
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/95 text-zinc-900 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                        FEATURED
                      </span>
                    ) : null}
                  </div>

                  {/* Top-Right Badge: Quantity already in cart */}
                  {qtyInCart > 0 && (
                    <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-zinc-900 text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide shadow-md ring-2 ring-white/80">
                      {qtyInCart} PCS
                    </div>
                  )}

                  {/* Bottom-Center Hover Pill: QUICK VIEW */}
                  <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <div className="bg-white hover:bg-zinc-50 text-zinc-900 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.22)] flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors">
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-600 stroke-[2.2]" />
                      <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider">
                        QUICK VIEW
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Metadata: Title + Price on row 1, Category + Sold info on row 2 */}
                <div className="pt-2.5 sm:pt-3 px-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-2">
                    <h3
                      className="font-extrabold text-zinc-900 text-[12px] sm:text-[13.5px] uppercase tracking-tight truncate"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                    <span className="font-extrabold text-zinc-900 text-[12px] sm:text-[13.5px] tabular-nums shrink-0">
                      {formatRupiah(finalPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-zinc-400 uppercase tracking-widest truncate">
                      {item.category}
                    </span>
                    <span className="text-[9.5px] sm:text-[10px] font-medium text-zinc-400 shrink-0">
                      {isOutOfStock
                        ? "Habis"
                        : `Stok ${item.stock} • ${item.soldCount} Terjual`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK VIEW DETAIL MODAL (Portaled to document.body so background workspace blurs deeply) */}
      {quickViewItem &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onClick={handleCloseQuickView}
            style={{
              backdropFilter: isQuickViewVisible ? "blur(16px)" : "blur(0px)",
              WebkitBackdropFilter: isQuickViewVisible
                ? "blur(16px)"
                : "blur(0px)",
              transition:
                "background-color 300ms ease-out, backdrop-filter 300ms ease-out, -webkit-backdrop-filter 300ms ease-out, opacity 280ms ease-out",
            }}
            className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 ${
              isQuickViewVisible
                ? "bg-zinc-950/60 opacity-100"
                : "bg-zinc-950/0 opacity-0"
            }`}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                transition:
                  "transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className={`bg-white rounded-[24px] sm:rounded-[28px] max-w-3xl w-full max-h-[90dvh] overflow-y-auto custom-scrollbar shadow-[0_25px_70px_rgba(0,0,0,0.42)] grid grid-cols-1 md:grid-cols-2 relative ${
                isQuickViewVisible
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-[0.92] translate-y-6"
              }`}
            >
            {/* Close Button (Top Right) */}
            <button
              type="button"
              onClick={handleCloseQuickView}
              className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/90 md:bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 shadow-sm md:shadow-none flex items-center justify-center transition cursor-pointer z-20 active:scale-90"
              aria-label="Tutup detail menu"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Left Column: Framed Dish Photo */}
            <div className="bg-[#F4F4F5] p-4 sm:p-8 flex items-center justify-center">
              <div className="w-full aspect-[16/11] sm:aspect-square rounded-2xl overflow-hidden shadow-md bg-white relative">
                <img
                  src={quickViewItem.imageUrl}
                  alt={quickViewItem.name}
                  className="w-full h-full object-cover"
                />
                {quickViewItem.stock <= 0 && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-extrabold uppercase tracking-wider">
                    STOK HABIS
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Detailed Sales, Stock, Pcs Purchased & Options */}
            <div className="p-5 sm:p-8 flex flex-col justify-between bg-white">
              <div>
                {/* Top Meta Row: Category & Real-time Stock */}
                <div className="flex items-center justify-between pr-8">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-800 bg-zinc-100 border border-zinc-200/80 px-2.5 py-0.5 rounded-md">
                    {quickViewItem.category}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    STOCK: {quickViewItem.stock}
                  </span>
                </div>

                {/* Large Uppercase Dish Title */}
                <h2 className="text-2xl sm:text-[27px] font-black text-zinc-900 uppercase leading-[1.12] tracking-tight mt-2">
                  {quickViewItem.name}
                </h2>

                {/* Price */}
                <p className="text-xl font-extrabold text-zinc-900 mt-2 pb-4 border-b border-zinc-100 tabular-nums">
                  {formatRupiah(getEffectivePrice(quickViewItem))}
                </p>

                {/* Sales & Cart Status Info */}
                <div className="grid grid-cols-3 gap-2 my-3.5 bg-[#F8F8FA] p-2.5 rounded-2xl border border-zinc-100 text-center">
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-semibold uppercase">
                      Stok Sisa
                    </span>
                    <span className="text-xs font-extrabold text-zinc-900">
                      {quickViewItem.stock} Pcs
                    </span>
                  </div>
                  <div className="border-x border-zinc-200/70">
                    <span className="block text-[10px] text-zinc-400 font-semibold uppercase">
                      Terjual
                    </span>
                    <span className="text-xs font-extrabold text-zinc-900">
                      {quickViewItem.soldCount} Pcs
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-semibold uppercase">
                      Dibeli Saat Ini
                    </span>
                    <span className="text-xs font-extrabold text-zinc-900">
                      {getItemQuantity(quickViewItem.id)} Pcs
                    </span>
                  </div>
                </div>

                {/* Dish Description (Shown only when non-empty and not legacy kitchen placeholder on snacks) */}
                {(() => {
                  const desc = (quickViewItem.description || "").trim();
                  const isLegacyPlaceholder =
                    desc.startsWith("Hidangan spesial racikan dapur utama") &&
                    (quickViewItem.category === "Snack" ||
                      quickViewItem.group === "Snack");
                  if (!desc || isLegacyPlaceholder) return null;
                  return (
                    <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                      {desc}
                    </p>
                  );
                })()}

                {/* Serving / Portion Variant Selector (Only shown for items that actually have variants) */}
                {(() => {
                  const validOptions = getValidServingOptions(quickViewItem);
                  if (validOptions.length === 0) return null;
                  return (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-zinc-900">
                          PILIH VARIAN / PENYAJIAN
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          OPSIONAL DETAIL
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {validOptions.map((option) => {
                          const isSelected = selectedServing === option;
                          return (
                            <button
                              type="button"
                              key={option}
                              onClick={() => setSelectedServing(option)}
                              className={`px-4 py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${
                                isSelected
                                  ? "bg-zinc-900 text-white shadow-xs"
                                  : "bg-[#F4F4F5] text-zinc-600 hover:bg-zinc-200/80"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Quantity To Buy Selector (Berapa Pcs yang Dibeli) */}
                {quickViewItem.stock > 0 && (
                  <div className="flex items-center justify-between bg-[#F8F8FA] px-4 py-2.5 rounded-2xl border border-zinc-100 mb-5">
                    <span className="text-xs font-bold text-zinc-700">
                      Jumlah Dibeli (Pcs)
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-full bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 flex items-center justify-center transition cursor-pointer active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <span className="text-xs font-extrabold text-zinc-900 min-w-[42px] text-center tabular-nums">
                        {buyQty} Pcs
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setBuyQty((q) =>
                            Math.min(quickViewItem.stock, q + 1)
                          )
                        }
                        className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-700 text-white flex items-center justify-center transition cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom CTA Button */}
              {quickViewItem.stock <= 0 ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-4 rounded-full bg-[#F4F4F5] text-zinc-400 font-extrabold text-xs uppercase tracking-wider cursor-not-allowed"
                >
                  STOK HABIS
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    addToCartWithQty(quickViewItem.id, buyQty);
                    handleCloseQuickView();
                  }}
                  className="w-full py-4 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_8px_20px_rgba(24,24,27,0.2)] flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                  <span>
                    TAMBAH {buyQty} PCS —{" "}
                    {formatRupiah(getEffectivePrice(quickViewItem) * buyQty)}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
