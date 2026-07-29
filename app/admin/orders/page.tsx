"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OrderStatus =
  | "pending_review"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type StatusFilter = "all" | OrderStatus;

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingOrderNumber, setIsUpdatingOrderNumber] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
        throw new Error(data?.message || "دریافت سفارش‌ها انجام نشد.");
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
        error instanceof Error ? error.message : "خطا در دریافت سفارش‌ها.";
      setErrorMessage(message);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (
    orderNumber: string,
    nextStatus: OrderStatus
  ) => {
    try {
      setIsUpdatingOrderNumber(orderNumber);
      setErrorMessage("");

      const statusMap: Record<OrderStatus, string> = {
        pending_review: "PENDING_REVIEW",
        processing: "PROCESSING",
        shipped: "SHIPPED",
        delivered: "DELIVERED",
        cancelled: "CANCELLED",
      };

      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          orderNumber,
          status: statusMap[nextStatus],
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "به‌روزرسانی وضعیت انجام نشد.");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.orderNumber === orderNumber
            ? { ...order, status: nextStatus }
            : order
        )
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "خطا در تغییر وضعیت سفارش.";
      setErrorMessage(message);
    } finally {
      setIsUpdatingOrderNumber(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" ? true : order.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        order.orderNumber.includes(normalizedSearch) ||
        order.customer.fullName.includes(normalizedSearch) ||
        order.customer.city.includes(normalizedSearch) ||
        order.customer.phone.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  return (
    <main className="px-4 py-4 pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">مدیریت سفارش‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          اینجا می‌توانی وضعیت سفارش‌ها را تغییر بدهی و آن‌ها را جستجو کنی.
        </p>
      </section>

      {errorMessage ? (
        <section className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm font-extrabold text-red-700">
            خطا در پردازش
          </div>
          <p className="mt-2 text-sm leading-7 text-red-600">{errorMessage}</p>
        </section>
      ) : null}

      <section className="mt-5 space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-xs font-bold text-slate-500">
            جستجو
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="شماره سفارش، نام گیرنده، شهر یا شماره تماس"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-xs font-bold text-slate-500">
            فیلتر وضعیت
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
          >
            <option value="all">همه سفارش‌ها</option>
            <option value="pending_review">در انتظار بررسی</option>
            <option value="processing">در حال پردازش</option>
            <option value="shipped">ارسال شده</option>
            <option value="delivered">تحویل شده</option>
            <option value="cancelled">لغو شده</option>
          </select>
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">
            لیست سفارش‌ها
          </h2>
          <span className="text-sm text-slate-500">
            {filteredOrders.length} سفارش
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-sm font-bold text-slate-900">
                در حال دریافت سفارش‌ها...
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                چند لحظه صبر کن.
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-sm font-bold text-slate-900">
                سفارشی با این فیلتر پیدا نشد
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                فیلتر وضعیت یا عبارت جستجو را تغییر بده.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusMeta = getOrderStatusMeta(order.status);
              const isUpdating = isUpdatingOrderNumber === order.orderNumber;

              return (
                <div
                  key={order.orderNumber}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {order.orderNumber}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleString("fa-IR")}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">گیرنده</span>
                      <span className="font-bold text-slate-900">
                        {order.customer.fullName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">شهر</span>
                      <span className="font-bold text-slate-900">
                        {order.customer.city}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">تعداد اقلام</span>
                      <span className="font-bold text-slate-900">
                        {order.itemCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">مبلغ</span>
                      <span className="font-bold text-blue-900">
                        {order.total.toLocaleString("fa-IR")} ریال
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-bold text-slate-500">
                      تغییر وضعیت
                    </label>

                    <select
                      value={order.status}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleUpdateStatus(
                          order.orderNumber,
                          e.target.value as OrderStatus
                        )
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none disabled:opacity-60"
                    >
                      <option value="pending_review">در انتظار بررسی</option>
                      <option value="processing">در حال پردازش</option>
                      <option value="shipped">ارسال شده</option>
                      <option value="delivered">تحویل شده</option>
                      <option value="cancelled">لغو شده</option>
                    </select>
                  </div>

                  <Link
                    href={`/profile/orders/${encodeURIComponent(order.orderNumber)}`}
                    className="mt-4 block rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700"
                  >
                    جزئیات سفارش
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}