"use client";

import React, { useEffect, useState } from "react";
import { Download, Smartphone, Monitor, X, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function notifyListeners() {
  promptListeners.forEach((fn) => fn());
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(true);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Daftarkan Service Worker PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // 2. Cek apakah sudah berjalan sebagai aplikasi ter-install (Standalone PWA)
    const checkStandalone = () => {
      const standaloneMatch =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true;
      setIsStandalone(Boolean(standaloneMatch));
    };
    checkStandalone();

    // Cek apakah user pernah menutup banner install sementara di sesi ini
    const dismissed = sessionStorage.getItem("pwa-banner-dismissed-v1");
    if (!dismissed) {
      setIsBannerDismissed(false);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(globalDeferredPrompt);
      notifyListeners();
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      notifyListeners();
    };

    const syncListener = () => {
      setDeferredPrompt(globalDeferredPrompt);
    };

    promptListeners.add(syncListener);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Event custom agar tombol "Install Aplikasi" dari Header Admin/Sidebar bisa membuka panduan jika prompt native belum muncul
    const handleOpenGuide = () => setShowGuideModal(true);
    window.addEventListener("open-pwa-install-guide", handleOpenGuide);

    return () => {
      promptListeners.delete(syncListener);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("open-pwa-install-guide", handleOpenGuide);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          notifyListeners();
        }
      } catch {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      sessionStorage.setItem("pwa-banner-dismissed-v1", "1");
    } catch {
      // Abaikan
    }
  };

  return (
    <>
      {/* Floating Banner Install Aplikasi (Muncul otomatis jika browser mendukung prompt & belum di-install) */}
      {!isStandalone && !isBannerDismissed && deferredPrompt && (
        <div className="fixed bottom-4 left-4 z-[85] max-w-xs bg-white rounded-2xl p-3.5 border border-slate-200 shadow-[0_14px_35px_rgba(15,23,42,0.14)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/icons/icon-192x192.png"
              alt="Bahtera Biru POS"
              className="w-10 h-10 rounded-xl shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 truncate">
                Install Aplikasi POS
              </p>
              <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
                Akses cepat di layar HP &amp; PC tanpa buka tab browser
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => void handleInstallClick()}
              className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-[11px] font-bold transition cursor-pointer"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Tutup banner install"
              className="w-6 h-6 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Panduan Install di HP (Android / iPhone) & PC (Chrome / Edge) */}
      {showGuideModal && (
        <div
          onClick={() => setShowGuideModal(false)}
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          className="fixed inset-0 z-[140] bg-slate-950/60 flex items-center justify-center p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/icon-192x192.png"
                  alt="Bahtera Biru POS"
                  className="w-10 h-10 rounded-xl shadow-xs shrink-0"
                />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Install Aplikasi Bahtera Biru POS
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Bisa di-install di HP (Android &amp; iOS) maupun PC / Laptop
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isStandalone ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs font-bold">
                  Aplikasi Bahtera Biru POS sudah ter-install dan sedang berjalan dalam mode Aplikasi!
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* Panduan HP Android / iPhone */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900">
                    <Smartphone className="w-4 h-4 text-[#2563EB]" />
                    <span>Cara Install di HP (Android &amp; iPhone)</span>
                  </div>
                  <ol className="list-decimal list-inside text-[11.5px] text-slate-600 space-y-1 leading-relaxed">
                    <li>
                      <strong>Android (Chrome):</strong> Ketuk ikon menu titik tiga{" "}
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-bold">
                        ⋮
                      </span>{" "}
                      di pojok kanan atas browser → pilih{" "}
                      <strong>&quot;Instal aplikasi&quot;</strong> atau{" "}
                      <strong>&quot;Tambahkan ke layar utama&quot;</strong>.
                    </li>
                    <li>
                      <strong>iPhone / iPad (Safari):</strong> Ketuk tombol{" "}
                      <strong>Bagikan (Share)</strong> di bagian bawah → pilih{" "}
                      <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.
                    </li>
                  </ol>
                </div>

                {/* Panduan PC / Laptop */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900">
                    <Monitor className="w-4 h-4 text-[#2563EB]" />
                    <span>Cara Install di PC / Laptop (Chrome &amp; Edge)</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Klik ikon <strong>Install (Monitor dengan panah unduh)</strong> di sebelah kanan kolom URL alamat website (Address Bar), lalu klik{" "}
                    <strong>&quot;Install&quot;</strong>. Aplikasi akan muncul di Desktop &amp; Start Menu Windows.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Tombol pemicu Install PWA yang bisa dipasang di Header Admin maupun Sidebar Pembeli */
export function PwaInstallButton({
  variant = "admin",
}: {
  variant?: "admin" | "buyer";
}) {
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standaloneMatch =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setIsStandalone(Boolean(standaloneMatch));
  }, []);

  if (isStandalone) return null;

  const handleTriggerInstall = async () => {
    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          globalDeferredPrompt = null;
          notifyListeners();
        }
        return;
      } catch {
        // Fallback ke panduan
      }
    }
    window.dispatchEvent(new Event("open-pwa-install-guide"));
  };

  if (variant === "buyer") {
    return (
      <button
        type="button"
        onClick={() => void handleTriggerInstall()}
        title="Install Aplikasi di HP atau PC"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold transition cursor-pointer shrink-0"
      >
        <Download className="w-3 h-3" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleTriggerInstall()}
      title="Install Aplikasi Bahtera Biru POS di PC atau HP"
      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer shrink-0"
    >
      <Download className="w-3.5 h-3.5 text-[#2563EB]" />
      <span className="hidden md:inline">Install App</span>
    </button>
  );
}

