"use client";

import React, { useState } from "react";
import {
  X,
  QrCode,
  Banknote,
  CreditCard,
  Check,
  Printer,
  RotateCcw,
} from "lucide-react";
import { usePosStore, CompletedOrder } from "@/store/usePosStore";
import { formatRupiah, getEffectivePrice } from "@/data/initialMenu";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, menuItems, customerName, personCount, completeCheckout } =
    usePosStore();

  const [paymentMethod, setPaymentMethod] = useState<
    "QRIS" | "TUNAI" | "KARTU_MAHASISWA"
  >("QRIS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null
  );

  if (!isOpen) return null;

  const populatedCart = cart
    .map((c) => {
      const product = menuItems.find((m) => m.id === c.productId);
      if (!product) return null;
      const effectivePrice = getEffectivePrice(product);
      return {
        ...c,
        product,
        effectivePrice,
        lineOriginal: product.price * c.quantity,
        lineEffective: effectivePrice * c.quantity,
        lineDiscount: (product.price - effectivePrice) * c.quantity,
      };
    })
    .filter(Boolean) as {
    productId: string;
    quantity: number;
    product: (typeof menuItems)[number];
    effectivePrice: number;
    lineOriginal: number;
    lineEffective: number;
    lineDiscount: number;
  }[];

  const subtotal = populatedCart.reduce((s, i) => s + i.lineOriginal, 0);
  const discountSales = populatedCart.reduce((s, i) => s + i.lineDiscount, 0);
  const totalTax = populatedCart.length > 0 ? 40000 : 0;
  const finalTotal = Math.max(0, subtotal - discountSales + totalTax);

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    const result = completeCheckout(paymentMethod);

    if (result) {
      try {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: result.orderNumber,
            customerName: result.customerName,
            personCount: result.personCount,
            subtotal,
            discountTotal: discountSales,
            taxTotal: totalTax,
            totalAmount: finalTotal,
            paymentMethod,
            items: result.items.map((i) => ({
              productId: i.product.id,
              productName: i.product.name,
              quantity: i.quantity,
              originalPrice: i.product.price,
              discountPercent: i.product.discountPercent,
              unitPrice: i.unitPrice,
              lineTotal: i.lineTotal,
            })),
          }),
        });
      } catch {
        // Handled in local store
      }

      setCompletedOrder({
        ...result,
        subtotal,
        discountTotal: discountSales,
        taxTotal: totalTax,
        totalAmount: finalTotal,
      });
    }
    setIsSubmitting(false);
  };

  const handleResetAndClose = () => {
    setCompletedOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] max-w-md w-full p-7 shadow-2xl border border-zinc-200">
        {!completedOrder ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
                  SELF-SERVICE CHECKOUT
                </p>
                <h3 className="text-xl font-black tracking-tight text-zinc-950 uppercase mt-0.5">
                  METODE PEMBAYARAN<span className="text-[#84CC16]">.</span>
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-zinc-200 hover:border-zinc-950 flex items-center justify-center text-zinc-600 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-5">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "QRIS", label: "QRIS INSTAN", icon: QrCode },
                  { id: "TUNAI", label: "TUNAI KASIR", icon: Banknote },
                  {
                    id: "KARTU_MAHASISWA",
                    label: "E-KTM KAMPUS",
                    icon: CreditCard,
                  },
                ].map((method) => {
                  const Icon = method.icon;
                  const active = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() =>
                        setPaymentMethod(
                          method.id as "QRIS" | "TUNAI" | "KARTU_MAHASISWA"
                        )
                      }
                      className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-[10px] font-black tracking-wider uppercase transition cursor-pointer ${
                        active
                          ? "bg-zinc-950 text-white border-zinc-950"
                          : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-950"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3.5 max-h-44 overflow-y-auto space-y-2 custom-scrollbar">
              {populatedCart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-zinc-800 uppercase truncate pr-2">
                    {item.quantity}&times; {item.product.name}
                  </span>
                  <span className="font-extrabold text-zinc-950 tabular-nums shrink-0">
                    {formatRupiah(item.lineEffective)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-5 pt-4 border-t border-zinc-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span className="uppercase tracking-wider font-bold text-[11px]">
                  Pemesan
                </span>
                <span className="font-extrabold text-zinc-950 uppercase">
                  {customerName || "Pelanggan"} ({personCount} Org)
                </span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span className="uppercase tracking-wider font-bold text-[11px]">
                  Subtotal
                </span>
                <span className="font-bold text-zinc-900 tabular-nums">
                  {formatRupiah(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span className="uppercase tracking-wider font-bold text-[11px]">
                  Potongan Promo
                </span>
                <span className="font-bold text-zinc-900 tabular-nums">
                  -{formatRupiah(discountSales)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span className="uppercase tracking-wider font-bold text-[11px]">
                  Pajak
                </span>
                <span className="font-bold text-zinc-900 tabular-nums">
                  {formatRupiah(totalTax)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-zinc-950">
                <span className="text-xs font-black tracking-widest uppercase text-zinc-950">
                  TOTAL TAGIHAN
                </span>
                <span className="text-lg font-black text-zinc-950 tabular-nums">
                  {formatRupiah(finalTotal)}
                </span>
              </div>
            </div>

            {/* Confirm CTA */}
            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="w-full mt-5 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs tracking-[0.16em] uppercase py-4 rounded-full transition cursor-pointer"
            >
              {isSubmitting ? "MEMPROSES..." : "KONFIRMASI & CETAK STRUK"}
            </button>
          </>
        ) : (
          /* Clean Monochrome Kiosk Receipt */
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#B4F03A] text-zinc-950 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
              TRANSAKSI BERHASIL
            </p>
            <h3 className="text-2xl font-black tracking-tight text-zinc-950 uppercase mt-0.5">
              #{completedOrder.orderNumber}
            </h3>

            <div className="mt-5 rounded-2xl border border-zinc-200 p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                  PEMESAN
                </span>
                <span className="font-extrabold text-zinc-950 uppercase">
                  {completedOrder.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                  METODE BAYAR
                </span>
                <span className="font-extrabold text-zinc-950 uppercase">
                  {completedOrder.paymentMethod}
                </span>
              </div>

              <div className="border-t border-dashed border-zinc-200 my-2 pt-2 space-y-1.5">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-zinc-700 font-semibold uppercase text-[11px]">
                      {item.quantity}&times; {item.product.name}
                    </span>
                    <span className="font-bold text-zinc-950 tabular-nums">
                      {formatRupiah(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-950 pt-2.5 flex justify-between items-baseline">
                <span className="font-black uppercase tracking-wider text-zinc-950">
                  TOTAL LUNAS
                </span>
                <span className="text-base font-black text-zinc-950 tabular-nums">
                  {formatRupiah(completedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 py-3.5 rounded-full border border-zinc-200 hover:border-zinc-950 text-[11px] font-black tracking-wider uppercase text-zinc-900 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>CETAK</span>
              </button>
              <button
                onClick={handleResetAndClose}
                className="flex items-center justify-center gap-2 py-3.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-[11px] font-black tracking-wider uppercase text-white transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>PESANAN BARU</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
