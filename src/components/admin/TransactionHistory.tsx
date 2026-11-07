"use client";

import React, { useMemo, useState } from "react";
import {
  History,
  Search,
  CalendarDays,
  Download,
  ChevronDown,
  ChevronRight,
  Receipt,
  Wallet,
  TrendingUp,
  Package,
  CheckCircle2,
  Banknote,
  QrCode,
  CreditCard,
  Trash2,
  X,
} from "lucide-react";
import { CompletedOrder, OrderStatusType } from "@/store/usePosStore";
import { formatRupiah, MenuItem } from "@/data/initialMenu";
import { useDebounce } from "@/hooks/useDebounce";

type PeriodFilter = "today" | "7d" | "30d" | "month" | "all" | "custom";
type HistoryTab = "transactions" | "products";
type PaymentFilter = "ALL" | CompletedOrder["paymentMethod"];

interface TransactionHistoryProps {
  orders: CompletedOrder[];
  menuItems: MenuItem[];
  onOpenDetail: (order: CompletedOrder) => void;
  onDeleteOrder?: (order: CompletedOrder) => void;
}

// ---------------------------------------------------------------------------
// Helpers tanggal
// ---------------------------------------------------------------------------

/** Ambil tanggal asli transaksi (ISO dari DB → fallback timestamp di ID `ord-<ms>`) */
export function getOrderDate(order: CompletedOrder): Date | null {
  if (order.createdAtIso) {
    const d = new Date(order.createdAtIso);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const match = /^ord-(\d{12,})/.exec(order.id);
  if (match) {
    const d = new Date(Number(match[1]));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function toDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function formatDayHeader(dayKey: string) {
  if (dayKey === "unknown") return "Tanggal tidak diketahui";
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const todayKey = toDayKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const label = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (dayKey === todayKey) return `Hari Ini • ${label}`;
  if (dayKey === toDayKey(yesterday)) return `Kemarin • ${label}`;
  return label;
}

function formatTime(d: Date | null, fallback: string) {
  if (!d) return fallback;
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABEL: Record<OrderStatusType, string> = {
  Preparing: "Pending",
  Ready: "Siap Diambil",
  Completed: "Selesai",
};

const STATUS_STYLE: Record<OrderStatusType, string> = {
  Preparing: "bg-amber-50 text-amber-600 border-amber-200",
  Ready: "bg-blue-50 text-[#2563EB] border-blue-200",
  Completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const PERIOD_OPTIONS: { id: PeriodFilter; label: string }[] = [
  { id: "today", label: "Hari Ini" },
  { id: "7d", label: "7 Hari" },
  { id: "30d", label: "30 Hari" },
  { id: "month", label: "Bulan Ini" },
  { id: "all", label: "Semua" },
  { id: "custom", label: "Custom" },
];

// ---------------------------------------------------------------------------
// Visual kecil untuk kartu metode pembayaran
// ---------------------------------------------------------------------------
interface ArtProps {
  accent: string;
  accent2: string;
}

/** Ilustrasi tumpukan uang kertas + koin */
function CashArt({ accent, accent2 }: ArtProps) {
  return (
    <svg width="66" height="46" viewBox="0 0 66 46" fill="none" aria-hidden>
      <defs>
        <linearGradient id="cash-note" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={accent2} />
        </linearGradient>
      </defs>
      <rect
        x="12"
        y="3"
        width="48"
        height="27"
        rx="5"
        fill={accent}
        opacity="0.22"
        transform="rotate(-7 36 16)"
      />
      <rect x="4" y="11" width="50" height="27" rx="5" fill="url(#cash-note)" />
      <rect
        x="7.5"
        y="14.5"
        width="43"
        height="20"
        rx="3"
        stroke="white"
        strokeOpacity="0.45"
        strokeDasharray="2 2"
      />
      <circle cx="29" cy="24.5" r="6.5" fill="white" fillOpacity="0.3" />
      <text
        x="29"
        y="27.5"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="800"
        fill="white"
      >
        Rp
      </text>
      <circle cx="12.5" cy="24.5" r="1.6" fill="white" fillOpacity="0.55" />
      <circle cx="45.5" cy="24.5" r="1.6" fill="white" fillOpacity="0.55" />
      <circle cx="55" cy="37" r="7.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5" />
      <circle cx="55" cy="37" r="4.2" stroke="#FFFBEB" strokeOpacity="0.8" />
      <circle cx="47" cy="40.5" r="5" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.2" />
    </svg>
  );
}

/** Ilustrasi mini kode QR */
function QrisArt({ accent }: ArtProps) {
  const cell = 3.4;
  const origin = 6;
  // pola modul QR (grid 9x9) yang deterministik, area finder dikosongkan
  const pattern = [
    "000000000",
    "000101000",
    "000010000",
    "010110110",
    "101011001",
    "011100101",
    "000010110",
    "000101011",
    "000011010",
  ];
  const finder = (x: number, y: number) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width="10" height="10" rx="2.2" fill={accent} />
      <rect x={x + 1.8} y={y + 1.8} width="6.4" height="6.4" rx="1.4" fill="white" />
      <rect x={x + 3.4} y={y + 3.4} width="3.2" height="3.2" rx="0.8" fill={accent} />
    </g>
  );
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden>
      <rect
        x="1"
        y="1"
        width="44"
        height="44"
        rx="9"
        fill="white"
        stroke={accent}
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />
      {finder(origin, origin)}
      {finder(origin + 6 * cell - 0.4, origin)}
      {finder(origin, origin + 6 * cell - 0.4)}
      {pattern.map((row, r) =>
        row.split("").map((c, col) =>
          c === "1" ? (
            <rect
              key={`m-${r}-${col}`}
              x={origin + col * cell}
              y={origin + r * cell}
              width={cell - 0.7}
              height={cell - 0.7}
              rx="0.7"
              fill={accent}
              opacity={0.85}
            />
          ) : null
        )
      )}
      {/* garis scan */}
      <rect x="4" y="22" width="38" height="1.6" rx="0.8" fill={accent} opacity="0.35" />
    </svg>
  );
}

/** Ilustrasi mini kartu debit dengan chip & contactless */
function DebitArt({ accent, accent2 }: ArtProps) {
  return (
    <svg width="68" height="46" viewBox="0 0 68 46" fill="none" aria-hidden>
      <defs>
        <linearGradient id="debit-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={accent2} />
        </linearGradient>
      </defs>
      <rect
        x="10"
        y="2"
        width="54"
        height="34"
        rx="6"
        fill={accent}
        opacity="0.2"
        transform="rotate(6 37 19)"
      />
      <rect x="3" y="8" width="56" height="35" rx="6" fill="url(#debit-card)" />
      <path d="M3 18 H59" stroke="white" strokeOpacity="0.12" strokeWidth="6" />
      <rect x="9" y="15" width="11" height="8.5" rx="2" fill="#FCD34D" />
      <path
        d="M9 19.2 H20 M14.5 15 V23.5"
        stroke="#D97706"
        strokeOpacity="0.55"
        strokeWidth="0.8"
      />
      <path
        d="M25 15.5 q3 3.75 0 7.5 M28.5 13.8 q4.6 5.45 0 10.9"
        stroke="white"
        strokeOpacity="0.8"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="9" y="30" width="7" height="2.4" rx="1.2" fill="white" fillOpacity="0.75" />
      <rect x="18" y="30" width="7" height="2.4" rx="1.2" fill="white" fillOpacity="0.75" />
      <rect x="27" y="30" width="7" height="2.4" rx="1.2" fill="white" fillOpacity="0.75" />
      <rect x="9" y="35.5" width="14" height="2" rx="1" fill="white" fillOpacity="0.45" />
      <circle cx="46" cy="35" r="4.6" fill="#F43F5E" fillOpacity="0.9" />
      <circle cx="51.5" cy="35" r="4.6" fill="#FBBF24" fillOpacity="0.85" />
    </svg>
  );
}

const METHOD_THEME: Record<
  CompletedOrder["paymentMethod"],
  {
    title: string;
    subtitle: string;
    accent: string;
    accent2: string;
    Art: (props: ArtProps) => React.ReactElement;
  }
> = {
  Cash: {
    title: "Tunai (Cash)",
    subtitle: "Bayar langsung di kasir",
    accent: "#10B981",
    accent2: "#047857",
    Art: CashArt,
  },
  QRIS: {
    title: "QRIS",
    subtitle: "Scan QR semua e-wallet",
    accent: "#2563EB",
    accent2: "#1E40AF",
    Art: QrisArt,
  },
  Debit: {
    title: "Kartu Debit",
    subtitle: "EDC / kartu ATM",
    accent: "#7C3AED",
    accent2: "#4338CA",
    Art: DebitArt,
  },
};

/** Ring persentase kontribusi */
function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const size = 50;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#F1F5F9"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-slate-800 tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}

/** Grafik garis mini (7 titik) */
function Sparkline({
  id,
  values,
  color,
}: {
  id: string;
  values: number[];
  color: string;
}) {
  const w = 200;
  const h = 40;
  const pad = 4;
  const max = Math.max(...values, 0);
  const hasData = max > 0;
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = pad + i * step;
    const y = hasData ? h - pad - (v / max) * (h - pad * 2) : h - pad - 2;
    return [x, y] as const;
  });
  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${h} L${points[0][0].toFixed(1)},${h} Z`;
  const [lx, ly] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-10"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={hasData ? 0.28 : 0.08} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeOpacity={hasData ? 1 : 0.35}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={hasData ? undefined : "4 4"}
        vectorEffect="non-scaling-stroke"
      />
      {hasData && (
        <circle
          cx={lx}
          cy={ly}
          r="3.2"
          fill="white"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

export function TransactionHistory({
  orders,
  menuItems,
  onOpenDetail,
  onDeleteOrder,
}: TransactionHistoryProps) {
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatusType>(
    "ALL"
  );
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [tab, setTab] = useState<HistoryTab>("transactions");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>(
    {}
  );
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyPageSize, setHistoryPageSize] = useState<number>(10);

  // Harga modal per produk (snapshot saat checkout → fallback harga modal terkini)
  const costLookup = useMemo(() => {
    const map = new Map<string, number>();
    menuItems.forEach((m) => map.set(m.id, m.costPrice ?? 0));
    return map;
  }, [menuItems]);

  const getLineCost = (line: CompletedOrder["items"][number]) => {
    const snapshot = line.product.costPrice;
    const unitCost =
      typeof snapshot === "number" && snapshot > 0
        ? snapshot
        : costLookup.get(line.product.id) ?? 0;
    return unitCost * line.quantity;
  };

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------
  // Filter dasar (periode, status, pencarian) — tanpa filter metode bayar
  const baseFilteredOrders = useMemo(() => {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    if (period === "today") {
      from = startOfDay(now);
    } else if (period === "7d") {
      from = startOfDay(new Date(now.getTime() - 6 * 86400000));
    } else if (period === "30d") {
      from = startOfDay(new Date(now.getTime() - 29 * 86400000));
    } else if (period === "month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "custom") {
      if (customFrom) from = new Date(`${customFrom}T00:00:00`);
      if (customTo) to = new Date(`${customTo}T23:59:59.999`);
    }

    const q = debouncedSearch.trim().toLowerCase();

    return orders
      .filter((o) => {
        const d = getOrderDate(o);
        if (from || to) {
          if (!d) return false;
          if (from && d < from) return false;
          if (to && d > to) return false;
        }
        const st: OrderStatusType = o.status || "Preparing";
        if (statusFilter !== "ALL" && st !== statusFilter) return false;
        if (q) {
          const haystack = [
            o.customerName,
            o.orderNumber,
            o.paymentMethod,
            ...o.items.map((i) => i.product.name),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = getOrderDate(a)?.getTime() ?? 0;
        const db = getOrderDate(b)?.getTime() ?? 0;
        return db - da;
      });
  }, [orders, period, customFrom, customTo, statusFilter, search]);

  // Filter akhir (termasuk metode pembayaran)
  const filteredOrders = useMemo(
    () =>
      paymentFilter === "ALL"
        ? baseFilteredOrders
        : baseFilteredOrders.filter((o) => o.paymentMethod === paymentFilter),
    [baseFilteredOrders, paymentFilter]
  );

  // -------------------------------------------------------------------------
  // Statistik per metode pembayaran (tidak terpengaruh filter metode)
  // -------------------------------------------------------------------------
  const methodStats = useMemo(() => {
    const methods: CompletedOrder["paymentMethod"][] = ["Cash", "QRIS", "Debit"];
    const grandTotal = baseFilteredOrders.reduce((s, o) => s + o.totalAmount, 0);

    // 7 hari terakhir, berakhir di transaksi terbaru (atau hari ini)
    const latest = baseFilteredOrders
      .map((o) => getOrderDate(o))
      .find((d): d is Date => Boolean(d));
    const end = startOfDay(latest ?? new Date());
    const dayKeys: string[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      dayKeys.push(toDayKey(new Date(end.getTime() - i * 86400000)));
    }

    return methods.map((m) => {
      const list = baseFilteredOrders.filter((o) => o.paymentMethod === m);
      const amount = list.reduce((s, o) => s + o.totalAmount, 0);
      const series = dayKeys.map((key) =>
        list.reduce((s, o) => {
          const d = getOrderDate(o);
          return d && toDayKey(d) === key ? s + o.totalAmount : s;
        }, 0)
      );
      const lastOrder = list.find((o) => getOrderDate(o));
      return {
        method: m,
        amount,
        count: list.length,
        pct: grandTotal ? Math.round((amount / grandTotal) * 100) : 0,
        avg: list.length ? Math.round(amount / list.length) : 0,
        series,
        lastAt: lastOrder ? getOrderDate(lastOrder) : null,
      };
    });
  }, [baseFilteredOrders]);

  // -------------------------------------------------------------------------
  // Ringkasan (KPI)
  // -------------------------------------------------------------------------
  const summary = useMemo(() => {
    let omzet = 0;
    let pcs = 0;
    let modal = 0;
    let penjualanBersih = 0; // tanpa pajak
    let completed = 0;
    const byMethod: Record<CompletedOrder["paymentMethod"], number> = {
      Cash: 0,
      QRIS: 0,
      Debit: 0,
    };

    filteredOrders.forEach((o) => {
      omzet += o.totalAmount;
      pcs += o.itemCount;
      byMethod[o.paymentMethod] =
        (byMethod[o.paymentMethod] || 0) + o.totalAmount;
      if ((o.status || "Preparing") === "Completed") completed += 1;
      o.items.forEach((line) => {
        penjualanBersih += line.lineTotal;
        modal += getLineCost(line);
      });
    });

    return {
      omzet,
      pcs,
      modal,
      laba: penjualanBersih - modal,
      completed,
      count: filteredOrders.length,
      avg: filteredOrders.length ? Math.round(omzet / filteredOrders.length) : 0,
      byMethod,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredOrders, costLookup]);

  // Kelompokkan transaksi per hari
  const groupedByDay = useMemo(() => {
    const groups: { dayKey: string; orders: CompletedOrder[]; total: number }[] =
      [];
    const index = new Map<string, number>();
    filteredOrders.forEach((o) => {
      const d = getOrderDate(o);
      const key = d ? toDayKey(d) : "unknown";
      if (!index.has(key)) {
        index.set(key, groups.length);
        groups.push({ dayKey: key, orders: [], total: 0 });
      }
      const g = groups[index.get(key)!];
      g.orders.push(o);
      g.total += o.totalAmount;
    });
    return groups;
  }, [filteredOrders]);

  const totalHistoryPages = Math.max(
    1,
    Math.ceil(groupedByDay.length / historyPageSize)
  );
  const safeHistoryPage = Math.min(Math.max(1, historyPage), totalHistoryPages);
  const paginatedGroups = groupedByDay.slice(
    (safeHistoryPage - 1) * historyPageSize,
    safeHistoryPage * historyPageSize
  );

  // Rekap per produk
  const productRecap = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        imageUrl: string;
        qty: number;
        omzet: number;
        modal: number;
        trx: number;
      }
    >();
    filteredOrders.forEach((o) => {
      o.items.forEach((line) => {
        const key = line.product.id;
        const prev = map.get(key) ?? {
          id: key,
          name: line.product.name,
          category: line.product.category,
          imageUrl: line.product.imageUrl,
          qty: 0,
          omzet: 0,
          modal: 0,
          trx: 0,
        };
        prev.qty += line.quantity;
        prev.omzet += line.lineTotal;
        prev.modal += getLineCost(line);
        prev.trx += 1;
        map.set(key, prev);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredOrders, costLookup]);

  // -------------------------------------------------------------------------
  // Export CSV
  // -------------------------------------------------------------------------
  const handleExportCsv = () => {
    const esc = (v: string | number) => {
      const s = String(v ?? "");
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows: (string | number)[][] = [];

    if (tab === "transactions") {
      rows.push([
        "Tanggal",
        "Jam",
        "No. Pesanan",
        "Pembeli",
        "Produk",
        "Qty",
        "Harga Satuan",
        "Subtotal Baris",
        "Modal Baris",
        "Laba Baris",
        "Pajak Pesanan",
        "Total Pesanan",
        "Metode",
        "Status",
      ]);
      filteredOrders.forEach((o) => {
        const d = getOrderDate(o);
        const tgl = d ? d.toLocaleDateString("id-ID") : o.createdAt;
        const jam = formatTime(d, "-");
        const st = STATUS_LABEL[o.status || "Preparing"];
        o.items.forEach((line, idx) => {
          const cost = getLineCost(line);
          rows.push([
            tgl,
            jam,
            o.orderNumber,
            o.customerName,
            line.product.name,
            line.quantity,
            line.unitPrice,
            line.lineTotal,
            cost,
            line.lineTotal - cost,
            idx === 0 ? o.taxTotal : "",
            idx === 0 ? o.totalAmount : "",
            o.paymentMethod,
            st,
          ]);
        });
      });
    } else {
      rows.push([
        "Produk",
        "Kategori",
        "Qty Terjual",
        "Jumlah Transaksi",
        "Omzet",
        "Total Modal",
        "Laba Bersih",
      ]);
      productRecap.forEach((p) => {
        rows.push([
          p.name,
          p.category,
          p.qty,
          p.trx,
          p.omzet,
          p.modal,
          p.omzet - p.modal,
        ]);
      });
    }

    const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riwayat-${tab === "transactions" ? "transaksi" : "produk"}-${toDayKey(
      new Date()
    )}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilter =
    period !== "all" ||
    statusFilter !== "ALL" ||
    paymentFilter !== "ALL" ||
    search.trim() !== "";

  const resetFilters = () => {
    setPeriod("all");
    setCustomFrom("");
    setCustomTo("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setSearch("");
  };

  const methodIcon = (m: CompletedOrder["paymentMethod"]) =>
    m === "Cash" ? Banknote : m === "QRIS" ? QrCode : CreditCard;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-20 lg:pb-8 custom-scrollbar space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              History Transaksi
            </h2>
            <p className="text-[11px] text-slate-400">
              Riwayat lengkap penjualan, rincian item, modal & laba per
              transaksi
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                period === p.id
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "bg-[#F8FAFC] text-slate-600 border-slate-200/80 hover:border-[#2563EB] hover:text-[#2563EB]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period === "custom" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <CalendarDays className="w-4 h-4 text-[#2563EB]" />
            Rentang Tanggal
          </div>
          <label className="flex flex-col gap-1 text-[10.5px] font-semibold text-slate-400">
            Dari
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB]"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10.5px] font-semibold text-slate-400">
            Sampai
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB]"
            />
          </label>
        </div>
      )}

      {/* KPI Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Total Omzet",
            value: formatRupiah(summary.omzet),
            sub: `Rata-rata ${formatRupiah(summary.avg)} / trx`,
            icon: Wallet,
            accent: "text-[#2563EB]",
          },
          {
            label: "Jumlah Transaksi",
            value: String(summary.count),
            sub: `${summary.completed} selesai • ${
              summary.count - summary.completed
            } proses`,
            icon: Receipt,
            accent: "text-slate-900",
          },
          {
            label: "Item Terjual",
            value: `${summary.pcs} pcs`,
            sub: `${productRecap.length} jenis produk`,
            icon: Package,
            accent: "text-slate-900",
          },
          {
            label: "Estimasi Laba Bersih",
            value: `${summary.laba >= 0 ? "+" : "-"}${formatRupiah(
              Math.abs(summary.laba)
            )}`,
            sub: `Modal ${formatRupiah(summary.modal)}`,
            icon: TrendingUp,
            accent: summary.laba >= 0 ? "text-emerald-600" : "text-rose-600",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex items-start justify-between gap-2"
            >
              <div className="min-w-0">
                <span className="block text-[11px] sm:text-xs font-medium text-slate-400 mb-1">
                  {kpi.label}
                </span>
                <span
                  className={`block text-base sm:text-xl font-extrabold tabular-nums tracking-tight truncate ${kpi.accent}`}
                >
                  {kpi.value}
                </span>
                <span className="block text-[10.5px] text-slate-400 mt-1 truncate">
                  {kpi.sub}
                </span>
              </div>
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#F8FAFC] border border-slate-200/80 text-slate-500 items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Rincian metode pembayaran (kartu visual) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {methodStats.map((stat) => {
          const theme = METHOD_THEME[stat.method];
          const Icon = methodIcon(stat.method);
          const Art = theme.Art;
          const active = paymentFilter === stat.method;
          return (
            <button
              key={stat.method}
              type="button"
              onClick={() => setPaymentFilter(active ? "ALL" : stat.method)}
              title={
                active
                  ? "Klik lagi untuk menampilkan semua metode"
                  : `Tampilkan hanya transaksi ${stat.method}`
              }
              style={
                active
                  ? {
                      borderColor: theme.accent,
                      boxShadow: `0 0 0 3px ${theme.accent}22, 0 10px 24px -12px ${theme.accent}66`,
                    }
                  : undefined
              }
              className="group relative overflow-hidden text-left bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:shadow-[0_10px_28px_-14px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              {/* Dekorasi blob lembut */}
              <div
                aria-hidden
                style={{
                  background: `radial-gradient(circle, ${theme.accent}26 0%, transparent 70%)`,
                }}
                className="absolute -top-14 -right-14 w-44 h-44 rounded-full pointer-events-none transition-transform duration-500 group-hover:scale-110"
              />

              {/* Header: ikon + nama + ilustrasi */}
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                      boxShadow: `0 6px 14px -4px ${theme.accent}80`,
                    }}
                    className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0"
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">
                      {theme.title}
                    </p>
                    {active ? (
                      <span
                        style={{ color: theme.accent }}
                        className="flex items-center gap-1 text-[10.5px] font-bold"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Filter aktif
                      </span>
                    ) : (
                      <p className="text-[10.5px] text-slate-400 truncate">
                        {theme.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                  <Art accent={theme.accent} accent2={theme.accent2} />
                </div>
              </div>

              {/* Nominal + ring persentase */}
              <div className="relative mt-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-[10.5px] font-medium text-slate-400">
                    Total diterima
                  </span>
                  <span className="block text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums tracking-tight truncate">
                    {formatRupiah(stat.amount)}
                  </span>
                  <span className="block text-[10.5px] text-slate-500 mt-0.5 truncate">
                    <b className="text-slate-700">{stat.count}</b> transaksi
                    {stat.count > 0 && (
                      <> • rata-rata {formatRupiah(stat.avg)}</>
                    )}
                  </span>
                </div>
                <ProgressRing pct={stat.pct} color={theme.accent} />
              </div>

              {/* Sparkline 7 hari */}
              <div className="relative mt-3">
                <Sparkline
                  id={`spark-${stat.method}`}
                  values={stat.series}
                  color={theme.accent}
                />
                <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-slate-400">
                  <span>Tren 7 hari terakhir</span>
                  <span className="tabular-nums">
                    {stat.lastAt
                      ? `Terakhir ${stat.lastAt.toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Belum ada transaksi"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Container utama */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
          <div className="flex items-center gap-1 bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-1 w-fit">
            {(
              [
                { id: "transactions", label: "Per Transaksi" },
                { id: "products", label: "Rekap per Produk" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  tab === t.id
                    ? "bg-white text-[#2563EB] shadow-xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[180px] sm:w-60 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari pembeli / no. pesanan / produk..."
                className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200/80 pl-8 pr-3 py-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | OrderStatusType)
              }
              className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Preparing">Pending</option>
              <option value="Ready">Siap Diambil</option>
              <option value="Completed">Selesai</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="ALL">Semua Metode</option>
              <option value="Cash">Cash</option>
              <option value="QRIS">QRIS</option>
              <option value="Debit">Debit</option>
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Reset
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredOrders.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[11px] font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Konten */}
        {filteredOrders.length === 0 ? (
          <div className="py-16 px-6 flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-11 h-11 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-center text-slate-400">
              <History className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">
              Belum ada riwayat transaksi
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm">
              {hasActiveFilter
                ? "Tidak ada transaksi yang cocok dengan filter. Coba ubah periode atau reset filter."
                : "Transaksi dari halaman pembeli akan tercatat otomatis di sini."}
            </p>
          </div>
        ) : tab === "transactions" ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200/70 text-[11px] font-bold text-slate-500">
                  <th className="py-3 px-5 w-8" />
                  <th className="py-3 px-3">Jam</th>
                  <th className="py-3 px-3">No. Pesanan</th>
                  <th className="py-3 px-3">Pembeli</th>
                  <th className="py-3 px-3">Item</th>
                  <th className="py-3 px-3">Metode</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right">Laba</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              {paginatedGroups.map((group) => {
                const isCollapsed = collapsedDays[group.dayKey];
                return (
                  <tbody key={group.dayKey} className="text-xs">
                    {/* Header per hari */}
                    <tr
                      onClick={() =>
                        setCollapsedDays((prev) => ({
                          ...prev,
                          [group.dayKey]: !prev[group.dayKey],
                        }))
                      }
                      className="bg-blue-50/40 border-y border-slate-200/70 cursor-pointer hover:bg-blue-50/70 transition"
                    >
                      <td colSpan={9} className="py-2.5 px-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 font-extrabold text-slate-800 text-[11.5px]">
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 text-[#2563EB]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#2563EB]" />
                            )}
                            <CalendarDays className="w-3.5 h-3.5 text-[#2563EB]" />
                            {formatDayHeader(group.dayKey)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                            {group.orders.length} transaksi •{" "}
                            <span className="font-extrabold text-[#2563EB]">
                              {formatRupiah(group.total)}
                            </span>
                          </span>
                        </div>
                      </td>
                    </tr>

                    {!isCollapsed &&
                      group.orders.map((order) => {
                        const d = getOrderDate(order);
                        const st: OrderStatusType = order.status || "Preparing";
                        const isExpanded = expandedOrderId === order.id;
                        const orderModal = order.items.reduce(
                          (s, l) => s + getLineCost(l),
                          0
                        );
                        const orderNet = order.items.reduce(
                          (s, l) => s + l.lineTotal,
                          0
                        );
                        const orderLaba = orderNet - orderModal;
                        const MethodIcon = methodIcon(order.paymentMethod);

                        return (
                          <React.Fragment key={order.id}>
                            <tr
                              onClick={() =>
                                setExpandedOrderId(isExpanded ? null : order.id)
                              }
                              className={`border-b border-slate-100 cursor-pointer transition-colors ${
                                isExpanded ? "bg-blue-50/30" : "hover:bg-slate-50/80"
                              }`}
                            >
                              <td className="py-3 px-5 text-slate-400">
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-[#2563EB]" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                                {formatTime(d, order.createdAt)}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900 tabular-nums">
                                {order.orderNumber}
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-800 max-w-[160px] truncate">
                                {order.customerName}
                              </td>
                              <td className="py-3 px-3 text-slate-500">
                                {order.items.length} produk • {order.itemCount} pcs
                              </td>
                              <td className="py-3 px-3">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                                  <MethodIcon className="w-3.5 h-3.5 text-slate-400" />
                                  {order.paymentMethod}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                                {formatRupiah(order.totalAmount)}
                              </td>
                              <td
                                className={`py-3 px-3 text-right font-bold tabular-nums whitespace-nowrap ${
                                  orderLaba >= 0 ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {orderLaba >= 0 ? "+" : "-"}
                                {formatRupiah(Math.abs(orderLaba))}
                              </td>
                              <td className="py-3 px-5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10.5px] font-bold ${STATUS_STYLE[st]}`}
                                >
                                  {st === "Completed" && (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  {STATUS_LABEL[st]}
                                </span>
                              </td>
                            </tr>

                            {/* Rincian item (expand) */}
                            {isExpanded && (
                              <tr className="bg-[#FBFCFE] border-b border-slate-200/70">
                                <td colSpan={9} className="px-5 sm:px-12 py-4">
                                  <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
                                    <table className="w-full text-[11.5px]">
                                      <thead>
                                        <tr className="bg-[#F8FAFC] text-[10.5px] font-bold text-slate-400 border-b border-slate-100">
                                          <th className="py-2 px-3 text-left">Produk</th>
                                          <th className="py-2 px-3 text-right">Qty</th>
                                          <th className="py-2 px-3 text-right">Harga Jual</th>
                                          <th className="py-2 px-3 text-right">Modal</th>
                                          <th className="py-2 px-3 text-right">Subtotal</th>
                                          <th className="py-2 px-3 text-right">Laba</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {order.items.map((line, idx) => {
                                          const cost = getLineCost(line);
                                          const lineLaba = line.lineTotal - cost;
                                          return (
                                            <tr key={`${line.product.id}-${idx}`}>
                                              <td className="py-2 px-3">
                                                <div className="flex items-center gap-2.5">
                                                  {line.product.imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                      src={line.product.imageUrl}
                                                      alt={line.product.name}
                                                      className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0"
                                                    />
                                                  ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
                                                  )}
                                                  <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 truncate">
                                                      {line.product.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                      {line.product.category}
                                                    </p>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="py-2 px-3 text-right font-semibold tabular-nums">
                                                {line.quantity}
                                              </td>
                                              <td className="py-2 px-3 text-right tabular-nums text-slate-600">
                                                {formatRupiah(line.unitPrice)}
                                              </td>
                                              <td className="py-2 px-3 text-right tabular-nums text-slate-400">
                                                {formatRupiah(cost)}
                                              </td>
                                              <td className="py-2 px-3 text-right tabular-nums font-bold text-slate-900">
                                                {formatRupiah(line.lineTotal)}
                                              </td>
                                              <td
                                                className={`py-2 px-3 text-right tabular-nums font-bold ${
                                                  lineLaba >= 0
                                                    ? "text-emerald-600"
                                                    : "text-rose-600"
                                                }`}
                                              >
                                                {lineLaba >= 0 ? "+" : "-"}
                                                {formatRupiah(Math.abs(lineLaba))}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>

                                    <div className="border-t border-slate-100 bg-[#F8FAFC] px-3 py-2.5 flex flex-wrap items-center justify-between gap-3">
                                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-500 tabular-nums">
                                        <span>
                                          Subtotal{" "}
                                          <b className="text-slate-800">
                                            {formatRupiah(order.subtotal)}
                                          </b>
                                        </span>
                                        {order.discountTotal > 0 && (
                                          <span>
                                            Diskon{" "}
                                            <b className="text-rose-600">
                                              -{formatRupiah(order.discountTotal)}
                                            </b>
                                          </span>
                                        )}
                                        <span>
                                          Pajak{" "}
                                          <b className="text-slate-800">
                                            {formatRupiah(order.taxTotal)}
                                          </b>
                                        </span>
                                        <span>
                                          Total{" "}
                                          <b className="text-[#2563EB]">
                                            {formatRupiah(order.totalAmount)}
                                          </b>
                                        </span>
                                        {d && (
                                          <span>
                                            Waktu{" "}
                                            <b className="text-slate-800">
                                              {d.toLocaleString("id-ID", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </b>
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenDetail(order);
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 hover:border-[#2563EB] hover:text-[#2563EB] text-[11px] font-bold text-slate-600 transition cursor-pointer"
                                        >
                                          <Receipt className="w-3.5 h-3.5" /> Lihat Struk
                                        </button>
                                        {onDeleteOrder && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteOrder(order);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200/80 hover:bg-rose-50 text-[11px] font-bold text-rose-600 transition cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" /> Hapus (PIN)
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                );
              })}
            </table>

            {/* Pagination Hari Transaksi */}
            {groupedByDay.length > historyPageSize && (
              <div className="p-3.5 sm:p-4 bg-[#F8FAFC] border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>
                    Menampilkan grup hari{" "}
                    <b className="text-slate-800">
                      {(safeHistoryPage - 1) * historyPageSize + 1}
                    </b>{" "}
                    –{" "}
                    <b className="text-slate-800">
                      {Math.min(
                        safeHistoryPage * historyPageSize,
                        groupedByDay.length
                      )}
                    </b>{" "}
                    dari{" "}
                    <b className="text-slate-800">{groupedByDay.length}</b>{" "}
                    hari
                  </span>

                  <div className="flex items-center gap-1.5 ml-3">
                    <span className="text-[11px] text-slate-400">Tampilkan:</span>
                    <select
                      value={historyPageSize}
                      onChange={(e) => {
                        setHistoryPageSize(Number(e.target.value));
                        setHistoryPage(1);
                      }}
                      className="bg-white border border-slate-200/80 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-[#2563EB]"
                    >
                      <option value={5}>5 hari</option>
                      <option value={10}>10 hari</option>
                      <option value={20}>20 hari</option>
                      <option value={50}>50 hari</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safeHistoryPage <= 1}
                    onClick={() =>
                      setHistoryPage((p) => Math.max(1, p - 1))
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    ← Sebelumnya
                  </button>

                  <span className="px-2.5 py-1 text-xs font-bold text-slate-700 tabular-nums">
                    Hal {safeHistoryPage} / {totalHistoryPages}
                  </span>

                  <button
                    type="button"
                    disabled={safeHistoryPage >= totalHistoryPages}
                    onClick={() =>
                      setHistoryPage((p) =>
                        Math.min(totalHistoryPages, p + 1)
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200/70 text-[11px] font-bold text-slate-500">
                  <th className="py-3 px-5">#</th>
                  <th className="py-3 px-3">Produk</th>
                  <th className="py-3 px-3 text-right">Qty Terjual</th>
                  <th className="py-3 px-3 text-right">Transaksi</th>
                  <th className="py-3 px-3 text-right">Omzet</th>
                  <th className="py-3 px-3 text-right">Total Modal</th>
                  <th className="py-3 px-5 text-right">Laba Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {productRecap.map((p, idx) => {
                  const laba = p.omzet - p.modal;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5 font-bold text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {p.name}
                            </p>
                            <p className="text-[10.5px] text-slate-400">
                              {p.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                        {p.qty} pcs
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500 tabular-nums">
                        {p.trx}x
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800 tabular-nums">
                        {formatRupiah(p.omzet)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 tabular-nums">
                        {formatRupiah(p.modal)}
                      </td>
                      <td
                        className={`py-3 px-5 text-right font-extrabold tabular-nums ${
                          laba >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {laba >= 0 ? "+" : "-"}
                        {formatRupiah(Math.abs(laba))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFC] border-t border-slate-200/70 text-xs font-extrabold">
                  <td className="py-3 px-5" colSpan={2}>
                    Total
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    {summary.pcs} pcs
                  </td>
                  <td className="py-3 px-3" />
                  <td className="py-3 px-3 text-right tabular-nums">
                    {formatRupiah(summary.omzet - filteredOrders.reduce((s, o) => s + o.taxTotal, 0))}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-slate-500">
                    {formatRupiah(summary.modal)}
                  </td>
                  <td
                    className={`py-3 px-5 text-right tabular-nums ${
                      summary.laba >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {summary.laba >= 0 ? "+" : "-"}
                    {formatRupiah(Math.abs(summary.laba))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
