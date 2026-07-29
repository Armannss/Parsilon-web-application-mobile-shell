"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OrderStatus =
  | "pending_review"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type AdminOrderItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
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
};

function normalizeStatus(status: string): OrderStatus {
  switch (status) {
    case "PENDING_REVIEW":
    case "pending_review":
      return "pending_review";
    case "PROCESSING":
    case "processing":
      return "processing";
    case "SHIPPED":
    case "shipped":
      return "shipped";
    case "DELIVERED":
    case "delivered":
      return "delivered";
    case "CANCELLED":
    case "cancelled":
      return "cancelled";
    default:
      return "pending_review";
  }
}

function getOrderStatusMeta(status: OrderStatus) {
  switch (status) {
    case "pending_review":
      return {
        label: "در انتظار بررسی",
        badgeClass: "bg-amber-50 text-amber-700",
      };
    case "processing":
      return {
        label: "در حال پردازش",
        badgeClass: "bg-blue-50 text-blue-700",
      };
    case "shipped":
      return {
        label: "ارسال شده",
        badgeClass: "bg-violet-50 text-violet-700",
      };
    case "delivered":
      return {
        label: "تحویل شده",
        badgeClass: "bg-emerald-50 text-emerald-700",
      };
    case "cancelled":
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

export default function AdminPage() {
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/admin/orders", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !Array.isArray(data?.orders)) {
          throw new Error(data?.message || "دریافت اطلاعات داشبورد انجام نشد.");
        }

        const mapped: AdminOrderItem[] = data.orders.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: normalizeStatus(order.status),
          itemCount: Number(order.itemCount || 0),
          subtotal: Number(order.subtotal || 0),
          shipping: Number(order.shipping || 0),
          vat: Number(order.vat || 0),
          total: Number(order.total || 0),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          customer: {
            fullName: order.customer?.fullName || "",
            phone: order.customer?.phone || "",
            province: order.customer?.province || "",
            city: order.customer?.city || "",
            address: order.customer?.address || "",
            postalCode: order.customer?.postalCode || "",
          },
        }));

        setOrders(mapped);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "خطا در دریافت اطلاعات.";
        setErrorMessage(message);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending_review")
        .length,
      processing: orders.filter((order) => order.status === "processing")
        .length,
      shipped: orders.filter((order) => order.status === "shipped").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
      totalSales,
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 3);
  }, [orders]);

  return (
    <main className="px-4 py-4 pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">داشبورد مدیریت</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          خلاصه‌ای از وضعیت سفارش‌ها، فروش و دسترسی‌های مدیریتی را از اینجا
          ببین.
        </p>
      </section>

      {errorMessage ? (
        <section className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm font-extrabold text-red-700">
            خطا در دریافت اطلاعات
          </div>
          <p className="mt-2 text-sm leading-7 text-red-600">{errorMessage}</p>
        </section>
      ) : null}

      {isLoading ? (
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-sm font-bold text-slate-900">
            در حال بارگذاری داشبورد...
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            چند لحظه صبر کن تا اطلاعات سفارش‌ها آماده شود.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3">
            <div className="group rounded-3xl border border-amber-100 bg-amber-50 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-sm">
              <div className="text-xs font-bold text-amber-700">
                در انتظار بررسی
              </div>
              <div className="mt-2 text-2xl font-black text-amber-800">
                {stats.pending}
              </div>
              <div className="mt-2 text-[11px] text-amber-700/80 transition-colors duration-200 group-hover:text-amber-800">
                سفارش‌های تازه ثبت‌شده
              </div>
            </div>

            <div className="group rounded-3xl border border-blue-100 bg-blue-50 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-sm">
              <div className="text-xs font-bold text-blue-700">
                در حال پردازش
              </div>
              <div className="mt-2 text-2xl font-black text-blue-800">
                {stats.processing}
              </div>
              <div className="mt-2 text-[11px] text-blue-700/80 transition-colors duration-200 group-hover:text-blue-800">
                سفارش‌های فعال فروش
              </div>
            </div>

            <div className="group rounded-3xl border border-violet-100 bg-violet-50 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-sm">
              <div className="text-xs font-bold text-violet-700">
                ارسال شده
              </div>
              <div className="mt-2 text-2xl font-black text-violet-800">
                {stats.shipped}
              </div>
              <div className="mt-2 text-[11px] text-violet-700/80 transition-colors duration-200 group-hover:text-violet-800">
                در مسیر تحویل به مشتری
              </div>
            </div>

            <div className="group rounded-3xl border border-emerald-100 bg-emerald-50 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-sm">
              <div className="text-xs font-bold text-emerald-700">
                تحویل شده
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-800">
                {stats.delivered}
              </div>
              <div className="mt-2 text-[11px] text-emerald-700/80 transition-colors duration-200 group-hover:text-emerald-800">
                سفارش‌های تکمیل‌شده
              </div>
            </div>
          </section>

          <section className="mt-3 grid grid-cols-1 gap-3">
            <div className="group rounded-3xl border border-red-100 bg-red-50 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-sm">
              <div className="text-xs font-bold text-red-700">لغو شده</div>
              <div className="mt-2 text-2xl font-black text-red-800">
                {stats.cancelled}
              </div>
              <div className="mt-2 text-[11px] text-red-700/80 transition-colors duration-200 group-hover:text-red-800">
                سفارش‌های لغوشده
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-3xl bg-slate-900 p-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-300">
                  جمع فروش کل
                </div>
                <div className="mt-3 text-2xl font-black">
                  {stats.totalSales.toLocaleString("fa-IR")} ریال
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  مجموع مبلغ همه سفارش‌های ثبت‌شده تا این لحظه
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-3 py-2 text-center backdrop-blur-sm">
                <div className="text-[11px] text-slate-300">کل سفارش‌ها</div>
                <div className="mt-1 text-lg font-black text-white">
                  {stats.total.toLocaleString("fa-IR")}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/admin/orders"
              className="group rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md active:scale-[0.98]"
            >
              <div className="text-base font-extrabold text-slate-900 transition-colors duration-200 group-hover:text-blue-900">
                مدیریت سفارش‌ها
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-500 transition-colors duration-200 group-hover:text-slate-600">
                مشاهده، بررسی و تغییر وضعیت سفارش‌ها
              </div>
            </Link>

            <Link
              href="/admin/products"
              className="group rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md active:scale-[0.98]"
            >
              <div className="text-base font-extrabold text-slate-900 transition-colors duration-200 group-hover:text-blue-900">
                مدیریت محصولات
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-500 transition-colors duration-200 group-hover:text-slate-600">
                مشاهده، ویرایش و حذف محصولات
              </div>
            </Link>
          </section>

          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  سفارش‌های اخیر
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  آخرین سفارش‌های ثبت‌شده
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="rounded-full px-3 py-1.5 text-sm font-bold text-blue-900 transition-all duration-200 hover:bg-blue-50 active:scale-[0.98]"
              >
                مشاهده همه
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {recentOrders.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  هنوز سفارشی ثبت نشده است.
                </div>
              ) : (
                recentOrders.map((order) => {
                  const statusMeta = getOrderStatusMeta(order.status);

                  return (
                    <div
                      key={order.orderNumber}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-slate-900">
                            {order.orderNumber}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {order.customer.fullName}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {new Date(order.createdAt).toLocaleString("fa-IR")}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${statusMeta.badgeClass}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-slate-500">مبلغ</span>
                        <span className="font-black text-blue-900">
                          {order.total.toLocaleString("fa-IR")} ریال
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}