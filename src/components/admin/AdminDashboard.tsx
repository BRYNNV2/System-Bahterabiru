"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  FolderKanban,
  Package,
  Search,
  Plus,
  Minus,
  Pencil,
  Trash2,
  Lock,
  User,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  X,
  ExternalLink,
  TrendingUp,
  Bell,
  PanelLeft,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  SlidersHorizontal,
  MoreVertical,
  HelpCircle,
  Settings,
  Receipt,
  BarChart2,
  UtensilsCrossed,
  Clock,
} from "lucide-react";
import { usePosStore, OrderStatusType } from "@/store/usePosStore";
import {
  formatRupiah,
  getEffectivePrice,
  MenuItem,
  SidebarGroupType,
} from "@/data/initialMenu";

const PRESET_FOOD_IMAGES = [
  {
    label: "Steak Sapi",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Ayam Panggang",
    url: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Mie Ramen",
    url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Nasi Goreng",
    url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Kopi Latte",
    url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80",
  },
  {
    label: "Croissant",
    url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
  },
];

type AdminPageTab = "dashboard" | "transactions" | "crud";
type RevenueTimeframe = "daily" | "weekly" | "monthly";

// Helper component for the signature FinPay striped progress bar
function StripedProgressBar({ percentage }: { percentage: number }) {
  const clamped = Math.max(5, Math.min(100, percentage));
  return (
    <div className="w-full h-2.5 flex items-center gap-1 overflow-hidden">
      <div
        style={{ width: `${clamped}%` }}
        className="h-full bg-[#2563EB] rounded-full transition-all duration-500 shrink-0"
      />
      <div
        className="flex-1 h-full rounded-r-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #93C5FD 0px, #93C5FD 2px, transparent 2px, transparent 5px)",
        }}
      />
    </div>
  );
}

export function AdminDashboard() {
  const {
    menuItems,
    recentOrders,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin,
    updateProductStock,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateOrderStatus,
    deleteOrder,
    syncFromServer,
  } = usePosStore();

  // Login State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Sidebar & Page Navigation State
  const [isMounted, setIsMounted] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<AdminPageTab>("dashboard");

  useEffect(() => {
    setIsMounted(true);
    void syncFromServer();

    const interval = setInterval(() => {
      void syncFromServer();
    }, 3000);

    const handleFocus = () => {
      void syncFromServer();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [syncFromServer]);

  // Timeframe & Chart State
  const [revenueTimeframe, setRevenueTimeframe] =
    useState<RevenueTimeframe>("monthly");
  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(5); // Jun default
  const [statsSubTab, setStatsSubTab] = useState<"income" | "sold">("income");

  // Search & Filter State
  const [globalSearch, setGlobalSearch] = useState("");
  const [crudCategoryFilter, setCrudCategoryFilter] = useState<string>("All");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // CRUD Modal State
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] =
    useState<MenuItem["category"]>("Rice bowl");
  const [formGroup, setFormGroup] = useState<SidebarGroupType>("Food");
  const [formPrice, setFormPrice] = useState<number>(25000);
  const [formStock, setFormStock] = useState<number>(20);
  const [formDesc, setFormDesc] = useState("");
  const [formImage, setFormImage] = useState(PRESET_FOOD_IMAGES[0].url);
  const [formFeatured, setFormFeatured] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginAdmin(username, password);
    if (!ok) {
      setLoginError(
        "Username atau password salah. Gunakan admin / admin123 untuk masuk."
      );
    } else {
      setLoginError("");
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormCategory("Rice bowl");
    setFormGroup("Food");
    setFormPrice(25000);
    setFormStock(20);
    setFormDesc(
      "Hidangan spesial racikan dapur utama menggunakan bahan segar berkualitas tinggi."
    );
    setFormImage(PRESET_FOOD_IMAGES[0].url);
    setFormFeatured(true);
    setIsCrudModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormGroup(item.group);
    setFormPrice(getEffectivePrice(item));
    setFormStock(item.stock);
    setFormDesc(item.description);
    setFormImage(item.imageUrl);
    setFormFeatured(Boolean(item.featured));
    setIsCrudModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      updateMenuItem(editingItem.id, {
        name: formName.trim(),
        category: formCategory,
        group: formGroup,
        price: Number(formPrice) || 15000,
        discountedPrice: undefined,
        discountPercent: undefined,
        stock: Math.max(0, Number(formStock) || 0),
        description: formDesc.trim(),
        imageUrl: formImage.trim() || PRESET_FOOD_IMAGES[0].url,
        featured: formFeatured,
      });
      showToast(`Menu "${formName}" berhasil diperbarui.`);
    } else {
      addMenuItem({
        name: formName.trim(),
        category: formCategory,
        group: formGroup,
        price: Number(formPrice) || 15000,
        stock: Math.max(0, Number(formStock) || 0),
        description:
          formDesc.trim() ||
          "Hidangan spesial racikan dapur utama menggunakan bahan segar berkualitas.",
        imageUrl: formImage.trim() || PRESET_FOOD_IMAGES[0].url,
        featured: formFeatured,
        servingOptions: ["Porsi Reguler", "Pedas Normal", "Extra Bumbu"],
      });
      showToast(`Menu baru "${formName}" berhasil ditambahkan.`);
    }
    setIsCrudModalOpen(false);
  };

  // ============================================================================
  // 1. ADMIN LOGIN GATE (FinPay Royal Blue & White Style)
  // ============================================================================
  if (!isMounted) {
    return <div className="h-[100dvh] w-screen bg-[#F7F8FA]" />;
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen w-screen bg-[#F7F8FA] flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-[0_12px_40px_rgba(15,23,42,0.06)] border border-slate-200/80">
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.3)] mb-4">
              <div className="w-5 h-5 rounded-full border-[3px] border-white" />
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-[10px] font-bold uppercase tracking-widest mb-2">
              CocaPay POS • Admin Portal
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, Admin
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Masuk untuk mengakses dashboard statistik dan manajemen CRUD menu
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 pl-11 pr-4 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 pl-11 pr-11 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Demo: <strong className="text-slate-700">admin</strong> /{" "}
                <strong className="text-slate-700">admin123</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setUsername("admin");
                  setPassword("admin123");
                  setLoginError("");
                }}
                className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                Isi Otomatis
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer active:scale-[0.99] mt-2 shadow-[0_8px_20px_rgba(37,99,235,0.25)]"
            >
              Sign In to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. DATA & ANALYTICS CALCULATIONS
  // ============================================================================
  const liveOrdersRevenue = recentOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalSoldUnits = menuItems.reduce((s, m) => s + m.soldCount, 0);

  const totalIncome = 10450000 + liveOrdersRevenue;
  const totalExpenses = 4200000;
  const totalNetProfit = totalIncome - totalExpenses;

  // Bidirectional Bar Chart Datasets (Per Hari, Minggu, Bulan)
  const REVENUE_DATASETS: Record<
    RevenueTimeframe,
    {
      label: string;
      balance: number;
      bars: {
        label: string;
        income: number;
        expense: number;
        inPct: number;
        exPct: number;
      }[];
    }
  > = {
    daily: {
      label: "Per Hari (7 Hari)",
      balance: 8450000 + liveOrdersRevenue,
      bars: [
        { label: "Sen", income: 1450000, expense: 520000, inPct: 68, exPct: 45 },
        { label: "Sel", income: 1220000, expense: 610000, inPct: 55, exPct: 58 },
        { label: "Rab", income: 1380000, expense: 490000, inPct: 64, exPct: 48 },
        { label: "Kam", income: 1690000, expense: 440000, inPct: 82, exPct: 38 },
        {
          label: "Jum",
          income: 1920000 + liveOrdersRevenue,
          expense: 580000,
          inPct: 92,
          exPct: 50,
        },
        { label: "Sab", income: 1540000, expense: 510000, inPct: 75, exPct: 44 },
        { label: "Min", income: 1250000, expense: 450000, inPct: 58, exPct: 40 },
      ],
    },
    weekly: {
      label: "Per Minggu (8 Mgg)",
      balance: 19800000 + liveOrdersRevenue,
      bars: [
        { label: "Mgg 1", income: 3800000, expense: 1400000, inPct: 62, exPct: 46 },
        { label: "Mgg 2", income: 3400000, expense: 1650000, inPct: 54, exPct: 58 },
        { label: "Mgg 3", income: 4100000, expense: 1500000, inPct: 68, exPct: 50 },
        { label: "Mgg 4", income: 4750000, expense: 1320000, inPct: 80, exPct: 42 },
        { label: "Mgg 5", income: 3950000, expense: 1280000, inPct: 65, exPct: 40 },
        { label: "Mgg 6", income: 4500000, expense: 1420000, inPct: 76, exPct: 45 },
        { label: "Mgg 7", income: 4900000, expense: 1600000, inPct: 84, exPct: 52 },
        {
          label: "Mgg 8",
          income: 5400000 + liveOrdersRevenue,
          expense: 1480000,
          inPct: 94,
          exPct: 48,
        },
      ],
    },
    monthly: {
      label: "Bulanan (Tahun Ini)",
      balance: 34970000 + liveOrdersRevenue,
      bars: [
        { label: "Jan", income: 6200000, expense: 3100000, inPct: 72, exPct: 55 },
        { label: "Feb", income: 4400000, expense: 3800000, inPct: 48, exPct: 72 },
        { label: "Mar", income: 5300000, expense: 3400000, inPct: 62, exPct: 60 },
        { label: "Apr", income: 7100000, expense: 2900000, inPct: 84, exPct: 46 },
        { label: "May", income: 4800000, expense: 2500000, inPct: 54, exPct: 38 },
        {
          label: "Jun",
          income: 7000000 + liveOrdersRevenue,
          expense: 4000000,
          inPct: 82,
          exPct: 48,
        },
        { label: "Jul", income: 4600000, expense: 3500000, inPct: 50, exPct: 62 },
        { label: "Aug", income: 5500000, expense: 3100000, inPct: 64, exPct: 52 },
        { label: "Sep", income: 7200000, expense: 3000000, inPct: 86, exPct: 50 },
        { label: "Oct", income: 5100000, expense: 2900000, inPct: 58, exPct: 48 },
        { label: "Nov", income: 4200000, expense: 3700000, inPct: 45, exPct: 68 },
        { label: "Dec", income: 5000000, expense: 2800000, inPct: 56, exPct: 44 },
      ],
    },
  };

  const currentDataset = REVENUE_DATASETS[revenueTimeframe];
  const safeBarIdx =
    selectedBarIndex < currentDataset.bars.length ? selectedBarIndex : 0;
  const activePoint = currentDataset.bars[safeBarIdx];

  // Category Statistics for Donut Chart
  const categoryMap = new Map<
    string,
    { category: string; sold: number; revenue: number }
  >();
  menuItems.forEach((item) => {
    const prev = categoryMap.get(item.category) || {
      category: item.category,
      sold: 0,
      revenue: 0,
    };
    prev.sold += item.soldCount;
    prev.revenue += item.soldCount * getEffectivePrice(item);
    categoryMap.set(item.category, prev);
  });

  const sortedCategories = Array.from(categoryMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const totalCategoryRevenue = Math.max(
    1,
    sortedCategories.reduce((s, c) => s + c.revenue, 0)
  );

  const DONUT_COLORS = [
    "#1D4ED8", // Deep Royal Blue
    "#93C5FD", // Soft Sky Blue
    "#C4B5FD", // Soft Lavender
    "#BAE6FD", // Ice Blue
    "#3B82F6", // Bright Blue
  ];

  // Top 3 Popular Items for Left Column "Popular Items" Progress Cards
  const topPopularItems = [...menuItems]
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 3);

  // Filtered Lists for Search & CRUD
  const crudFilteredItems = menuItems.filter((item) => {
    if (
      crudCategoryFilter !== "All" &&
      item.category !== crudCategoryFilter &&
      item.group !== crudCategoryFilter
    ) {
      return false;
    }
    const q = globalSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q)
    );
  });

  const filteredOrders = recentOrders.filter((ord) => {
    const q = globalSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      ord.customerName.toLowerCase().includes(q) ||
      ord.orderNumber.toLowerCase().includes(q)
    );
  });

  // Calculate SVG Donut stroke-dasharray segments
  let cumulativePercent = 0;
  const donutSegments = sortedCategories.map((cat, idx) => {
    const pct = Math.round((cat.revenue / totalCategoryRevenue) * 100);
    const strokeDasharray = `${pct} ${100 - pct}`;
    const strokeDashoffset = 100 - cumulativePercent;
    cumulativePercent += pct;
    return {
      ...cat,
      pct,
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-[#F7F8FA] flex font-sans select-none text-slate-900">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-16 lg:bottom-5 right-4 sm:right-5 z-[120] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-[#3B82F6]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Mobile Backdrop Overlay (< lg) */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] z-40 lg:hidden"
        />
      )}

      {/* =====================================================================
          1. LEFT SIDEBAR (Exact FinPay Sidebar Layout — Drawer on < lg, Docked on lg+)
         ===================================================================== */}
      <aside
        className={`${
          isMobileSidebarOpen
            ? "fixed inset-y-0 left-0 z-50 flex w-[256px] shadow-2xl"
            : isAdminSidebarOpen
            ? "hidden lg:flex lg:w-[235px] xl:w-[242px]"
            : "hidden"
        } bg-white border-r border-slate-200/80 px-4 py-5 flex-col justify-between shrink-0 h-full overflow-y-auto custom-scrollbar z-20`}
      >
        <div>
          {/* Brand Logo + Collapse Button */}
          <div className="flex items-center justify-between px-2 mb-7">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
                <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-white" />
              </div>
              <span className="text-[18px] font-extrabold text-slate-900 tracking-tight">
                CocaPay
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMobileSidebarOpen(false);
                if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                  setIsAdminSidebarOpen(false);
                }
              }}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              title="Tutup Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>

          {/* MAIN MENU */}
          <div className="mb-6">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              MAIN MENU
            </span>
            <nav className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: Home },
                { id: "transactions", label: "Transaction", icon: Receipt },
                {
                  id: "crud",
                  label: "Menu CRUD & Stok",
                  icon: UtensilsCrossed,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id as AdminPageTab);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition cursor-pointer ${
                      isActive
                        ? "bg-[#F1F5F9] text-[#2563EB] font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-[#2563EB]" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* OTHER */}
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              OTHER
            </span>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActivePage("crud");
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium transition cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings & Katalog</span>
              </button>

              <Link
                href="/"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium transition"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Halaman Pembeli (POS)</span>
              </Link>

              <button
                type="button"
                onClick={logoutAdmin}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-600 font-medium transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Action Card (FinPay Bottom Card Style) */}
        <div className="mt-6 pt-2">
          <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                POS Pro
              </span>
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Update Menu Baru!
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Tambah varian makanan atau atur stok kantin
            </p>
            <button
              type="button"
              onClick={() => {
                setIsMobileSidebarOpen(false);
                openCreateModal();
              }}
              className="w-full mt-3 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              + Tambah Menu
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          2. RIGHT MAIN CONTENT AREA (Top Header + Bento Grid)
         ===================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* TOP HEADER BAR (Exact FinPay Header + Responsive Toggle) */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between shrink-0 z-10 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Mobile Drawer Button (< lg) */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Buka Menu Admin"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Desktop Sidebar Expand Button (lg+) */}
            {!isAdminSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsAdminSidebarOpen(true)}
                className="hidden lg:flex w-9 h-9 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 items-center justify-center transition cursor-pointer shrink-0"
                title="Buka Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
              Hey Admin, Welcome back! 👋🏻
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Box with ⌘K badge */}
            <div className="relative flex items-center bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-2.5 sm:px-3 py-1.5 w-36 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5 sm:mr-2 shrink-0" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {globalSearch ? (
                <button
                  type="button"
                  onClick={() => setGlobalSearch("")}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200/70 shrink-0">
                  ⌘ K
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                showToast(`${recentOrders.length} transaksi tercatat hari ini.`)
              }
              className="w-9 h-9 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition cursor-pointer relative shrink-0"
              title="Notifikasi Pesanan"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#2563EB] absolute top-2 right-2" />
            </button>
          </div>
        </header>

        {/* ===================================================================
            VIEW A: HALAMAN UTAMA DASHBOARD (Exact FinPay 3-Column Bento Grid)
           =================================================================== */}
        {activePage === "dashboard" ? (
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-20 lg:pb-6 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 max-w-[1600px] mx-auto">
              {/* -------------------------------------------------------------
                  COLUMN 1 (LEFT — 3 cols): Blue POS Card + 4 Quick Actions + Target Harian + Popular Items
                 ------------------------------------------------------------- */}
              <div className="lg:col-span-4 xl:col-span-3 space-y-4 sm:space-y-5">
                {/* 1. Royal Blue POS Terminal Card */}
                <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] rounded-2xl p-5 text-white shadow-[0_10px_25px_rgba(37,99,235,0.22)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-9 h-7 rounded-md bg-white/20 border border-white/30 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-white" />
                    </div>
                  </div>

                  <span className="block text-[10px] text-blue-200 font-medium">
                    Terminal Kasir ID
                  </span>
                  <p className="text-sm font-bold tracking-wider mt-0.5 font-mono">
                    2243 9830 6500 9982
                  </p>

                  <div className="flex items-end justify-between mt-5 pt-2">
                    <div>
                      <span className="block text-[10px] text-blue-200 font-medium">
                        Saldo Kasir Aktif
                      </span>
                      <span className="text-lg font-extrabold tabular-nums">
                        {formatRupiah(totalIncome)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="block text-[9px] text-blue-200 uppercase">
                          SHIFT
                        </span>
                        <span className="text-[11px] font-bold">01/26</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-blue-200 uppercase">
                          POS
                        </span>
                        <span className="text-[11px] font-bold">AKTIF</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. 4 Quick Action Buttons Row */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 grid grid-cols-4 gap-2 text-center">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-center text-slate-700">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600">
                      Add Menu
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePage("crud")}
                    className="flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-center text-slate-700">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600">
                      CRUD Stok
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePage("transactions")}
                    className="flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-center text-slate-700">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600">
                      Pesanan
                    </span>
                  </button>

                  <Link
                    href="/"
                    className="flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-center text-slate-700">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600">
                      Buka POS
                    </span>
                  </Link>
                </div>

                {/* 3. Daily Target Card (with FinPay Striped Progress Bar) */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">
                      Target Omzet Harian
                    </h3>
                    <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  <StripedProgressBar percentage={76} />

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      <strong className="text-slate-900">Rp 1.520.000</strong> •
                      76%
                    </span>
                    <span className="font-bold text-slate-900">
                      Rp 2.000.000
                    </span>
                  </div>
                </div>

                {/* 4. Popular Items Card (Adapted from "Saving Plans" in FinPay) */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">
                      Popular Items
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActivePage("crud")}
                      className="text-[11px] font-bold text-slate-600 hover:text-[#2563EB] cursor-pointer"
                    >
                      + Kelola Menu
                    </button>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-400">
                      Total Unit Terjual
                    </span>
                    <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                      {totalSoldUnits} Pcs
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {topPopularItems.map((item) => {
                      const totalCap = Math.max(
                        1,
                        item.soldCount + item.stock
                      );
                      const soldPct = Math.round(
                        (item.soldCount / totalCap) * 100
                      );

                      return (
                        <div
                          key={item.id}
                          onClick={() => openEditModal(item)}
                          className="p-3 rounded-xl border border-slate-200/70 hover:border-blue-300 transition cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-6 h-6 rounded-md object-cover shrink-0"
                              />
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {item.name}
                              </span>
                            </div>
                            <MoreVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </div>

                          <StripedProgressBar percentage={soldPct} />

                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="text-slate-500">
                              <strong className="text-slate-800">
                                {item.soldCount} Terjual
                              </strong>{" "}
                              • {soldPct}%
                            </span>
                            <span className="font-bold text-slate-800">
                              {formatRupiah(getEffectivePrice(item))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  COLUMN 2 (CENTER — 6 cols): 3 KPI Cards + Money Statistics Bidirectional Chart + Recent Transaction Table
                 ------------------------------------------------------------- */}
              <div className="lg:col-span-8 xl:col-span-6 space-y-4 sm:space-y-5">
                {/* 1. Top 3 KPI Cards: Total Income, Total Expenses, Net Profit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                  {/* Total Income */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-center text-slate-700">
                        <ArrowDownLeft className="w-4 h-4 text-[#2563EB]" />
                      </div>
                      <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        Total Pendapatan
                      </span>
                      <span className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                        {formatRupiah(totalIncome)}
                      </span>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                        +Rp 1,5 Jt (26%)
                      </span>
                    </div>
                  </div>

                  {/* Total Expenses */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-center text-slate-700">
                        <ArrowUpRight className="w-4 h-4 text-rose-500" />
                      </div>
                      <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        Biaya Operasional
                      </span>
                      <span className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                        {formatRupiah(totalExpenses)}
                      </span>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[10px] font-bold">
                        -Rp 650 Rb (15%)
                      </span>
                    </div>
                  </div>

                  {/* Total Net Profit */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-center text-slate-700">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                      </div>
                      <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        Laba Bersih
                      </span>
                      <span className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                        {formatRupiah(totalNetProfit)}
                      </span>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                        +Rp 2,1 Jt (70%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Aliran Pendapatan (Money Statistics Bidirectional Bar Chart: Per Hari / Minggu / Bulan) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Aliran Pendapatan (Money Statistics)
                    </h3>

                    {/* Per Hari | Per Minggu | Per Bulan Switcher */}
                    <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-slate-200/70">
                      {[
                        { id: "daily", label: "Per Hari" },
                        { id: "weekly", label: "Per Minggu" },
                        { id: "monthly", label: "Per Bulan" },
                      ].map((tf) => (
                        <button
                          type="button"
                          key={tf.id}
                          onClick={() => {
                            setRevenueTimeframe(tf.id as RevenueTimeframe);
                            setSelectedBarIndex(4);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                            revenueTimeframe === tf.id
                              ? "bg-white text-[#2563EB] shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Balance + Legend + Floating Tooltip */}
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-5 relative">
                    <div>
                      <span className="block text-[10px] text-slate-400">
                        Total Omzet ({currentDataset.label})
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
                        {formatRupiah(currentDataset.balance)}
                      </span>
                    </div>

                    {/* Floating Callout Card matching FinPay Jun 2025 tooltip */}
                    <div className="bg-white rounded-xl px-3.5 py-2 border border-slate-200/90 shadow-md text-[11px]">
                      <span className="block font-bold text-slate-400 text-[10px] mb-0.5">
                        Sorotan: {activePoint.label}
                      </span>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Pendapatan</span>
                        <strong className="text-slate-900 tabular-nums">
                          {formatRupiah(activePoint.income)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Modal</span>
                        <strong className="text-slate-900 tabular-nums">
                          {formatRupiah(activePoint.expense)}
                        </strong>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB] inline-block" />
                        Pendapatan
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-xs bg-[#93C5FD] inline-block" />
                        Modal
                      </span>
                    </div>
                  </div>

                  {/* Bidirectional Positive/Negative Bar Chart matching FinPay */}
                  <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar">
                    {/* Left Y-Axis Labels */}
                    <div className="flex flex-col justify-between text-[9px] sm:text-[10px] font-semibold text-slate-400 py-1 pb-6 shrink-0">
                      <span>8 Jt</span>
                      <span>4 Jt</span>
                      <span>0</span>
                      <span>-4 Jt</span>
                      <span>-8 Jt</span>
                    </div>

                    {/* Bars Grid */}
                    <div className="flex-1 min-w-[290px]">
                      <div
                        className="grid gap-1.5 sm:gap-2 h-44 items-center relative"
                        style={{
                          gridTemplateColumns: `repeat(${currentDataset.bars.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {/* Horizontal Dashed Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                          <div className="border-b border-dashed border-slate-100" />
                          <div className="border-b border-dashed border-slate-100" />
                          <div className="border-b border-slate-200/80" />
                          <div className="border-b border-dashed border-slate-100" />
                          <div className="border-b border-dashed border-slate-100" />
                        </div>

                        {currentDataset.bars.map((bar, idx) => {
                          const isSelected = idx === safeBarIdx;
                          return (
                            <div
                              key={bar.label}
                              onClick={() => setSelectedBarIndex(idx)}
                              className="h-full flex flex-col items-center justify-center relative z-10 cursor-pointer group"
                            >
                              {/* Top Half (Positive Income Bar in Royal Blue #2563EB) */}
                              <div className="w-full h-1/2 flex items-end justify-center pb-[1px]">
                                <div
                                  style={{ height: `${bar.inPct}%` }}
                                  className={`w-full max-w-[20px] rounded-t-md transition-all duration-300 ${
                                    isSelected
                                      ? "bg-[#1D4ED8] ring-2 ring-blue-200"
                                      : "bg-[#2563EB] group-hover:bg-[#1D4ED8]"
                                  }`}
                                />
                              </div>

                              {/* Bottom Half (Negative Expense Bar in Soft Sky Blue #93C5FD) */}
                              <div className="w-full h-1/2 flex items-start justify-center pt-[1px]">
                                <div
                                  style={{ height: `${bar.exPct}%` }}
                                  className={`w-full max-w-[20px] rounded-b-md transition-all duration-300 ${
                                    isSelected
                                      ? "bg-[#60A5FA]"
                                      : "bg-[#93C5FD] group-hover:bg-[#60A5FA]"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* X-Axis Labels */}
                      <div
                        className="grid gap-2 mt-2 text-center"
                        style={{
                          gridTemplateColumns: `repeat(${currentDataset.bars.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {currentDataset.bars.map((bar, idx) => (
                          <span
                            key={bar.label}
                            className={`text-[10px] font-semibold ${
                              idx === safeBarIdx
                                ? "text-[#2563EB] font-bold"
                                : "text-slate-400"
                            }`}
                          >
                            {bar.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Recent Transaction Table (Pesanan Terbaru) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Recent Transaction (Pesanan Terbaru)
                    </h3>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActivePage("transactions")}
                        className="px-3 py-1.5 rounded-lg border border-slate-200/80 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Minggu Ini ▾
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePage("transactions")}
                        className="w-8 h-8 rounded-lg border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
                        title="Lihat Semua Transaksi"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[520px] text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F8FAFC] text-[10.5px] font-semibold text-slate-400 border-y border-slate-200/70">
                          <th className="py-2.5 px-3">Menu & Pelanggan ⇅</th>
                          <th className="py-2.5 px-3">Waktu ⇅</th>
                          <th className="py-2.5 px-3">Nominal ⇅</th>
                          <th className="py-2.5 px-3">Metode ⇅</th>
                          <th className="py-2.5 px-3 text-right">Status ⇅</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredOrders.map((ord) => {
                          const currentStatus: OrderStatusType =
                            ord.status || "Preparing";
                          const nextStatus: OrderStatusType =
                            currentStatus === "Preparing"
                              ? "Ready"
                              : currentStatus === "Ready"
                              ? "Completed"
                              : "Preparing";
                          const firstItem =
                            ord.items[0]?.product.name || "Pesanan Menu";

                          return (
                            <tr
                              key={ord.id}
                              className="hover:bg-slate-50/80 transition"
                            >
                              <td className="py-3 px-3">
                                <p className="font-bold text-slate-900">
                                  {firstItem}
                                  {ord.items.length > 1
                                    ? ` +${ord.items.length - 1} lainnya`
                                    : ""}
                                </p>
                                <span className="text-[10.5px] text-slate-400">
                                  {ord.customerName} ({ord.orderNumber})
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <p className="font-semibold text-slate-800">
                                  2026-11-03
                                </p>
                                <span className="text-[10.5px] text-slate-400">
                                  {ord.createdAt}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-extrabold text-slate-900 tabular-nums">
                                {formatRupiah(ord.totalAmount)}
                              </td>
                              <td className="py-3 px-3 text-slate-500 text-[11px]">
                                Pembayaran {ord.paymentMethod}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateOrderStatus(ord.id, nextStatus);
                                    showToast(
                                      `Status ${ord.orderNumber} -> ${nextStatus}`
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                                    currentStatus === "Completed"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : currentStatus === "Ready"
                                      ? "bg-blue-50 text-[#2563EB]"
                                      : "bg-amber-50 text-amber-600"
                                  }`}
                                >
                                  {currentStatus === "Completed"
                                    ? "Successful"
                                    : currentStatus}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  COLUMN 3 (RIGHT — 3 cols): Statistics Donut Chart (Kategori Produk) + Recent Activity Timeline
                 ------------------------------------------------------------- */}
              <div className="lg:col-span-12 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 sm:gap-5">
                {/* 1. Statistics Donut Chart Card (Kategori Produk) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Statistics (Kategori)
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Bulan Ini ▾
                    </span>
                  </div>

                  {/* Sub-tabs matching FinPay Statistics card */}
                  <div className="grid grid-cols-2 border-b border-slate-100 text-[11px] mb-5">
                    <button
                      type="button"
                      onClick={() => setStatsSubTab("income")}
                      className={`pb-2 font-bold transition cursor-pointer ${
                        statsSubTab === "income"
                          ? "text-slate-900 border-b-2 border-[#2563EB]"
                          : "text-slate-400"
                      }`}
                    >
                      Omzet • Rp 10,4 Jt
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatsSubTab("sold")}
                      className={`pb-2 font-bold transition cursor-pointer ${
                        statsSubTab === "sold"
                          ? "text-slate-900 border-b-2 border-[#2563EB]"
                          : "text-slate-400"
                      }`}
                    >
                      Terjual • {totalSoldUnits} Pcs
                    </button>
                  </div>

                  {/* Multi-Segment SVG Donut Chart */}
                  <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
                    <svg
                      viewBox="0 0 36 36"
                      className="w-full h-full -rotate-90"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="#F1F5F9"
                        strokeWidth="4.2"
                      />
                      {donutSegments.map((seg) => (
                        <circle
                          key={seg.category}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="4.2"
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          strokeLinecap="butt"
                        />
                      ))}
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {statsSubTab === "income"
                          ? "Total Kategori"
                          : "Unit Terjual"}
                      </span>
                      <span className="text-base font-extrabold text-slate-900 tabular-nums mt-0.5">
                        {statsSubTab === "income"
                          ? formatRupiah(totalCategoryRevenue)
                          : `${totalSoldUnits} Pcs`}
                      </span>
                    </div>
                  </div>

                  {/* Category Legend List */}
                  <div className="space-y-3 mt-5">
                    {donutSegments.map((seg) => (
                      <div
                        key={seg.category}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            style={{ backgroundColor: seg.color }}
                            className="w-3.5 h-3.5 rounded-md inline-block shrink-0"
                          />
                          <span className="font-semibold text-slate-700">
                            {seg.category}{" "}
                            <span className="text-slate-400 font-normal">
                              • {seg.pct}%
                            </span>
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {statsSubTab === "income"
                            ? formatRupiah(seg.revenue)
                            : `${seg.sold} Pcs`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Recent Activity Timeline Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Recent Activity
                    </h3>
                    <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="block text-xs font-bold text-slate-900 mb-3">
                        Today
                      </span>
                      <div className="space-y-3.5 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
                        {[
                          {
                            title: `Order baru ${recentOrders[0]?.orderNumber || "#F8371"} diterima`,
                            time: "14:05",
                          },
                          {
                            title: "Sinkronisasi stok katalog menu aktif",
                            time: "13:30",
                          },
                          {
                            title: "Admin masuk ke portal manajemen",
                            time: "12:45",
                          },
                        ].map((act, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 relative z-10"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-200 flex items-center justify-center shrink-0">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-snug">
                                {act.title}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {act.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-slate-900 mb-3">
                        Yesterday
                      </span>
                      <div className="space-y-3.5 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
                        {[
                          {
                            title: "Rekapitulasi kasir harian ditutup",
                            time: "21:00",
                          },
                          {
                            title: "Restock 24 pcs Steak sapi bakar",
                            time: "16:20",
                          },
                        ].map((act, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 relative z-10"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-200 flex items-center justify-center shrink-0">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-snug">
                                {act.title}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {act.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        ) : activePage === "crud" ? (
          /* ===================================================================
              VIEW B: HALAMAN TERPISAH CRUD MENU & STOK (FinPay Clean Style)
             =================================================================== */
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-20 lg:pb-6 custom-scrollbar space-y-4 sm:space-y-5">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Manajemen CRUD Menu & Stok
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tambah menu baru, ubah harga, foto, deskripsi, atau perbarui stok pcs
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePage("dashboard")}
                  className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center"
                >
                  ← Dashboard
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex-1 sm:flex-initial justify-center px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Menu Baru</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {[
                "All",
                "Rice bowl",
                "Chicken",
                "Seafood",
                "Pasta",
                "Coffee",
                "Beverages",
                "Appetizer",
                "Snack",
              ].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCrudCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                    crudCategoryFilter === cat
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F8FAFC] text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 4-Column CRUD Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
              {crudFilteredItems.map((item) => {
                const effectivePrice = getEffectivePrice(item);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-300 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {item.group} • {item.category}
                        </span>
                        {item.featured && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] text-[9.5px] font-bold">
                            FEATURED
                          </span>
                        )}
                      </div>

                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F8FAFC] my-2">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {item.stock <= 0 && (
                          <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                            <span className="px-2.5 py-1 rounded-full bg-white text-slate-900 text-[10px] font-bold">
                              Stok Habis
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between gap-2 mt-2.5">
                        <h4
                          className="font-bold text-slate-900 text-sm truncate"
                          title={item.name}
                        >
                          {item.name}
                        </h4>
                        <span className="font-extrabold text-[#2563EB] text-sm shrink-0 tabular-nums">
                          {formatRupiah(effectivePrice)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Stock Stepper */}
                      <div className="flex items-center justify-between mt-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/60 text-xs">
                        <div>
                          <span className="block text-[10px] text-slate-400">
                            Stok Tersedia
                          </span>
                          <span
                            className={`font-bold ${
                              item.stock <= 0
                                ? "text-rose-600"
                                : "text-slate-900"
                            }`}
                          >
                            {item.stock} pcs
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateProductStock(item.id, item.stock - 1)
                            }
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateProductStock(item.id, item.stock + 1)
                            }
                            className="w-6 h-6 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateProductStock(item.id, item.stock + 10)
                            }
                            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-semibold text-[10px] cursor-pointer"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#2563EB] text-slate-700 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          deleteMenuItem(item.id);
                          showToast(`Menu "${item.name}" telah dihapus.`);
                        }}
                        className="py-2 rounded-xl bg-[#F8FAFC] hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        ) : (
          /* ===================================================================
              VIEW C: HALAMAN TRANSAKSI LENGKAP
             =================================================================== */
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-20 lg:pb-6 custom-scrollbar space-y-4 sm:space-y-5">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Daftar Seluruh Transaksi ({filteredOrders.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kelola status pesanan dari Preparing, Ready, hingga Completed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePage("dashboard")}
                className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                ← Kembali ke Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
              {filteredOrders.map((order) => {
                const currentStatus: OrderStatusType =
                  order.status || "Preparing";
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {order.customerName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {order.orderNumber}
                            </span>
                          </div>
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            {order.createdAt} • {order.paymentMethod}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            deleteOrder(order.id);
                            showToast(
                              `Order ${order.orderNumber} berhasil dihapus.`
                            );
                          }}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2 my-3">
                        {order.items.map((line, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs bg-[#F8FAFC] p-2.5 rounded-xl"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={line.product.imageUrl}
                                alt={line.product.name}
                                className="w-9 h-9 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {line.product.name}
                                </p>
                                <span className="text-[10.5px] text-slate-400">
                                  {line.quantity} pcs x{" "}
                                  {formatRupiah(line.unitPrice)}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900 tabular-nums">
                              {formatRupiah(line.lineTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Total Bayar</span>
                        <span className="text-sm font-extrabold text-[#2563EB] tabular-nums">
                          {formatRupiah(order.totalAmount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          ["Preparing", "Ready", "Completed"] as OrderStatusType[]
                        ).map((st) => (
                          <button
                            type="button"
                            key={st}
                            onClick={() => {
                              updateOrderStatus(order.id, st);
                              showToast(`Order ${order.orderNumber} -> ${st}`);
                            }}
                            className={`py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              currentStatus === st
                                ? st === "Completed"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-[#2563EB] text-white"
                                : "bg-[#F8FAFC] text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* Mobile Bottom Navigation Bar (< lg) */}
        <nav className="lg:hidden absolute bottom-0 inset-x-0 bg-white border-t border-slate-200/80 px-2 py-1.5 grid grid-cols-3 gap-1 z-30">
          {[
            { id: "dashboard", label: "Dashboard", icon: Home },
            { id: "transactions", label: "Pesanan", icon: Receipt },
            { id: "crud", label: "CRUD Stok", icon: UtensilsCrossed },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activePage === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActivePage(tab.id as AdminPageTab)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                  isActive ? "text-[#2563EB] bg-blue-50/70" : "text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* =====================================================================
          ADMIN CRUD MODAL (Add to Menu / Edit Menu)
         ===================================================================== */}
      {isCrudModalOpen && (
        <div
          onClick={() => setIsCrudModalOpen(false)}
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          className="fixed inset-0 z-[110] bg-slate-950/55 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingItem ? "Edit Menu Penjualan" : "Tambah Menu Baru"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Perubahan langsung diperbarui pada katalog pembeli
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCrudModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F8FAFC] hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Makanan / Minuman
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Steak Sapi Bakar"
                  required
                  className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Grup Sidebar
                  </label>
                  <select
                    value={formGroup}
                    onChange={(e) =>
                      setFormGroup(e.target.value as SidebarGroupType)
                    }
                    className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 px-3 py-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="Food">Food</option>
                    <option value="Coffee">Coffee</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Appetizer">Appetizer</option>
                    <option value="Bread">Bread</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sub-Kategori Filter
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as MenuItem["category"])
                    }
                    className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 px-3 py-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="Rice bowl">Rice bowl</option>
                    <option value="Chicken">Chicken</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Pasta">Pasta</option>
                    <option value="Coffee">Coffee</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Appetizer">Appetizer</option>
                    <option value="Bread">Bread</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    required
                    className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stok Tersedia (Pcs)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    required
                    className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi Hidangan
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Jelaskan bahan dan keunggulan menu ini..."
                  className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 p-3 font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  URL Foto Menu
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 px-3.5 py-2 font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#2563EB] mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_FOOD_IMAGES.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setFormImage(preset.url)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border transition cursor-pointer ${
                        formImage === preset.url
                          ? "bg-blue-50 border-[#2563EB] text-[#2563EB]"
                          : "bg-[#F8FAFC] border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#2563EB] rounded"
                />
                <span className="font-semibold text-slate-700">
                  Tandai sebagai menu &ldquo;FEATURED&rdquo;
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCrudModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {editingItem ? "Simpan Perubahan" : "Tambahkan Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
