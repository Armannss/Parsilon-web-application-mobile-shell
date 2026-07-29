"use client";

import { useEffect, useMemo, useState } from "react";

type OrderStatus =
  | "pending_review"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type ReportSummary = {
  totalOrders: number;
  totalSales: number;
  todaySales: number;
  last7DaysSales: number;
  totalWholesaleRequests: number;
  openWholesaleRequests: number;
};

type ReportOrders = {
  byStatus: {
    pending_review: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  recent: Array<{
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    itemCount: number;
    createdAt: string;
    customer: {
      fullName: string;
      phone: string;
    };
  }>;
};

type TopSellingProduct = {
  rank: number;
  slug: string;
  name: string;
  code: string;
  quantitySold: number;
  revenue: number;
};

type ReportData = {
  summary: ReportSummary;
  orders: ReportOrders;
  products: {
    topSelling: TopSellingProduct[];
  };
};

function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "pending_review":
      return "در انتظار بررسی";
    case "processing":
      return "در حال پردازش";
    case "shipped":
      return "ارسال شده";
    case "delivered":
      return "تحویل شده";
    case "cancelled":
      return "لغو شده";
    default:
      return "نامشخص";
  }
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/admin/reports", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !data?.report) {
          throw new Error(data?.message || "دریافت گزارش‌ها انجام نشد.");
        }

        setReport(data.report);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "خطا در دریافت گزارش‌ها.";
        setErrorMessage(message);
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, []);

  const stats = useMemo(() => {
    if (!report) {
      return {
        totalOrders: 0,
        totalSales: 0,
        todaySales: 0,
        last7DaysSales: 0,
        totalWholesaleRequests: 0,
        openWholesaleRequests: 0,
        pendingCount: 0,
        processingCount: 0,
        shippedCount: 0,
        deliveredCount: 0,
        cancelledCount: 0,
        recentOrders: [] as ReportOrders["recent"],
        topSellingProducts: [] as TopSellingProduct[],
      };
    }

    return {
      totalOrders: report.summary.totalOrders,
      totalSales: report.summary.totalSales,
      todaySales: report.summary.todaySales,
      last7DaysSales: report.summary.last7DaysSales,
      totalWholesaleRequests: report.summary.totalWholesaleRequests,
      openWholesaleRequests: report.summary.openWholesaleRequests,
      pendingCount: report.orders.byStatus.pending_review,
      processingCount: report.orders.byStatus.processing,
      shippedCount: report.orders.byStatus.shipped,
      deliveredCount: report.orders.byStatus.delivered,
      cancelledCount: report.orders.byStatus.cancelled,
      recentOrders: report.orders.recent,
      topSellingProducts: report.products.topSelling,
    };
  }, [report]);

  return (
    <main className="px-4 py-4 pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">گزارش‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          خلاصه فروش، سفارش‌ها، درخواست‌های عمده و محصولات پرفروش را از اینجا
          بررسی کن.
        </p>
      </section>

      {errorMessage ? (
        <section className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm font-extrabold text-red-700">
            خطا در دریافت گزارش‌ها
          </div>
          <p className="mt-2 text-sm leading-7 text-red-600">{errorMessage}</p>
        </section>
      ) : null}

      {isLoading ? (
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-sm font-bold text-slate-900">
            در حال بارگذاری گزارش‌ها...
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            چند لحظه صبر کن تا داده‌ها آماده شوند.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
              <div className="text-xs font-bold text-blue-700">کل سفارش‌ها</div>
              <div className="mt-2 text-2xl font-black text-blue-900">
                {stats.totalOrders.toLocaleString("fa-IR")}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="text-xs font-bold text-emerald-700">
                جمع فروش کل
              </div>
              <div className="mt-2 text-xl font-black text-emerald-900">
                {stats.totalSales.toLocaleString("fa-IR")} ریال
              </div>
            </div>

            <div className="rounded-3xl border border-violet-100 bg-violet-50 p-4">
              <div className="text-xs font-bold text-violet-700">فروش امروز</div>
              <div className="mt-2 text-xl font-black text-violet-900">
                {stats.todaySales.toLocaleString("fa-IR")} ریال
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
              <div className="text-xs font-bold text-amber-700">
                فروش ۷ روز اخیر
              </div>
              <div className="mt-2 text-xl font-black text-amber-900">
                {stats.last7DaysSales.toLocaleString("fa-IR")} ریال
              </div>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
              <div className="text-xs font-bold text-amber-700">
                در انتظار بررسی
              </div>
              <div className="mt-2 text-2xl font-black text-amber-900">
                {stats.pendingCount.toLocaleString("fa-IR")}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
              <div className="text-xs font-bold text-blue-700">
                در حال پردازش
              </div>
              <div className="mt-2 text-2xl font-black text-blue-900">
                {stats.processingCount.toLocaleString("fa-IR")}
              </div>
            </div>

            <div className="rounded-3xl border border-violet-100 bg-violet-50 p-4">
              <div className="text-xs font-bold text-violet-700">
                ارسال شده
              </div>
              <div className="mt-2 text-2xl font-black text-violet-900">
                {stats.shippedCount.toLocaleString("fa-IR")}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="text-xs font-bold text-emerald-700">
                تحویل شده
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-900">
                {stats.deliveredCount.toLocaleString("fa-IR")}
              </div>
            </div>
          </section>

          <section className="mt-3 grid grid-cols-1 gap-3">
            <div className="rounded-3xl border border-red-100 bg-red-50 p-4">
              <div className="text-xs font-bold text-red-700">لغو شده</div>
              <div className="mt-2 text-2xl font-black text-red-900">
                {stats.cancelledCount.toLocaleString("fa-IR")}
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900">
              گزارش درخواست‌های عمده
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-bold text-slate-700">
                  کل درخواست‌ها
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  {stats.totalWholesaleRequests.toLocaleString("fa-IR")}
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4">
                <div className="text-xs font-bold text-blue-700">
                  درخواست‌های باز
                </div>
                <div className="mt-2 text-2xl font-black text-blue-900">
                  {stats.openWholesaleRequests.toLocaleString("fa-IR")}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900">
              سفارش‌های اخیر
            </h2>

            <div className="mt-4 space-y-3">
              {stats.recentOrders.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  هنوز داده‌ای برای نمایش وجود ندارد.
                </div>
              ) : (
                stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
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

                      <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-bold text-slate-700">
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-500">مبلغ</span>
                      <span className="font-black text-blue-900">
                        {order.total.toLocaleString("fa-IR")} ریال
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900">
              محصولات پرفروش
            </h2>

            <div className="mt-4 space-y-3">
              {stats.topSellingProducts.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  هنوز داده‌ای برای نمایش وجود ندارد.
                </div>
              ) : (
                stats.topSellingProducts.map((product) => (
                  <div
                    key={`${product.slug}-${product.rank}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900">
                          {product.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          کد فنی: {product.code}
                        </div>
                      </div>

                      <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
                        رتبه {product.rank.toLocaleString("fa-IR")}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-[11px] font-bold text-slate-500">
                          تعداد فروش
                        </div>
                        <div className="mt-1 text-sm font-black text-slate-900">
                          {product.quantitySold.toLocaleString("fa-IR")}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <div className="text-[11px] font-bold text-slate-500">
                          درآمد
                        </div>
                        <div className="mt-1 text-sm font-black text-blue-900">
                          {product.revenue.toLocaleString("fa-IR")} ریال
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}