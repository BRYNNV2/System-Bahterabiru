import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kans Resto — Kantin Kampus POS & Self-Ordering",
  description:
    "Sistem Kasir & Pemesanan Mandiri Kantin Kampus dengan Pemantauan Stok Real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
