"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import AuthGuard from "@/components/auth/AuthGuard";

type OrderStatus =
  | "PENDING_REVIEW"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type OrderData = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  shippingMethod: "NORMAL" | "EXPRESS";
  itemCount: number;
  subtotal: number;
  shipping: number;
  vat: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  customer: {
    fullName: string;
    phone: string;
    province: string;
    city: string;
    address: string;
    postalCode: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    name: string;
    code: string;
    slug: string;
    image: string;
    brand: string;
    category: string;
  }>;
};

function getOrderStatusMeta(status: OrderStatus) {
  switch (status) {
    case "PENDING_REVIEW":
      return {
        label: "در انتظار بررسی",
        badgeClass: "bg-amber-50 text-amber-700",
      };
    case "PROCESSING":
      return {
        label: "در حال پردازش",
        badgeClass: "bg-blue-50 text-blue-700",
      };
    case "SHIPPED":
      return {
        label: "ارسال شده",
        badgeClass: "bg-violet-50 text-violet-700",
      };
    case "DELIVERED":
      return {
        label: "تحویل شده",
        badgeClass: "bg-emerald-50 text-emerald-700",
      };
    case "CANCELLED":
      return {
        label: "لغو شده",
        badgeClass: "bg-red-50 text-red-700",
      };
    default:
      return {
        label: "در انتظار بررسی",
        badgeClass: "bg-amber-50 text-amber-700",
      };
  }
}

function BoxIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
  );
}

export default function ProfileOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await fetch("/api/orders", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !Array.isArray(data?.orders)) {
          throw new Error(data?.message || "دریافت سفارش‌ها انجام نشد.");
        }

        setOrders(data.orders);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "خطا در دریافت سفارش‌ها.";
        setLoadError(message);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders]);

  return (
    <AuthGuard>
      <MobileShell>
        <AppHeader title="سفارش‌های من" backHref="/profile" />

        <main
          className="pb-28 text-right"
          style={{ background: "#F4F7FC", direction: "rtl" }}
        >
          <section className="px-4 pt-4">
            <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_12px_35px_rgba(14,47,109,0.04)]">
              <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#06183A] via-[#0E2F6D] to-[#355FC7] p-6 text-white">
                <div className="relative z-10">
                  <div className="flex justify-end">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold backdrop-blur-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8CC63F] opacity-70" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8CC63F]" />
                      </span>
                      سوابق خرید
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                      <BoxIcon className="h-7 w-7" />
                    </div>

                    <div>
                      <h1 className="text-[28px] font-black leading-[42px] tracking-tight">
                        سفارش‌های من
                      </h1>
                      <div className="text-sm font-bold text-white/90">
                        مشاهده و پیگیری سفارش‌های ثبت‌شده
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 max-w-[310px] text-sm leading-7 text-white/90">
                    تاریخچه سفارش‌های ثبت‌شده خودت را از این بخش ببین و برای
                    مشاهده جزئیات هر سفارش وارد آن شو.
                  </p>

                  <div className="mt-4 h-[4px] w-16 rounded-full bg-[#8CC63F]" />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 px-4">
            <div className="space-y-3">
              {isLoading ? (
                <div className="rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
                  <div className="text-base font-black text-slate-800">
                    در حال دریافت سفارش‌ها...
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    چند لحظه صبر کن تا سوابق سفارش‌های شما بارگذاری شود.
                  </p>
                </div>
              ) : loadError ? (
                <div className="rounded-[32px] border border-red-100 bg-white p-8 text-center shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
                  <div className="text-base font-black text-red-700">
                    خطا در دریافت سفارش‌ها
                  </div>
                  <p className="mt-2 text-sm leading-7 text-red-600">
                    {loadError}
                  </p>
                </div>
              ) : sortedOrders.length === 0 ? (
                <div className="rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
                  <div className="text-base font-black text-slate-800">
                    هنوز سفارشی ثبت نشده
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    بعد از ثبت سفارش، لیست آن‌ها از همین بخش قابل مشاهده است.
                  </p>

                  <Link
                    href="/products"
                    className="mt-4 inline-flex rounded-2xl bg-[#0E2F6D] px-4 py-3 text-sm font-black text-white"
                  >
                    مشاهده محصولات
                  </Link>
                </div>
              ) : (
                sortedOrders.map((order) => {
                  const statusMeta = getOrderStatusMeta(order.status);

                  return (
                    <Link
                      key={order.orderNumber}
                      href={`/profile/orders/${encodeURIComponent(
                        order.orderNumber
                      )}`}
                      className="block rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_10px_28px_rgba(14,47,109,0.03)] transition-all duration-200 hover:-translate-y-1 active:scale-95"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-black text-slate-800">
                            {order.orderNumber}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {new Date(order.createdAt).toLocaleString("fa-IR")}
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusMeta.badgeClass}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50/70 p-3">
                          <div className="text-[11px] font-bold text-slate-400">
                            تعداد اقلام
                          </div>
                          <div className="mt-2 text-sm font-black text-slate-800">
                            {order.itemCount}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50/70 p-3">
                          <div className="text-[11px] font-bold text-slate-400">
                            مبلغ نهایی
                          </div>
                          <div className="mt-2 text-sm font-black text-[#17479E]">
                            {order.total.toLocaleString("fa-IR")} ریال
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        </main>

        <BottomNav />
      </MobileShell>
    </AuthGuard>
  );
}