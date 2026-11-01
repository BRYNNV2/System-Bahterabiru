"use client";

import React from "react";
import {
  UtensilsCrossed,
  Coffee,
  CupSoda,
  Wine,
  Soup,
  Beef,
  Flame,
} from "lucide-react";
import { CATEGORIES_WITH_META, CategoryType } from "@/data/initialMenu";
import { usePosStore } from "@/store/usePosStore";

export function CategoryCards() {
  const { selectedCategory, setSelectedCategory } = usePosStore();

  const getCategoryIcon = (id: CategoryType) => {
    switch (id) {
      case "All Menu":
        return <UtensilsCrossed className="w-5 h-5" />;
      case "Coffee":
        return <Coffee className="w-5 h-5" />;
      case "Tea":
        return <CupSoda className="w-5 h-5" />;
      case "Mocktail":
        return <Wine className="w-5 h-5" />;
      case "Rice":
        return <Beef className="w-5 h-5" />;
      case "Pasta":
        return <Soup className="w-5 h-5" />;
      case "Burger":
        return <Flame className="w-5 h-5" />;
      default:
        return <UtensilsCrossed className="w-5 h-5" />;
    }
  };

  return (
    <section className="mt-5">
      <h2 className="text-[17px] font-bold text-zinc-900 tracking-tight mb-3.5">
        Categories
      </h2>

      {/* Horizontal row of 7 category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {CATEGORIES_WITH_META.map((cat) => {
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                isActive
                  ? "bg-[#FFF4F0] border-[#FFCCBF] shadow-xs"
                  : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
              }`}
            >
              {/* Category Icon */}
              <div
                className={`mb-2 w-9 h-9 rounded-xl flex items-center justify-center ${
                  isActive
                    ? "text-[#FF5B35] bg-white shadow-2xs"
                    : "text-zinc-600 bg-gray-50"
                }`}
              >
                {getCategoryIcon(cat.id)}
              </div>

              {/* Title & Count */}
              <span
                className={`text-[12.5px] font-bold truncate w-full ${
                  isActive ? "text-[#FF5B35]" : "text-zinc-800"
                }`}
              >
                {cat.label}
              </span>
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                {cat.count} Item
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

