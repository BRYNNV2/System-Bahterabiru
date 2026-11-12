"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Banknote,
  QrCode,
  CheckCircle2,
  ScanLine,
  Store,
  RotateCcw,
  LayoutGrid,
} from "lucide-react";
import {
  MenuItem,
  SIDEBAR_GROUPS,
  SidebarGroupType,
  formatRupiah,
  getEffectivePrice,
} from "@/data/initialMenu";
import { PaymentMethod } from "@/store/usePosStore";
import {
  BarcodeScannerModal,
  ScannedKasirItem,
  playScannerBeep,
} from "@/components/pos/BarcodeScannerModal";

interface ManualCashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onCompleteCheckout: (payload: {
    items: ScannedKasirItem[];
    customerName: string;
    paymentMethod: PaymentMethod;
  }) => void;
  onQuickBindBarcode?: (productId: string, barcode: string) => void;
}

const QUICK_CASH_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export function ManualCashierModal({
  isOpen,
  onClose,
  menuItems,
  onCompleteCheckout,
  onQuickBindBarcode,
}: ManualCashierModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<SidebarGroupType>("All");
  const [cart, setCart] = useState<ScannedKasirItem[]>([]);
  const [customerName, setCustomerName] = useState(
    "Pembeli Langsung (Etalase)"
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isEmbeddedScannerOpen, setIsEmbeddedScannerOpen] = useState(false);
  // Tab khusus tampilan HP/Mobile agar tidak perlu scroll panjang ke bawah
  const [mobileActiveTab, setMobileActiveTab] = useState<"catalog" | "cart">(
    "catalog"
  );

  // Layar Konfirmasi Struk & Kembalian setelah klik Selesaikan Pembelian
  const [completedReceipt, setCompletedReceipt] = useState<{
    items: ScannedKasirItem[];
    totalAmount: number;
    paymentMethod: PaymentMethod;
    cashPaid: number;
    changeAmount: number;
    customerName: string;
    time: string;
  } | null>(null);

  const filteredMenu = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchGroup =
        selectedGroup === "All" ||
        item.group === selectedGroup ||
        item.category === selectedGroup;
      if (!matchGroup) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.toLowerCase().includes(q))
      );
    });
  }, [menuItems, searchQuery, selectedGroup]);

  const totalItemsCount = useMemo(
    () => cart.reduce((sum, entry) => sum + entry.quantity, 0),
    [cart]
  );

  const totalAmount = useMemo(
    () =>
      cart.reduce(
        (sum, entry) => sum + getEffectivePrice(entry.product) * entry.quantity,
        0
      ),
    [cart]
  );

  const numericCashReceived = Number(cashReceived) || 0;
  const effectiveCashPaid =
    paymentMethod === "Cash"
      ? numericCashReceived > 0
        ? numericCashReceived
        : totalAmount
      : totalAmount;
  const changeAmount = Math.max(0, effectiveCashPaid - totalAmount);
  const isCashUnderpaid =
    paymentMethod === "Cash" &&
    numericCashReceived > 0 &&
    numericCashReceived < totalAmount;

  const getQtyInCart = (productId: string) => {
    const found = cart.find((c) => c.product.id === productId);
    return found ? found.quantity : 0;
  };

  const addItemToManualCart = (product: MenuItem) => {
    const currentQty = getQtyInCart(product.id);
    if (product.stock <= 0 || currentQty >= product.stock) {
      playScannerBeep("error");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? {
                ...i,
                product,
                quantity: Math.min(product.stock, i.quantity + 1),
              }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const decrementItemFromManualCart = (productId: string) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItemFromManualCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleResetNewTransaction = () => {
    setCart([]);
    setCashReceived("");
    setCustomerName("Pembeli Langsung (Etalase)");
    setPaymentMethod("Cash");
    setCompletedReceipt(null);
    setMobileActiveTab("catalog");
  };

  const handleProcessSale = () => {
    if (cart.length === 0 || isCashUnderpaid) return;

    const finalCustomer =
      customerName.trim() || "Pembeli Langsung (Etalase)";

    onCompleteCheckout({
      items: cart,
      customerName: finalCustomer,
      paymentMethod,
    });

    playScannerBeep("success");

    setCompletedReceipt({
      items: cart,
      totalAmount,
      paymentMethod,
      cashPaid: effectiveCashPaid,
      changeAmount,
      customerName: finalCustomer,
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      className="fixed inset-0 z-[125] bg-slate-950/65 flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8FAFC] rounded-t-3xl sm:rounded-3xl w-full max-w-[1380px] h-[95dvh] sm:h-[90vh] shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden"
      >
        {/* Header Modal Kasir Manual (Lebih Besar & Jelas) */}
        <div className="bg-white px-4 sm:px-7 py-3.5 sm:py-4.5 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-sm shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg lg:text-xl font-extrabold text-slate-900 truncate">
                Kasir Input Manual — Pembelian Langsung di Etalase
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                Klik menu yang dibeli pelanggan secara langsung • Stok etalase otomatis berkurang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsEmbeddedScannerOpen(true)}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs"
              title="Buka kamera jika pembeli juga membeli produk kemasan ber-barcode"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden sm:inline">+ Scan Barcode</span>
              <span className="sm:hidden">Scan</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Navigasi Tab Cepat Khusus Layar HP / Tablet Kecil (< lg) */}
        {!completedReceipt && (
          <div className="flex lg:hidden bg-white px-4 py-2 border-b border-slate-200/80 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileActiveTab("catalog")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mobileActiveTab === "catalog"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pilih Produk Etalase ({filteredMenu.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileActiveTab("cart")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mobileActiveTab === "cart"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                Keranjang &amp; Bayar ({totalItemsCount} pcs)
              </span>
            </button>
          </div>
        )}

        {/* Jika Transaksi Baru Saja Selesai -> Tampilkan Ringkasan Struk & Uang Kembalian */}
        {completedReceipt ? (
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex items-center justify-center">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                  TRANSAKSI BERHASIL &amp; STOK ETALASE DIPOTONG
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2.5">
                  {completedReceipt.customerName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Pukul {completedReceipt.time} • Metode{" "}
                  {completedReceipt.paymentMethod}
                </p>
              </div>

              {/* Kotak rincian uang & kembalian */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2.5 text-xs sm:text-sm text-left">
                <div className="max-h-40 overflow-y-auto space-y-2 pb-2.5 border-b border-slate-200/70">
                  {completedReceipt.items.map((entry) => (
                    <div
                      key={entry.product.id}
                      className="flex items-center justify-between text-slate-700"
                    >
                      <span>
                        <strong>{entry.quantity}x</strong> {entry.product.name}
                      </span>
                      <span className="font-bold tabular-nums">
                        {formatRupiah(
                          getEffectivePrice(entry.product) * entry.quantity
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-slate-600 pt-1">
                  <span className="font-bold">Total Belanja</span>
                  <span className="font-extrabold text-slate-900 text-base sm:text-lg tabular-nums">
                    {formatRupiah(completedReceipt.totalAmount)}
                  </span>
                </div>

                {completedReceipt.paymentMethod === "Cash" && (
                  <>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Uang Tunai Diterima</span>
                      <span className="font-bold text-slate-800 tabular-nums">
                        {formatRupiah(completedReceipt.cashPaid)}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900 mt-1">
                      <span className="font-extrabold text-sm">
                        Uang Kembalian
                      </span>
                      <span className="text-lg sm:text-xl font-extrabold text-emerald-700 tabular-nums">
                        {formatRupiah(completedReceipt.changeAmount)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleResetNewTransaction}
                  className="py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Input Pembeli Berikutnya</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleResetNewTransaction();
                    onClose();
                  }}
                  className="py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
                >
                  Selesai &amp; Tutup
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Layout 2 Kolom Besar & Responsif */
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 lg:divide-x divide-slate-200/80 overflow-hidden">
            {/* KOLOM KIRI (7 cols di Desktop): Pilihan Produk Etalase */}
            <div
              className={`lg:col-span-7 flex flex-col h-full min-h-0 p-3.5 sm:p-6 space-y-3.5 overflow-hidden ${
                mobileActiveTab === "catalog" ? "flex" : "hidden lg:flex"
              }`}
            >
              {/* Search & Filter Group */}
              <div className="space-y-3 shrink-0">
                <div className="relative flex items-center bg-white border border-slate-200/90 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-2xs">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        const q = searchQuery.trim().toLowerCase();
                        const exact = menuItems.find(
                          (m) =>
                            (m.barcode && m.barcode.toLowerCase() === q) ||
                            m.name.toLowerCase() === q
                        );
                        if (exact && exact.stock > 0) {
                          e.preventDefault();
                          addItemToManualCart(exact);
                          playScannerBeep("success");
                          setSearchQuery("");
                        }
                      }
                    }}
                    placeholder="Cari nama makanan, minuman, gorengan, atau scan barcode..."
                    className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Kategori Pills Lebih Besar */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                  {SIDEBAR_GROUPS.map((grp) => {
                    const active = selectedGroup === grp.id;
                    return (
                      <button
                        type="button"
                        key={grp.id}
                        onClick={() => setSelectedGroup(grp.id)}
                        className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition cursor-pointer ${
                          active
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {grp.label === "All" ? "Semua Menu" : grp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid Kartu Produk Etalase (Klik langsung +1) */}
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 pb-4">
                  {filteredMenu.map((item) => {
                    const qtyInCart = getQtyInCart(item.id);
                    const remainingStock = Math.max(0, item.stock - qtyInCart);
                    const isOutOfStock = item.stock <= 0 || remainingStock <= 0;
                    const unitPrice = getEffectivePrice(item);

                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => addItemToManualCart(item)}
                        disabled={isOutOfStock}
                        className={`group text-left bg-white rounded-2xl p-3 sm:p-3.5 border transition-all flex flex-col justify-between relative ${
                          qtyInCart > 0
                            ? "border-[#2563EB] ring-2 ring-blue-500/20 shadow-sm"
                            : "border-slate-200/80 hover:border-blue-300 hover:shadow-xs"
                        } ${
                          isOutOfStock
                            ? "opacity-55 cursor-not-allowed"
                            : "cursor-pointer active:scale-[0.98]"
                        }`}
                      >
                        <div>
                          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {/* Badge Jumlah yang Dipilih */}
                            {qtyInCart > 0 && (
                              <span className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-[11px] sm:text-xs font-extrabold shadow-md">
                                {qtyInCart}x dipilih
                              </span>
                            )}
                            {/* Badge Sisa Stok Etalase */}
                            <span
                              className={`absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold ${
                                remainingStock <= 0
                                  ? "bg-rose-600 text-white"
                                  : remainingStock <= 5
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-900/80 text-white"
                              }`}
                            >
                              {remainingStock <= 0
                                ? "Stok Habis"
                                : `Sisa: ${remainingStock} pcs`}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {item.category}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                          <span className="text-xs sm:text-base font-extrabold text-[#2563EB] tabular-nums">
                            {formatRupiah(unitPrice)}
                          </span>
                          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 group-hover:bg-[#2563EB] group-hover:text-white text-slate-700 flex items-center justify-center transition-colors">
                            <Plus className="w-4 h-4" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sticky Bar Bawah Khusus Layar HP (< lg) Saat Ada Barang Dipilih */}
              {cart.length > 0 && (
                <div className="lg:hidden pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMobileActiveTab("cart")}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#2563EB] text-white font-extrabold text-xs sm:text-sm flex items-center justify-between shadow-lg cursor-pointer"
                  >
                    <span>
                      {totalItemsCount} pcs dipilih • {formatRupiah(totalAmount)}
                    </span>
                    <span className="underline">Lanjut Bayar →</span>
                  </button>
                </div>
              )}
            </div>

            {/* KOLOM KANAN (5 cols di Desktop): Keranjang Pembelian Langsung + Kalkulator Kembalian */}
            <div
              className={`lg:col-span-5 bg-white flex flex-col justify-between h-full min-h-0 p-4 sm:p-6 overflow-y-auto custom-scrollbar ${
                mobileActiveTab === "cart" ? "flex" : "hidden lg:flex"
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Daftar Belanja Pembeli ({totalItemsCount} pcs)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sesuaikan jumlah pcs atau hapus jika batal
                    </p>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {/* Daftar Item di Keranjang */}
                {cart.length === 0 ? (
                  <div className="py-10 px-5 rounded-2xl bg-[#F8FAFC] border border-dashed border-slate-200 text-center space-y-1.5">
                    <ShoppingBag className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="text-xs sm:text-sm font-bold text-slate-600">
                      Belum ada produk dipilih
                    </p>
                    <p className="text-xs text-slate-400">
                      Klik foto produk di sebelah kiri sesuai pesanan pembeli di etalase.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {cart.map((entry) => {
                      const unitPrice = getEffectivePrice(entry.product);
                      return (
                        <div
                          key={entry.product.id}
                          className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={entry.product.imageUrl}
                              alt={entry.product.name}
                              className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white shadow-2xs"
                            />
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                                {entry.product.name}
                              </p>
                              <p className="text-xs text-slate-500 font-semibold tabular-nums mt-0.5">
                                {formatRupiah(unitPrice)} × {entry.quantity} ={" "}
                                <strong className="text-slate-900">
                                  {formatRupiah(unitPrice * entry.quantity)}
                                </strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                decrementItemFromManualCart(entry.product.id)
                              }
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums">
                              {entry.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => addItemToManualCart(entry.product)}
                              disabled={entry.quantity >= entry.product.stock}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-slate-700 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeItemFromManualCart(entry.product.id)
                              }
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer ml-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Pembayaran & Kalkulator Uang Kembalian */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Nama Pembeli / Catatan
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Pembeli Langsung (Etalase)"
                      className="w-full rounded-xl bg-[#F8FAFC] border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Metode Pembayaran
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("Cash")}
                        className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          paymentMethod === "Cash"
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-[#F8FAFC] border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Cash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("QRIS")}
                        className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          paymentMethod === "QRIS"
                            ? "bg-[#2563EB] border-[#2563EB] text-white"
                            : "bg-[#F8FAFC] border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>QRIS</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kalkulator Uang Diterima & Kembalian (Selalu tampil saat metode Cash dipilih) */}
                {paymentMethod === "Cash" && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Uang Tunai Diterima (Rp)
                      </label>
                      {totalAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => setCashReceived(String(totalAmount))}
                          className="text-xs font-extrabold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          Uang Pas ({formatRupiah(totalAmount)})
                        </button>
                      )}
                    </div>

                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder={
                        totalAmount > 0
                          ? `Ketik uang pembeli atau klik nominal di bawah...`
                          : "Pilih produk dulu untuk menghitung kembalian..."
                      }
                      className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:border-[#2563EB]"
                    />

                    {/* Tombol Pecahan Uang Cepat */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {QUICK_CASH_AMOUNTS.map((amt) => (
                        <button
                          type="button"
                          key={amt}
                          onClick={() => setCashReceived(String(amt))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            numericCashReceived === amt
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {formatRupiah(amt)}
                        </button>
                      ))}
                    </div>

                    {/* Indikator Uang Kembalian / Kurang Bayar */}
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
                        isCashUnderpaid
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-emerald-50 border-emerald-200 text-emerald-900"
                      }`}
                    >
                      <span className="font-bold">
                        {isCashUnderpaid
                          ? "Uang Kurang:"
                          : "Kembalian ke Pembeli:"}
                      </span>
                      <span className="text-base sm:text-lg font-extrabold tabular-nums">
                        {isCashUnderpaid
                          ? formatRupiah(totalAmount - numericCashReceived)
                          : formatRupiah(changeAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Total & Tombol Selesaikan Pembelian */}
                <div className="pt-1 space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-500">
                      Total Tagihan Kasir
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessSale}
                    disabled={cart.length === 0 || isCashUnderpaid}
                    className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#2563EB] hover:bg-blue-700 disabled:opacity-45 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>
                      Selesaikan Pembelian &amp; Potong Stok (
                      {formatRupiah(totalAmount)})
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scanner Barcode Terintegrasi jika Pembeli Langsung juga Membeli Barang Kemasan */}
      <BarcodeScannerModal
        isOpen={isEmbeddedScannerOpen}
        onClose={() => setIsEmbeddedScannerOpen(false)}
        mode="pos-checkout"
        title="Scan Produk Kemasan ke Keranjang Kasir Manual"
        menuItems={menuItems}
        onAddToCart={(productId) => {
          const found = menuItems.find((m) => m.id === productId);
          if (found) addItemToManualCart(found);
        }}
        getItemQuantity={getQtyInCart}
        onCompleteAdminCheckout={(payload) => {
          onCompleteCheckout(payload);
          setIsEmbeddedScannerOpen(false);
        }}
        onQuickBindBarcode={onQuickBindBarcode}
      />
    </div>
  );
}
