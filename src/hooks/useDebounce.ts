import { useState, useEffect } from "react";

/**
 * useDebounce hook untuk menunda eksekusi nilai pencarian atau input berfrekuensi tinggi
 * Sangat ideal untuk barcode scanner & kotak pencarian produk/transaksi agar server & UI tidak lag.
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

