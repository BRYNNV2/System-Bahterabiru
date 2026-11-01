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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900">
                Riwayat Transaksi Kasir
              </h3>
              <p className="text-xs text-gray-400">
                Total {recentOrders.length} pesanan selesai pada sesi ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-zinc-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="bg-[#F7F8FA] rounded-2xl p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-extrabold text-zinc-900">
                    #{order.orderNumber} &mdash; {order.customerName}
                  </span>
                  <span className="block text-[11px] text-gray-400">
                    {order.personCount} Person Table &bull; {order.paymentMethod}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#47B24B]">
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
          ))}
        </div>
      </div>
    </div>
  );
}

