"use client";

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";

export function HeaderBar() {
  const { searchQuery, setSearchQuery } = usePosStore();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateTime();
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 bg-white px-5 py-3.5 rounded-2xl border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      {/* Search Food Input + Filter Trigger */}
      <div className="flex items-center gap-3 w-full max-w-[520px]">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food or menu..."
            className="w-full bg-[#F4F5F7] hover:bg-[#ECEEF2] focus:bg-white text-zinc-900 placeholder:text-gray-400 text-xs font-medium rounded-xl pl-4 pr-10 py-2.5 border border-transparent focus:border-[#EE5728]/40 focus:outline-none transition"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          )}
        </div>
      </div>

      {/* Clean Date text */}
      <div className="text-right shrink-0">
        <span className="text-[12px] text-gray-400 font-semibold">
          {currentDate}
        </span>
      </div>
    </header>
  );
}
