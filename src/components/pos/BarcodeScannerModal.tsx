"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Upload,
  ScanLine,
  Keyboard,
  Flashlight,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import { MenuItem, formatRupiah, getEffectivePrice } from "@/data/initialMenu";
import { PaymentMethod } from "@/store/usePosStore";

export interface ScannedKasirItem {
  product: MenuItem;
  quantity: number;
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * "pos-checkout": Mode Kasir Admin — scan produk beruntun & selesaikan transaksi langsung di Admin
   * "admin-register": Mode Registrasi Kemasan — ambil kode barcode/QR dari kemasan untuk disimpan ke produk di Admin CRUD
   */
  mode: "pos-checkout" | "admin-register";
  menuItems?: MenuItem[];
  onAddToCart?: (productId: string) => void;
  getItemQuantity?: (productId: string) => number;
  onDetectedCode?: (code: string) => void;
  onCompleteAdminCheckout?: (payload: {
    items: ScannedKasirItem[];
    customerName: string;
    paymentMethod: PaymentMethod;
    keepOpen?: boolean;
  }) => void;
  onQuickBindBarcode?: (productId: string, barcode: string) => void;
  title?: string;
}

/** Validasi digit cek resmi EAN-13 / EAN-8 / UPC-A (Standar Barcode Kemasan Indomie / Minimarket) */
function isValidEanChecksum(code: string): boolean {
  if (!/^\d+$/.test(code)) return false;
  if (code.length !== 13 && code.length !== 8 && code.length !== 12) {
    return false;
  }
  const digits = code.split("").map(Number);
  const checkDigit = digits.pop()!;
  let sum = 0;
  // Dari kanan ke kiri (sebelum check digit), bobot bergantian 3, 1, 3, 1...
  for (let i = digits.length - 1, pos = 0; i >= 0; i--, pos++) {
    sum += digits[i] * (pos % 2 === 0 ? 3 : 1);
  }
  const calculated = (10 - (sum % 10)) % 10;
  return calculated === checkDigit;
}

/** Bunyi "BEEP!" khas mesin scanner kasir Indomaret / Alfamart */
export function playScannerBeep(type: "success" | "error" = "success") {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1750, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }

    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 400);
  } catch {
    // Abaikan jika audio diblokir browser
  }
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  mode,
  menuItems = [],
  onAddToCart,
  getItemQuantity,
  onDetectedCode,
  onCompleteAdminCheckout,
  onQuickBindBarcode,
  title,
}: BarcodeScannerModalProps) {
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>("");
  const [lastRawDetected, setLastRawDetected] = useState<string>("");
  const [isFlashGreen, setIsFlashGreen] = useState<boolean>(false);
  const [scannedCart, setScannedCart] = useState<ScannedKasirItem[]>([]);
  const [autoInstantSell, setAutoInstantSell] = useState<boolean>(false);
  const [quickBindProductId, setQuickBindProductId] = useState<string>("");
  const [kasirCustomerName, setKasirCustomerName] =
    useState<string>("Pelanggan Kasir");
  const [kasirPaymentMethod, setKasirPaymentMethod] =
    useState<PaymentMethod>("Cash");
  const [scanResultBanner, setScanResultBanner] = useState<{
    status: "success" | "error";
    code: string;
    message: string;
    product?: MenuItem;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({
    code: "",
    time: 0,
  });
  const handleCodeRef = useRef<(rawCode: string) => void>(() => {});

  // Handler utama saat kode Barcode / QR terbaca
  const handleDetected = (rawCode: string) => {
    const cleaned = rawCode.trim();
    if (!cleaned) return;

    // Cooldown 1.2 detik untuk kode yang sama agar tidak ter-input ganda dalam 1 kali arahkan kamera
    const now = Date.now();
    if (
      lastScanRef.current.code === cleaned &&
      now - lastScanRef.current.time < 1200
    ) {
      return;
    }
    lastScanRef.current = { code: cleaned, time: now };
    setLastRawDetected(cleaned);
    setIsFlashGreen(true);
    setTimeout(() => setIsFlashGreen(false), 450);

    if (mode === "admin-register") {
      playScannerBeep("success");
      setScanResultBanner({
        status: "success",
        code: cleaned,
        message: `Kode kemasan "${cleaned}" berhasil terbaca!`,
      });
      if (onDetectedCode) {
        onDetectedCode(cleaned);
      }
      setTimeout(() => {
        onClose();
      }, 500);
      return;
    }

    // Mode "pos-checkout": Cari produk berdasarkan Barcode Kemasan (termasuk toleransi angka 0 di depan UPC/EAN Indomie), ID Produk, atau Nama
    const normalized = cleaned.toLowerCase();
    const strippedZero = normalized.replace(/^0+/, "");
    const matchedProduct = menuItems.find((item) => {
      const itemCode = item.barcode?.trim().toLowerCase() || "";
      const itemStripped = itemCode.replace(/^0+/, "");
      return (
        (itemCode &&
          (itemCode === normalized ||
            (strippedZero.length >= 6 && itemStripped === strippedZero))) ||
        item.id.toLowerCase() === normalized ||
        item.name.toLowerCase() === normalized
      );
    });

    if (!matchedProduct) {
      playScannerBeep("error");
      setScanResultBanner({
        status: "error",
        code: cleaned,
        message: `Barcode "${cleaned}" terbaca, namun belum didaftarkan ke produk di Admin CRUD.`,
      });
      return;
    }

    const existingInModal = scannedCart.find(
      (s) => s.product.id === matchedProduct.id
    );
    const currentQty = existingInModal
      ? existingInModal.quantity
      : getItemQuantity
      ? getItemQuantity(matchedProduct.id)
      : 0;
    if (matchedProduct.stock <= 0 || currentQty >= matchedProduct.stock) {
      playScannerBeep("error");
      setScanResultBanner({
        status: "error",
        code: cleaned,
        message: `Stok "${matchedProduct.name}" tidak mencukupi (Sisa ${matchedProduct.stock} pcs).`,
        product: matchedProduct,
      });
      return;
    }

    playScannerBeep("success");

    // Jika Mode "Langsung Terjual (1x Scan)" aktif, langsung catat transaksi penjualan saat itu juga!
    if (autoInstantSell && onCompleteAdminCheckout) {
      onCompleteAdminCheckout({
        items: [{ product: matchedProduct, quantity: 1 }],
        customerName: kasirCustomerName.trim() || "Pelanggan Kasir",
        paymentMethod: kasirPaymentMethod,
        keepOpen: true,
      });
      setScanResultBanner({
        status: "success",
        code: cleaned,
        message: `TERJUAL! 1x ${matchedProduct.name} (${formatRupiah(
          getEffectivePrice(matchedProduct)
        )}) langsung tercatat & stok dipotong!`,
        product: matchedProduct,
      });
      return;
    }

    setScannedCart((prev) => {
      const found = prev.find((i) => i.product.id === matchedProduct.id);
      if (found) {
        return prev.map((i) =>
          i.product.id === matchedProduct.id
            ? {
                ...i,
                product: matchedProduct,
                quantity: Math.min(matchedProduct.stock, i.quantity + 1),
              }
            : i
        );
      }
      return [...prev, { product: matchedProduct, quantity: 1 }];
    });
    if (onAddToCart) {
      onAddToCart(matchedProduct.id);
    }
    setScanResultBanner({
      status: "success",
      code: cleaned,
      message: `+1 ${matchedProduct.name} masuk ke daftar penjualan!`,
      product: matchedProduct,
    });
  };

  handleCodeRef.current = handleDetected;

  // Nyalakan Kamera HD + Triple-Engine Scanner (Native BarcodeDetector + Quagga2 1D EAN/Indomie + QR)
  useEffect(() => {
    if (!isOpen) {
      setScanResultBanner(null);
      setCameraError(null);
      setManualCode("");
      setLastRawDetected("");
      setQuickBindProductId("");
      setTorchOn(false);
      setTorchSupported(false);
      return;
    }

    let isCancelled = false;
    let scanInterval: NodeJS.Timeout | null = null;
    let isDecodingFrame = false;

    const stopMediaStream = () => {
      if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const startCameraAndEngines = async () => {
      setIsStarting(true);
      setCameraError(null);
      stopMediaStream();

      try {
        // 1. Buka stream video HD dengan autofocus kontinu agar garis barcode kemasan Indomie tajam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          try {
            const caps = videoTrack.getCapabilities?.() as
              | { focusMode?: string[]; torch?: boolean }
              | undefined;
            if (caps?.torch) {
              setTorchSupported(true);
            }
            if (caps?.focusMode?.includes("continuous")) {
              await videoTrack.applyConstraints({
                advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
              });
            }
          } catch {
            // Abaikan jika browser tidak mendukung applyConstraints lanjutan
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setIsStarting(false);

        // 2. Siapkan Engine 1: Native Browser BarcodeDetector (sangat cepat di Chrome/Edge/Android)
        type NativeDetectorType = {
          detect: (
            source: HTMLVideoElement | HTMLCanvasElement
          ) => Promise<{ rawValue?: string }[]>;
        };
        let nativeDetector: NativeDetectorType | null = null;
        if (typeof window !== "undefined" && "BarcodeDetector" in window) {
          try {
            const BD = (
              window as unknown as {
                BarcodeDetector: new (opts: {
                  formats: string[];
                }) => NativeDetectorType;
              }
            ).BarcodeDetector;
            nativeDetector = new BD({
              formats: [
                "ean_13",
                "ean_8",
                "upc_a",
                "upc_e",
                "code_128",
                "code_39",
                "qr_code",
              ],
            });
          } catch {
            nativeDetector = null;
          }
        }

        // 3. Siapkan Engine 2: Quagga2 (Spesialis Barcode Garis 1D Kemasan Indomie / Minimarket)
        const QuaggaModule = await import("@ericblade/quagga2");
        const Quagga = QuaggaModule.default || QuaggaModule;

        // Canvas offscreen untuk pemrosesan frame
        const captureCanvas = document.createElement("canvas");
        const captureCtx = captureCanvas.getContext("2d", {
          willReadFrequently: true,
        });

        // Catatan kandidat kode & siklus multi-jarak (dekat/sedang/jauh) untuk kamera webcam/HP yang kurang fokus
        let candidateCode = "";
        let candidateHits = 0;
        let frameTick = 0;
        const patchSizes: ("large" | "medium" | "small")[] = [
          "medium",
          "large",
          "small",
        ];

        scanInterval = setInterval(async () => {
          if (isCancelled || isDecodingFrame) return;
          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;

          isDecodingFrame = true;
          frameTick += 1;
          try {
            // A. Coba Native BarcodeDetector terlebih dahulu (jika didukung browser)
            if (nativeDetector) {
              try {
                const results = await nativeDetector.detect(video);
                if (results && results.length > 0 && results[0].rawValue) {
                  handleCodeRef.current(results[0].rawValue);
                  isDecodingFrame = false;
                  return;
                }
              } catch {
                // Lanjut ke Quagga2
              }
            }

            // B. Proses frame dengan Quagga2 Multi-Scale (tetap terbaca meski kamera laptop agak buram / fixed-focus)
            if (captureCtx) {
              const vw = video.videoWidth;
              const vh = video.videoHeight;
              const useCenterZoom = frameTick % 2 === 0;
              const currentPatchSize =
                patchSizes[frameTick % patchSizes.length];

              captureCanvas.width = 960;
              captureCanvas.height = 540;
              // Pertajam garis hitam-putih pada plastik kemasan yang buram/mengkilap
              captureCtx.filter = "grayscale(1) contrast(1.55) brightness(1.06)";

              if (useCenterZoom) {
                const cropW = Math.round(vw * 0.68);
                const cropH = Math.round(vh * 0.52);
                const cropX = Math.round((vw - cropW) / 2);
                const cropY = Math.round((vh - cropH) / 2);
                captureCtx.drawImage(
                  video,
                  cropX,
                  cropY,
                  cropW,
                  cropH,
                  0,
                  0,
                  960,
                  540
                );
              } else {
                captureCtx.drawImage(video, 0, 0, 960, 540);
              }

              const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.9);

              await new Promise<void>((resolve) => {
                Quagga.decodeSingle(
                  {
                    src: dataUrl,
                    numOfWorkers: 0,
                    locate: true,
                    inputStream: {
                      size: 960,
                    },
                    locator: {
                      patchSize: currentPatchSize,
                      halfSample: currentPatchSize === "large",
                    },
                    decoder: {
                      readers: [
                        "ean_reader",
                        "upc_reader",
                        "ean_8_reader",
                        "code_128_reader",
                      ],
                    },
                  },
                  (result) => {
                    const code = result?.codeResult?.code?.trim();
                    if (code) {
                      const validChecksum = isValidEanChecksum(code);

                      if (validChecksum) {
                        // Jika checksum EAN-13 / UPC-A / EAN-8 sudah valid (seperti Indomie), langsung terima!
                        handleCodeRef.current(code);
                      } else if (code.length >= 4) {
                        if (candidateCode === code) {
                          candidateHits += 1;
                          if (candidateHits >= 2) {
                            handleCodeRef.current(code);
                            candidateHits = 0;
                          }
                        } else {
                          candidateCode = code;
                          candidateHits = 1;
                        }
                      }
                    }
                    resolve();
                  }
                );
              });
            }
          } catch {
            // Abaikan error frame tunggal
          } finally {
            isDecodingFrame = false;
          }
        }, 140);
      } catch {
        if (!isCancelled) {
          setIsStarting(false);
          setCameraError(
            "Kamera tidak dapat diakses. Pastikan izin kamera diizinkan di browser, atau gunakan tombol 'Scan dari Foto' / ketik kode di bawah."
          );
        }
      }
    };

    void startCameraAndEngines();

    return () => {
      isCancelled = true;
      stopMediaStream();
    };
  }, [isOpen, facingMode]);

  // Nyalakan / matikan senter (Torch) pada HP jika didukung
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      // Abaikan
    }
  };

  // Fallback: Scan dari file foto kemasan (Menggunakan Quagga2 + Html5Qrcode sekaligus)
  const handleScanImageFile = async (file?: File | null) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    try {
      // 1. Coba baca Barcode Garis 1D (EAN-13 Indomie, dll) dengan Quagga2 terlebih dahulu
      const QuaggaModule = await import("@ericblade/quagga2");
      const Quagga = QuaggaModule.default || QuaggaModule;

      const quaggaCode = await new Promise<string | null>((resolve) => {
        Quagga.decodeSingle(
          {
            src: objectUrl,
            numOfWorkers: 0,
            locate: true,
            inputStream: { size: 1280 },
            locator: { patchSize: "medium", halfSample: false },
            decoder: {
              readers: [
                "ean_reader",
                "ean_8_reader",
                "upc_reader",
                "code_128_reader",
              ],
            },
          },
          (res) => {
            resolve(res?.codeResult?.code?.trim() || null);
          }
        );
      });

      if (quaggaCode) {
        handleDetected(quaggaCode);
        return;
      }

      // 2. Jika bukan barcode garis, coba baca QR Code dengan Html5Qrcode
      const { Html5Qrcode } = await import("html5-qrcode");
      const tempId = "bahtera-pos-file-reader-temp";
      const fileScanner = new Html5Qrcode(tempId);
      const decodedText = await fileScanner.scanFile(file, false);
      fileScanner.clear();
      handleDetected(decodedText);
    } catch {
      playScannerBeep("error");
      setScanResultBanner({
        status: "error",
        code: "-",
        message:
          "Barcode/QR tidak terbaca dari foto tersebut. Pastikan foto barcode terang & tidak buram.",
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      className="fixed inset-0 z-[130] bg-zinc-950/65 flex items-center justify-center p-3.5 sm:p-5 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-zinc-100 max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header Modal Scanner */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900">
                {title ||
                  (mode === "admin-register"
                    ? "Scan Barcode / QR Kemasan"
                    : "Scan Barang / Kemasan Produk")}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {mode === "admin-register"
                  ? "Arahkan garis barcode bungkus produk (misal: Indomie) ke kotak"
                  : "Arahkan garis barcode bungkus jajan atau QR ke kotak kamera"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Kamera HD Live dengan Garis Bidik Laser */}
        <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-200 flex flex-col items-center justify-center">
          <div className="relative w-full h-[240px] sm:h-[260px] bg-zinc-950 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />

            {/* Bingkai Bidik Barcode & Garis Laser Kasir */}
            {!cameraError && !isStarting && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-5">
                <div
                  className={`w-full max-w-[280px] h-[135px] rounded-2xl border-2 transition-colors duration-200 relative flex items-center justify-center ${
                    isFlashGreen
                      ? "border-emerald-400 bg-emerald-400/15 shadow-[0_0_25px_rgba(52,211,153,0.45)]"
                      : "border-white/80 bg-black/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.32)]"
                  }`}
                >
                  {/* Garis merah/hijau tengah khas laser scanner */}
                  <div
                    className={`w-[90%] h-[2px] rounded-full transition-colors ${
                      isFlashGreen
                        ? "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                        : "bg-rose-500/90 shadow-[0_0_8px_#f43f5e] animate-pulse"
                    }`}
                  />
                </div>
                <span className="mt-2.5 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10.5px] font-semibold">
                  Posisikan garis barcode kemasan mendatar di dalam kotak
                </span>
              </div>
            )}

            {isStarting && !cameraError && (
              <div className="absolute inset-0 bg-zinc-950/85 flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-zinc-300" />
                <p className="text-xs font-semibold">
                  Menyalakan kamera HD pemindai...
                </p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-zinc-950 p-5 flex flex-col items-center justify-center text-center text-zinc-200 space-y-2">
                <AlertCircle className="w-7 h-7 text-amber-400 mx-auto" />
                <p className="text-xs font-semibold leading-relaxed">
                  {cameraError}
                </p>
              </div>
            )}
          </div>

          <div id="bahtera-pos-file-reader-temp" className="hidden" />

          {/* Bar Kontrol Kamera: Ganti Kamera, Senter (HP), & Upload Foto Barcode */}
          <div className="w-full bg-zinc-900 px-3.5 py-2.5 flex items-center justify-between gap-2 border-t border-zinc-800">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) =>
                    prev === "environment" ? "user" : "environment"
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {facingMode === "environment"
                    ? "Kamera Belakang"
                    : "Kamera Depan"}
                </span>
              </button>

              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                    torchOn
                      ? "bg-amber-400 text-zinc-950"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  }`}
                  title="Nyalakan Lampu Senter Kamera"
                >
                  <Flashlight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <label className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Scan dari Foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleScanImageFile(f);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Indikator Kode Terakhir yang Terbaca Kamera */}
        {lastRawDetected && (
          <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 font-medium">
              Kode kemasan terbaca:
            </span>
            <span className="font-mono font-extrabold text-zinc-900">
              {lastRawDetected}
            </span>
          </div>
        )}

        {/* Banner Feedback Hasil Scan (Seperti Layar Kasir Minimarket) */}
        {scanResultBanner && (
          <div
            className={`mt-3 p-3.5 rounded-2xl border space-y-2.5 ${
              scanResultBanner.status === "success"
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                : "bg-amber-50/90 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {scanResultBanner.product ? (
                  <img
                    src={scanResultBanner.product.imageUrl}
                    alt={scanResultBanner.product.name}
                    className="w-10 h-10 rounded-xl object-cover border border-white shadow-2xs shrink-0"
                  />
                ) : scanResultBanner.status === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-extrabold leading-snug">
                    {scanResultBanner.message}
                  </p>
                  <p className="text-[10.5px] opacity-75 truncate mt-0.5">
                    Kode: {scanResultBanner.code}
                    {scanResultBanner.product &&
                      ` • ${formatRupiah(
                        getEffectivePrice(scanResultBanner.product)
                      )}`}
                  </p>
                </div>
              </div>

              {scanResultBanner.product && getItemQuantity && (
                <span className="px-2.5 py-1 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-extrabold shrink-0">
                  {getItemQuantity(scanResultBanner.product.id)}x di Keranjang
                </span>
              )}
            </div>

            {/* Pintasan Hubungkan Barcode & Jual Langsung jika kode belum terdaftar di CRUD */}
            {mode === "pos-checkout" &&
              scanResultBanner.status === "error" &&
              !scanResultBanner.product &&
              scanResultBanner.code !== "-" &&
              menuItems.length > 0 && (
                <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                  <label className="block text-[11px] font-bold text-amber-900">
                    Hubungkan kode &quot;{scanResultBanner.code}&quot; ke produk &amp; langsung masukkan ke penjualan:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={quickBindProductId}
                      onChange={(e) => setQuickBindProductId(e.target.value)}
                      className="flex-1 rounded-xl bg-white border border-amber-300 px-2.5 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none"
                    >
                      <option value="">-- Pilih Produk Katalog --</option>
                      {menuItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({formatRupiah(getEffectivePrice(m))} • Stok:{" "}
                          {m.stock})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const targetProd = menuItems.find(
                          (m) => m.id === quickBindProductId
                        );
                        if (!targetProd) return;
                        if (onQuickBindBarcode) {
                          onQuickBindBarcode(
                            targetProd.id,
                            scanResultBanner.code
                          );
                        }
                        playScannerBeep("success");
                        if (autoInstantSell && onCompleteAdminCheckout) {
                          onCompleteAdminCheckout({
                            items: [{ product: targetProd, quantity: 1 }],
                            customerName:
                              kasirCustomerName.trim() || "Pelanggan Kasir",
                            paymentMethod: kasirPaymentMethod,
                            keepOpen: true,
                          });
                          setScanResultBanner({
                            status: "success",
                            code: scanResultBanner.code,
                            message: `Barcode dihubungkan & 1x ${targetProd.name} langsung terjual!`,
                            product: targetProd,
                          });
                        } else {
                          setScannedCart((prev) => {
                            const found = prev.find(
                              (i) => i.product.id === targetProd.id
                            );
                            if (found) {
                              return prev.map((i) =>
                                i.product.id === targetProd.id
                                  ? {
                                      ...i,
                                      quantity: Math.min(
                                        targetProd.stock,
                                        i.quantity + 1
                                      ),
                                    }
                                  : i
                              );
                            }
                            return [
                              ...prev,
                              { product: targetProd, quantity: 1 },
                            ];
                          });
                          setScanResultBanner({
                            status: "success",
                            code: scanResultBanner.code,
                            message: `Barcode disimpan ke "${targetProd.name}" & +1 masuk daftar penjualan!`,
                            product: targetProd,
                          });
                        }
                        setQuickBindProductId("");
                      }}
                      disabled={!quickBindProductId}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Simpan &amp; Jual
                    </button>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Input Manual / Alat Scanner Laser USB & Bluetooth */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!manualCode.trim()) return;
            handleDetected(manualCode);
            setManualCode("");
          }}
          className="mt-4 pt-3.5 border-t border-zinc-100 space-y-2"
        >
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600">
            <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              Atau ketik angka bawah barcode kemasan / tembak Scanner USB:
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Contoh Indomie: 089686010947"
              className="flex-1 rounded-xl bg-zinc-50 border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition cursor-pointer shrink-0"
            >
              Proses
            </button>
          </div>
        </form>

        {/* Daftar Keranjang Scan Kasir & Tombol Selesaikan Transaksi (Khusus Mode Kasir Admin) */}
        {mode === "pos-checkout" && (
          <div className="mt-4 pt-3.5 border-t border-zinc-100 space-y-3">
            {/* Pilihan Mode Scan Penjualan: Keranjang Kasir vs Langsung Terjual Otomatis */}
            <div className="p-1 rounded-xl bg-zinc-100 grid grid-cols-2 gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setAutoInstantSell(false)}
                className={`py-2 px-2.5 rounded-lg transition cursor-pointer ${
                  !autoInstantSell
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                🛒 Keranjang Kasir (Scan Banyak)
              </button>
              <button
                type="button"
                onClick={() => setAutoInstantSell(true)}
                className={`py-2 px-2.5 rounded-lg transition cursor-pointer ${
                  autoInstantSell
                    ? "bg-[#2563EB] text-white shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                ⚡ Langsung Terjual (1x Scan)
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-zinc-900">
                Daftar Barang Penjualan ({scannedCart.reduce((a, b) => a + b.quantity, 0)} pcs)
              </span>
              {scannedCart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScannedCart([])}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {scannedCart.length === 0 ? (
              <div className="py-5 px-3 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center text-[11px] text-zinc-400 font-medium">
                Belum ada barang di-scan. Arahkan barcode kemasan produk ke kamera atau ketik kode di atas.
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                  {scannedCart.map((entry) => {
                    const unitPrice = getEffectivePrice(entry.product);
                    return (
                      <div
                        key={entry.product.id}
                        className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={entry.product.imageUrl}
                            alt={entry.product.name}
                            className="w-9 h-9 rounded-lg object-cover border border-white shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 truncate">
                              {entry.product.name}
                            </p>
                            <p className="text-[10.5px] text-zinc-500 font-semibold tabular-nums">
                              {formatRupiah(unitPrice)} × {entry.quantity} ={" "}
                              <strong className="text-zinc-900">
                                {formatRupiah(unitPrice * entry.quantity)}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setScannedCart((prev) =>
                                prev
                                  .map((i) =>
                                    i.product.id === entry.product.id
                                      ? { ...i, quantity: i.quantity - 1 }
                                      : i
                                  )
                                  .filter((i) => i.quantity > 0)
                              )
                            }
                            className="w-6 h-6 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-extrabold text-zinc-900 tabular-nums">
                            {entry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setScannedCart((prev) =>
                                prev.map((i) =>
                                  i.product.id === entry.product.id
                                    ? {
                                        ...i,
                                        quantity: Math.min(
                                          entry.product.stock,
                                          i.quantity + 1
                                        ),
                                      }
                                    : i
                                )
                              )
                            }
                            className="w-6 h-6 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setScannedCart((prev) =>
                                prev.filter(
                                  (i) => i.product.id !== entry.product.id
                                )
                              )
                            }
                            className="w-6 h-6 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 flex items-center justify-center cursor-pointer ml-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Nama Pembeli & Metode Pembayaran Kasir */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10.5px] font-bold text-zinc-500 mb-1">
                      Nama Pembeli / Catatan
                    </label>
                    <input
                      type="text"
                      value={kasirCustomerName}
                      onChange={(e) => setKasirCustomerName(e.target.value)}
                      placeholder="Pelanggan Kasir"
                      className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-zinc-500 mb-1">
                      Metode Pembayaran
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["Cash", "QRIS"] as PaymentMethod[]).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setKasirPaymentMethod(m)}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            kasirPaymentMethod === m
                              ? "bg-zinc-900 border-zinc-900 text-white"
                              : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tombol Selesaikan Transaksi Kasir */}
                <button
                  type="button"
                  onClick={() => {
                    if (scannedCart.length === 0) return;
                    if (onCompleteAdminCheckout) {
                      onCompleteAdminCheckout({
                        items: scannedCart,
                        customerName:
                          kasirCustomerName.trim() || "Pelanggan Kasir",
                        paymentMethod: kasirPaymentMethod,
                      });
                    }
                    setScannedCart([]);
                    onClose();
                  }}
                  className="w-full py-3 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    Selesaikan Transaksi Kasir (
                    {formatRupiah(
                      scannedCart.reduce(
                        (sum, i) =>
                          sum + getEffectivePrice(i.product) * i.quantity,
                        0
                      )
                    )}
                    )
                  </span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
