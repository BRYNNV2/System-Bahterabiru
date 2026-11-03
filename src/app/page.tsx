"use client";

import React, { useState } from "react";
import { Menu, Flame } from "lucide-react";
import { SidebarRail } from "@/components/pos/SidebarRail";
import { HeaderBar } from "@/components/pos/HeaderBar";
import { CategoryCards } from "@/components/pos/CategoryCards";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { DetailItemsSidebar } from "@/components/pos/DetailItemsSidebar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { TransactionModal } from "@/components/pos/TransactionModal";
import { RecentOrdersModal } from "@/components/pos/RecentOrdersModal";
import { usePosStore } from "@/store/usePosStore";

export default function PosTerminalPage() {
  const { activeTab, setActiveTab, toggleSidebar } = usePosStore();
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8F9FB] flex flex-col font-sans">
      {/* Top Global Header Bar (Coca coffeetalk style + Single Hamburger Toggle) */}
      <header className="h-14 bg-white border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 select-none">
        {/* Left: Single Hamburger Toggle + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-9 h-9 rounded-xl bg-[#F8F9FB] hover:bg-[#FFF5EF] text-zinc-700 hover:text-[#FF6B2C] flex items-center justify-center transition cursor-pointer active:scale-95"
            aria-label="Buka/Tutup Sidebar"
            title="Buka/Tutup Sidebar"
          >
            <Menu className="w-5 h-5 stroke-[2]" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF8C42] to-[#FF5511] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <span className="text-[16px] font-extrabold text-zinc-900 tracking-tight">
              Coca{" "}
              <span className="font-bold text-zinc-700">coffeetalk</span>
            </span>
          </button>
        </div>

        {/* Right: Quick View Switcher Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[
            { id: "pos", label: "POS Menu" },
            { id: "analytics", label: "Dashboard" },
            { id: "feedback", label: "Feedback" },
            { id: "message", label: "Kitchen Notes" },
          ].map((nav) => {
            const isCurrent =
              nav.id === "analytics"
                ? activeTab === "analytics" || activeTab === "inventory"
                : activeTab === nav.id;
            return (
              <button
                type="button"
                key={nav.id}
                onClick={() => setActiveTab(nav.id as typeof activeTab)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition cursor-pointer ${
                  isCurrent
                    ? "bg-[#FFF5EF] text-[#FF6B2C] border border-[#FF6B2C]/50 font-bold"
                    : "text-gray-400 hover:text-zinc-700 hover:bg-[#F8F9FB] font-medium"
                }`}
              >
                {nav.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main 3-Column Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Vertical Icon Rail */}
        <SidebarRail />

        {/* Center Main Work Area */}
        {activeTab === "pos" ? (
          <>
            <main className="flex-1 min-w-0 h-full overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 custom-scrollbar bg-[#F8F9FB]">
              {/* Breadcrumb + Unified Search & Category Pill Bar */}
              <HeaderBar />

              {/* Category Cards (Unified inside HeaderBar) */}
              <CategoryCards />

              {/* Clean 4-Column Product Grid */}
              <ProductGrid />
            </main>

            {/* Right Panel: Customer Information & Orders Details */}
            <DetailItemsSidebar
              onProcessTransaction={() => setIsTransactionOpen(true)}
            />
          </>
        ) : activeTab === "analytics" || activeTab === "inventory" ? (
          <AdminDashboard />
        ) : activeTab === "feedback" ? (
          <div className="flex-1 h-full p-5 sm:p-7 overflow-y-auto bg-[#F8F9FB]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200/70 mb-6">
              <div>
                <h1 className="text-xl font-extrabold text-zinc-900">
                  Ulasan & Feedback Pelanggan
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Penilaian kualitas makanan dan pelayanan kantin
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("pos")}
                className="self-start sm:self-auto px-4 py-2 rounded-full bg-[#FF6B2C] text-white text-xs font-bold transition hover:bg-[#e55a1f] cursor-pointer"
              >
                Kembali ke POS Menu
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: "Rizky Pratama",
                  menu: "Steak sapi bakar",
                  rating: "5.0",
                  comment:
                    "Dagingnya empuk dan bumbunya meresap pas untuk makan siang kampus.",
                },
                {
                  name: "Nadia Putri",
                  menu: "Caramel Coffee Latte",
                  rating: "4.9",
                  comment:
                    "Kopi creamy dan penyajian cepat walaupun jam istirahat ramai.",
                },
                {
                  name: "Dimas Saputra",
                  menu: "Mie kuah pedas",
                  rating: "4.8",
                  comment:
                    "Kuahnya gurih segar, pedasnya pas dan harga ramah mahasiswa.",
                },
              ].map((fb, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-zinc-900">
                      {fb.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFF5EF] text-[#FF6B2C] text-xs font-extrabold">
                      ★ {fb.rating}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#FF6B2C] mb-2">
                    Menu: {fb.menu}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    &ldquo;{fb.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "message" ? (
          <div className="flex-1 h-full p-5 sm:p-7 overflow-y-auto bg-[#F8F9FB]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200/70 mb-6">
              <div>
                <h1 className="text-xl font-extrabold text-zinc-900">
                  Pesan & Catatan Dapur
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Komunikasi antrean pesanan antara kasir dan dapur kantin
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("pos")}
                className="self-start sm:self-auto px-4 py-2 rounded-full bg-[#FF6B2C] text-white text-xs font-bold transition hover:bg-[#e55a1f] cursor-pointer"
              >
                Kembali ke POS Menu
              </button>
            </div>
            <div className="max-w-2xl space-y-3">
              {[
                {
                  sender: "Dapur Utama",
                  time: "Baru saja",
                  text: "Stok Steak sapi bakar dan Ayam kentang siap 20 porsi hangat untuk sesi makan siang.",
                },
                {
                  sender: "Barista Minuman",
                  time: "10 menit lalu",
                  text: "Antrean Caramel Coffee Latte dan Tropical Berry Refresher sudah selesai disajikan semua.",
                },
              ].map((msg, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start justify-between gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                >
                  <div>
                    <span className="text-xs font-extrabold text-[#FF6B2C]">
                      {msg.sender}
                    </span>
                    <p className="text-xs text-zinc-700 mt-1">{msg.text}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {msg.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "history" ? (
          <div className="flex-1 h-full p-5 sm:p-7 overflow-y-auto bg-[#F8F9FB]">
            <RecentOrdersModal
              isOpen={true}
              onClose={() => setActiveTab("pos")}
            />
          </div>
        ) : (
          <div className="flex-1 h-full p-5 sm:p-7 overflow-y-auto bg-[#F8F9FB]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200/70 mb-6">
              <div>
                <h1 className="text-xl font-extrabold text-zinc-900">
                  Pengaturan POS
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Konfigurasi nama merchant, pajak layanan, dan preferensi kasir
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("pos")}
                className="self-start sm:self-auto px-4 py-2 rounded-full bg-[#FF6B2C] text-white text-xs font-bold transition hover:bg-[#e55a1f] cursor-pointer"
              >
                Kembali ke POS Menu
              </button>
            </div>
            <div className="max-w-md bg-white rounded-3xl p-6 border border-gray-100 space-y-4 text-xs shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div>
                <label className="block text-gray-500 font-bold mb-1.5">
                  Nama Resto / Merchant
                </label>
                <input
                  type="text"
                  defaultValue="Coca coffeetalk"
                  className="w-full bg-[#F8F9FB] border border-gray-200 rounded-full px-4 py-2.5 font-bold text-zinc-800 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>
              <div>
                <label className="block text-gray-500 font-bold mb-1.5">
                  Pajak & Layanan Resto (%)
                </label>
                <input
                  type="number"
                  defaultValue={10}
                  className="w-full bg-[#F8F9FB] border border-gray-200 rounded-full px-4 py-2.5 font-bold text-zinc-800 focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("pos")}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF7A18] to-[#FF5500] text-white font-bold cursor-pointer hover:opacity-95 transition shadow-md shadow-orange-500/20"
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
      />

      <RecentOrdersModal
        isOpen={isRecentOrdersOpen}
        onClose={() => setIsRecentOrdersOpen(false)}
      />
    </div>
  );
}
