"use client";

import React, { useState } from "react";
import {
  Check,
  Printer,
  RotateCcw,
  X,
  ShieldCheck,
  Clock,
  BellRing,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import {
  usePosStore,
  CompletedOrder,
  OrderStatusType,
} from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewReceiptOnly?: boolean;
}

export function TransactionModal({
  isOpen,
  onClose,
  viewReceiptOnly = false,
}: TransactionModalProps) {
  const {
    cart,
    menuItems,
    customerName,
    orderMode,
    orderNote,
    completeCheckout,
    paymentMethod,
    setPaymentMethod,
    lastBuyerOrder,
  } = usePosStore();
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Gunakan status terbaru dari lastBuyerOrder yang disinkronkan real-time setiap 3 detik
  const activeReceiptOrder =
    viewReceiptOnly && lastBuyerOrder
      ? lastBuyerOrder
      : completedOrder
      ? lastBuyerOrder && lastBuyerOrder.id === completedOrder.id
        ? lastBuyerOrder
        : completedOrder
      : null;

  const populatedCart = cart
    .map((c) => {
      const product = menuItems.find((m) => m.id === c.productId);
      if (!product) return null;
      const unitPrice = getEffectivePrice(product);
      return {
        ...c,
        product,
        unitPrice,
        lineTotal: unitPrice * c.quantity,
      };
    })
    .filter(Boolean) as {
    productId: string;
    quantity: number;
    product: (typeof menuItems)[number];
    unitPrice: number;
    lineTotal: number;
  }[];

  const totalQty = populatedCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPayment = populatedCart.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );

  const handleConfirmOrder = async () => {
    setIsProcessing(true);
    const order = completeCheckout();
    if (order) {
      setCompletedOrder(order);
      try {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            items: order.items.map((i) => ({
              productId: i.product.id,
              productName: i.product.name,
              quantity: i.quantity,
              originalPrice: i.product.price,
              unitPrice: i.unitPrice,
              lineTotal: i.lineTotal,
            })),
            subtotal: order.subtotal,
            discountTotal: order.discountTotal,
            taxTotal: order.taxTotal,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
          }),
        });
      } catch {
        // Fallback to local store
      }
    }
    setIsProcessing(false);
  };

  const handleCloseAll = () => {
    setCompletedOrder(null);
    onClose();
  };

  const paymentOptions: ("Cash" | "Debit" | "QRIS")[] = [
    "Cash",
    "Debit",
    "QRIS",
  ];

  const currentStatus: OrderStatusType =
    activeReceiptOrder?.status || "Preparing";

  const statusSteps: {
    id: OrderStatusType;
    label: string;
    desc: string;
  }[] = [
    {
      id: "Preparing",
      label: "Diproses",
      desc: "Pesanan diterima & sedang disiapkan",
    },
    {
      id: "Ready",
      label: "Siap Diambil",
      desc: "Silakan ambil pesanan Anda di kasir",
    },
    {
      id: "Completed",
      label: "Selesai",
      desc: "Pesanan telah diserahkan ke pembeli",
    },
  ];

  const currentStepIndex =
    currentStatus === "Completed" ? 2 : currentStatus === "Ready" ? 1 : 0;

  return (
    <div
      onClick={handleCloseAll}
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      className="fixed inset-0 z-[100] bg-zinc-950/55 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-zinc-100 max-h-[92dvh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95"
      >
        {!activeReceiptOrder ? (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  Konfirmasi Transaksi Kasir
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseAll}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Payment method toggle inside modal */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-zinc-400 mb-2 uppercase">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentOptions.map((opt) => {
                  const isDebitOngoing = opt === "Debit";
                  return (
                    <button
                      type="button"
                      key={opt}
                      disabled={isDebitOngoing}
                      onClick={() => {
                        if (!isDebitOngoing) setPaymentMethod(opt);
                      }}
                      title={
                        isDebitOngoing
                          ? "Pembayaran Debit sedang dalam pengembangan (On Going)"
                          : `Pilih pembayaran ${opt}`
                      }
                      className={`relative py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        isDebitOngoing
                          ? "bg-zinc-100/80 border-zinc-200/70 text-zinc-400 cursor-not-allowed"
                          : paymentMethod === opt
                          ? "bg-zinc-900 border-zinc-900 text-white cursor-pointer"
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 cursor-pointer"
                      }`}
                    >
                      <span>{opt}</span>
                      {isDebitOngoing && (
                        <span className="block text-[8.5px] font-extrabold uppercase tracking-wider text-amber-600 leading-none mt-0.5">
                          On Going
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer & Order Items Breakdown */}
            <div className="mt-4 p-4 rounded-2xl bg-[#FAFAFA] border border-zinc-100 text-xs space-y-2.5">
              <div className="flex justify-between text-zinc-500">
                <span>Nama Pembeli</span>
                <span className="font-bold text-zinc-900">
                  {customerName.trim() || "Pelanggan Kantin"}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Tipe Pesanan</span>
                <span className="font-semibold text-zinc-800">
                  {orderMode === "Reservation" ? "Reservasi" : "Beli Langsung"}
                </span>
              </div>
              {orderNote.trim() && (
                <div className="flex justify-between gap-3 text-zinc-500">
                  <span className="shrink-0">Catatan</span>
                  <span className="font-medium text-zinc-700 text-right truncate">
                    {orderNote.trim()}
                  </span>
                </div>
              )}

              {/* Daftar Produk yang Dibeli */}
              <div className="border-t border-zinc-200/80 pt-2.5 mt-1 space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-0.5">
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Rincian Pesanan ({totalQty} Pcs)
                </span>
                {populatedCart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-800 truncate">
                        {item.product.name}
                      </p>
                      <span className="text-[10.5px] text-zinc-400 tabular-nums">
                        {item.quantity} x {formatRupiah(item.unitPrice)}
                      </span>
                    </div>
                    <span className="font-extrabold text-zinc-900 tabular-nums shrink-0">
                      {formatRupiah(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Bayar */}
              <div className="border-t border-zinc-200/80 pt-2.5 flex items-center justify-between text-sm font-black text-zinc-900">
                <span>Total Pembayaran</span>
                <span className="tabular-nums">
                  {formatRupiah(totalPayment)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={handleCloseAll}
                className="py-3 rounded-2xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-bold transition cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                className="py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isProcessing ? "Memproses..." : "Selesaikan Bayar"}
              </button>
            </div>
          </div>
        ) : (
          /* =================================================================
             STRUK DIGITAL RESMI + PELACAK STATUS REAL-TIME (TUNJUKKAN KE KASIR)
             ================================================================= */
          <div>
            {/* Top Bar Close */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-extrabold uppercase tracking-wider">
                <Receipt className="w-3 h-3" />
                <span>Struk Digital Kasir</span>
              </span>
              <button
                type="button"
                onClick={handleCloseAll}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Banner Instruksi Tunjukkan ke Kasir */}
            <div className="rounded-2xl bg-zinc-900 text-white p-4 text-center relative overflow-hidden">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Tunjukkan Layar Ini ke Penjaga Kasir
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5 tabular-nums">
                {activeReceiptOrder.orderNumber}
              </div>
              <p className="text-xs text-zinc-300 font-semibold mt-0.5">
                Atas Nama:{" "}
                <strong className="text-white">
                  {activeReceiptOrder.customerName}
                </strong>
              </p>
            </div>

            {/* Live Order Status Tracker (Auto-Update tiap 3 detik) */}
            <div className="mt-3.5 p-3.5 rounded-2xl border border-zinc-200/80 bg-white">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-zinc-500">
                  Status Pesanan Real-Time
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold ${
                    currentStatus === "Completed"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : currentStatus === "Ready"
                      ? "bg-blue-50 text-blue-600 border border-blue-200 animate-pulse"
                      : "bg-amber-50 text-amber-600 border border-amber-200"
                  }`}
                >
                  {currentStatus === "Completed" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : currentStatus === "Ready" ? (
                    <BellRing className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  <span>
                    {currentStatus === "Completed"
                      ? "Selesai"
                      : currentStatus === "Ready"
                      ? "Siap Diambil!"
                      : "Sedang Diproses"}
                  </span>
                </span>
              </div>

              {/* 3-Step Progress Bar */}
              <div className="grid grid-cols-3 gap-2">
                {statusSteps.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step.id} className="flex flex-col">
                      <div
                        className={`h-1.5 rounded-full mb-1.5 transition-all ${
                          isDone
                            ? currentStatus === "Completed"
                              ? "bg-emerald-500"
                              : currentStatus === "Ready"
                              ? "bg-blue-600"
                              : "bg-amber-500"
                            : "bg-zinc-100"
                        }`}
                      />
                      <span
                        className={`text-[10.5px] font-extrabold ${
                          isCurrent
                            ? "text-zinc-900"
                            : isDone
                            ? "text-zinc-600"
                            : "text-zinc-300"
                        }`}
                      >
                        {idx + 1}. {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 pt-2 border-t border-zinc-100">
                {statusSteps[currentStepIndex].desc}
              </p>
            </div>

            {/* Rincian Struk Belanja */}
            <div className="mt-3.5 bg-[#FAFAFA] rounded-2xl p-4 text-left text-xs space-y-2 border border-dashed border-zinc-300">
              <div className="flex justify-between text-zinc-500">
                <span>Waktu Transaksi</span>
                <span className="font-semibold text-zinc-800">
                  {activeReceiptOrder.createdAt}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Metode Pembayaran</span>
                <span className="font-extrabold text-zinc-900">
                  {activeReceiptOrder.paymentMethod}
                </span>
              </div>

              <div className="border-t border-zinc-200/80 my-2 pt-2 space-y-1.5">
                <span className="block text-[10px] font-bold text-zinc-400 uppercase">
                  Item yang Dibeli ({activeReceiptOrder.itemCount} Pcs)
                </span>
                {activeReceiptOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="text-zinc-700 font-medium truncate">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-bold text-zinc-900 shrink-0 tabular-nums">
                      {formatRupiah(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-200/80 pt-2.5 flex justify-between font-black text-sm text-zinc-900">
                <span>Total Pembayaran</span>
                <span className="text-zinc-900 tabular-nums">
                  {formatRupiah(activeReceiptOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-zinc-200 text-zinc-800 text-xs font-bold hover:bg-zinc-50 transition cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={handleCloseAll}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-md cursor-pointer active:scale-95"
              >
                {viewReceiptOnly ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tutup Struk</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Pesanan Baru</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
