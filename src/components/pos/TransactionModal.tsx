"use client";

import React, { useState } from "react";
import { Check, Printer, RotateCcw, X, ShieldCheck } from "lucide-react";
import { usePosStore, CompletedOrder } from "@/store/usePosStore";
import { formatRupiah } from "@/data/initialMenu";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const { completeCheckout, paymentMethod, setPaymentMethod } = usePosStore();
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

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

  const paymentOptions: ("Cash" | "Debit" | "QRIS")[] = ["Cash", "Debit", "QRIS"];

  return (
    <div
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        {!completedOrder ? (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Transaksi Kasir
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Payment method toggle inside modal */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPaymentMethod(opt)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      paymentMethod === opt
                        ? "bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>Terminal</span>
                <span className="font-semibold text-slate-800">
                  Kasir Kantin #01
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Pajak Resto (10%)</span>
                <span className="font-semibold text-slate-800">Termasuk</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={onClose}
                className="py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                className="py-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white text-xs font-bold transition shadow-[0_6px_16px_rgba(37,99,235,0.28)] cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isProcessing ? "Memproses..." : "Selesaikan Bayar"}
              </button>
            </div>
          </div>
        ) : (
          /* Struk Sukses */
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-3 ring-4 ring-[#DBEAFE]/60">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Transaksi Berhasil!
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nomor Struk:{" "}
              <span className="font-bold text-slate-800">
                #{completedOrder.orderNumber}
              </span>
            </p>

            <div className="mt-4 bg-[#F8FAFC] rounded-2xl p-4 text-left text-xs space-y-2 border border-dashed border-slate-200">
              <div className="flex justify-between text-slate-500">
                <span>Waktu</span>
                <span className="font-medium text-slate-800">
                  {completedOrder.createdAt}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Metode</span>
                <span className="font-bold text-[#2563EB]">
                  {completedOrder.paymentMethod}
                </span>
              </div>

              <div className="border-t border-slate-200/80 my-2 pt-2 space-y-1.5">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-600 truncate pr-2">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-bold text-slate-900 shrink-0">
                      {formatRupiah(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200/80 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                <span>Total Lunas</span>
                <span className="text-[#2563EB]">
                  {formatRupiah(completedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 transition cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={handleCloseAll}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white text-xs font-bold transition shadow-[0_6px_16px_rgba(37,99,235,0.25)] cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Pesanan Baru</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
