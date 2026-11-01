"use client";

import React, { useState } from "react";
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
  const { activeTab, setActiveTab } = usePosStore();
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#EDF0F5] p-3 sm:p-5 lg:p-7 flex items-center justify-center font-sans">
      {/* Main Rounded App Card Container matching reference screenshot */}
      <div className="w-full max-w-[1640px] min-h-[920px] bg-white rounded-[32px] shadow-[0_12px_48px_rgba(0,0,0,0.035)] border border-gray-100/80 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Slim Sidebar Rail */}
        <SidebarRail />

        {/* Center Main Work Area */}
        {activeTab === "pos" ? (
          <>
            <main className="flex-1 p-6 sm:p-8 overflow-y-auto custom-scrollbar">
              {/* Header Bar */}
              <HeaderBar />

              {/* Categories Cards */}
              <CategoryCards />

              {/* Select Menu Grid */}
              <ProductGrid />
            </main>

            {/* Right Panel: Detail Items & Checkout */}
            <DetailItemsSidebar
              onProcessTransaction={() => setIsTransactionOpen(true)}
            />
          </>
        ) : activeTab === "analytics" || activeTab === "inventory" ? (
          /* Role Admin Dashboard for Monitoring Growth, Revenue & Stock */
          <AdminDashboard />
        ) : activeTab === "history" ? (
          /* Transaction History Screen */
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h1 className="text-2xl font-black text-zinc-900">
                  Riwayat Transaksi Penjualan
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Arsip seluruh pesanan kasir yang telah diselesaikan
                </p>
              </div>
              <button
                onClick={() => setActiveTab("pos")}
                className="px-4 py-2 rounded-2xl bg-[#FF5B35] text-white text-xs font-bold"
              >
                Kembali ke Kasir
              </button>
            </div>
            <RecentOrdersModal
              isOpen={true}
              onClose={() => setActiveTab("pos")}
            />
          </div>
        ) : (
          /* Settings View */
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h1 className="text-2xl font-black text-zinc-900">
                  Pengaturan Kasir Kantin
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Konfigurasi profil kasir, printer struk, dan sistem POS
                </p>
              </div>
              <button
                onClick={() => setActiveTab("pos")}
                className="px-4 py-2 rounded-2xl bg-[#FF5B35] text-white text-xs font-bold"
              >
                Kembali ke Kasir
              </button>
            </div>
            <div className="max-w-md bg-gray-50/60 rounded-3xl p-6 border border-gray-100 space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">
                  Nama Kasir Bertugas
                </label>
                <input
                  type="text"
                  defaultValue="Lina Punk Manado"
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-bold mb-1">
                  Pajak & Layanan Resto (%)
                </label>
                <input
                  type="number"
                  defaultValue={15}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <button
                onClick={() => alert("Pengaturan berhasil disimpan!")}
                className="w-full py-3 rounded-2xl bg-zinc-900 text-white font-bold"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Success Modal */}
      <TransactionModal
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
      />

      {/* History Modal */}
      <RecentOrdersModal
        isOpen={isRecentOrdersOpen}
        onClose={() => setIsRecentOrdersOpen(false)}
      />
    </div>
  );
}
