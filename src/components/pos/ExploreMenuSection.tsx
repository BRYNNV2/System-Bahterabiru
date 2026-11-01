"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  Minus,
  Check,
  X,
  ReceiptText,
} from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import {
  CATEGORIES,
  CategoryFilter,
  formatRupiah,
  getEffectivePrice,
} from "@/data/initialMenu";

interface ExploreMenuSectionProps {
  promoOnly: boolean;
  setPromoOnly: (val: boolean) => void;
  isOrderPanelOpen: boolean;
  onOpenRecentOrders: () => void;
}

export function ExploreMenuSection({
  promoOnly,
  setPromoOnly,
  isOrderPanelOpen,
  onOpenRecentOrders,
}: ExploreMenuSectionProps) {
  const {
    menuItems,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    onlyAvailable,
    setOnlyAvailable,
    addToCart,
    decrementFromCart,
    getItemQuantity,
    recentOrders,
  } = usePosStore();

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Flash sale countdown timer
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

  // Filter & Sort logic
  const filteredItems = menuItems
    .filter((item) => {
      if (promoOnly && !item.isSpecialDiscount) return false;
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }
      if (
        searchQuery.trim() &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.category.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (onlyAvailable && item.stock <= 0) {
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

  const activeCategoryLabel = promoOnly
    ? "PROMO HARI INI"
    : selectedCategory === "All"
    ? "ALL CATEGORIES"
    : selectedCategory.toUpperCase();

  const sortLabels: Record<typeof sortBy, string> = {
    default: "RECOMMENDED",
    "price-asc": "PRICE: LOW",
    "price-desc": "PRICE: HIGH",
    "stock-desc": "MOST STOCK",
  };

  return (
    <section className="w-full">
      {/* Editorial Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-zinc-400 uppercase mb-2">
            THE CANTEEN ARCHIVE &bull; SELF-ORDER POS
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] text-zinc-950 uppercase leading-none">
            {promoOnly ? "SPECIAL PROMO" : "EXPLORE MENU"}
            <span className="text-[#A3E635]">.</span>
          </h1>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {recentOrders.length > 0 && (
            <button
              onClick={onOpenRecentOrders}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-zinc-200 hover:border-zinc-950 text-[11px] font-extrabold tracking-wider uppercase text-zinc-700 hover:text-zinc-950 transition cursor-pointer"
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Struk ({recentOrders.length})</span>
            </button>
          )}

          {/* Clean Minimalist Promo Countdown Pill */}
          <button
            onClick={() => setPromoOnly(!promoOnly)}
            className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border text-[11px] font-extrabold tracking-widest uppercase transition cursor-pointer ${
              promoOnly
                ? "bg-zinc-950 text-white border-zinc-950"
                : "bg-zinc-50 text-zinc-800 border-zinc-200 hover:border-zinc-950"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
            <span>PROMO DISKON 15%</span>
            <span className="text-zinc-400">|</span>
            <span className="tabular-nums font-black">
              {hours}:{minutes}:{seconds}
            </span>
          </button>
        </div>
      </div>

      {/* Full-Width Pill Toolbar (Category Selector | Centered Search | Item Count & Sort) */}
      <div className="mt-7 mb-9 w-full rounded-full border border-zinc-200/90 bg-white p-2 sm:px-4 sm:py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.015)]">
        {/* Left: Category Dropdown Pill */}
        <div className="relative w-full md:w-auto flex items-center gap-2">
          <button
            onClick={() => {
              setShowCategoryDropdown((prev) => !prev);
              setShowSortDropdown(false);
            }}
            className="w-full md:w-auto inline-flex items-center justify-between gap-3 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-950 text-[11px] font-extrabold tracking-[0.12em] text-zinc-900 uppercase transition cursor-pointer"
          >
            <span>{activeCategoryLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {(selectedCategory !== "All" || promoOnly) && (
            <button
              onClick={() => {
                setSelectedCategory("All");
                setPromoOnly(false);
              }}
              className="px-3 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-[10px] font-extrabold tracking-wider uppercase text-zinc-600 transition cursor-pointer"
            >
              Reset
            </button>
          )}

          {showCategoryDropdown && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-2 z-30">
              <button
                onClick={() => {
                  setPromoOnly(false);
                  setSelectedCategory("All");
                  setShowCategoryDropdown(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-extrabold tracking-wider uppercase text-zinc-800 hover:bg-zinc-50 rounded-xl transition cursor-pointer"
              >
                <span>ALL CATEGORIES</span>
                {!promoOnly && selectedCategory === "All" && (
                  <Check className="w-3.5 h-3.5 text-zinc-950" />
                )}
              </button>
              <button
                onClick={() => {
                  setPromoOnly(true);
                  setSelectedCategory("All");
                  setShowCategoryDropdown(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-extrabold tracking-wider uppercase text-zinc-800 hover:bg-zinc-50 rounded-xl transition cursor-pointer"
              >
                <span>PROMO HARI INI (15%)</span>
                {promoOnly && <Check className="w-3.5 h-3.5 text-zinc-950" />}
              </button>
              <div className="h-px bg-zinc-100 my-1" />
              {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setPromoOnly(false);
                    setSelectedCategory(cat as CategoryFilter);
                    setShowCategoryDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold tracking-wider uppercase text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-xl transition cursor-pointer"
                >
                  <span>{cat}</span>
                  {!promoOnly && selectedCategory === cat && (
                    <Check className="w-3.5 h-3.5 text-zinc-950" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Search Input Pill */}
        <div className="relative w-full md:max-w-md lg:max-w-lg">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu or beverages..."
            className="w-full bg-zinc-50/70 hover:bg-zinc-100/60 focus:bg-white text-zinc-900 placeholder:text-zinc-400 text-xs font-medium rounded-full pl-10 pr-9 py-2 border border-zinc-200/70 focus:border-zinc-950 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Item Count + Sort Dropdown */}
        <div className="w-full md:w-auto flex items-center justify-end gap-3.5 shrink-0">
          <span className="text-[11px] font-bold tracking-[0.18em] text-zinc-400 uppercase tabular-nums">
            {filteredItems.length} ITEMS
          </span>

          <div className="h-4 w-px bg-zinc-200" />

          <div className="relative">
            <button
              onClick={() => {
                setShowSortDropdown((prev) => !prev);
                setShowCategoryDropdown(false);
              }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-950 text-[11px] font-extrabold tracking-[0.12em] text-zinc-900 uppercase transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{sortLabels[sortBy]}</span>
              <span className="text-[9px] text-zinc-400">&#9650;</span>
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-2 z-30">
                {[
                  { id: "default", label: "RECOMMENDED" },
                  { id: "price-asc", label: "PRICE: LOW TO HIGH" },
                  { id: "price-desc", label: "PRICE: HIGH TO LOW" },
                  { id: "stock-desc", label: "HIGHEST STOCK" },
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
                      setShowSortDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold tracking-wider uppercase text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 rounded-xl transition cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.id && (
                      <Check className="w-3.5 h-3.5 text-zinc-950" />
                    )}
                  </button>
                ))}
                <div className="h-px bg-zinc-100 my-1" />
                <label className="flex items-center justify-between px-3 py-2 text-[11px] font-bold tracking-wider uppercase text-zinc-700 cursor-pointer hover:bg-zinc-50 rounded-xl">
                  <span>TERSEDIA SAJA</span>
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="rounded accent-zinc-950"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editorial Product Grid (Berakit Series aesthetic + Blitz/McD Kiosk touch action) */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-zinc-200 rounded-3xl">
          <p className="text-sm font-extrabold uppercase tracking-wider text-zinc-900">
            Menu Tidak Ditemukan
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Silakan ubah kata kunci pencarian atau reset filter kategori.
          </p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            isOrderPanelOpen
              ? "lg:grid-cols-3 2xl:grid-cols-4"
              : "lg:grid-cols-3 xl:grid-cols-4"
          } gap-x-6 gap-y-9`}
        >
          {filteredItems.map((item) => {
            const qty = getItemQuantity(item.id);
            const finalPrice = getEffectivePrice(item);
            const remainingStock = Math.max(0, item.stock);
            const isMaxReached = qty >= remainingStock;
            const isOutOfStock = remainingStock === 0;

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between"
              >
                {/* Tall Portrait/Square Image Container */}
                <div
                  onClick={() => {
                    if (!isOutOfStock && qty === 0) {
                      addToCart(item.id);
                    }
                  }}
                  className={`relative aspect-[4/4.2] w-full rounded-[24px] overflow-hidden bg-zinc-100 ${
                    !isOutOfStock && qty === 0 ? "cursor-pointer" : ""
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
                      isOutOfStock ? "grayscale opacity-60" : ""
                    }`}
                    loading="lazy"
                  />

                  {/* Top-Left Pill Badge (Exact style of FEATURED / STOK HABIS in screenshot) */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                    {isOutOfStock ? (
                      <span className="bg-[#FF2A5F] text-white text-[10px] font-black tracking-[0.12em] uppercase px-3 py-1 rounded-full shadow-xs">
                        STOK HABIS
                      </span>
                    ) : item.isSpecialDiscount ? (
                      <span className="bg-[#B4F03A] text-zinc-950 text-[10px] font-black tracking-[0.12em] uppercase px-3 py-1 rounded-full shadow-xs">
                        PROMO {item.discountPercent}%
                      </span>
                    ) : (
                      <span className="bg-[#B4F03A] text-zinc-950 text-[10px] font-black tracking-[0.12em] uppercase px-3 py-1 rounded-full shadow-xs">
                        FEATURED
                      </span>
                    )}
                  </div>

                  {/* Top-Right Stock Pill */}
                  {!isOutOfStock && (
                    <div className="absolute top-3.5 right-3.5 bg-zinc-950/65 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
                      STOK: {remainingStock}
                    </div>
                  )}

                  {/* Kiosk Action Control on Bottom of Image */}
                  {qty > 0 ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-3 inset-x-3 bg-zinc-950/95 backdrop-blur-md text-white rounded-2xl px-3 py-2 flex items-center justify-between shadow-lg"
                    >
                      <button
                        onClick={() => decrementFromCart(item.id)}
                        className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                        aria-label="Kurangi porsi"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      <span className="text-[11px] font-black tracking-widest uppercase text-[#B4F03A] tabular-nums">
                        {qty} DIPILIH
                      </span>

                      <button
                        onClick={() => addToCart(item.id)}
                        disabled={isMaxReached}
                        className="w-7 h-7 rounded-xl bg-[#B4F03A] hover:bg-[#c3f756] disabled:opacity-40 text-zinc-950 flex items-center justify-center transition cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Tambah porsi"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    !isOutOfStock && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item.id);
                        }}
                        className="absolute bottom-3 right-3 bg-white/95 hover:bg-zinc-950 text-zinc-950 hover:text-white border border-zinc-200/80 hover:border-zinc-950 px-3.5 py-2 rounded-full text-[10.5px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span>PILIH</span>
                      </button>
                    )
                  )}
                </div>

                {/* Clean Editorial Typography Row Below Image (Left: Name & Category, Right: Price) */}
                <div className="mt-3.5 flex items-start justify-between gap-3 px-0.5">
                  <div className="min-w-0">
                    <h3
                      className="text-[13.5px] font-extrabold tracking-[-0.01em] text-zinc-950 uppercase truncate"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                    <p className="text-[10.5px] font-bold tracking-[0.14em] text-zinc-400 uppercase mt-0.5">
                      {item.category}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-[14px] font-extrabold text-zinc-950 tabular-nums">
                      {formatRupiah(finalPrice)}
                    </span>
                    {item.isSpecialDiscount && (
                      <span className="block text-[10.5px] text-zinc-400 line-through font-medium tabular-nums">
                        {formatRupiah(item.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
