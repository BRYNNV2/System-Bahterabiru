"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  TrendingUp,
  Flame,
  PackageCheck,
  AlertTriangle,
  ArrowUpRight,
  ShoppingBag,
  Sparkles,
  Plus,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import {
  MenuItem,
  formatRupiah,
  getEffectivePrice,
} from "@/data/initialMenu";
import { CompletedOrder } from "@/store/usePosStore";

interface ProductInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  recentOrders: CompletedOrder[];
  onQuickRestock?: (item: MenuItem, addedQty: number) => void;
  onEditProduct?: (item: MenuItem) => void;
}

type InsightPeriod = "7days" | "today" | "all";
type InsightTab = "most-profitable" | "fastest-selling" | "restock-advisor";

export function ProductInsightModal({
  isOpen,
  onClose,
  menuItems,
  recentOrders,
  onQuickRestock,
  onEditProduct,
}: ProductInsightModalProps) {
  const [period, setPeriod] = useState<InsightPeriod>("7days");
  const [activeTab, setActiveTab] = useState<InsightTab>("most-profitable");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const periodLabel =
    period === "7days"
      ? "7 Hari Terakhir (Mingguan)"
      : period === "today"
      ? "Hari Ini"
      : "Semua Waktu";

  // Hitung statistik per produk berdasarkan periode waktu
  const productMetrics = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const oneDayMs = 24 * 60 * 60 * 1000;

    const filteredOrders = recentOrders.filter((ord) => {
      if (period === "all") return true;
      if (ord.createdAtIso) {
        const ts = new Date(ord.createdAtIso).getTime();
        if (!Number.isNaN(ts)) {
          return period === "today"
            ? now - ts <= oneDayMs
            : now - ts <= sevenDaysMs;
        }
      }
      if (period === "today") {
        return ord.createdAt?.toLowerCase().includes("today");
      }
      return true;
    });

    const orderQtyMap = new Map<string, number>();
    for (const ord of filteredOrders) {
      for (const line of ord.items) {
        const pid = line?.product?.id;
        if (pid) {
          orderQtyMap.set(
            pid,
            (orderQtyMap.get(pid) || 0) + (Number(line.quantity) || 0)
          );
        }
      }
    }

    return menuItems.map((item) => {
      const sellPrice = getEffectivePrice(item);
      const buyCost = item.costPrice ?? 0;
      const profitPerUnit = sellPrice - buyCost;
      const marginPct =
        sellPrice > 0 ? Math.round((profitPerUnit / sellPrice) * 100) : 0;

      const fromOrders = orderQtyMap.get(item.id) || 0;
      const soldQty =
        period === "all"
          ? Math.max(item.soldCount || 0, fromOrders)
          : fromOrders;

      const totalRevenue = soldQty * sellPrice;
      const totalCost = soldQty * buyCost;
      const totalProfit = soldQty * profitPerUnit;

      const totalPool = soldQty + item.stock;
      const sellThroughPct =
        totalPool > 0 ? Math.round((soldQty / totalPool) * 100) : 0;

      const avgDailySold =
        period === "today" ? soldQty : Number((soldQty / 7).toFixed(1));

      const daysUntilEmpty =
        avgDailySold > 0
          ? Math.round(item.stock / avgDailySold)
          : item.stock > 0
          ? 99
          : 0;

      const targetWeeklyBuffer = Math.max(
        soldQty > 0 ? Math.ceil(soldQty * 1.25) : 0,
        soldQty >= 5 ? 20 : soldQty >= 1 ? 12 : 0
      );
      const suggestedRestockQty = Math.max(0, targetWeeklyBuffer - item.stock);
      const estimatedRestockCapital = suggestedRestockQty * buyCost;
      const estimatedRestockProfit = suggestedRestockQty * profitPerUnit;

      let restockStatus: "urgent" | "recommended" | "safe" | "slow" = "safe";
      if (item.stock <= 5 && soldQty > 0) {
        restockStatus = "urgent";
      } else if (item.stock === 0) {
        restockStatus = "urgent";
      } else if (sellThroughPct >= 50 || suggestedRestockQty >= 5) {
        restockStatus = "recommended";
      } else if (soldQty === 0 && item.stock >= 10) {
        restockStatus = "slow";
      }

      const restockStatusLabel =
        restockStatus === "urgent"
          ? "Wajib Kulakan Segera"
          : restockStatus === "recommended"
          ? "Perbanyak Saat Kulakan"
          : restockStatus === "slow"
          ? "Perputaran Lambat (Tahan Kulakan)"
          : "Stok Etalase Cukup";

      return {
        item,
        sellPrice,
        buyCost,
        profitPerUnit,
        marginPct,
        soldQty,
        totalRevenue,
        totalCost,
        totalProfit,
        sellThroughPct,
        avgDailySold,
        daysUntilEmpty,
        suggestedRestockQty,
        estimatedRestockCapital,
        estimatedRestockProfit,
        restockStatus,
        restockStatusLabel,
      };
    });
  }, [menuItems, recentOrders, period]);

  const sortedByProfit = useMemo(
    () =>
      [...productMetrics].sort(
        (a, b) =>
          b.totalProfit - a.totalProfit || b.profitPerUnit - a.profitPerUnit
      ),
    [productMetrics]
  );

  const sortedBySpeed = useMemo(
    () =>
      [...productMetrics].sort(
        (a, b) =>
          b.soldQty - a.soldQty || b.sellThroughPct - a.sellThroughPct
      ),
    [productMetrics]
  );

  const sortedForRestock = useMemo(() => {
    const priorityScore = (st: "urgent" | "recommended" | "safe" | "slow") => {
      if (st === "urgent") return 4;
      if (st === "recommended") return 3;
      if (st === "safe") return 2;
      return 1;
    };
    return [...productMetrics].sort(
      (a, b) =>
        priorityScore(b.restockStatus) - priorityScore(a.restockStatus) ||
        b.totalProfit - a.totalProfit ||
        b.soldQty - a.soldQty
    );
  }, [productMetrics]);

  const topProfitChampion = sortedByProfit[0];
  const topFastestChampion = sortedBySpeed[0];
  const urgentRestockList = productMetrics.filter(
    (m) => m.restockStatus === "urgent" || m.restockStatus === "recommended"
  );
  const totalRestockCapitalNeeded = urgentRestockList.reduce(
    (sum, m) => sum + m.estimatedRestockCapital,
    0
  );
  const totalPotentialProfitFromRestock = urgentRestockList.reduce(
    (sum, m) => sum + m.estimatedRestockProfit,
    0
  );

  // Fungsi Export ke Excel (.xlsx dengan 3 Sheet Lengkap)
  const handleExportXlsx = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // Sheet 1: Peringkat Produk Paling Untung
      const profitRows: Record<string, string | number>[] = sortedByProfit.map(
        (r, i) => ({
          Peringkat: `#${i + 1}`,
          "Nama Produk": r.item.name,
          Kategori: r.item.category,
          "Barcode Kemasan": r.item.barcode || "-",
          "Harga Beli / Modal (Rp)": r.buyCost,
          "Harga Jual (Rp)": r.sellPrice,
          "Untung per Pcs (Rp)": r.profitPerUnit,
          "Margin (%)": `${r.marginPct}%`,
          "Unit Terjual (Pcs)": r.soldQty,
          "Total Omzet (Rp)": r.totalRevenue,
          "Total Laba Bersih (Rp)": r.totalProfit,
        })
      );
      profitRows.push({
        Peringkat: "TOTAL",
        "Nama Produk": `Rekap Periode: ${periodLabel}`,
        Kategori: "-",
        "Barcode Kemasan": "-",
        "Harga Beli / Modal (Rp)": 0,
        "Harga Jual (Rp)": 0,
        "Untung per Pcs (Rp)": 0,
        "Margin (%)": "-",
        "Unit Terjual (Pcs)": sortedByProfit.reduce((s, r) => s + r.soldQty, 0),
        "Total Omzet (Rp)": sortedByProfit.reduce(
          (s, r) => s + r.totalRevenue,
          0
        ),
        "Total Laba Bersih (Rp)": sortedByProfit.reduce(
          (s, r) => s + r.totalProfit,
          0
        ),
      });
      const wsProfit = XLSX.utils.json_to_sheet(profitRows);
      wsProfit["!cols"] = [
        { wch: 10 },
        { wch: 24 },
        { wch: 14 },
        { wch: 16 },
        { wch: 20 },
        { wch: 16 },
        { wch: 18 },
        { wch: 12 },
        { wch: 16 },
        { wch: 18 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, wsProfit, "1. Produk Paling Untung");

      // Sheet 2: Paling Cepat Habis (Fast Moving)
      const speedRows = sortedBySpeed.map((r, i) => ({
        Peringkat: `#${i + 1}`,
        "Nama Produk": r.item.name,
        Kategori: r.item.category,
        "Unit Terjual (Pcs)": r.soldQty,
        "Kecepatan Laku (%)": `${r.sellThroughPct}%`,
        "Rata-rata Terjual / Hari": `${r.avgDailySold} pcs`,
        "Sisa Stok Etalase (Pcs)": r.item.stock,
        "Estimasi Stok Habis":
          r.item.stock === 0
            ? "Sudah Habis"
            : r.avgDailySold > 0
            ? `${r.daysUntilEmpty} hari lagi`
            : "Stok Aman",
      }));
      const wsSpeed = XLSX.utils.json_to_sheet(speedRows);
      wsSpeed["!cols"] = [
        { wch: 10 },
        { wch: 24 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
        { wch: 22 },
        { wch: 20 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSpeed, "2. Paling Cepat Habis");

      // Sheet 3: Rekomendasi Kulakan Berikutnya
      const restockRows = sortedForRestock.map((r) => {
        const addQty =
          r.suggestedRestockQty > 0 ? r.suggestedRestockQty : 0;
        return {
          "Nama Produk": r.item.name,
          Kategori: r.item.category,
          "Status Kulakan": r.restockStatusLabel,
          "Sisa Stok Saat Ini (Pcs)": r.item.stock,
          "Terjual Minggu Ini (Pcs)": r.soldQty,
          "Saran Tambah Kulakan (Pcs)": addQty,
          "Harga Modal / Pcs (Rp)": r.buyCost,
          "Estimasi Modal Kulakan (Rp)": addQty * r.buyCost,
          "Potensi Laba dari Kulakan (Rp)": addQty * r.profitPerUnit,
        };
      });
      const wsRestock = XLSX.utils.json_to_sheet(restockRows);
      wsRestock["!cols"] = [
        { wch: 24 },
        { wch: 14 },
        { wch: 28 },
        { wch: 20 },
        { wch: 20 },
        { wch: 22 },
        { wch: 18 },
        { wch: 24 },
        { wch: 24 },
      ];
      XLSX.utils.book_append_sheet(wb, wsRestock, "3. Rekomendasi Kulakan");

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(
        wb,
        `Laporan-Untung-dan-Kulakan-BahteraBiru-${dateStr}.xlsx`
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Fungsi Export ke CSV (.csv)
  const handleExportCsv = () => {
    const headers = [
      "Peringkat",
      "Nama Produk",
      "Kategori",
      "Barcode Kemasan",
      "Harga Beli Modal (Rp)",
      "Harga Jual (Rp)",
      "Untung per Pcs (Rp)",
      "Margin (%)",
      "Unit Terjual (Pcs)",
      "Kecepatan Laku (%)",
      "Sisa Stok (Pcs)",
      "Total Omzet (Rp)",
      "Total Laba Bersih (Rp)",
      "Status Kulakan",
      "Saran Tambah Kulakan (Pcs)",
      "Estimasi Modal Kulakan (Rp)",
    ];

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = sortedByProfit.map((r, idx) =>
      [
        `#${idx + 1}`,
        r.item.name,
        r.item.category,
        r.item.barcode || "-",
        r.buyCost,
        r.sellPrice,
        r.profitPerUnit,
        `${r.marginPct}%`,
        r.soldQty,
        `${r.sellThroughPct}%`,
        r.item.stock,
        r.totalRevenue,
        r.totalProfit,
        r.restockStatusLabel,
        r.suggestedRestockQty,
        r.estimatedRestockCapital,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csvContent = "\uFEFF" + [headers.join(","), ...lines].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `Laporan-Untung-dan-Kulakan-BahteraBiru-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      className="fixed inset-0 z-[125] bg-slate-950/60 flex items-center justify-center p-3.5 sm:p-5 select-none"
    >
      {/* Dialog Kotak Proporsional Sama Rata (Tidak Memanjang Ke Samping) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px" }}
        className="bg-white rounded-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[88vh] flex flex-col overflow-hidden"
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                Laporan Untung &amp; Saran Kulakan
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Analisis produk paling cuan, cepat habis, &amp; stok kulakan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Baris Kontrol: Filter Periode + Export Excel (.xlsx) & CSV */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-slate-100 shrink-0">
          <div className="p-0.5 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center gap-1 text-[11px] font-bold">
            {[
              { id: "7days", label: "7 Hari" },
              { id: "today", label: "Hari Ini" },
              { id: "all", label: "Semua" },
            ].map((p) => {
              const active = period === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPeriod(p.id as InsightPeriod)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    active
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleExportXlsx()}
              disabled={isExporting}
              title="Download Laporan Excel (.xlsx) dengan 3 Sheet lengkap"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isExporting ? "Proses..." : "Excel (.xlsx)"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              title="Download Laporan format CSV (.csv)"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Isi Laporan Scrollable */}
        <div className="flex-1 overflow-y-auto pt-3.5 space-y-3.5 pr-0.5 custom-scrollbar">
          {/* 3 Kotak Ringkasan Persegi Sama Rata (Grid 3 Kolom Seimbang) */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Kotak 1: Paling Untung */}
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between min-h-[104px]">
              <div className="flex items-center justify-between gap-1">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[9.5px] font-extrabold truncate">
                  PALING UNTUNG
                </span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <div className="mt-2">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {topProfitChampion?.item.name || "-"}
                </p>
                <p className="text-xs font-extrabold text-emerald-600 tabular-nums mt-0.5">
                  {formatRupiah(topProfitChampion?.totalProfit || 0)}
                </p>
                <span className="block text-[10px] text-slate-400 truncate">
                  +{formatRupiah(topProfitChampion?.profitPerUnit || 0)}/pcs
                </span>
              </div>
            </div>

            {/* Kotak 2: Cepat Habis */}
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between min-h-[104px]">
              <div className="flex items-center justify-between gap-1">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/70 text-[#2563EB] text-[9.5px] font-extrabold truncate">
                  CEPAT HABIS
                </span>
                <Flame className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              </div>
              <div className="mt-2">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {topFastestChampion?.item.name || "-"}
                </p>
                <p className="text-xs font-extrabold text-[#2563EB] tabular-nums mt-0.5">
                  {topFastestChampion?.soldQty || 0} pcs terjual
                </p>
                <span className="block text-[10px] text-slate-400 truncate">
                  Laku {topFastestChampion?.sellThroughPct || 0}% stok
                </span>
              </div>
            </div>

            {/* Kotak 3: Saran Kulakan */}
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between min-h-[104px]">
              <div className="flex items-center justify-between gap-1">
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[9.5px] font-extrabold truncate">
                  SARAN KULAKAN
                </span>
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              </div>
              <div className="mt-2">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {urgentRestockList.length} Produk
                </p>
                <p className="text-xs font-extrabold text-slate-900 tabular-nums mt-0.5">
                  Modal {formatRupiah(totalRestockCapitalNeeded)}
                </p>
                <span className="block text-[10px] text-emerald-600 font-bold truncate">
                  Potensi +{formatRupiah(totalPotentialProfitFromRestock)}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Tab Navigasi Sama Rata */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/70 grid grid-cols-3 gap-1 text-[11px] font-extrabold">
            <button
              type="button"
              onClick={() => setActiveTab("most-profitable")}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                activeTab === "most-profitable"
                  ? "bg-[#2563EB] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Paling Untung</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("fastest-selling")}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                activeTab === "fastest-selling"
                  ? "bg-[#2563EB] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cepat Habis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("restock-advisor")}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                activeTab === "restock-advisor"
                  ? "bg-[#2563EB] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Kulakan ({urgentRestockList.length})
              </span>
            </button>
          </div>

          {/* Grid Kartu Produk Persegi Sama Rata (2 Kolom Seimbang) */}
          {activeTab === "most-profitable" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sortedByProfit.map((row, idx) => (
                <div
                  key={row.item.id}
                  className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 hover:border-blue-300 transition flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : idx === 1
                            ? "bg-slate-200 text-slate-800"
                            : "bg-white border border-slate-200 text-slate-600"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <img
                        src={row.item.imageUrl}
                        alt={row.item.name}
                        className="w-9 h-9 rounded-xl object-cover border border-white shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {row.item.name}
                        </p>
                        <p className="text-[10.5px] text-slate-400 truncate">
                          {row.item.category} • {row.soldQty} pcs terjual
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[10.5px] font-extrabold shrink-0">
                      +{formatRupiah(row.profitPerUnit)}/pcs
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/70 text-[10.5px]">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                      <span className="block text-slate-400">Modal/Jual</span>
                      <strong className="text-slate-800 tabular-nums">
                        {formatRupiah(row.buyCost)} / {formatRupiah(row.sellPrice)}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                      <span className="block text-slate-400">Omzet</span>
                      <strong className="text-slate-800 tabular-nums">
                        {formatRupiah(row.totalRevenue)}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                      <span className="block text-emerald-700">Laba Bersih</span>
                      <strong className="text-emerald-700 font-extrabold tabular-nums">
                        {formatRupiah(row.totalProfit)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "fastest-selling" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sortedBySpeed.map((row, idx) => (
                <div
                  key={row.item.id}
                  className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 hover:border-blue-300 transition flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? "bg-blue-100 text-[#2563EB] border border-blue-300"
                            : "bg-white border border-slate-200 text-slate-600"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <img
                        src={row.item.imageUrl}
                        alt={row.item.name}
                        className="w-9 h-9 rounded-xl object-cover border border-white shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {row.item.name}
                        </p>
                        <p className="text-[10.5px] text-slate-400 truncate">
                          Rata-rata {row.avgDailySold} pcs/hari
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/70 text-[#2563EB] text-[10.5px] font-extrabold shrink-0">
                      {row.soldQty} pcs
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-bold text-slate-600">
                        Kecepatan Laku: {row.sellThroughPct}%
                      </span>
                      <span className="font-bold text-slate-700">
                        Sisa Stok: {row.item.stock} pcs
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        style={{
                          width: `${Math.max(
                            5,
                            Math.min(100, row.sellThroughPct)
                          )}%`,
                        }}
                        className="h-full rounded-full bg-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "restock-advisor" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sortedForRestock.map((row) => {
                const addAmount =
                  row.suggestedRestockQty > 0 ? row.suggestedRestockQty : 15;
                return (
                  <div
                    key={row.item.id}
                    className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 hover:border-blue-300 transition flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={row.item.imageUrl}
                          alt={row.item.name}
                          className="w-9 h-9 rounded-xl object-cover border border-white shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 truncate">
                            {row.item.name}
                          </p>
                          <p className="text-[10.5px] text-slate-400 truncate">
                            Sisa {row.item.stock} pcs • Terjual {row.soldQty} pcs
                          </p>
                        </div>
                      </div>

                      {row.restockStatus === "urgent" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Wajib Kulakan
                        </span>
                      ) : row.restockStatus === "recommended" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-[10px] font-extrabold shrink-0">
                          <ArrowUpRight className="w-2.5 h-2.5" />
                          Perbanyak
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shrink-0">
                          Stok Aman
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                      <div className="text-[10.5px]">
                        <span className="block text-slate-400">
                          Saran Kulakan +{addAmount} pcs
                        </span>
                        <strong className="text-slate-800">
                          Modal {formatRupiah(addAmount * row.buyCost)} →{" "}
                          <span className="text-emerald-600">
                            +{formatRupiah(addAmount * row.profitPerUnit)}
                          </span>
                        </strong>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onQuickRestock && (
                          <button
                            type="button"
                            onClick={() => onQuickRestock(row.item, addAmount)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-[10.5px] font-extrabold inline-flex items-center gap-1 transition cursor-pointer"
                            title="Tambah stok produk ini sesuai saran kulakan (Wajib PIN Owner)"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+{addAmount}</span>
                          </button>
                        )}
                        {onEditProduct && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditProduct(row.item);
                            }}
                            className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10.5px] font-bold transition cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
