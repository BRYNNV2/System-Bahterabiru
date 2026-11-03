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
import {
  usePosStore,
  OrderStatusType,
  CompletedOrder,
} from "@/store/usePosStore";
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
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [statsSubTab, setStatsSubTab] = useState<"income" | "sold">("income");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Interactive Feature States (Modals, Custom Targets, Table Sort & Filter)
  const [dailyTargetAmount, setDailyTargetAmount] = useState<number>(2000000);
  const [customExpenses, setCustomExpenses] = useState<number>(0);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState<
    "income" | "expenses" | "profit" | "target" | "terminal" | null
  >(null);
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<
    string | null
  >(null);
  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<CompletedOrder | null>(null);
  const [txStatusFilter, setTxStatusFilter] = useState<
    "ALL" | OrderStatusType
  >("ALL");
  const [txSortField, setTxSortField] = useState<"date" | "amount">("date");
  const [txSortAsc, setTxSortAsc] = useState<boolean>(false);

  // Search & Filter State
  const [globalSearch, setGlobalSearch] = useState("");
  const [crudCategoryFilter, setCrudCategoryFilter] = useState<string>("All");
  const [mobileCrudCols, setMobileCrudCols] = useState<2 | 3>(2);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // CRUD Modal State
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] =
    useState<MenuItem["category"]>("Rice bowl");
  const [formGroup, setFormGroup] = useState<MenuItem["group"]>("Food");
  const [formPrice, setFormPrice] = useState<number>(25000);
  const [formStock, setFormStock] = useState<number>(20);
  const [formDesc, setFormDesc] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formUseVariants, setFormUseVariants] = useState(false);
  const [formVariantsText, setFormVariantsText] = useState(
    "Porsi Reguler, Pedas Normal, Pedas Ekstra"
  );
  const [isConvertingWebp, setIsConvertingWebp] = useState(false);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [uploadedImageMeta, setUploadedImageMeta] = useState<{
    fileName: string;
    originalKb: number;
    webpKb: number;
    width: number;
    height: number;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  // Automatic Client-Side Image -> WebP Compression & Resize
  const handleUploadProductImage = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Format tidak didukung. Pilih file gambar (JPG, PNG, WEBP).");
      return;
    }

    setIsConvertingWebp(true);
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      try {
        const MAX_DIM = 720;
        let targetW = img.naturalWidth || img.width || 600;
        let targetH = img.naturalHeight || img.height || 600;

        if (targetW > MAX_DIM || targetH > MAX_DIM) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * MAX_DIM) / targetW);
            targetW = MAX_DIM;
          } else {
            targetW = Math.round((targetW * MAX_DIM) / targetH);
            targetH = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const webpDataUrl = canvas.toDataURL("image/webp", 0.78);

          const originalKb =
            Math.max(0.1, Math.round((file.size / 1024) * 10) / 10);
          const base64Length =
            webpDataUrl.length - (webpDataUrl.indexOf(",") + 1);
          const webpBytes = (base64Length * 3) / 4;
          const webpKb = Math.max(
            0.1,
            Math.round((webpBytes / 1024) * 10) / 10
          );
          const baseName = file.name.replace(/\.[^/.]+$/, "");

          setFormImage(webpDataUrl);
          setUploadedImageMeta({
            fileName: `${baseName}.webp`,
            originalKb,
            webpKb,
            width: targetW,
            height: targetH,
          });
          showToast(
            `Foto dikonversi ke WebP (${webpKb} KB) • Hemat & ringan!`
          );
        }
      } catch {
        showToast("Gagal memproses gambar. Coba pilih foto lain.");
      } finally {
        URL.revokeObjectURL(objectUrl);
        setIsConvertingWebp(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setIsConvertingWebp(false);
      showToast("File gambar rusak atau tidak dapat dibaca.");
    };

    img.src = objectUrl;
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
    setFormDesc("");
    setFormImage("");
    setUploadedImageMeta(null);
    setFormFeatured(false);
    setFormUseVariants(false);
    setFormVariantsText("Porsi Reguler, Pedas Normal, Pedas Ekstra");
    setIsCrudModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormGroup(item.group);
    setFormPrice(getEffectivePrice(item));
    setFormStock(item.stock);
    const isLegacyDesc =
      item.description?.startsWith("Hidangan spesial racikan dapur utama") &&
      (item.category === "Snack" || item.group === "Snack");
    setFormDesc(isLegacyDesc ? "" : item.description || "");
    setFormImage(item.imageUrl);
    setUploadedImageMeta(null);
    setFormFeatured(Boolean(item.featured));

    const rawOpts = item.servingOptions || [];
    const isOldPlaceholder =
      rawOpts.length === 3 &&
      rawOpts[0] === "Porsi Reguler" &&
      rawOpts[1] === "Pedas Normal" &&
      rawOpts[2] === "Extra Bumbu" &&
      (item.category === "Snack" ||
        item.group === "Snack" ||
        item.category === "Bread" ||
        item.group === "Bread");
    const effectiveOpts = isOldPlaceholder ? [] : rawOpts;
    setFormUseVariants(effectiveOpts.length > 0);
    setFormVariantsText(
      effectiveOpts.length > 0
        ? effectiveOpts.join(", ")
        : "Porsi Reguler, Pedas Normal, Pedas Ekstra"
    );
    setIsCrudModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (!formImage.trim()) {
      showToast("Silakan upload foto produk terlebih dahulu.");
      return;
    }

    const parsedServingOptions = formUseVariants
      ? formVariantsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    if (editingItem) {
      updateMenuItem(editingItem.id, {
        name: formName.trim(),
        category: formCategory,
        group: formGroup,
        price: Number(formPrice) || 1000,
        discountedPrice: undefined,
        discountPercent: undefined,
        stock: Math.max(0, Number(formStock) || 0),
        description: formDesc.trim(),
        imageUrl: formImage.trim(),
        featured: formFeatured,
        servingOptions: parsedServingOptions,
      });
      showToast(`Menu "${formName}" berhasil diperbarui.`);
    } else {
      addMenuItem({
        name: formName.trim(),
        category: formCategory,
        group: formGroup,
        price: Number(formPrice) || 1000,
        stock: Math.max(0, Number(formStock) || 0),
        description: formDesc.trim(),
        imageUrl: formImage.trim(),
        featured: formFeatured,
        servingOptions: parsedServingOptions,
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

  const totalIncome = liveOrdersRevenue;
  const totalExpenses = customExpenses;
  const totalNetProfit = totalIncome - totalExpenses;
  const todayRevenue = liveOrdersRevenue;
  const dailyTargetPct = Math.min(
    100,
    Math.round((todayRevenue / Math.max(1, dailyTargetAmount)) * 100)
  );
  const liveBarPct = liveOrdersRevenue > 0 ? Math.min(100, Math.max(18, Math.round((liveOrdersRevenue / Math.max(1, dailyTargetAmount)) * 100))) : 4;
  const expBarPct = customExpenses > 0 ? Math.min(100, Math.max(15, Math.round((customExpenses / Math.max(1, dailyTargetAmount)) * 100))) : 4;

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
      balance: liveOrdersRevenue,
      bars: [
        { label: "Sen", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Sel", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Rab", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Kam", income: 0, expense: 0, inPct: 4, exPct: 4 },
        {
          label: "Hari Ini",
          income: liveOrdersRevenue,
          expense: customExpenses,
          inPct: liveBarPct,
          exPct: expBarPct,
        },
        { label: "Sab", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Min", income: 0, expense: 0, inPct: 4, exPct: 4 },
      ],
    },
    weekly: {
      label: "Per Minggu (8 Mgg)",
      balance: liveOrdersRevenue,
      bars: [
        { label: "Mgg 1", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Mgg 2", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Mgg 3", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Mgg 4", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Mgg 5", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Mgg 6", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Mgg 7", income: 0, expense: 0, inPct: 4, exPct: 4 },
        {
          label: "Mgg Ini",
          income: liveOrdersRevenue,
          expense: customExpenses,
          inPct: liveBarPct,
          exPct: expBarPct,
        },
      ],
    },
    monthly: {
      label: "Bulanan (Tahun Ini)",
      balance: liveOrdersRevenue,
      bars: [
        { label: "Jan", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Feb", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Mar", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Apr", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "May", income: 0, expense: 0, inPct: 4, exPct: 4 },
        {
          label: "Bln Ini",
          income: liveOrdersRevenue,
          expense: customExpenses,
          inPct: liveBarPct,
          exPct: expBarPct,
        },
        { label: "Jul", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Aug", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Sep", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Oct", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Nov", income: 0, expense: 0, inPct: 4, exPct: 4 },
        { label: "Dec", income: 0, expense: 0, inPct: 4, exPct: 4 },
      ],
    },
  };

  const currentDataset = REVENUE_DATASETS[revenueTimeframe];
  const safeBarIdx =
    selectedBarIndex < currentDataset.bars.length ? selectedBarIndex : 0;
  const displayBarIdx =
    hoveredBarIndex !== null && hoveredBarIndex < currentDataset.bars.length
      ? hoveredBarIndex
      : safeBarIdx;
  const activePoint = currentDataset.bars[displayBarIdx];

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

  const filteredOrders = recentOrders
    .filter((ord) => {
      if (txStatusFilter !== "ALL") {
        const st = ord.status || "Preparing";
        if (st !== txStatusFilter) return false;
      }
      const q = globalSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        ord.customerName.toLowerCase().includes(q) ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.paymentMethod.toLowerCase().includes(q) ||
        ord.items.some((i) => i.product.name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (txSortField === "amount") {
        return txSortAsc
          ? a.totalAmount - b.totalAmount
          : b.totalAmount - a.totalAmount;
      }
      return txSortAsc ? 1 : -1;
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
                {/* 1. Royal Blue POS Terminal Card (Interactive on Hover & Click) */}
                <div
                  onClick={() => setIsFinanceModalOpen("terminal")}
                  className="group bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] rounded-2xl p-5 text-white shadow-[0_10px_25px_rgba(37,99,235,0.22)] hover:shadow-[0_16px_32px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden cursor-pointer"
                >
                  {/* Hover Explanation Badge */}
                  <div className="absolute top-3 right-14 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 bg-slate-950/85 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg pointer-events-none">
                    Klik untuk rincian saldo kasir
                  </div>

                  <div className="flex items-center justify-between mb-5">
                    <div className="w-9 h-7 rounded-md bg-white/20 border border-white/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-white group-hover:scale-110 transition-transform" />
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
                        Saldo Kasir Aktif (Klik Detail)
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

                {/* 2. 4 Quick Action Buttons Row (with Hover Tooltips) */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 grid grid-cols-4 gap-2 text-center">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    title="Tambah menu makanan atau minuman baru ke katalog pembeli"
                    className="group relative flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-blue-50/70 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-[#2563EB] group-hover:text-white border border-slate-200/70 flex items-center justify-center text-slate-700 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 group-hover:text-[#2563EB]">
                      Add Menu
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePage("crud")}
                    title="Buka halaman kelola stok pcs, harga, dan edit menu"
                    className="group relative flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-blue-50/70 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-[#2563EB] group-hover:text-white border border-slate-200/70 flex items-center justify-center text-slate-700 transition-colors">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 group-hover:text-[#2563EB]">
                      CRUD Stok
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePage("transactions")}
                    title="Kelola seluruh daftar pesanan masuk dan ubah status pesanan"
                    className="group relative flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-blue-50/70 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-[#2563EB] group-hover:text-white border border-slate-200/70 flex items-center justify-center text-slate-700 transition-colors">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 group-hover:text-[#2563EB]">
                      Pesanan
                    </span>
                  </button>

                  <Link
                    href="/"
                    title="Buka tampilan katalog pemesanan mandiri (Halaman Pembeli)"
                    className="group relative flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-blue-50/70 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-[#2563EB] group-hover:text-white border border-slate-200/70 flex items-center justify-center text-slate-700 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 group-hover:text-[#2563EB]">
                      Buka POS
                    </span>
                  </Link>
                </div>

                {/* 3. Daily Target Card (Clickable to Edit Daily Target + Hover Tooltip) */}
                <div
                  onClick={() => setIsFinanceModalOpen("target")}
                  className="group relative bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  {/* Hover Explanation Tooltip */}
                  <div className="hidden group-hover:block absolute -top-9 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                    Target Harian: {dailyTargetPct}% tercapai • Klik untuk ubah target
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                        Target Omzet Harian
                      </h3>
                      <span className="text-[9.5px] font-semibold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Ubah Target
                      </span>
                    </div>
                    <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
                  </div>

                  <StripedProgressBar percentage={dailyTargetPct} />

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      <strong className="text-slate-900">
                        {formatRupiah(todayRevenue)}
                      </strong>{" "}
                      • {dailyTargetPct}%
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatRupiah(dailyTargetAmount)}
                    </span>
                  </div>
                </div>

                {/* 4. Popular Items Card (Interactive Hover & Click to Edit Menu/Stock) */}
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
                      const itemOmzet =
                        item.soldCount * getEffectivePrice(item);

                      return (
                        <div
                          key={item.id}
                          onClick={() => openEditModal(item)}
                          className="group relative p-3 rounded-xl border border-slate-200/70 hover:border-[#2563EB] hover:bg-blue-50/20 hover:shadow-xs transition-all cursor-pointer space-y-2"
                        >
                          {/* Hover Tooltip for Popular Item */}
                          <div className="hidden group-hover:flex items-center justify-between text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                            <span>Omzet: {formatRupiah(itemOmzet)}</span>
                            <span className="text-blue-300 font-bold">
                              Klik Edit Menu / Stok →
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-6 h-6 rounded-md object-cover shrink-0"
                              />
                              <span className="text-xs font-bold text-slate-800 group-hover:text-[#2563EB] truncate transition-colors">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#2563EB] shrink-0">
                              Stok: {item.stock}
                            </span>
                          </div>

                          <StripedProgressBar percentage={soldPct} />

                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="text-slate-500">
                              <strong className="text-slate-800">
                                {item.soldCount} Terjual
                              </strong>{" "}
                              • {soldPct}% rasio
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
                {/* 1. Top 3 KPI Cards: Total Income, Total Expenses, Net Profit (Interactive on Hover & Click) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                  {/* Total Income */}
                  <div
                    onClick={() => setIsFinanceModalOpen("income")}
                    className="group relative bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-[#2563EB] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                      Akumulasi omzet kotor + pesanan baru • Klik untuk rincian
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-blue-50 border border-slate-200/70 flex items-center justify-center text-slate-700 transition-colors">
                        <ArrowDownLeft className="w-4 h-4 text-[#2563EB]" />
                      </div>
                      <span className="text-[10px] font-bold text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity">
                        Lihat Detail →
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        Total Pendapatan
                      </span>
                      <span className="text-lg font-extrabold text-slate-900 group-hover:text-[#2563EB] transition-colors tabular-nums mt-0.5 block">
                        {formatRupiah(totalIncome)}
                      </span>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                        {recentOrders.length} Transaksi Masuk
                      </span>
                    </div>
                  </div>

                  {/* Total Expenses */}
                  <div
                    onClick={() => setIsFinanceModalOpen("expenses")}
                    className="group relative bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-[#2563EB] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                      HPP bahan baku & operasional • Klik untuk sesuaikan biaya
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-rose-50 border border-slate-200/70 flex items-center justify-center text-slate-700 transition-colors">
                        <ArrowUpRight className="w-4 h-4 text-rose-500" />
                      </div>
                      <span className="text-[10px] font-bold text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity">
                        Atur Biaya →
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        Biaya Operasional
                      </span>
                      <span className="text-lg font-extrabold text-slate-900 group-hover:text-[#2563EB] transition-colors tabular-nums mt-0.5 block">
                        {formatRupiah(totalExpenses)}
                      </span>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[10px] font-bold">
                        Klik untuk atur HPP
                      </span>
                    </div>
                  </div>

                  {/* Total Net Profit */}
                  <div
                    onClick={() => setIsFinanceModalOpen("profit")}
                    className="group relative bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-[#2563EB] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                      Selisih Pendapatan dikurangi Biaya • Klik analisis margin
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-emerald-50 border border-slate-200/70 flex items-center justify-center text-slate-700 transition-colors">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-bold text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity">
                        Analisis →
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        Laba Bersih
                      </span>
                      <span className="text-lg font-extrabold text-slate-900 group-hover:text-[#2563EB] transition-colors tabular-nums mt-0.5 block">
                        {formatRupiah(totalNetProfit)}
                      </span>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                        Margin{" "}
                        {Math.round(
                          (totalNetProfit / Math.max(1, totalIncome)) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Aliran Pendapatan (Money Statistics Bidirectional Bar Chart: Interactive Hover & Click) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Aliran Pendapatan (Money Statistics)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Arahkan kursor atau klik batang grafik untuk melihat rincian laba periode
                      </p>
                    </div>

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
                            setHoveredBarIndex(null);
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

                  {/* Balance + Legend + Dynamic Interactive Callout Card */}
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-5 relative">
                    <div>
                      <span className="block text-[10px] text-slate-400">
                        Total Omzet ({currentDataset.label})
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
                        {formatRupiah(currentDataset.balance)}
                      </span>
                    </div>

                    {/* Dynamic Callout Card (Updates Live on Hover or Click) */}
                    <div
                      onClick={() => setIsFinanceModalOpen("income")}
                      className="bg-[#F8FAFC] hover:bg-blue-50/50 rounded-xl px-3.5 py-2.5 border border-blue-200/80 shadow-xs text-[11px] transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="font-bold text-[#2563EB] text-[10.5px]">
                          Periode: {activePoint.label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9.5px] font-bold">
                          Laba{" "}
                          {formatRupiah(
                            activePoint.income - activePoint.expense
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Pendapatan</span>
                        <strong className="text-slate-900 tabular-nums">
                          {formatRupiah(activePoint.income)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Modal (HPP)</span>
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

                  {/* Bidirectional Positive/Negative Bar Chart with Rich Hover Tooltips */}
                  <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pt-2">
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
                          const isSelected = idx === displayBarIdx;
                          const isHovered = idx === hoveredBarIndex;
                          const netBarProfit = bar.income - bar.expense;
                          const marginPct = Math.round(
                            (netBarProfit / Math.max(1, bar.income)) * 100
                          );

                          return (
                            <div
                              key={bar.label}
                              onMouseEnter={() => setHoveredBarIndex(idx)}
                              onMouseLeave={() => setHoveredBarIndex(null)}
                              onClick={() => {
                                setSelectedBarIndex(idx);
                                showToast(
                                  `Periode ${bar.label}: Omzet ${formatRupiah(
                                    bar.income
                                  )} | Laba Bersih ${formatRupiah(netBarProfit)} (${marginPct}%)`
                                );
                              }}
                              className={`h-full flex flex-col items-center justify-center relative z-10 cursor-pointer group rounded-xl transition-colors ${
                                isHovered
                                  ? "bg-blue-50/80"
                                  : isSelected
                                  ? "bg-slate-50/80"
                                  : ""
                              }`}
                            >
                              {/* Floating Hover Tooltip directly on the hovered bar */}
                              {isHovered && (
                                <div className="hidden sm:block absolute -top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                                  <p className="font-bold text-blue-300">
                                    {bar.label} • Margin {marginPct}%
                                  </p>
                                  <p>
                                    Masuk: {formatRupiah(bar.income)} | Modal:{" "}
                                    {formatRupiah(bar.expense)}
                                  </p>
                                </div>
                              )}

                              {/* Top Half (Positive Income Bar in Royal Blue #2563EB) */}
                              <div className="w-full h-1/2 flex items-end justify-center pb-[1px]">
                                <div
                                  style={{ height: `${bar.inPct}%` }}
                                  className={`w-full max-w-[20px] rounded-t-md transition-all duration-300 ${
                                    isSelected
                                      ? "bg-[#1D4ED8] ring-2 ring-blue-300 scale-x-105"
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
                                      ? "bg-[#60A5FA] scale-x-105"
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
                          <button
                            type="button"
                            key={bar.label}
                            onMouseEnter={() => setHoveredBarIndex(idx)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                            onClick={() => setSelectedBarIndex(idx)}
                            className={`text-[10px] font-semibold cursor-pointer transition ${
                              idx === displayBarIdx
                                ? "text-[#2563EB] font-extrabold underline underline-offset-4"
                                : "text-slate-400 hover:text-slate-700"
                            }`}
                          >
                            {bar.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Recent Transaction Table (Interactive Sort, Filter & Clickable Row for Order Detail Modal) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Recent Transaction (Pesanan Terbaru)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Klik baris pesanan untuk melihat detail struk atau klik status untuk ubah cepat
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Interactive Status Filter Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const cycle: ("ALL" | OrderStatusType)[] = [
                            "ALL",
                            "Preparing",
                            "Ready",
                            "Completed",
                          ];
                          const next =
                            cycle[
                              (cycle.indexOf(txStatusFilter) + 1) % cycle.length
                            ];
                          setTxStatusFilter(next);
                        }}
                        title="Klik untuk memfilter status pesanan"
                        className="px-3 py-1.5 rounded-lg border border-slate-200/80 text-[11px] font-semibold text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] transition cursor-pointer"
                      >
                        Status:{" "}
                        {txStatusFilter === "ALL" ? "Semua" : txStatusFilter} ▾
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePage("transactions")}
                        className="w-8 h-8 rounded-lg border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-[#2563EB] transition cursor-pointer"
                        title="Buka Halaman Seluruh Transaksi"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[520px] text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F8FAFC] text-[10.5px] font-semibold text-slate-400 border-y border-slate-200/70">
                          <th className="py-2.5 px-3">Menu & Pelanggan</th>
                          <th
                            onClick={() => {
                              setTxSortField("date");
                              setTxSortAsc((p) => !p);
                            }}
                            title="Klik untuk urutkan waktu"
                            className="py-2.5 px-3 cursor-pointer hover:text-[#2563EB]"
                          >
                            Waktu ⇅
                          </th>
                          <th
                            onClick={() => {
                              setTxSortField("amount");
                              setTxSortAsc((p) => !p);
                            }}
                            title="Klik untuk urutkan nominal tertinggi/terendah"
                            className="py-2.5 px-3 cursor-pointer hover:text-[#2563EB]"
                          >
                            Nominal ⇅
                          </th>
                          <th className="py-2.5 px-3">Metode</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredOrders.map((ord) => {
                          const currentStatus: OrderStatusType =
                            ord.status || "Preparing";
                          const isCompletedLocked =
                            currentStatus === "Completed";
                          const nextStatus: OrderStatusType =
                            currentStatus === "Preparing"
                              ? "Ready"
                              : "Completed";
                          const firstItem =
                            ord.items[0]?.product.name || "Pesanan Menu";

                          return (
                            <tr
                              key={ord.id}
                              onClick={() => setSelectedOrderDetail(ord)}
                              title="Klik untuk membuka detail struk pesanan ini"
                              className="group hover:bg-blue-50/40 transition cursor-pointer"
                            >
                              <td className="py-3 px-3">
                                <p className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
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
                              <td
                                className="py-3 px-3 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  disabled={isCompletedLocked}
                                  title={
                                    isCompletedLocked
                                      ? "Pesanan sudah selesai dan terkunci"
                                      : "Klik untuk mengubah status pesanan"
                                  }
                                  onClick={() => {
                                    if (isCompletedLocked) return;
                                    updateOrderStatus(ord.id, nextStatus);
                                    showToast(
                                      `Status ${ord.orderNumber} -> ${nextStatus}`
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                                    isCompletedLocked
                                      ? "bg-emerald-50 text-emerald-600 cursor-default"
                                      : currentStatus === "Ready"
                                      ? "bg-blue-50 text-[#2563EB] cursor-pointer hover:scale-105"
                                      : "bg-amber-50 text-amber-600 cursor-pointer hover:scale-105"
                                  }`}
                                >
                                  {isCompletedLocked
                                    ? "✓ Selesai"
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
                  COLUMN 3 (RIGHT — 3 cols): Interactive Statistics Donut Chart + Clickable Recent Activity
                 ------------------------------------------------------------- */}
              <div className="lg:col-span-12 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 sm:gap-5">
                {/* 1. Statistics Donut Chart Card (Kategori Produk — Interactive Hover & Click) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      Statistics (Kategori)
                    </h3>
                    <span className="text-[10.5px] font-semibold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md">
                      Interaktif
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Arahkan kursor ke lingkaran/kategori atau klik untuk lihat menu
                  </p>

                  {/* Sub-tabs matching FinPay Statistics card */}
                  <div className="grid grid-cols-2 border-b border-slate-100 text-[11px] mb-5">
                    <button
                      type="button"
                      onClick={() => setStatsSubTab("income")}
                      className={`pb-2 font-bold transition cursor-pointer ${
                        statsSubTab === "income"
                          ? "text-slate-900 border-b-2 border-[#2563EB]"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Omzet • {formatRupiah(totalCategoryRevenue)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatsSubTab("sold")}
                      className={`pb-2 font-bold transition cursor-pointer ${
                        statsSubTab === "sold"
                          ? "text-slate-900 border-b-2 border-[#2563EB]"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Terjual • {totalSoldUnits} Pcs
                    </button>
                  </div>

                  {/* Multi-Segment Interactive SVG Donut Chart */}
                  {(() => {
                    const activeSeg = donutSegments.find(
                      (s) => s.category === hoveredCategory
                    );
                    return (
                      <>
                        <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
                          <svg
                            viewBox="0 0 36 36"
                            className="w-full h-full -rotate-90 overflow-visible"
                          >
                            <circle
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="transparent"
                              stroke="#F1F5F9"
                              strokeWidth="4.2"
                            />
                            {donutSegments.map((seg) => {
                              const isHovered =
                                hoveredCategory === seg.category;
                              return (
                                <circle
                                  key={seg.category}
                                  cx="18"
                                  cy="18"
                                  r="15.915"
                                  fill="transparent"
                                  stroke={seg.color}
                                  strokeWidth={isHovered ? "5.4" : "4.2"}
                                  strokeDasharray={seg.strokeDasharray}
                                  strokeDashoffset={seg.strokeDashoffset}
                                  strokeLinecap="butt"
                                  onMouseEnter={() =>
                                    setHoveredCategory(seg.category)
                                  }
                                  onMouseLeave={() => setHoveredCategory(null)}
                                  onClick={() =>
                                    setSelectedCategoryDetail(seg.category)
                                  }
                                  className="transition-all duration-200 cursor-pointer"
                                  style={{
                                    opacity:
                                      hoveredCategory && !isHovered ? 0.35 : 1,
                                  }}
                                />
                              );
                            })}
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                              {activeSeg
                                ? `${activeSeg.category} (${activeSeg.pct}%)`
                                : statsSubTab === "income"
                                ? "Total Kategori"
                                : "Unit Terjual"}
                            </span>
                            <span className="text-sm sm:text-base font-extrabold text-slate-900 tabular-nums mt-0.5">
                              {activeSeg
                                ? statsSubTab === "income"
                                  ? formatRupiah(activeSeg.revenue)
                                  : `${activeSeg.sold} Pcs`
                                : statsSubTab === "income"
                                ? formatRupiah(totalCategoryRevenue)
                                : `${totalSoldUnits} Pcs`}
                            </span>
                            {activeSeg && (
                              <span className="text-[9.5px] font-bold text-[#2563EB] mt-0.5">
                                Klik lihat menu →
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Category Legend List */}
                        <div className="space-y-2 mt-4">
                          {donutSegments.map((seg) => {
                            const isHovered = hoveredCategory === seg.category;
                            return (
                              <div
                                key={seg.category}
                                onMouseEnter={() =>
                                  setHoveredCategory(seg.category)
                                }
                                onMouseLeave={() => setHoveredCategory(null)}
                                onClick={() =>
                                  setSelectedCategoryDetail(seg.category)
                                }
                                title={`Klik untuk melihat daftar menu dan stok kategori ${seg.category}`}
                                className={`flex items-center justify-between text-xs p-2 rounded-xl transition cursor-pointer ${
                                  isHovered
                                    ? "bg-blue-50/80 ring-1 ring-blue-200"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span
                                    style={{ backgroundColor: seg.color }}
                                    className="w-3.5 h-3.5 rounded-md inline-block shrink-0"
                                  />
                                  <span
                                    className={`font-semibold ${
                                      isHovered
                                        ? "text-[#2563EB] font-bold"
                                        : "text-slate-700"
                                    }`}
                                  >
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
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* 2. Recent Activity Timeline Card (Clickable Items) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Recent Activity
                      </h3>
                      <p className="text-[10.5px] text-slate-400">
                        Klik aktivitas untuk membuka detailnya
                      </p>
                    </div>
                    <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="block text-xs font-bold text-slate-900 mb-3">
                        Today
                      </span>
                      <div className="space-y-2.5 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
                        {[
                          {
                            title: `Order baru ${
                              recentOrders[0]?.orderNumber || "#F8371"
                            } diterima`,
                            desc: "Klik untuk melihat struk pesanan terbaru",
                            time: "14:05",
                            onClick: () => {
                              if (recentOrders[0]) {
                                setSelectedOrderDetail(recentOrders[0]);
                              } else {
                                setActivePage("transactions");
                              }
                            },
                          },
                          {
                            title: "Sinkronisasi stok katalog menu aktif",
                            desc: "Klik untuk membuka halaman CRUD & Stok",
                            time: "13:30",
                            onClick: () => setActivePage("crud"),
                          },
                          {
                            title: "Laporan target omzet harian diperbarui",
                            desc: "Klik untuk mengatur target omzet harian",
                            time: "12:45",
                            onClick: () => setIsFinanceModalOpen("target"),
                          },
                        ].map((act, i) => (
                          <div
                            key={i}
                            onClick={act.onClick}
                            title={act.desc}
                            className="group flex items-start gap-3 relative z-10 p-1.5 -mx-1.5 rounded-xl hover:bg-blue-50/50 transition cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-[#2563EB] border border-slate-200 flex items-center justify-center shrink-0 transition-colors">
                              <Clock className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 group-hover:text-[#2563EB] leading-snug transition-colors">
                                {act.title}
                              </p>
                              <span className="block text-[10px] text-slate-400">
                                {act.time} • {act.desc}
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
                      <div className="space-y-2.5 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
                        {[
                          {
                            title: "Rekapitulasi kasir harian ditutup",
                            desc: "Klik untuk melihat ringkasan laba bersih",
                            time: "21:00",
                            onClick: () => setIsFinanceModalOpen("profit"),
                          },
                          {
                            title: "Restock 24 pcs Steak sapi bakar",
                            desc: "Klik untuk edit stok Steak sapi bakar",
                            time: "16:20",
                            onClick: () => {
                              if (menuItems[0]) openEditModal(menuItems[0]);
                            },
                          },
                        ].map((act, i) => (
                          <div
                            key={i}
                            onClick={act.onClick}
                            title={act.desc}
                            className="group flex items-start gap-3 relative z-10 p-1.5 -mx-1.5 rounded-xl hover:bg-blue-50/50 transition cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-[#2563EB] border border-slate-200 flex items-center justify-center shrink-0 transition-colors">
                              <Clock className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 group-hover:text-[#2563EB] leading-snug transition-colors">
                                {act.title}
                              </p>
                              <span className="block text-[10px] text-slate-400">
                                {act.time} • {act.desc}
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

              <button
                type="button"
                onClick={openCreateModal}
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Baru</span>
              </button>
            </div>

            {/* Category Filter Pills + Mobile 2/3 Column Switcher */}
            <div className="bg-white rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                    className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition cursor-pointer shrink-0 ${
                      crudCategoryFilter === cat
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#F8FAFC] text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Mobile Grid Density Switcher (2 or 3 cards per row on phone) */}
              <div className="flex sm:hidden items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-slate-200/70 shrink-0">
                {([2, 3] as const).map((cols) => (
                  <button
                    type="button"
                    key={cols}
                    onClick={() => setMobileCrudCols(cols)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                      mobileCrudCols === cols
                        ? "bg-[#2563EB] text-white"
                        : "text-slate-500"
                    }`}
                    title={`Tampilkan ${cols} produk per baris`}
                  >
                    {cols}x
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Multi-Column CRUD Cards Grid (2-3 on Mobile, 3 on Tablet, 4 on Desktop) */}
            <div
              className={`grid ${
                mobileCrudCols === 3 ? "grid-cols-3" : "grid-cols-2"
              } sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 pb-8`}
            >
              {crudFilteredItems.map((item) => {
                const effectivePrice = getEffectivePrice(item);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-200/80 hover:border-blue-300 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                        <span className="text-[8.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                          {item.category}
                        </span>
                        {item.featured && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] text-[8px] sm:text-[9.5px] font-bold shrink-0">
                            HOT
                          </span>
                        )}
                      </div>

                      <div className="relative aspect-square sm:aspect-[4/3] w-full rounded-lg sm:rounded-xl overflow-hidden bg-[#F8FAFC] my-1 sm:my-2">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {item.stock <= 0 && (
                          <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                            <span className="px-2 py-0.5 rounded-full bg-white text-slate-900 text-[9px] sm:text-[10px] font-bold">
                              Habis
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-2 mt-1.5 sm:mt-2.5">
                        <h4
                          className="font-bold text-slate-900 text-[11px] sm:text-sm truncate"
                          title={item.name}
                        >
                          {item.name}
                        </h4>
                        <span className="font-extrabold text-[#2563EB] text-[11px] sm:text-sm shrink-0 tabular-nums">
                          {formatRupiah(effectivePrice)}
                        </span>
                      </div>

                      {item.description && (
                        <p className="hidden sm:line-clamp-2 text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Stock Stepper (Compact on Mobile, Full on Desktop) */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-2 sm:mt-3 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#F8FAFC] border border-slate-200/60 text-xs">
                        <div className="flex items-center justify-between sm:block">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 sm:block">
                            Stok
                          </span>
                          <span
                            className={`text-[10.5px] sm:text-xs font-extrabold ${
                              item.stock <= 0
                                ? "text-rose-600"
                                : "text-slate-900"
                            }`}
                          >
                            {item.stock} pcs
                          </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateProductStock(item.id, item.stock - 1)
                            }
                            className="w-6 h-6 rounded-md sm:rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateProductStock(item.id, item.stock + 1)
                            }
                            className="w-6 h-6 rounded-md sm:rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateProductStock(item.id, item.stock + 10)
                            }
                            className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-semibold text-[9px] sm:text-[10px] cursor-pointer"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#F1F5F9] hover:bg-[#2563EB] text-slate-700 hover:text-white font-semibold text-[10.5px] sm:text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          deleteMenuItem(item.id);
                          showToast(`Menu "${item.name}" telah dihapus.`);
                        }}
                        className="py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#F8FAFC] hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-semibold text-[10.5px] sm:text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
              VIEW C: HALAMAN TRANSAKSI LENGKAP (Table Layout — FinPay Blue & White)
             =================================================================== */
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-20 lg:pb-8 custom-scrollbar space-y-5">
            {/* 1. Top 2 KPI Summary Boxes (Pendapatan Berhasil & Total Transaksi) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Box 1: Pendapatan Berhasil */}
              <div
                onClick={() => setIsFinanceModalOpen("income")}
                title="Klik untuk melihat rincian pendapatan kasir"
                className="group bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-[#2563EB] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">
                    Pendapatan Berhasil
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#2563EB] tabular-nums tracking-tight">
                    {formatRupiah(liveOrdersRevenue)}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              {/* Box 2: Total Transaksi */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">
                    Total Transaksi
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                    {recentOrders.length}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#F8FAFC] border border-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* 2. Full-Width Transaction Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              {/* Table Container Header: Title on Left, Search + Status Filter on Right */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Daftar Transaksi Pesanan
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Kelola pesanan masuk dari pembeli secara real-time
                    </p>
                  </div>
                </div>

                {/* Search & Status Dropdown Controls */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      placeholder="Cari nama/metode..."
                      className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200/80 pl-8 pr-3 py-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] transition"
                    />
                  </div>

                  <select
                    value={txStatusFilter}
                    onChange={(e) =>
                      setTxStatusFilter(
                        e.target.value as "ALL" | OrderStatusType
                      )
                    }
                    className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#2563EB] cursor-pointer"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Preparing">Pending (Preparing)</option>
                    <option value="Ready">Siap (Ready)</option>
                    <option value="Completed">Selesai (Completed)</option>
                  </select>
                </div>
              </div>

              {/* Responsive Data Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200/70 text-[11px] font-bold text-slate-500">
                      <th className="py-3.5 px-5">Pembeli</th>
                      <th className="py-3.5 px-4">Rincian Pesanan</th>
                      <th className="py-3.5 px-4">Metode</th>
                      <th
                        onClick={() => {
                          if (txSortField === "amount") {
                            setTxSortAsc((p) => !p);
                          } else {
                            setTxSortField("amount");
                            setTxSortAsc(false);
                          }
                        }}
                        className="py-3.5 px-4 cursor-pointer hover:text-[#2563EB] select-none"
                        title="Klik untuk urutkan berdasarkan Total Belanja"
                      >
                        Total Belanja ⇅
                      </th>
                      <th
                        onClick={() => {
                          if (txSortField === "date") {
                            setTxSortAsc((p) => !p);
                          } else {
                            setTxSortField("date");
                            setTxSortAsc(false);
                          }
                        }}
                        className="py-3.5 px-4 cursor-pointer hover:text-[#2563EB] select-none"
                        title="Klik untuk urutkan berdasarkan Tanggal"
                      >
                        Tanggal ⇅
                      </th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-14 px-6 text-center text-slate-400"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-11 h-11 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-center text-slate-400">
                              <Receipt className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-slate-700">
                              Belum ada data transaksi pesanan
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Pesanan baru yang dibuat dari halaman pembeli akan langsung muncul di tabel ini.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const currentStatus: OrderStatusType =
                          order.status || "Preparing";
                        const itemsSummary = order.items
                          .map((i) => `${i.quantity}x ${i.product.name}`)
                          .join(", ");

                        const isCompletedLocked =
                          currentStatus === "Completed";
                        const statusConfig = isCompletedLocked
                          ? {
                              label: "Selesai",
                              bg: "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default",
                              dot: "bg-emerald-500",
                            }
                          : currentStatus === "Ready"
                          ? {
                              label: "Siap Diambil",
                              bg: "bg-blue-50 text-[#2563EB] border-blue-200 hover:bg-blue-100 cursor-pointer",
                              dot: "bg-[#2563EB]",
                            }
                          : {
                              label: "Pending",
                              bg: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 cursor-pointer",
                              dot: "bg-amber-500",
                            };

                        const nextStatus: OrderStatusType =
                          currentStatus === "Preparing"
                            ? "Ready"
                            : "Completed";

                        return (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrderDetail(order)}
                            title="Klik baris untuk melihat detail struk pesanan"
                            className="group hover:bg-blue-50/35 transition-colors cursor-pointer"
                          >
                            {/* 1. Pembeli & Order ID */}
                            <td className="py-3.5 px-5">
                              <p className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                                {order.customerName}
                              </p>
                              <span className="block text-[10.5px] font-medium text-slate-400 mt-0.5 tabular-nums">
                                {order.orderNumber} • {order.itemCount} Porsi
                              </span>
                            </td>

                            {/* 2. Rincian Menu */}
                            <td className="py-3.5 px-4 max-w-[260px]">
                              <p
                                className="text-slate-600 font-medium truncate"
                                title={itemsSummary}
                              >
                                {itemsSummary || "-"}
                              </p>
                            </td>

                            {/* 3. Metode Pembayaran */}
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-700">
                                {order.paymentMethod}
                              </span>
                            </td>

                            {/* 4. Total Belanja */}
                            <td className="py-3.5 px-4">
                              <span className="font-extrabold text-slate-900 tabular-nums">
                                {formatRupiah(order.totalAmount)}
                              </span>
                            </td>

                            {/* 5. Tanggal */}
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                              {order.createdAt}
                            </td>

                            {/* 6. Status Pill (Locked once Completed) */}
                            <td
                              className="py-3.5 px-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isCompletedLocked) return;
                                updateOrderStatus(order.id, nextStatus);
                                showToast(
                                  `Status ${order.orderNumber} diubah ke ${
                                    nextStatus === "Completed"
                                      ? "Selesai"
                                      : nextStatus
                                  }`
                                );
                              }}
                            >
                              <span
                                title={
                                  isCompletedLocked
                                    ? "Pesanan sudah selesai dan tidak dapat diubah lagi"
                                    : "Klik badge untuk mengubah status pesanan"
                                }
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition ${statusConfig.bg}`}
                              >
                                {isCompletedLocked ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                                  />
                                )}
                                {statusConfig.label}
                              </span>
                            </td>

                            {/* 7. Aksi (Detail Struk & Hapus) */}
                            <td
                              className="py-3.5 px-5 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetail(order)}
                                  title="Lihat Struk & Ubah Status"
                                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 flex items-center justify-center transition cursor-pointer"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteOrder(order.id);
                                    showToast(
                                      `Transaksi ${order.orderNumber} telah dihapus.`
                                    );
                                  }}
                                  title="Hapus Transaksi"
                                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
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
                      setFormGroup(e.target.value as MenuItem["group"])
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Deskripsi Produk (Opsional)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Kosongkan jika tidak perlu deskripsi
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Contoh: Snack ikan gurih renyah kemasan 25g, atau rincian bahan makanan..."
                  className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 p-3 font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#2563EB]"
                />
              </div>

              {/* Pilihan Mode Varian: Hanya Jumlah Pcs (Snack/Satuan) vs Pakai Detail Varian (Makanan/Minuman) */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    Tipe Pilihan Pembelian
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Sesuaikan dengan jenis produk
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormUseVariants(false)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      !formUseVariants
                        ? "bg-white border-[#2563EB] ring-1 ring-[#2563EB]/20"
                        : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                    }`}
                  >
                    <p
                      className={`text-xs font-extrabold ${
                        !formUseVariants ? "text-[#2563EB]" : "text-slate-700"
                      }`}
                    >
                      Hanya Jumlah Pcs
                    </p>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Tanpa varian (Cocok untuk Snack, Roti, Minuman Kemasan)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormUseVariants(true)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      formUseVariants
                        ? "bg-white border-[#2563EB] ring-1 ring-[#2563EB]/20"
                        : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                    }`}
                  >
                    <p
                      className={`text-xs font-extrabold ${
                        formUseVariants ? "text-[#2563EB]" : "text-slate-700"
                      }`}
                    >
                      Pakai Pilihan Varian / Detail
                    </p>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Ada opsi Porsi / Pedas / Es / Rasa saat pembeli memesan
                    </span>
                  </button>
                </div>

                {formUseVariants && (
                  <div className="pt-2 border-t border-slate-200/70 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="text-[10.5px] font-bold text-slate-700">
                        Daftar Pilihan Varian (pisahkan dengan koma):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          {
                            label: "Makanan",
                            val: "Porsi Reguler, Pedas Normal, Pedas Ekstra, Tanpa Sambal",
                          },
                          {
                            label: "Minuman",
                            val: "Dingin (Es), Hangat, Less Sugar",
                          },
                          {
                            label: "Rasa",
                            val: "Original, Balado, BBQ, Pedas",
                          },
                        ].map((preset) => (
                          <button
                            type="button"
                            key={preset.label}
                            onClick={() => setFormVariantsText(preset.val)}
                            className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-[10px] font-bold cursor-pointer transition"
                          >
                            + Preset {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formVariantsText}
                      onChange={(e) => setFormVariantsText(e.target.value)}
                      placeholder="Contoh: Porsi Reguler, Pedas Normal, Tanpa Sambal"
                      className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700">
                    Upload Foto Produk
                  </label>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-[10px] font-bold">
                    Auto-Convert ke .WEBP Ringan
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  id="product-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) {
                      handleUploadProductImage(selected);
                    }
                    e.target.value = "";
                  }}
                  className="hidden"
                />

                {!formImage ? (
                  <label
                    htmlFor="product-photo-upload"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOverUpload(true);
                    }}
                    onDragLeave={() => setIsDragOverUpload(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOverUpload(false);
                      const droppedFile = e.dataTransfer.files?.[0];
                      if (droppedFile) {
                        handleUploadProductImage(droppedFile);
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                      isDragOverUpload
                        ? "border-[#2563EB] bg-blue-50/60"
                        : "border-slate-300 bg-[#F8FAFC] hover:border-[#2563EB] hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-[#2563EB] flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        {isConvertingWebp
                          ? "Mengompresi & mengubah ke format WebP..."
                          : "Klik untuk pilih foto produk atau tarik ke sini"}
                      </p>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        Mendukung JPG, PNG, JPEG, WEBP — otomatis diubah ke .webp agar hemat ukuran & cepat dimuat
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={formImage}
                        alt="Preview Produk"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9.5px] font-extrabold uppercase">
                            WEBP AKTIF
                          </span>
                          {uploadedImageMeta && (
                            <span className="text-[10px] font-bold text-[#2563EB]">
                              {uploadedImageMeta.webpKb} KB
                              {uploadedImageMeta.originalKb >
                                uploadedImageMeta.webpKb && (
                                <span className="text-emerald-600 ml-1">
                                  (Hemat{" "}
                                  {Math.max(
                                    1,
                                    Math.round(
                                      ((uploadedImageMeta.originalKb -
                                        uploadedImageMeta.webpKb) /
                                        uploadedImageMeta.originalKb) *
                                        100
                                    )
                                  )}
                                  % dari {uploadedImageMeta.originalKb} KB)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate mt-1">
                          {uploadedImageMeta
                            ? uploadedImageMeta.fileName
                            : "foto-produk.webp"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {uploadedImageMeta
                            ? `Resolusi optimal ${uploadedImageMeta.width}×${uploadedImageMeta.height}px`
                            : "Tersimpan dalam format WebP terkompresi"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-1.5 shrink-0">
                      <label
                        htmlFor="product-photo-upload"
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-[#2563EB] border border-slate-200 hover:border-blue-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        Ganti Foto
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormImage("");
                          setUploadedImageMeta(null);
                        }}
                        className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
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

      {/* =====================================================================
          INTERACTIVE MODAL 1: CATEGORY DETAIL & QUICK STOCK (Clicked from Donut Chart)
         ===================================================================== */}
      {selectedCategoryDetail && (
        <div
          onClick={() => setSelectedCategoryDetail(null)}
          style={{
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
          className="fixed inset-0 z-[115] bg-slate-950/55 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[88vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#2563EB] text-[10px] font-bold uppercase">
                  Statistik Kategori
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Rincian Menu Kategori: {selectedCategoryDetail}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategoryDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 mb-5">
              {menuItems
                .filter((m) => m.category === selectedCategoryDetail)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/70"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] font-semibold text-[#2563EB]">
                          {formatRupiah(getEffectivePrice(item))} •{" "}
                          {item.soldCount} Terjual
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateProductStock(item.id, item.stock - 1)
                        }
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-extrabold text-slate-900 min-w-[44px] text-center">
                        {item.stock} pcs
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProductStock(item.id, item.stock + 1)
                        }
                        className="w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center hover:bg-blue-700 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCategoryDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setCrudCategoryFilter(selectedCategoryDetail);
                  setSelectedCategoryDetail(null);
                  setActivePage("crud");
                }}
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Buka di Halaman CRUD →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          INTERACTIVE MODAL 2: ORDER RECEIPT DETAIL (Clicked from Recent Transaction Row)
         ===================================================================== */}
      {selectedOrderDetail && (
        <div
          onClick={() => setSelectedOrderDetail(null)}
          style={{
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
          className="fixed inset-0 z-[115] bg-slate-950/55 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#2563EB] text-[10px] font-bold">
                  Struk Pesanan {selectedOrderDetail.orderNumber}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {selectedOrderDetail.customerName}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedOrderDetail.createdAt} • Pembayaran{" "}
                  {selectedOrderDetail.paymentMethod}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 my-4 max-h-60 overflow-y-auto custom-scrollbar">
              {selectedOrderDetail.items.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={line.product.imageUrl}
                      alt={line.product.name}
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-slate-900">
                        {line.product.name}
                      </p>
                      <span className="text-[10.5px] text-slate-400">
                        {line.quantity} pcs x {formatRupiah(line.unitPrice)}
                      </span>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {formatRupiah(line.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs mb-4">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">
                  {formatRupiah(selectedOrderDetail.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Pajak (10%)</span>
                <span className="font-bold text-slate-800">
                  {formatRupiah(selectedOrderDetail.taxTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                <span>Total Bayar</span>
                <span className="text-[#2563EB]">
                  {formatRupiah(selectedOrderDetail.totalAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">
                Status Pesanan
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["Preparing", "Ready", "Completed"] as OrderStatusType[]).map(
                  (st) => {
                    const currentSt =
                      selectedOrderDetail.status || "Preparing";
                    const active = currentSt === st;
                    const isLocked = currentSt === "Completed" && !active;

                    return (
                      <button
                        type="button"
                        key={st}
                        disabled={isLocked}
                        onClick={() => {
                          if (currentSt === "Completed") return;
                          updateOrderStatus(selectedOrderDetail.id, st);
                          setSelectedOrderDetail({
                            ...selectedOrderDetail,
                            status: st,
                          });
                          showToast(
                            `Status ${selectedOrderDetail.orderNumber} -> ${
                              st === "Completed" ? "Selesai" : st
                            }`
                          );
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition ${
                          active
                            ? st === "Completed"
                              ? "bg-emerald-600 text-white cursor-default"
                              : "bg-[#2563EB] text-white cursor-pointer"
                            : isLocked
                            ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                            : "bg-[#F8FAFC] text-slate-600 hover:bg-slate-100 cursor-pointer"
                        }`}
                      >
                        {st === "Completed" ? "Selesai" : st}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          INTERACTIVE MODAL 3: FINANCIAL BREAKDOWN & TARGET ADJUSTER (Clicked from KPI Cards / Target Card)
         ===================================================================== */}
      {isFinanceModalOpen && (
        <div
          onClick={() => setIsFinanceModalOpen(null)}
          style={{
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
          className="fixed inset-0 z-[115] bg-slate-950/55 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#2563EB] text-[10px] font-bold uppercase">
                  Manajemen Keuangan & Target POS
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {isFinanceModalOpen === "target"
                    ? "Atur Target Omzet Harian"
                    : isFinanceModalOpen === "expenses"
                    ? "Atur Biaya Operasional (HPP)"
                    : "Rincian Saldo & Laba Bersih Kasir"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFinanceModalOpen(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Pendapatan Kotor</span>
                  <strong className="text-slate-900">
                    {formatRupiah(totalIncome)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Biaya Operasional (HPP)</span>
                  <strong className="text-rose-600">
                    -{formatRupiah(totalExpenses)}
                  </strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm">
                  <span className="text-slate-900">Laba Bersih (Net Profit)</span>
                  <span className="text-emerald-600">
                    {formatRupiah(totalNetProfit)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Omzet Harian (Rp)
                </label>
                <input
                  type="number"
                  step={100000}
                  min={500000}
                  value={dailyTargetAmount}
                  onChange={(e) =>
                    setDailyTargetAmount(
                      Math.max(100000, Number(e.target.value) || 0)
                    )
                  }
                  className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Estimasi Biaya Operasional / HPP Bulanan (Rp)
                </label>
                <input
                  type="number"
                  step={100000}
                  min={0}
                  value={customExpenses}
                  onChange={(e) =>
                    setCustomExpenses(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsFinanceModalOpen(null);
                  showToast(
                    "Parameter target harian & biaya operasional berhasil diperbarui."
                  );
                }}
                className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition"
              >
                Simpan & Terapkan ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
