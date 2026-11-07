"use client";

import React, { useState, useEffect, useRef } from "react";
import { Delete, KeyRound, Lock, ShieldCheck, X } from "lucide-react";

interface AdminPinModalProps {
  isOpen: boolean;
  actionLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminPinModal({
  isOpen,
  actionLabel,
  onClose,
  onSuccess,
}: AdminPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setIsVerifying(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const verifyPinCode = async (pinToVerify: string) => {
    if (!pinToVerify.trim() || isVerifying) return;
    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/admin-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToVerify }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error || "PIN tidak sesuai.");
        setPin("");
        setIsVerifying(false);
        return;
      }

      setIsVerifying(false);
      onSuccess();
    } catch {
      setError("Gagal menghubungi server. Coba lagi.");
      setIsVerifying(false);
    }
  };

  const handleDigitClick = (digit: string) => {
    if (isVerifying || pin.length >= 6) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError("");
    if (nextPin.length === 6) {
      void verifyPinCode(nextPin);
    }
  };

  const handleBackspace = () => {
    if (isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void verifyPinCode(pin);
  };

  return (
    <div
      onClick={onClose}
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      className="fixed inset-0 z-[150] bg-slate-950/60 flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          aria-label="Tutup modal PIN"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Icon & Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center mb-3 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            Otorisasi Owner / Supervisor
          </span>
          <h3 className="text-base font-extrabold text-slate-900">
            Masukkan PIN Keamanan
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[260px] leading-relaxed">
            Diperlukan PIN khusus untuk{" "}
            <strong className="text-slate-700">{actionLabel}</strong>
          </p>
        </div>

        {/* 6-Dot Indicator + Hidden/Direct Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-center gap-2.5 py-2 cursor-text"
          >
            {Array.from({ length: 6 }).map((_, idx) => {
              const filled = idx < pin.length;
              return (
                <div
                  key={idx}
                  className={`w-10 h-11 rounded-xl border flex items-center justify-center text-lg font-extrabold transition-all ${
                    filled
                      ? "border-[#2563EB] bg-blue-50/60 text-[#2563EB] shadow-2xs"
                      : "border-slate-200 bg-[#F8FAFC] text-slate-300"
                  }`}
                >
                  {filled ? "●" : ""}
                </div>
              );
            })}
          </div>

          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setPin(val);
              setError("");
              if (val.length === 6) {
                void verifyPinCode(val);
              }
            }}
            className="sr-only"
            aria-label="Input PIN 6 digit"
          />

          {error && (
            <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={isVerifying}
                onClick={() => handleDigitClick(digit)}
                className="h-11 rounded-xl bg-[#F8FAFC] hover:bg-blue-50 active:scale-95 border border-slate-200/80 hover:border-blue-300 text-slate-800 hover:text-[#2563EB] font-extrabold text-sm transition cursor-pointer"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              disabled={isVerifying}
              onClick={() => {
                setPin("");
                setError("");
              }}
              className="h-11 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold text-xs transition cursor-pointer"
            >
              Reset
            </button>

            <button
              type="button"
              disabled={isVerifying}
              onClick={() => handleDigitClick("0")}
              className="h-11 rounded-xl bg-[#F8FAFC] hover:bg-blue-50 active:scale-95 border border-slate-200/80 hover:border-blue-300 text-slate-800 hover:text-[#2563EB] font-extrabold text-sm transition cursor-pointer"
            >
              0
            </button>

            <button
              type="button"
              disabled={isVerifying}
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              aria-label="Hapus 1 digit"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isVerifying || pin.length < 4}
            className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              {isVerifying ? "Memverifikasi PIN..." : "Verifikasi PIN"}
            </span>
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Akses CRUD & Hapus akan terbuka selama 5 menit</span>
        </div>
      </div>
    </div>
  );
}

