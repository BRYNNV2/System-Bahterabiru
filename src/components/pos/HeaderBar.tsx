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
    <header className="flex items-center justify-between gap-4 pb-5 border-b border-gray-100">
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
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-zinc-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
        )}
      </div>

      {/* Clean Date text matching reference design */}
      <div className="text-right">
        <span className="text-[12px] text-gray-400 font-medium">
          {currentDate}
        </span>
      </div>
    </header>
  );
}
