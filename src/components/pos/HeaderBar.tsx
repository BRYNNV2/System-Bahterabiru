"use client";

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";

export function HeaderBar() {
  const { searchQuery, setSearchQuery } = usePosStore();
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
          " • " +
          now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 pb-5 border-b border-gray-100">
      {/* Search Menu Input */}
      <div className="relative w-full max-w-[420px]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search menu..."
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

      {/* Operational Live Time & System Status (No user profile/avatar) */}
      <div className="flex items-center gap-2.5 bg-[#F8F9FB] px-4 py-2.5 rounded-2xl border border-gray-100">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-zinc-800 tabular-nums">
          {currentDateTime || "Kantin Kampus POS Aktif"}
        </span>
      </div>
    </header>
  );
}
