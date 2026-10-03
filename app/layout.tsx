import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { CartProvider } from "../context/CartContext";
import { OrderProvider } from "../context/OrderContext";
import { AuthProvider } from "../context/AuthContext";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "پارسیلون پارت | قطعات یدکی خودرو",
    template: "%s | پارسیلون پارت",
  },
  description:
    "خرید آنلاین قطعات یدکی خودرو از پارسیلون پارت: دیسک ترمز، بلبرینگ و قطعات اصلی با ضمانت اصالت.",
  applicationName: "پارسیلون پارت",
  appleWebApp: {
    capable: true,
    title: "پارسیلون",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0E2F6D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.variable}>
        <AuthProvider>
          <OrderProvider>
            <CartProvider>{children}</CartProvider>
          </OrderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
