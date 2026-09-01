import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import { AppShell } from "@/components/layout/AppShell";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Omni Tools - Bộ Công Cụ Tiện Ích Web Thế Hệ Mới",
  description:
    "Tổng hợp các công cụ tính toán tài chính, lãi kép, chia hóa đơn, quy đổi tỷ giá ngoại tệ và tiện ích lập trình chính xác 100% Client-side bằng Decimal.js.",
  keywords: [
    "omni tools",
    "công cụ tiện ích",
    "tính lãi kép",
    "chia tiền hóa đơn",
    "chuyển đổi tiền tệ",
    "decimal.js",
    "next.js utility tools",
  ],
  authors: [{ name: "Omni Tools Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={plusJakarta.variable}>
      <body className="antialiased min-h-screen font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
