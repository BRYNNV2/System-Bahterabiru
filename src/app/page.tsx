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
    <div className="h-screen w-screen overflow-hidden bg-[#F4F5F7] flex font-sans">
      {/* Left Labeled Sidebar (foodislice style) */}
      <SidebarRail />

      {/* Center Main Work Area */}
      {activeTab === "pos" ? (
        <>
          <main className="flex-1 h-full overflow-y-auto px-5 lg:px-7 py-5 custom-scrollbar bg-[#F4F5F7]">
            {/* Header Bar */}
            <HeaderBar />

            {/* Categories Cards */}
            <CategoryCards />

            {/* Select Menu Grid */}
            <ProductGrid />
          </main>

          {/* Right Panel: Invoice & Checkout (Full Height) */}
          <DetailItemsSidebar
            onProcessTransaction={() => setIsTransactionOpen(true)}
          />
        </>
      ) : activeTab === "analytics" || activeTab === "inventory" ? (
        /* Role Admin Dashboard for Monitoring Growth, Revenue & Stock */
        <AdminDashboard />
      ) : activeTab === "feedback" ? (
        /* Customer Feedback View */
        <div className="flex-1 h-full p-8 overflow-y-auto bg-[#F4F5F7]">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">
                Ulasan & Feedback Pelanggan
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Daftar penilaian kualitas makanan dan pelayanan kantin
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("pos")}
              className="px-4 py-2 rounded-xl bg-[#EE5728] text-white text-xs font-bold transition hover:bg-[#d94b1f] cursor-pointer"
            >
              Kembali ke Food Order
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Rizky Pratama",
                menu: "Chicken Pop Matah",
                rating: "5.0",
                comment: "Sambal matahnya segar dan porsinya pas untuk makan siang kampus.",
              },
              {
                name: "Nadia Putri",
                menu: "Coffee Latte",
                rating: "4.9",
                comment: "Kopi creamy dan penyajian cepat walaupun jam istirahat ramai.",
              },
              {
                name: "Dimas Saputra",
                menu: "Thanos Burger",
                rating: "4.8",
                comment: "Roti lembut, daging tebal, harga ramah mahasiswa.",
              },
            ].map((fb, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-gray-200/70 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-zinc-900">{fb.name}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#FCEAE3] text-[#EE5728] text-xs font-extrabold">
                    ★ {fb.rating}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-[#EE5728] mb-2">
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
        /* Order Messages / Kitchen Notes View */
        <div className="flex-1 h-full p-8 overflow-y-auto bg-[#F4F5F7]">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">
                Pesan & Catatan Dapur
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Komunikasi antrean pesanan antara kasir dan dapur kantin
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("pos")}
              className="px-4 py-2 rounded-xl bg-[#EE5728] text-white text-xs font-bold transition hover:bg-[#d94b1f] cursor-pointer"
            >
              Kembali ke Food Order
            </button>
          </div>
          <div className="max-w-2xl space-y-3">
            {[
              {
                sender: "Dapur Utama",
                time: "Baru saja",
                text: "Stok Chicken Pop Matah siap 18 porsi hangat untuk sesi makan siang.",
              },
              {
                sender: "Barista Minuman",
                time: "10 menit lalu",
                text: "Antrean es kopi dan teh chamomile sudah selesai disajikan semua.",
              },
            ].map((msg, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-gray-200/70 flex items-start justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-extrabold text-[#EE5728]">
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
        /* Transaction History Screen */
        <div className="flex-1 h-full p-8 overflow-y-auto bg-[#F4F5F7]">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">
                Riwayat Transaksi Penjualan
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Arsip seluruh pesanan kasir yang telah diselesaikan
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("pos")}
              className="px-4 py-2 rounded-xl bg-[#EE5728] text-white text-xs font-bold transition hover:bg-[#d94b1f] cursor-pointer"
            >
              Kembali ke Food Order
            </button>
          </div>
          <RecentOrdersModal
            isOpen={true}
            onClose={() => setActiveTab("pos")}
          />
        </div>
      ) : (
        /* Customization / Settings View */
        <div className="flex-1 h-full p-8 overflow-y-auto bg-[#F4F5F7]">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">
                Customization & Pengaturan POS
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Konfigurasi nama kantin, pajak layanan, dan preferensi kasir
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("pos")}
              className="px-4 py-2 rounded-xl bg-[#EE5728] text-white text-xs font-bold transition hover:bg-[#d94b1f] cursor-pointer"
            >
              Kembali ke Food Order
            </button>
          </div>
          <div className="max-w-md bg-white rounded-3xl p-6 border border-gray-200/70 space-y-4 text-xs shadow-2xs">
            <div>
              <label className="block text-gray-500 font-bold mb-1">
                Nama Kantin / Merchant
              </label>
              <input
                type="text"
                defaultValue="Foodislice Campus Canteen"
                className="w-full bg-[#F4F5F7] border border-gray-200 rounded-xl p-2.5 font-bold"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">
                Pajak & Layanan Resto (%)
              </label>
              <input
                type="number"
                defaultValue={15}
                className="w-full bg-[#F4F5F7] border border-gray-200 rounded-xl p-2.5 font-bold"
              />
            </div>
            <button
              type="button"
              onClick={() => alert("Pengaturan berhasil disimpan!")}
              className="w-full py-3 rounded-xl bg-[#EE5728] text-white font-bold cursor-pointer hover:bg-[#d94b1f] transition"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

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
