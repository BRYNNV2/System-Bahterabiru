"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";

export function HeaderBar() {
  const { searchQuery, setSearchQuery } = usePosStore();

  return (
    <header className="flex items-center justify-between gap-4 pb-6 border-b border-gray-100/90">
      {/* Search Menu Input matching reference */}
      <div className="relative w-full max-w-[420px]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search menu"
          className="w-full bg-[#F8F9FB] hover:bg-[#F2F4F8] focus:bg-white text-zinc-900 placeholder:text-gray-400 text-xs font-medium rounded-2xl pl-5 pr-11 py-3 border border-transparent focus:border-gray-200 focus:outline-none transition"
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
        )}
      </div>

      {/* Right User & Date Profile */}
      <div className="flex items-center gap-3.5 shrink-0">
        <div className="text-right hidden sm:block">
          <h4 className="text-[13.5px] font-bold text-zinc-900 leading-tight">
            Lina Punk Manado
          </h4>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            Sunday, 15 January 2023
          </p>
        </div>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-gray-100">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
            alt="Lina Punk Manado"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
