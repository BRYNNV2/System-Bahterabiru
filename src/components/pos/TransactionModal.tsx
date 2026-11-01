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
  const { completeCheckout, paymentMethod } = usePosStore();
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirmOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const order = completeCheckout();
      setCompletedOrder(order);
      setIsProcessing(false);
    }, 600);
  };

  const handleCloseAll = () => {
    setCompletedOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
        {!completedOrder ? (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF4F0] text-[#FF5B35] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  Konfirmasi Transaksi Kasir
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-zinc-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-100 text-xs space-y-2">
              <div className="flex justify-between text-gray-500">
                <span>Metode Pembayaran</span>
                <span className="font-bold text-[#FF5B35]">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Terminal</span>
                <span className="font-semibold text-zinc-800">
                  Kasir Kantin #01
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Pajak Resto (15%)</span>
                <span className="font-semibold text-zinc-800">Termasuk</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={onClose}
                className="py-3 rounded-2xl border border-gray-200 text-zinc-700 hover:bg-gray-50 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                className="py-3 rounded-2xl bg-[#FF5B35] hover:bg-[#e64c27] text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? "Memproses..." : "Selesaikan Bayar"}
              </button>
            </div>
          </div>
        ) : (
          /* Struk Sukses */
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <h3 className="text-lg font-black text-zinc-900">
              Transaksi Berhasil!
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Nomor Struk:{" "}
              <span className="font-bold text-zinc-800">
                #{completedOrder.orderNumber}
              </span>
            </p>

            <div className="mt-4 bg-[#F8F9FA] rounded-2xl p-4 text-left text-xs space-y-2 border border-dashed border-gray-200">
              <div className="flex justify-between text-gray-500">
                <span>Waktu</span>
                <span className="font-medium text-zinc-800">
                  {completedOrder.createdAt}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Metode</span>
                <span className="font-bold text-[#FF5B35]">
                  {completedOrder.paymentMethod}
                </span>
              </div>

              <div className="border-t border-gray-200/80 my-2 pt-2 space-y-1.5">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-zinc-600 truncate pr-2">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-bold text-zinc-900 shrink-0">
                      {formatRupiah(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200/80 pt-2 flex justify-between font-extrabold text-sm text-zinc-900">
                <span>Total Lunas</span>
                <span className="text-[#FF5B35]">
                  {formatRupiah(completedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-gray-200 text-zinc-800 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={handleCloseAll}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#FF5B35] hover:bg-[#e04d28] text-white text-xs font-bold transition shadow-md cursor-pointer"
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

