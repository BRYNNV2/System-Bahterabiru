"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ConciergeBell,
  ThumbsUp,
  MessageSquareMore,
  CalendarRange,
  WalletCards,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePosStore, AppNavTab } from "@/store/usePosStore";

const ORDER_TIPS = [
  {
    title: "How to order food?",
    desc: "Ordering food from our web app is a seamless and delightful experience designed to satisfy you effortlessly...",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Fast Category Filter",
    desc: "Use category cards or the live search & price filter to quickly find any dish or beverage in seconds.",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Instant Checkout",
    desc: "Review items in the invoice panel, select Cash, Debit, or QRIS, and process the transaction immediately.",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80",
  },
];

export function SidebarRail() {
  const { activeTab, setActiveTab } = usePosStore();
  const [tipIndex, setTipIndex] = useState(0);

  const navLinks: {
    id: AppNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "analytics", label: "Dashboard", icon: BookOpen },
    { id: "pos", label: "Food Order", icon: ConciergeBell },
    { id: "feedback", label: "Feedback", icon: ThumbsUp },
    { id: "message", label: "Message", icon: MessageSquareMore },
    { id: "history", label: "Order History", icon: CalendarRange },
    { id: "inventory", label: "Payment details", icon: WalletCards },
    { id: "settings", label: "Customization", icon: Settings },
  ];

  const currentTip = ORDER_TIPS[tipIndex];

  return (
    <aside className="w-[225px] lg:w-[242px] bg-white border-r border-gray-200/70 px-4 py-5 flex flex-col justify-between shrink-0 z-20 h-full overflow-y-auto custom-scrollbar select-none">
      {/* Top Section: Brand Logo + Navigation Menu */}
      <div>
        {/* Brand Header matching foodislice screenshot */}
        <button
          type="button"
          onClick={() => setActiveTab("pos")}
          className="flex items-center gap-2.5 px-2 mb-6 cursor-pointer group"
        >
          {/* Two-tone Pie Slice Icon */}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
              {/* Main Terracotta Orange Circle Sector */}
              <path
                d="M15 4C8.92487 4 4 8.92487 4 15C4 21.0751 8.92487 26 15 26C21.0751 26 26 21.0751 26 15H15V4Z"
                fill="#EE5728"
              />
              {/* Offset Golden Amber Slice */}
              <path
                d="M18 2C23.5228 2 28 6.47715 28 12H18V2Z"
                fill="#F5A623"
              />
            </svg>
          </div>

          <span className="text-[21px] font-extrabold tracking-tight leading-none">
            <span className="text-[#EE5728]">foodi</span>
            <span className="text-[#F5A623]">slice</span>
          </span>
        </button>

        {/* Navigation Links matching exact bordered card style */}
        <nav className="space-y-2.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl border text-[13px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#FCEAE3] border-[#EE5728]/50 text-[#EE5728] shadow-[0_2px_10px_rgba(238,87,40,0.08)]"
                    : "bg-white border-gray-200/80 text-zinc-700 hover:border-[#EE5728]/35 hover:text-[#EE5728] hover:bg-[#FFF9F6]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? "text-[#EE5728] stroke-[2.2]"
                      : "text-zinc-500 stroke-[1.8]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info Card ("How to order food?") matching screenshot */}
      <div className="mt-5 pt-2">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-3">
          <div className="w-full h-24 rounded-xl overflow-hidden bg-gray-100 mb-2.5">
            <img
              src={currentTip.image}
              alt={currentTip.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <h4 className="text-[12.5px] font-extrabold text-zinc-900 leading-snug">
            {currentTip.title}
          </h4>
          <p className="text-[10px] text-gray-400 leading-relaxed mt-1 line-clamp-3">
            {currentTip.desc}
          </p>

          {/* Mini Prev / Next Circular Buttons */}
          <div className="flex items-center gap-2 mt-2.5">
            <button
              type="button"
              onClick={() =>
                setTipIndex(
                  (prev) => (prev - 1 + ORDER_TIPS.length) % ORDER_TIPS.length
                )
              }
              aria-label="Previous tip"
              className="w-6 h-6 rounded-full border border-gray-300 text-zinc-500 hover:border-[#EE5728] hover:text-[#EE5728] flex items-center justify-center transition cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() =>
                setTipIndex((prev) => (prev + 1) % ORDER_TIPS.length)
              }
              aria-label="Next tip"
              className="w-6 h-6 rounded-full bg-[#EE5728] hover:bg-[#d94b1f] text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
