"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  buildReportMetrics,
  filterOrdersForReport,
  getCategoryLabel,
  getRangeLabel,
  getStatusLabel,
  type ReportCategoryFilter,
  type ReportFilters,
  type ReportRangeType,
  type ReportStatusFilter,
} from "../../lib/report-utils";
import { useOrder } from "../../context/OrderContext";

function buildReportNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  return `RPT-${yyyy}${mm}${dd}-${hh}${min}`;
}

function ReportsPrintContent() {
  const searchParams = useSearchParams();
  const { orderHistory } = useOrder();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filters = useMemo<ReportFilters>(() => {
    return {
      rangeType:
        (searchParams.get("rangeType") as ReportRangeType) || "monthly",
      status: (searchParams.get("status") as ReportStatusFilter) || "all",
      category:
        (searchParams.get("category") as ReportCategoryFilter) || "all",
      startDate: searchParams.get("startDate") || "",
      endDate: searchParams.get("endDate") || "",
    };
  }, [searchParams]);

  const filteredOrders = useMemo(() => {
    return filterOrdersForReport(orderHistory as any, filters);
  }, [orderHistory, filters]);

  const metrics = useMemo(() => {
    return buildReportMetrics(filteredOrders, filters.category);
  }, [filteredOrders, filters.category]);

  const reportNumber = useMemo(() => buildReportNumber(), []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        html,
        body {
          background: #f1f5f9;
        }

        @media print {
          html,
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-hide {
            display: none !important;
          }

          .print-shell {
            width: 190mm !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }

          .print-card,
          .print-section,
          .print-signature,
          table,
          tr,
          td,
          th {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <main
        dir="rtl"
        className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 print:bg-white print:px-0 print:py-0"
      >
        <div className="print-shell mx-auto w-full max-w-[980px] bg-white p-8 shadow-sm print:p-0 print:shadow-none">
          <header className="print-section border-b border-slate-300 pb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-3">
                  <Image
                    src="/images/parsilon-logo-fa.jpg"
                    alt="Parsilon Part"
                    width={150}
                    height={150}
                    className="h-auto w-[150px] object-contain"
                    priority
                  />
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-slate-500">
                    گزارش رسمی فروش
                  </div>

                  <h1 className="mt-3 text-4xl font-black leading-tight text-slate-900">
                    گزارش فروش
                    <br />
                    پارسیلون پارت
                  </h1>

                  <p className="mt-4 text-sm text-slate-500">
                    تاریخ تولید: {new Date().toLocaleString("fa-IR")}
                  </p>
                </div>
              </div>

              <div className="min-w-[180px] text-left">
                <div className="text-xl font-black text-slate-900">
                  Parsilon Part
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  Sales Report
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 px-4 py-3 text-right text-sm">
                  <div className="text-slate-500">شماره گزارش</div>
                  <div className="mt-1 font-extrabold text-slate-900">
                    {reportNumber}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 px-4 py-4 text-sm">
                <div className="font-bold text-slate-900">بازه</div>
                <div className="mt-2 text-slate-600">
                  {getRangeLabel(filters.rangeType)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 px-4 py-4 text-sm">
                <div className="font-bold text-slate-900">وضعیت</div>
                <div className="mt-2 text-slate-600">
                  {getStatusLabel(filters.status)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 px-4 py-4 text-sm">
                <div className="font-bold text-slate-900">دسته</div>
                <div className="mt-2 text-slate-600">
                  {getCategoryLabel(filters.category)}
                </div>
              </div>
            </div>

            {filters.rangeType === "custom" ? (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 px-4 py-4 text-sm">
                  <div className="font-bold text-slate-900">از تاریخ</div>
                  <div className="mt-2 text-slate-600">
                    {filters.startDate || "-"}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 px-4 py-4 text-sm">
                  <div className="font-bold text-slate-900">تا تاریخ</div>
                  <div className="mt-2 text-slate-600">
                    {filters.endDate || "-"}
                  </div>
                </div>
              </div>
            ) : null}
          </header>

          <section className="print-section mt-8">
            <div className="grid grid-cols-4 gap-4">
              <div className="print-card rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-xs text-slate-500">تعداد سفارش‌ها</div>
                <div className="mt-3 text-4xl font-black text-slate-900">
                  {metrics.totalOrders.toLocaleString("fa-IR")}
                </div>
              </div>

              <div className="print-card rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-xs text-slate-500">
                  تعداد اقلام فروخته‌شده
                </div>
                <div className="mt-3 text-4xl font-black text-slate-900">
                  {metrics.totalItems.toLocaleString("fa-IR")}
                </div>
              </div>

              <div className="print-card rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-xs text-slate-500">جمع فروش</div>
                <div className="mt-3 break-words text-3xl font-black leading-[1.6] text-blue-900">
                  {metrics.totalSales.toLocaleString("fa-IR")} ریال
                </div>
              </div>

              <div className="print-card rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-xs text-slate-500">میانگین هر سفارش</div>
                <div className="mt-3 break-words text-3xl font-black leading-[1.6] text-blue-900">
                  {metrics.averageOrderValue.toLocaleString("fa-IR")} ریال
                </div>
              </div>
            </div>
          </section>

          <section className="print-section mt-10">
            <h2 className="text-2xl font-extrabold text-slate-900">
              فروش بر اساس دسته
            </h2>

            <div className="mt-4 overflow-hidden border border-slate-300">
              <table className="w-full border-collapse text-right text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-4 py-3">دسته</th>
                    <th className="px-4 py-3">تعداد</th>
                    <th className="px-4 py-3">فروش</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.salesByCategoryList.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-center text-slate-500" colSpan={3}>
                        داده‌ای وجود ندارد
                      </td>
                    </tr>
                  ) : (
                    metrics.salesByCategoryList.map((row) => (
                      <tr key={row.label} className="border-t border-slate-200">
                        <td className="px-4 py-4">{row.label}</td>
                        <td className="px-4 py-4">
                          {row.qty.toLocaleString("fa-IR")}
                        </td>
                        <td className="px-4 py-4 font-bold text-blue-900">
                          {row.sales.toLocaleString("fa-IR")} ریال
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-section mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-slate-900">
                فروش بر اساس قطعه
              </h2>
              <div className="text-sm text-slate-500">
                پرفروش‌ترین قطعه: {metrics.topProduct}
              </div>
            </div>

            <div className="mt-4 overflow-hidden border border-slate-300">
              <table className="w-full border-collapse text-right text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-3 py-3">نام قطعه</th>
                    <th className="px-3 py-3">کد فنی</th>
                    <th className="px-3 py-3">دسته</th>
                    <th className="px-3 py-3">تعداد فروش</th>
                    <th className="px-3 py-3">قیمت واحد</th>
                    <th className="px-3 py-3">مبلغ فروش</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.salesByProductList.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-center text-slate-500" colSpan={6}>
                        قطعه‌ای برای این فیلتر وجود ندارد
                      </td>
                    </tr>
                  ) : (
                    metrics.salesByProductList.map((item) => (
                      <tr key={`${item.code}-${item.name}`} className="border-t border-slate-200">
                        <td className="px-3 py-4 font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-3 py-4">{item.code}</td>
                        <td className="px-3 py-4">{item.category}</td>
                        <td className="px-3 py-4">
                          {item.qty.toLocaleString("fa-IR")}
                        </td>
                        <td className="px-3 py-4">
                          {item.unitPrice.toLocaleString("fa-IR")} ریال
                        </td>
                        <td className="px-3 py-4 font-bold text-blue-900">
                          {item.sales.toLocaleString("fa-IR")} ریال
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-section mt-10">
            <h2 className="text-2xl font-extrabold text-slate-900">
              خلاصه سفارش‌ها
            </h2>

            <div className="mt-4 overflow-hidden border border-slate-300">
              <table className="w-full border-collapse text-right text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-3 py-3">شماره سفارش</th>
                    <th className="px-3 py-3">مشتری</th>
                    <th className="px-3 py-3">شهر</th>
                    <th className="px-3 py-3">تعداد</th>
                    <th className="px-3 py-3">مبلغ</th>
                    <th className="px-3 py-3">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-center text-slate-500" colSpan={6}>
                        سفارشی برای این فیلتر وجود ندارد
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.orderNumber} className="border-t border-slate-200">
                        <td className="px-3 py-4">{order.orderNumber}</td>
                        <td className="px-3 py-4">
                          {order.customer.fullName || "-"}
                        </td>
                        <td className="px-3 py-4">{order.customer.city || "-"}</td>
                        <td className="px-3 py-4">
                          {order.itemCount.toLocaleString("fa-IR")}
                        </td>
                        <td className="px-3 py-4 font-bold text-blue-900">
                          {order.total.toLocaleString("fa-IR")} ریال
                        </td>
                        <td className="px-3 py-4">
                          {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-signature mt-12 grid grid-cols-2 gap-10 border-t border-dashed border-slate-300 pt-8">
            <div className="text-center">
              <div className="text-sm font-bold text-slate-700">
                تهیه‌کننده گزارش
              </div>
              <div className="mt-12 border-t border-slate-400 pt-3 text-xs text-slate-500">
                نام و امضا
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm font-bold text-slate-700">
                تایید مدیریت
              </div>
              <div className="mt-12 border-t border-slate-400 pt-3 text-xs text-slate-500">
                نام، امضا و مهر
              </div>
            </div>
          </section>

          <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
            Parsilon Part - Internal Sales Report
          </footer>

          <section className="print-hide mt-10 flex gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
            >
              چاپ / ذخیره به صورت PDF
            </button>

            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
            >
              بازگشت
            </button>
          </section>
        </div>
      </main>
    </>
  );
}

function ReportsPrintFallback() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900"
    >
      <div className="mx-auto w-full max-w-[980px] rounded-2xl bg-white p-8 shadow-sm">
        <div className="text-sm font-black text-slate-800">
          در حال آماده‌سازی گزارش...
        </div>
      </div>
    </main>
  );
}

export default function ReportsPrintPage() {
  return (
    <Suspense fallback={<ReportsPrintFallback />}>
      <ReportsPrintContent />
    </Suspense>
  );
}