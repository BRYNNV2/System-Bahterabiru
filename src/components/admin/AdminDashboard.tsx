"use client";

import React, { useState } from "react";
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
  Star,
  Lock,
  User,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  X,
  Flame,
  Truck,
  ExternalLink,
  TrendingUp,
  PieChart,
  ArrowUpRight,
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

type AdminPageTab = "dashboard" | "crud" | "orders";
type RevenueTimeframe = "daily" | "weekly" | "monthly";

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
  } = usePosStore();

  // Login Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Separate Admin Pages State
  const [activePage, setActivePage] = useState<AdminPageTab>("dashboard");

  // Revenue Stream Timeframe State (Per Hari, Minggu, Bulan)
  const [revenueTimeframe, setRevenueTimeframe] =
    useState<RevenueTimeframe>("daily");
  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(4);

  // Search & Filter States
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
  // 1. CLEAN ADMIN LOGIN GATE (Strict White + Zinc + #FF6B2C Palette)
  // ============================================================================
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen w-screen bg-[#F8F9FB] flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B2C] text-white flex items-center justify-center shadow-sm mb-4">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FFF5EF] text-[#FF6B2C] text-[10px] font-bold uppercase tracking-widest mb-2">
              Coca coffeetalk • Admin
            </span>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
              Masuk ke Panel Admin
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Kelola penjualan, aliran pendapatan, dan katalog menu
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full rounded-xl bg-[#F8F9FB] border border-gray-200/80 pl-11 pr-4 py-3 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-[#FF6B2C] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-[#F8F9FB] border border-gray-200/80 pl-11 pr-11 py-3 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-[#FF6B2C] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
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
              <span className="text-[11px] text-zinc-400">
                Akses Demo: <strong className="text-zinc-700">admin</strong> /{" "}
                <strong className="text-zinc-700">admin123</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setUsername("admin");
                  setPassword("admin123");
                  setLoginError("");
                }}
                className="text-[11px] font-bold text-[#FF6B2C] hover:underline cursor-pointer"
              >
                Isi Otomatis
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#FF6B2C] hover:bg-[#e85d20] text-white font-bold text-xs transition cursor-pointer active:scale-[0.99] mt-2 shadow-sm"
            >
              Masuk Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. DATA CALCULATIONS
  // ============================================================================
  const preparingCount =
    recentOrders.filter((o) => !o.status || o.status === "Preparing").length + 7;
  const outForDeliveryCount =
    recentOrders.filter((o) => o.status === "Ready").length + 12;
  const deliveredCount =
    recentOrders.filter((o) => o.status === "Completed").length + 27;

  const liveOrdersRevenue = recentOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalSoldUnits = menuItems.reduce((s, m) => s + m.soldCount, 0);

  const REVENUE_DATASETS: Record<
    RevenueTimeframe,
    {
      title: string;
      subtitle: string;
      growth: string;
      totalRevenue: number;
      bars: { label: string; revenue: number; orders: number; pct: number }[];
    }
  > = {
    daily: {
      title: "Aliran Pendapatan Harian",
      subtitle: "Pemasukan 7 hari terakhir",
      growth: "+14.8%",
      totalRevenue: 8450000 + liveOrdersRevenue,
      bars: [
        { label: "Sen", revenue: 980000, orders: 28, pct: 55 },
        { label: "Sel", revenue: 1120000, orders: 32, pct: 64 },
        { label: "Rab", revenue: 1050000, orders: 30, pct: 60 },
        { label: "Kam", revenue: 1290000, orders: 37, pct: 74 },
        {
          label: "Jum",
          revenue: 1580000 + liveOrdersRevenue,
          orders: 45 + recentOrders.length,
          pct: 92,
        },
        { label: "Sab", revenue: 1340000, orders: 39, pct: 78 },
        { label: "Min", revenue: 1090000, orders: 31, pct: 62 },
      ],
    },
    weekly: {
      title: "Aliran Pendapatan Mingguan",
      subtitle: "Tren omzet 8 minggu terakhir",
      growth: "+21.4%",
      totalRevenue: 34800000 + liveOrdersRevenue,
      bars: [
        { label: "Mgg 1", revenue: 3650000, orders: 96, pct: 52 },
        { label: "Mgg 2", revenue: 4120000, orders: 108, pct: 61 },
        { label: "Mgg 3", revenue: 3890000, orders: 102, pct: 57 },
        { label: "Mgg 4", revenue: 4680000, orders: 124, pct: 71 },
        { label: "Mgg 5", revenue: 4950000, orders: 131, pct: 76 },
        { label: "Mgg 6", revenue: 4420000, orders: 118, pct: 66 },
        { label: "Mgg 7", revenue: 5250000, orders: 142, pct: 83 },
        {
          label: "Mgg 8",
          revenue: 5840000 + liveOrdersRevenue,
          orders: 156 + recentOrders.length,
          pct: 94,
        },
      ],
    },
    monthly: {
      title: "Aliran Pendapatan Bulanan",
      subtitle: "Rekapitulasi performa tahunan (Jan – Des)",
      growth: "+38.1%",
      totalRevenue: 186400000 + liveOrdersRevenue,
      bars: [
        { label: "Jan", revenue: 11200000, orders: 265, pct: 46 },
        { label: "Feb", revenue: 12800000, orders: 302, pct: 54 },
        { label: "Mar", revenue: 10900000, orders: 254, pct: 43 },
        { label: "Apr", revenue: 15600000, orders: 368, pct: 68 },
        { label: "Mei", revenue: 14200000, orders: 335, pct: 61 },
        {
          label: "Jun",
          revenue: 19400000 + liveOrdersRevenue,
          orders: 452 + recentOrders.length,
          pct: 88,
        },
        { label: "Jul", revenue: 15800000, orders: 374, pct: 70 },
        { label: "Agu", revenue: 16500000, orders: 390, pct: 73 },
        { label: "Sep", revenue: 17900000, orders: 418, pct: 80 },
        { label: "Okt", revenue: 15100000, orders: 356, pct: 65 },
        { label: "Nov", revenue: 18900000, orders: 441, pct: 85 },
        { label: "Des", revenue: 21100000, orders: 495, pct: 95 },
      ],
    },
  };

  const currentRevenueData = REVENUE_DATASETS[revenueTimeframe];
  const safeSelectedBar =
    selectedBarIndex < currentRevenueData.bars.length ? selectedBarIndex : 0;
  const activeBarPoint = currentRevenueData.bars[safeSelectedBar];

  // Product Category Breakdown
  const categoryStatsMap = new Map<
    string,
    { category: string; itemCount: number; sold: number; revenue: number }
  >();
  menuItems.forEach((item) => {
    const existing = categoryStatsMap.get(item.category) || {
      category: item.category,
      itemCount: 0,
      sold: 0,
      revenue: 0,
    };
    existing.itemCount += 1;
    existing.sold += item.soldCount;
    existing.revenue += item.soldCount * getEffectivePrice(item);
    categoryStatsMap.set(item.category, existing);
  });

  const categoryBreakdown = Array.from(categoryStatsMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );
  const maxCategoryRevenue = Math.max(
    1,
    ...categoryBreakdown.map((c) => c.revenue)
  );

  // Popular Items
  const popularItemsList = [...menuItems]
    .filter((item) => {
      const q = globalSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 8);

  // CRUD Filtered Items
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8F9FB] flex flex-col font-sans select-none text-zinc-900">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[120] bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-[#FF6B2C]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP NAVIGATION HEADER (Clean White + Zinc + Single Orange Accent) */}
      <header className="h-15 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FF6B2C] text-white flex items-center justify-center">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <span className="font-extrabold text-[15px] text-zinc-900 tracking-tight">
            Coca <span className="font-semibold text-zinc-500">admin</span>
          </span>
        </div>

        {/* Center: Clean Minimalist Page Switcher */}
        <nav className="flex items-center gap-1 bg-[#F8F9FB] p-1 rounded-full border border-gray-200/60">
          <button
            type="button"
            onClick={() => setActivePage("dashboard")}
            className={`px-4 py-1.5 rounded-full text-xs flex items-center gap-2 transition cursor-pointer ${
              activePage === "dashboard"
                ? "bg-white text-zinc-900 font-bold shadow-2xs"
                : "text-zinc-500 hover:text-zinc-900 font-medium"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard Utama</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage("crud")}
            className={`px-4 py-1.5 rounded-full text-xs flex items-center gap-2 transition cursor-pointer ${
              activePage === "crud"
                ? "bg-white text-zinc-900 font-bold shadow-2xs"
                : "text-zinc-500 hover:text-zinc-900 font-medium"
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Kelola Menu (CRUD)</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage("orders")}
            className={`px-4 py-1.5 rounded-full text-xs flex items-center gap-2 transition cursor-pointer ${
              activePage === "orders"
                ? "bg-white text-zinc-900 font-bold shadow-2xs"
                : "text-zinc-500 hover:text-zinc-900 font-medium"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Pesanan ({recentOrders.length})</span>
          </button>
        </nav>

        {/* Right: Buyer Store Link & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-full bg-[#F8F9FB] hover:bg-gray-100 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 border border-gray-200/60 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Katalog Pembeli</span>
          </Link>

          <button
            type="button"
            onClick={logoutAdmin}
            className="w-8 h-8 rounded-full bg-[#F8F9FB] hover:bg-gray-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center border border-gray-200/60 transition cursor-pointer"
            title="Logout Admin"
            aria-label="Logout Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* MAIN BODY */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT VERTICAL ICON RAIL */}
        <aside className="w-16 sm:w-[70px] bg-white border-r border-gray-100 py-5 flex flex-col items-center justify-between shrink-0 z-20">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setActivePage("dashboard")}
              title="Dashboard Utama"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
                activePage === "dashboard"
                  ? "bg-[#FF6B2C] text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-[#F8F9FB]"
              }`}
            >
              <Home className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActivePage("crud")}
              title="Kelola Menu (CRUD)"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
                activePage === "crud"
                  ? "bg-[#FF6B2C] text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-[#F8F9FB]"
              }`}
            >
              <FolderKanban className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActivePage("orders")}
              title="Pesanan"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
                activePage === "orders"
                  ? "bg-[#FF6B2C] text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-[#F8F9FB]"
              }`}
            >
              <Package className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setActivePage("crud");
              openCreateModal();
            }}
            title="Tambah Menu Baru"
            className="w-9 h-9 rounded-xl bg-[#FFF5EF] text-[#FF6B2C] hover:bg-[#FF6B2C] hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </aside>

        {/* ===================================================================
            PAGE 1: HALAMAN UTAMA DASHBOARD (Clean Monochrome + Single Orange Accent)
           =================================================================== */}
        {activePage === "dashboard" && (
          <>
            <main className="flex-1 min-w-0 h-full overflow-y-auto px-5 sm:px-7 py-5 custom-scrollbar space-y-5">
              {/* Top Search & Action Bar */}
              <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Cari menu, kategori, atau ID pesanan..."
                    className="w-full bg-transparent text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none py-1"
                  />
                  {globalSearch && (
                    <button
                      type="button"
                      onClick={() => setGlobalSearch("")}
                      className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-[#F8F9FB] border border-gray-200/60 text-zinc-600 text-[11px] font-semibold">
                    Total Terjual:{" "}
                    <strong className="text-zinc-900">{totalSoldUnits} pcs</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePage("crud")}
                    className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Kelola Menu</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3 Clean Status Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-zinc-900 tracking-tight tabular-nums">
                      {String(preparingCount).padStart(2, "0")}
                    </span>
                    <p className="text-xs font-medium text-zinc-400 mt-1">
                      Preparing (Diproses)
                    </p>
                    <span className="inline-block mt-2.5 px-2 py-0.5 rounded-md bg-[#FFF5EF] text-[#FF6B2C] text-[10px] font-bold">
                      +12.5% hari ini
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF5EF] text-[#FF6B2C] flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-zinc-900 tracking-tight tabular-nums">
                      {String(outForDeliveryCount).padStart(2, "0")}
                    </span>
                    <p className="text-xs font-medium text-zinc-400 mt-1">
                      Ready / Siap Saji
                    </p>
                    <span className="inline-block mt-2.5 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-bold">
                      +8.2% hari ini
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#F8F9FB] text-zinc-700 border border-gray-200/60 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-zinc-900 tracking-tight tabular-nums">
                      {String(deliveredCount).padStart(2, "0")}
                    </span>
                    <p className="text-xs font-medium text-zinc-400 mt-1">
                      Completed / Selesai
                    </p>
                    <span className="inline-block mt-2.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      +38.1% bulan ini
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#F8F9FB] text-zinc-700 border border-gray-200/60 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* ALIRAN PENDAPATAN (HARI / MINGGU / BULAN) + KATEGORI PRODUK */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Left (7 cols): Aliran Pendapatan Full Visual */}
                <div className="xl:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#FF6B2C]" />
                        <h3 className="text-sm font-bold text-zinc-900">
                          {currentRevenueData.title}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {currentRevenueData.subtitle} •{" "}
                        <span className="text-emerald-600 font-semibold">
                          {currentRevenueData.growth}
                        </span>
                      </p>
                    </div>

                    {/* Timeframe Switcher: Per Hari | Per Minggu | Per Bulan */}
                    <div className="flex items-center bg-[#F8F9FB] p-1 rounded-full border border-gray-200/60 self-start">
                      {[
                        { id: "daily", label: "Per Hari" },
                        { id: "weekly", label: "Per Minggu" },
                        { id: "monthly", label: "Per Bulan" },
                      ].map((tf) => {
                        const isAct = revenueTimeframe === tf.id;
                        return (
                          <button
                            type="button"
                            key={tf.id}
                            onClick={() => {
                              setRevenueTimeframe(tf.id as RevenueTimeframe);
                              setSelectedBarIndex(4);
                            }}
                            className={`px-3 py-1 rounded-full text-[11px] transition cursor-pointer ${
                              isAct
                                ? "bg-zinc-900 text-white font-semibold"
                                : "text-zinc-500 hover:text-zinc-900 font-medium"
                            }`}
                          >
                            {tf.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clean KPI Summary Strip */}
                  <div className="grid grid-cols-3 gap-3 my-4 bg-[#F8F9FB] p-3.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="block text-[10px] font-semibold text-zinc-400 uppercase">
                        Total Pendapatan
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-zinc-900 tabular-nums mt-0.5 block">
                        {formatRupiah(currentRevenueData.totalRevenue)}
                      </span>
                    </div>

                    <div className="border-x border-gray-200/70 px-3">
                      <span className="block text-[10px] font-semibold text-zinc-400 uppercase">
                        Periode ({activeBarPoint.label})
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-[#FF6B2C] tabular-nums mt-0.5 block">
                        {formatRupiah(activeBarPoint.revenue)}
                      </span>
                    </div>

                    <div className="pl-1">
                      <span className="block text-[10px] font-semibold text-zinc-400 uppercase">
                        Transaksi
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-zinc-900 tabular-nums mt-0.5 block">
                        {activeBarPoint.orders} Order
                      </span>
                    </div>
                  </div>

                  {/* Minimalist Bar Chart (Only #FF6B2C for active bar & soft zinc for others) */}
                  <div
                    className="grid gap-2 items-end h-44 pt-4 px-1"
                    style={{
                      gridTemplateColumns: `repeat(${currentRevenueData.bars.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {currentRevenueData.bars.map((bar, idx) => {
                      const isSelected = idx === safeSelectedBar;
                      return (
                        <div
                          key={bar.label}
                          onClick={() => setSelectedBarIndex(idx)}
                          className="flex flex-col items-center gap-2 h-full justify-end cursor-pointer group"
                        >
                          <span
                            className={`text-[9.5px] font-bold transition-opacity ${
                              isSelected
                                ? "text-[#FF6B2C] opacity-100"
                                : "text-zinc-400 opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {bar.orders}x
                          </span>

                          <div className="w-full max-w-[24px] h-full bg-[#F1F3F6] rounded-full flex items-end overflow-hidden p-[2px]">
                            <div
                              style={{ height: `${bar.pct}%` }}
                              className={`w-full rounded-full transition-all duration-300 ${
                                isSelected
                                  ? "bg-[#FF6B2C]"
                                  : "bg-zinc-300 group-hover:bg-zinc-400"
                              }`}
                            />
                          </div>

                          <span
                            className={`text-[10px] font-semibold truncate ${
                              isSelected ? "text-zinc-900 font-bold" : "text-zinc-400"
                            }`}
                          >
                            {bar.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right (5 cols): Kategori Produk (Clean Uniform Progress Bars) */}
                <div className="xl:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                      <div className="flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-[#FF6B2C]" />
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900">
                            Kategori Produk
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Distribusi penjualan per kategori
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#F8F9FB] border border-gray-200/60 text-zinc-600 text-[10.5px] font-semibold">
                        {categoryBreakdown.length} Kategori
                      </span>
                    </div>

                    <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                      {categoryBreakdown.map((cat, i) => {
                        const widthPct = Math.max(
                          12,
                          Math.round((cat.revenue / maxCategoryRevenue) * 100)
                        );

                        return (
                          <div key={cat.category} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-800">
                                  {cat.category}
                                </span>
                                <span className="text-[11px] text-zinc-400">
                                  {cat.itemCount} menu • {cat.sold} terjual
                                </span>
                              </div>
                              <span className="font-bold text-zinc-900 tabular-nums">
                                {formatRupiah(cat.revenue)}
                              </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-[#F1F3F6] overflow-hidden">
                              <div
                                style={{ width: `${widthPct}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                  i === 0 ? "bg-[#FF6B2C]" : "bg-zinc-800"
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      Atur produk & kategori di halaman CRUD
                    </span>
                    <button
                      type="button"
                      onClick={() => setActivePage("crud")}
                      className="text-[#FF6B2C] font-bold hover:underline cursor-pointer"
                    >
                      Buka CRUD ➔
                    </button>
                  </div>
                </div>
              </div>

              {/* POPULAR ITEMS SHOWCASE */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      Popular Items (Menu Terlaris)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Menu dengan tingkat pemesanan tertinggi
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePage("crud")}
                    className="self-start sm:self-auto px-4 py-1.5 rounded-full bg-[#FFF5EF] text-[#FF6B2C] hover:bg-[#FF6B2C] hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Edit Katalog Menu ➔
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {popularItemsList.map((item, rankIdx) => {
                    const effectivePrice = getEffectivePrice(item);
                    const itemRevenue = item.soldCount * effectivePrice;

                    return (
                      <div
                        key={item.id}
                        className="bg-[#F8F9FB] hover:bg-white rounded-2xl p-3.5 border border-gray-100 hover:border-gray-200/80 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-white mb-3">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/95 text-zinc-900 text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                              <Star className="w-3 h-3 fill-[#FF6B2C] text-[#FF6B2C]" />
                              4.{9 - (rankIdx % 2)}
                            </span>
                          </div>

                          <h4 className="font-bold text-zinc-900 text-xs sm:text-[13px] truncate">
                            {item.name}
                          </h4>
                          <span className="block text-[10.5px] text-zinc-400 mt-0.5">
                            {item.category} • {item.soldCount} terjual
                          </span>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-900 tabular-nums">
                            {formatRupiah(effectivePrice)}
                          </span>
                          <span className="font-bold text-[#FF6B2C] tabular-nums">
                            {formatRupiah(itemRevenue)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </main>

            {/* RIGHT PANEL: PESANAN TERBARU (RECENT ORDERS) */}
            <aside className="w-[320px] xl:w-[355px] bg-white border-l border-gray-100 p-5 flex flex-col gap-4 shrink-0 h-full overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Pesanan Terbaru
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Antrean transaksi pembeli
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F8F9FB] border border-gray-200/60 text-zinc-700 text-[10.5px] font-bold">
                  {filteredOrders.length} Order
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-400">
                    Belum ada pesanan terbaru.
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const currentStatus: OrderStatusType =
                      order.status || "Preparing";
                    const nextStatus: OrderStatusType =
                      currentStatus === "Preparing"
                        ? "Ready"
                        : currentStatus === "Ready"
                        ? "Completed"
                        : "Preparing";

                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl bg-[#F8F9FB] p-3.5 border border-gray-100 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-zinc-900 truncate">
                                {order.customerName}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-200/70 text-zinc-700 text-[9.5px] font-bold shrink-0">
                                {order.orderNumber}
                              </span>
                            </div>
                            <span className="block text-[10px] text-zinc-400 mt-0.5">
                              {order.createdAt} • {order.paymentMethod}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              updateOrderStatus(order.id, nextStatus);
                              showToast(
                                `Status order ${order.orderNumber} -> ${nextStatus}`
                              );
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer shrink-0 ${
                              currentStatus === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : currentStatus === "Ready"
                                ? "bg-zinc-900 text-white"
                                : "bg-[#FFF5EF] text-[#FF6B2C] border border-[#FF6B2C]/30"
                            }`}
                            title="Klik untuk ubah status pesanan"
                          >
                            {currentStatus}
                          </button>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                          {order.items.map((line, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-gray-100"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={line.product.imageUrl}
                                  alt={line.product.name}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 bg-gray-100"
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-xs text-zinc-900 truncate">
                                    {line.product.name}
                                  </p>
                                  <span className="text-[10px] text-zinc-400">
                                    {line.quantity}x
                                  </span>
                                </div>
                              </div>
                              <span className="font-bold text-xs text-zinc-900 tabular-nums shrink-0">
                                {formatRupiah(line.lineTotal)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-zinc-400">Total</span>
                          <span className="font-extrabold text-[#FF6B2C] tabular-nums">
                            {formatRupiah(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          </>
        )}

        {/* ===================================================================
            PAGE 2: HALAMAN KHUSUS CRUD MENU & MANAJEMEN STOK
           =================================================================== */}
        {activePage === "crud" && (
          <main className="flex-1 min-w-0 h-full overflow-y-auto px-5 sm:px-8 py-6 custom-scrollbar space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100">
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-zinc-900">
                  Kelola Menu & Stok Produk (CRUD)
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tambah menu baru, perbarui harga, foto, deskripsi, atau atur ketersediaan stok
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-3.5 py-2 rounded-xl bg-[#F8F9FB] border border-gray-100 text-xs">
                  <span className="text-zinc-400 mr-1.5">Total Menu:</span>
                  <strong className="text-zinc-900">{menuItems.length}</strong>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-[#F8F9FB] border border-gray-100 text-xs">
                  <span className="text-zinc-400 mr-1.5">Stok Menipis:</span>
                  <strong className="text-[#FF6B2C]">
                    {menuItems.filter((m) => m.stock <= 5).length}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2.5 rounded-full bg-[#FF6B2C] hover:bg-[#e85d20] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Menu Baru</span>
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 bg-[#F8F9FB] px-3.5 py-2 rounded-full border border-gray-200/60 flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Cari menu untuk diedit..."
                  className="w-full bg-transparent text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearch("")}
                    className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
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
                    className={`px-3.5 py-1.5 rounded-full text-xs transition cursor-pointer shrink-0 ${
                      crudCategoryFilter === cat
                        ? "border border-[#FF6B2C] bg-[#FFF5EF] text-[#FF6B2C] font-semibold"
                        : "bg-[#F8F9FB] text-zinc-600 hover:bg-gray-100 font-medium"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 4-Column Full CRUD Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
              {crudFilteredItems.map((item) => {
                const effectivePrice = getEffectivePrice(item);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider">
                          {item.group} • {item.category}
                        </span>

                        {item.featured && (
                          <span className="px-2 py-0.5 rounded bg-[#FFF5EF] text-[#FF6B2C] text-[9.5px] font-bold">
                            FEATURED
                          </span>
                        )}
                      </div>

                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F8F9FB] my-2">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {item.stock <= 0 && (
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                            <span className="px-2.5 py-1 rounded-full bg-white text-zinc-900 text-[10px] font-bold">
                              Stok Habis
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between gap-2 mt-2.5">
                        <h4
                          className="font-bold text-zinc-900 text-sm truncate"
                          title={item.name}
                        >
                          {item.name}
                        </h4>
                        <span className="font-extrabold text-[#FF6B2C] text-sm shrink-0 tabular-nums">
                          {formatRupiah(effectivePrice)}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Stock Stepper */}
                      <div className="flex items-center justify-between mt-3 p-2.5 rounded-xl bg-[#F8F9FB] border border-gray-100 text-xs">
                        <div>
                          <span className="block text-[10px] text-zinc-400">
                            Stok
                          </span>
                          <span
                            className={`font-bold ${
                              item.stock <= 0
                                ? "text-rose-600"
                                : "text-zinc-900"
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
                            className="w-6 h-6 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-zinc-700 flex items-center justify-center cursor-pointer"
                            title="Kurangi 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateProductStock(item.id, item.stock + 1)
                            }
                            className="w-6 h-6 rounded-full bg-zinc-900 hover:bg-zinc-700 text-white flex items-center justify-center cursor-pointer"
                            title="Tambah 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateProductStock(item.id, item.stock + 10)
                            }
                            className="px-2 py-0.5 rounded-full bg-white border border-gray-200 hover:border-zinc-400 text-zinc-700 font-semibold text-[10px] cursor-pointer"
                            title="Tambah 10"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Edit & Delete Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="py-2 rounded-xl bg-[#F8F9FB] hover:bg-zinc-900 text-zinc-700 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
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
                        className="py-2 rounded-xl bg-[#F8F9FB] hover:bg-rose-50 text-zinc-500 hover:text-rose-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
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
        )}

        {/* ===================================================================
            PAGE 3: HALAMAN MANAJEMEN PESANAN
           =================================================================== */}
        {activePage === "orders" && (
          <main className="flex-1 min-w-0 h-full overflow-y-auto px-5 sm:px-8 py-6 custom-scrollbar space-y-5">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-zinc-900">
                  Daftar Pesanan ({filteredOrders.length})
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Kelola status pesanan masuk dari Preparing, Ready, hingga Completed
                </p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#FFF5EF] text-[#FF6B2C] text-xs font-bold">
                Total Transaksi Aktif: {formatRupiah(liveOrdersRevenue)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
              {filteredOrders.map((order) => {
                const currentStatus: OrderStatusType =
                  order.status || "Preparing";
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-900">
                              {order.customerName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                              {order.orderNumber}
                            </span>
                          </div>
                          <span className="block text-[11px] text-zinc-400 mt-0.5">
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
                          className="w-7 h-7 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2 my-3">
                        {order.items.map((line, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs bg-[#F8F9FB] p-2.5 rounded-xl"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={line.product.imageUrl}
                                alt={line.product.name}
                                className="w-9 h-9 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-semibold text-zinc-900">
                                  {line.product.name}
                                </p>
                                <span className="text-[10.5px] text-zinc-400">
                                  {line.quantity} pcs x{" "}
                                  {formatRupiah(line.unitPrice)}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-zinc-900 tabular-nums">
                              {formatRupiah(line.lineTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Total (Termasuk Pajak)</span>
                        <span className="text-sm font-extrabold text-[#FF6B2C] tabular-nums">
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
                              showToast(
                                `Order ${order.orderNumber} -> ${st}`
                              );
                            }}
                            className={`py-1.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                              currentStatus === st
                                ? st === "Completed"
                                  ? "bg-emerald-600 text-white"
                                  : st === "Ready"
                                  ? "bg-zinc-900 text-white"
                                  : "bg-[#FF6B2C] text-white"
                                : "bg-[#F8F9FB] text-zinc-500 hover:bg-gray-100"
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
          className="fixed inset-0 z-[110] bg-zinc-950/55 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">
                  {editingItem ? "Edit Menu Penjualan" : "Tambah Menu Baru"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Perubahan otomatis diperbarui pada katalog pembeli
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCrudModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F8F9FB] hover:bg-gray-100 text-zinc-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Nama Makanan / Minuman
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Steak Sapi Bakar"
                  required
                  className="w-full rounded-xl bg-[#F8F9FB] border border-gray-200 px-3.5 py-2.5 font-medium text-zinc-900 focus:outline-none focus:bg-white focus:border-[#FF6B2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Grup Sidebar
                  </label>
                  <select
                    value={formGroup}
                    onChange={(e) =>
                      setFormGroup(e.target.value as SidebarGroupType)
                    }
                    className="w-full rounded-xl bg-[#F8F9FB] border border-gray-200 px-3 py-2.5 font-medium text-zinc-900 focus:outline-none focus:border-[#FF6B2C]"
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
                  <label className="block font-bold text-zinc-700 mb-1">
                    Sub-Kategori Filter
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as MenuItem["category"])
                    }
                    className="w-full rounded-xl bg-[#F8F9FB] border border-gray-200 px-3 py-2.5 font-medium text-zinc-900 focus:outline-none focus:border-[#FF6B2C]"
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
                  <label className="block font-bold text-zinc-700 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    required
                    className="w-full rounded-xl bg-[#F8F9FB] border border-gray-200 px-3.5 py-2.5 font-bold text-zinc-900 focus:outline-none focus:bg-white focus:border-[#FF6B2C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Stok Tersedia (Pcs)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    required
                    className="w-full rounded-xl bg-[#F8F9FB] border border-gray-200 px-3.5 py-2.5 font-bold text-zinc-900 focus:outline-none focus:bg-white focus:border-[#FF6B2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Deskripsi Hidangan
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Jelaskan bahan dan keunggulan menu ini..."
                  className="w-full rounded-xl bg-[#F8F9FB] border border-gray-200 p-3 font-medium text-zinc-800 focus:outline-none focus:bg-white focus:border-[#FF6B2C]"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  URL Foto Menu
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full rounded-xl bg-[#F8F9FB] border border-gray-200 px-3.5 py-2 font-medium text-zinc-800 focus:outline-none focus:bg-white focus:border-[#FF6B2C] mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_FOOD_IMAGES.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setFormImage(preset.url)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border transition cursor-pointer ${
                        formImage === preset.url
                          ? "bg-[#FFF5EF] border-[#FF6B2C] text-[#FF6B2C]"
                          : "bg-[#F8F9FB] border-gray-200 text-zinc-500 hover:bg-gray-100"
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
                  className="w-4 h-4 accent-[#FF6B2C] rounded"
                />
                <span className="font-semibold text-zinc-700">
                  Tandai sebagai menu &ldquo;FEATURED&rdquo;
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCrudModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-[#F8F9FB] hover:bg-gray-100 text-zinc-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#FF6B2C] hover:bg-[#e85d20] text-white font-bold cursor-pointer"
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
