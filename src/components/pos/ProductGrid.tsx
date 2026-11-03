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

  // Open Quick View modal with smooth enter animation & deep background blur
  const handleOpenQuickView = (item: MenuItem) => {
    setQuickViewItem(item);
    setSelectedServing(
      item.servingOptions && item.servingOptions.length > 0
        ? item.servingOptions[0]
        : "Porsi Reguler"
    );
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
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 mt-2">
          <div className="w-11 h-11 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Menu tidak ditemukan
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Coba kata kunci lain atau pilih kategori berbeda
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-3.5 px-4 py-1.5 rounded-full bg-[#2563EB] text-white text-xs font-semibold transition hover:bg-[#1D4ED8] cursor-pointer"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
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
                <div className="relative aspect-[4/4.2] w-full rounded-[22px] overflow-hidden bg-[#E2E8F0] shadow-[0_4px_16px_rgba(15,23,42,0.04)] group-hover:shadow-[0_12px_28px_rgba(37,99,235,0.12)] transition-all duration-300">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                      isOutOfStock ? "brightness-90" : ""
                    }`}
                    loading="lazy"
                  />

                  {/* Subtle dark gradient at bottom on hover so Quick View pill pops */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Top-Left Badge: STOK HABIS or FEATURED */}
                  <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5">
                    {isOutOfStock ? (
                      <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                        STOK HABIS
                      </span>
                    ) : item.featured ? (
                      <span className="px-3 py-1 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-[0_4px_12px_rgba(37,99,235,0.35)]">
                        FEATURED
                      </span>
                    ) : null}
                  </div>

                  {/* Top-Right Badge: Quantity already in cart */}
                  {qtyInCart > 0 && (
                    <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold uppercase tracking-wide shadow-[0_4px_12px_rgba(37,99,235,0.35)] ring-2 ring-white/80">
                      {qtyInCart} PCS
                    </div>
                  )}

                  {/* Bottom-Center Hover Pill: QUICK VIEW */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <div className="bg-white hover:bg-[#EFF6FF] text-slate-900 hover:text-[#2563EB] px-5 py-2.5 rounded-full shadow-[0_8px_24px_rgba(15,23,42,0.22)] flex items-center gap-2 whitespace-nowrap transition-colors">
                      <Eye className="w-3.5 h-3.5 text-[#2563EB] stroke-[2.2]" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider">
                        QUICK VIEW
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Metadata: Title + Price on row 1, Category + Sold info on row 2 */}
                <div className="pt-3 px-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3
                      className="font-extrabold text-slate-900 group-hover:text-[#2563EB] transition-colors text-[13px] sm:text-[13.5px] uppercase tracking-tight truncate"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                    <span className="font-extrabold text-[#2563EB] text-[13px] sm:text-[13.5px] tabular-nums shrink-0">
                      {formatRupiah(finalPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {isOutOfStock
                        ? "Habis Terjual"
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
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${
              isQuickViewVisible
                ? "bg-slate-950/60 opacity-100"
                : "bg-slate-950/0 opacity-0"
            }`}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                transition:
                  "transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className={`bg-white rounded-[28px] max-w-3xl w-full overflow-hidden shadow-[0_25px_70px_rgba(15,23,42,0.42)] grid grid-cols-1 md:grid-cols-2 relative ${
                isQuickViewVisible
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-[0.92] translate-y-6"
              }`}
            >
            {/* Close Button (Top Right) */}
            <button
              type="button"
              onClick={handleCloseQuickView}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-[#EFF6FF] text-slate-600 hover:text-[#2563EB] flex items-center justify-center transition cursor-pointer z-10 active:scale-90"
              aria-label="Tutup detail menu"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Left Column: Framed Dish Photo */}
            <div className="bg-[#F1F5F9] p-6 sm:p-9 flex items-center justify-center">
              <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-md bg-white relative">
                <img
                  src={quickViewItem.imageUrl}
                  alt={quickViewItem.name}
                  className="w-full h-full object-cover"
                />
                {quickViewItem.stock <= 0 && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                    STOK HABIS
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Detailed Sales, Stock, Pcs Purchased & Options */}
            <div className="p-6 sm:p-8 flex flex-col justify-between bg-white">
              <div>
                {/* Top Meta Row: Category & Real-time Stock */}
                <div className="flex items-center justify-between pr-8">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] px-2.5 py-0.5 rounded-md">
                    {quickViewItem.category}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    STOCK: {quickViewItem.stock}
                  </span>
                </div>

                {/* Large Uppercase Dish Title */}
                <h2 className="text-2xl sm:text-[27px] font-black text-slate-900 uppercase leading-[1.12] tracking-tight mt-2">
                  {quickViewItem.name}
                </h2>

                {/* Price */}
                <p className="text-xl font-extrabold text-[#2563EB] mt-2 pb-4 border-b border-slate-100 tabular-nums">
                  {formatRupiah(getEffectivePrice(quickViewItem))}
                </p>

                {/* Sales & Cart Status Info */}
                <div className="grid grid-cols-3 gap-2 my-3.5 bg-[#F8FAFC] p-2.5 rounded-2xl border border-slate-100 text-center">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                      Stok Sisa
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {quickViewItem.stock} Pcs
                    </span>
                  </div>
                  <div className="border-x border-slate-200/70">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                      Terjual
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {quickViewItem.soldCount} Pcs
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                      Dibeli Saat Ini
                    </span>
                    <span className="text-xs font-extrabold text-[#2563EB]">
                      {getItemQuantity(quickViewItem.id)} Pcs
                    </span>
                  </div>
                </div>

                {/* Dish Description */}
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {quickViewItem.description}
                </p>

                {/* Serving / Portion Variant Selector */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900">
                      PILIH VARIAN PENYAJIAN
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 underline">
                      STANDAR PORSI KANTIN
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      quickViewItem.servingOptions || [
                        "Porsi Reguler",
                        "Pedas Normal",
                      ]
                    ).map((option) => {
                      const isSelected = selectedServing === option;
                      return (
                        <button
                          type="button"
                          key={option}
                          onClick={() => setSelectedServing(option)}
                          className={`px-4 py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${
                            isSelected
                              ? "bg-[#2563EB] text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
                              : "bg-[#F8FAFC] text-slate-600 border border-slate-200/70 hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity To Buy Selector (Berapa Pcs yang Dibeli) */}
                {quickViewItem.stock > 0 && (
                  <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5 rounded-2xl border border-slate-100 mb-5">
                    <span className="text-xs font-bold text-slate-700">
                      Jumlah Dibeli (Pcs)
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 flex items-center justify-center transition cursor-pointer active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <span className="text-xs font-extrabold text-slate-900 min-w-[42px] text-center tabular-nums">
                        {buyQty} Pcs
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setBuyQty((q) =>
                            Math.min(quickViewItem.stock, q + 1)
                          )
                        }
                        className="w-7 h-7 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center transition cursor-pointer active:scale-95"
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
                  className="w-full py-4 rounded-full bg-[#F1F5F9] text-slate-400 font-extrabold text-xs uppercase tracking-wider cursor-not-allowed"
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
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_8px_20px_rgba(37,99,235,0.28)] flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
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
