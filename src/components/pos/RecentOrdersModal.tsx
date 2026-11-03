"use client";

import React from "react";
import { X, ReceiptText } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";
import { formatRupiah } from "@/data/initialMenu";

interface RecentOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecentOrdersModal({ isOpen, onClose }: RecentOrdersModalProps) {
  const { recentOrders } = usePosStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FCEAE3] text-[#EE5728] flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Riwayat Transaksi Kasir
              </h3>
              <p className="text-xs text-gray-400">
                Total {recentOrders.length} transaksi selesai pada sesi ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-zinc-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {recentOrders.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">
              Belum ada transaksi tersimpan
            </p>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#F8F9FA] rounded-2xl p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-zinc-900">
                      #{order.orderNumber} &bull; {order.customerName}
                    </span>
                    <span className="block text-[11px] text-gray-400 mt-0.5">
                      {order.createdAt} &bull; {order.paymentMethod}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-[#FF5B35]">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>
                <div className="border-t border-gray-200/70 pt-2 space-y-1">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-[11px] text-zinc-600"
                    >
                      <span>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-semibold">
                        {formatRupiah(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
