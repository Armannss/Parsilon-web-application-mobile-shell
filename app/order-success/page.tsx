"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";

type OrderStatus =
  | "PENDING_REVIEW"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type OrderItem = {
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
};

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
  items: OrderItem[];
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

function CheckCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12.75 11.25 15 15 9.75m6 2.25a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function ReceiptIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 14.25h6m-6-3h6m-6-3h6M5.25 3.75h13.5v16.5l-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5V3.75Z"
      />
    </svg>
  );
}

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a7.5 7.5 0 0 1 15 0"
      />
    </svg>
  );
}

function BoxIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
  );
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const orderNumber = useMemo(() => {
    return searchParams.get("orderNumber") || "";
  }, [searchParams]);

  useEffect(() => {
    if (!mounted || !orderNumber) {
      setIsLoading(false);
      return;
    }

    const loadOrder = async () => {
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
          throw new Error(data?.message || "دریافت اطلاعات سفارش انجام نشد.");
        }

        const foundOrder =
          data.orders.find((item: OrderData) => item.orderNumber === orderNumber) ||
          null;

        setOrder(foundOrder);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "خطا در دریافت اطلاعات سفارش.";
        setLoadError(message);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrder();
  }, [mounted, orderNumber]);

  const statusMeta = order ? getOrderStatusMeta(order.status) : null;

  if (!mounted) return null;

  return (
    <MobileShell>
      <AppHeader title="سفارش ثبت شد" backHref="/" />

      <main
        className="pb-28 text-right"
        style={{ background: "#F4F7FC", direction: "rtl" }}
      >
        <section className="px-4 pt-4">
          <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_12px_35px_rgba(14,47,109,0.04)]">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0B7A52] via-[#12A26C] to-[#1DBA7D] p-6 text-white">
              <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 right-0 h-28 w-28 rounded-full bg-[#8CC63F]/20 blur-2xl" />

              <div className="relative z-10">
                <div className="flex justify-end">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    ثبت موفق سفارش
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 text-white">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <CheckCircleIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-[28px] font-black leading-[42px] tracking-tight">
                      سفارش شما
                    </h1>
                    <div className="text-[28px] font-black leading-[36px] text-white/95">
                      با موفقیت ثبت شد
                    </div>
                  </div>
                </div>

                <p className="mt-4 max-w-[310px] text-sm leading-7 text-white/90">
                  سفارش شما در سیستم ثبت شده و از طریق بخش پروفایل و سفارش‌های من
                  قابل پیگیری است.
                </p>

                <div className="mt-4 h-[4px] w-16 rounded-full bg-[#8CC63F]" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 px-4">
          <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-[#0E2F6D]">
              <ReceiptIcon />
              <h2 className="text-base font-black">اطلاعات سفارش</h2>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50/70 p-4">
                <div className="text-[11px] font-bold text-slate-400">
                  شماره سفارش
                </div>
                <div className="mt-2 break-all text-sm font-black text-slate-800">
                  {orderNumber || "ثبت نشده"}
                </div>
              </div>

              {isLoading ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-500">
                  در حال دریافت اطلاعات سفارش...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50/70 p-4">
                    <span className="text-sm font-bold text-slate-500">
                      وضعیت سفارش
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        statusMeta?.badgeClass || "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {statusMeta?.label || "در انتظار بررسی"}
                    </span>
                  </div>

                  {order ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50/70 p-4">
                          <div className="text-[11px] font-bold text-slate-400">
                            تعداد اقلام
                          </div>
                          <div className="mt-2 text-sm font-black text-slate-800">
                            {order.itemCount}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50/70 p-4">
                          <div className="text-[11px] font-bold text-slate-400">
                            جمع کالاها
                          </div>
                          <div className="mt-2 text-sm font-black text-slate-800">
                            {order.subtotal.toLocaleString("fa-IR")} ریال
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50/70 p-4">
                        <div className="text-[11px] font-bold text-slate-400">
                          هزینه ارسال
                        </div>
                        <div className="mt-2 text-sm font-black text-slate-800">
                          {order.shipping.toLocaleString("fa-IR")} ریال
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50/70 p-4">
                        <div className="text-[11px] font-bold text-slate-400">
                          مالیات بر ارزش افزوده
                        </div>
                        <div className="mt-2 text-sm font-black text-slate-800">
                          {order.vat.toLocaleString("fa-IR")} ریال
                        </div>
                      </div>

                      <div className="rounded-2xl bg-blue-50/60 p-4">
                        <div className="text-[11px] font-bold text-[#17479E]/70">
                          مبلغ نهایی
                        </div>
                        <div className="mt-2 text-xl font-black text-[#0E2F6D]">
                          {order.total.toLocaleString("fa-IR")} ریال
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-500">
                      {loadError ||
                        "جزئیات کامل سفارش پیدا نشد، اما شماره سفارش ثبت شده و از بخش پروفایل قابل پیگیری است."}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {order ? (
          <section className="mt-5 px-4">
            <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-[#0E2F6D]">
                <UserIcon />
                <h2 className="text-base font-black">اطلاعات گیرنده</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <div className="text-[11px] font-bold text-slate-400">نام</div>
                  <div className="mt-2 text-sm font-black text-slate-800">
                    {order.customer.fullName}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <div className="text-[11px] font-bold text-slate-400">
                    شماره تماس
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-800">
                    {order.customer.phone}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <div className="text-[11px] font-bold text-slate-400">
                    استان
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-800">
                    {order.customer.province}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <div className="text-[11px] font-bold text-slate-400">
                    شهر
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-800">
                    {order.customer.city}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50/70 p-4">
                <div className="text-[11px] font-bold text-slate-400">آدرس</div>
                <div className="mt-2 break-words text-sm font-black leading-7 text-slate-800">
                  {order.customer.address}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {order ? (
          <section className="mt-5 px-4">
            <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-[#0E2F6D]">
                  <BoxIcon />
                  <h2 className="text-base font-black">اقلام ثبت‌شده</h2>
                </div>

                <span className="rounded-xl bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  {order.items.length} قلم
                </span>
              </div>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={`${order.orderNumber}-${item.slug}-${item.id}`}
                    className="rounded-[24px] border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-sm font-black leading-6 text-slate-800">
                          {item.name}
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-slate-400">
                          کد فنی: {item.code}
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="text-sm font-black text-slate-800">
                          {item.quantity} عدد
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-[#17479E]">
                          {item.unitPrice.toLocaleString("fa-IR")} ریال
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-5 px-4">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/profile/orders"
              className="rounded-2xl bg-[#0E2F6D] px-4 py-3.5 text-center text-sm font-black text-white shadow-md transition-all duration-200 hover:bg-[#17479E] active:scale-95"
            >
              مشاهده سفارش‌ها
            </Link>

            <Link
              href="/products"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-center text-sm font-black text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-200 hover:text-[#17479E] active:scale-95"
            >
              ادامه خرید
            </Link>
          </div>
        </section>
      </main>

      <BottomNav />
    </MobileShell>
  );
}

function OrderSuccessFallback() {
  return (
    <MobileShell>
      <AppHeader title="سفارش ثبت شد" backHref="/" />
      <main
        className="pb-28 text-right"
        style={{ background: "#F4F7FC", direction: "rtl" }}
      >
        <section className="px-4 pt-4">
          <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-[0_12px_35px_rgba(14,47,109,0.04)]">
            <div className="text-sm font-black text-slate-800">
              در حال آماده‌سازی اطلاعات سفارش...
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </MobileShell>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<OrderSuccessFallback />}>
      <OrderSuccessContent />
    </Suspense>
  );
}