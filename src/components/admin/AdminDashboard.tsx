"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Minus,
  CheckCircle2,
  Menu,
} from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah } from "@/data/initialMenu";

export function AdminDashboard() {
  const {
    menuItems,
    recentOrders,
    updateProductStock,
    setActiveTab,
    setIsMobileMenuOpen,
  } = usePosStore();

  const [activeSubTab, setActiveSubTab] = useState<"analytics" | "inventory">(
    "analytics"
  );
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Financial calculations
  const totalOmzet = recentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalItemsSold = recentOrders.reduce((sum, o) => sum + o.itemCount, 0);
  const totalDiscountGiven = recentOrders.reduce(
    (sum, o) => sum + o.discountTotal,
    0
  );

  const lowStockItems = menuItems.filter((i) => i.stock <= 5);

  const handleRestock = (productId: string, currentStock: number, add: number) => {
    updateProductStock(productId, currentStock + add);
    setSuccessToast("Stok berhasil diperbarui!");
    setTimeout(() => setSuccessToast(null), 2500);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F4F5F7]">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl bg-white border border-gray-200 text-zinc-700 flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5 stroke-[2]" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Admin Panel Kantin
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Pemantauan Perkembangan Penjualan, Pemasukan & Manajemen Stok
            </p>
          </div>
        </div>

        {/* Tab switch + Back to POS button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveSubTab("analytics")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "analytics"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Perkembangan & Omzet
            </button>
            <button
              onClick={() => setActiveSubTab("inventory")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "inventory"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Manajemen Stok ({lowStockItems.length} Menipis)
            </button>
          </div>

          <button
            onClick={() => setActiveTab("pos")}
            className="px-3.5 py-2 rounded-2xl bg-[#FF5B35] hover:bg-[#e04d28] text-white text-xs font-bold transition cursor-pointer"
          >
            Kembali ke Kasir
          </button>
        </div>
      </div>

      {successToast && (
        <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {activeSubTab === "analytics" ? (
        <div className="mt-6 space-y-6">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">Total Pemasukan</span>
                <div className="w-8 h-8 rounded-xl bg-[#FFF4F0] text-[#FF5B35] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-zinc-900 tabular-nums">
                {formatRupiah(totalOmzet || 116950)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+18.4% dari hari kemarin</span>
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">Transaksi Selesai</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-zinc-900 tabular-nums">
                {recentOrders.length} Pesanan
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Total {totalItemsSold || 5} porsi makanan/minuman terjual
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">Stok Perlu Perhatian</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-rose-600 tabular-nums">
                {lowStockItems.length} Item
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Stok habis atau tersisa di bawah 5 porsi
              </p>
            </div>
          </div>

          {/* Top Selling Products Table */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-[16px] font-bold text-zinc-900 mb-4">
              Menu Terlaris & Performa Penjualan
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                    <th className="pb-3">Menu</th>
                    <th className="pb-3">Kategori</th>
                    <th className="pb-3">Harga</th>
                    <th className="pb-3">Terjual</th>
                    <th className="pb-3">Sisa Stok</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3 flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-9 h-9 rounded-xl object-cover bg-gray-100"
                        />
                        <span className="font-bold text-zinc-900">{item.name}</span>
                      </td>
                      <td className="py-3 text-gray-500">{item.category}</td>
                      <td className="py-3 font-semibold text-zinc-800">
                        {formatRupiah(item.price)}
                      </td>
                      <td className="py-3 font-bold text-emerald-600">
                        {item.soldCount} porsi
                      </td>
                      <td className="py-3 font-bold text-zinc-800">
                        {item.stock} porsi
                      </td>
                      <td className="py-3">
                        {item.stock === 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px]">
                            Habis
                          </span>
                        ) : item.stock <= 5 ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px]">
                            Menipis
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">
                            Tersedia
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Inventory Management Tab */
        <div className="mt-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[16px] font-bold text-zinc-900">
                Kontrol Stok Kantin Real-Time
              </h3>
              <p className="text-xs text-gray-400">
                Setiap transaksi kasir otomatis memotong stok. Tambahkan stok saat bahan tiba.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 bg-gray-50/40 hover:bg-white hover:shadow-xs transition"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover bg-gray-100"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-zinc-900 text-xs truncate">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Stok saat ini:{" "}
                    <span
                      className={`font-black ${
                        item.stock === 0
                          ? "text-rose-600"
                          : item.stock <= 5
                          ? "text-amber-600"
                          : "text-zinc-900"
                      }`}
                    >
                      {item.stock}
                    </span>
                  </p>
                </div>

                {/* Restock Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRestock(item.id, item.stock, -1)}
                    disabled={item.stock <= 0}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:border-gray-300 disabled:opacity-30 text-zinc-700 flex items-center justify-center transition cursor-pointer"
                    title="Kurangi 1"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRestock(item.id, item.stock, 5)}
                    className="px-2.5 py-1 rounded-lg bg-[#FF5B35] hover:bg-[#e04d28] text-white text-[10px] font-bold transition cursor-pointer"
                    title="Tambah 5 porsi"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleRestock(item.id, item.stock, 10)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold transition cursor-pointer"
                    title="Tambah 10 porsi"
                  >
                    +10
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

