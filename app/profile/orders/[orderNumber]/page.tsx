"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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

export default function OrderDetailsPage() {
  const params = useParams();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const orderNumber = useMemo(() => {
    const raw = params?.orderNumber;
    return typeof raw === "string" ? decodeURIComponent(raw) : "";
  }, [params]);

  useEffect(() => {
    if (!orderNumber) {
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

    loadOrder();
  }, [orderNumber]);

  return (
    <AuthGuard>
      <MobileShell>
        <AppHeader title="جزئیات سفارش" backHref="/profile/orders" />

        <main className="px-4 py-4 pb-24">
          {isLoading ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900">
                در حال دریافت اطلاعات سفارش...
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                چند لحظه صبر کن.
              </p>
            </section>
          ) : !order ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900">
                سفارش پیدا نشد
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {loadError || "ممکن است این سفارش وجود نداشته باشد یا دسترسی به آن نداشته باشید."}
              </p>
              <Link
                href="/profile/orders"
                className="mt-4 inline-block rounded-2xl bg-blue-900 px-4 py-3 text-sm font-bold text-white"
              >
                بازگشت به سفارش‌ها
              </Link>
            </section>
          ) : (
            <>
              <section className="rounded-3xl bg-gradient-to-br from-blue-900 via-blue-700 to-slate-700 p-5 text-white shadow-lg">
                <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs">
                  جزئیات سفارش
                </div>

                <h1 className="mt-4 text-2xl font-black leading-9">
                  {order.orderNumber}
                </h1>

                <p className="mt-3 text-sm leading-7 text-blue-50">
                  ثبت شده در {new Date(order.createdAt).toLocaleString("fa-IR")}
                </p>
              </section>

              <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900">
                  وضعیت سفارش
                </h2>

                <div className="mt-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-2 text-sm font-bold ${
                      getOrderStatusMeta(order.status).badgeClass
                    }`}
                  >
                    {getOrderStatusMeta(order.status).label}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <div className="text-sm text-slate-700">
                      سفارش ثبت شده است
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        order.status === "PROCESSING" ||
                        order.status === "SHIPPED" ||
                        order.status === "DELIVERED"
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      }`}
                    />
                    <div className="text-sm text-slate-700">
                      در حال پردازش توسط فروش
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        order.status === "SHIPPED" || order.status === "DELIVERED"
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      }`}
                    />
                    <div className="text-sm text-slate-700">
                      سفارش ارسال شده
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        order.status === "DELIVERED"
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      }`}
                    />
                    <div className="text-sm text-slate-700">
                      سفارش تحویل شده
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900">
                  اطلاعات گیرنده
                </h2>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">نام</span>
                    <span className="font-bold text-slate-900">
                      {order.customer.fullName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">شماره تماس</span>
                    <span className="font-bold text-slate-900">
                      {order.customer.phone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">استان</span>
                    <span className="font-bold text-slate-900">
                      {order.customer.province}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">شهر</span>
                    <span className="font-bold text-slate-900">
                      {order.customer.city}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-3">
                    <div className="text-slate-500">آدرس</div>
                    <div className="mt-1 font-bold text-slate-900">
                      {order.customer.address}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <span className="text-slate-500">کد پستی</span>
                    <span className="font-bold text-slate-900">
                      {order.customer.postalCode}
                    </span>
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900">
                  اقلام سفارش
                </h2>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={`${order.orderNumber}-${item.id}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 rounded-xl object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-2 text-sm font-bold text-slate-900">
                            {item.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            کد فنی: {item.code}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            تعداد: {item.quantity}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            قیمت واحد: {item.unitPrice.toLocaleString("fa-IR")} ریال
                          </div>
                          <div className="mt-1 text-xs font-bold text-blue-900">
                            جمع ردیف: {item.totalPrice.toLocaleString("fa-IR")} ریال
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900">
                  خلاصه مالی سفارش
                </h2>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">تعداد اقلام</span>
                    <span className="font-bold text-slate-900">
                      {order.itemCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">جمع کالاها</span>
                    <span className="font-bold text-slate-900">
                      {order.subtotal.toLocaleString("fa-IR")} ریال
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">هزینه ارسال</span>
                    <span className="font-bold text-slate-900">
                      {order.shipping.toLocaleString("fa-IR")} ریال
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">مالیات بر ارزش افزوده</span>
                    <span className="font-bold text-slate-900">
                      {order.vat.toLocaleString("fa-IR")} ریال
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                    <span className="font-bold text-slate-900">مبلغ نهایی</span>
                    <span className="text-lg font-black text-blue-900">
                      {order.total.toLocaleString("fa-IR")} ریال
                    </span>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        <BottomNav />
      </MobileShell>
    </AuthGuard>
  );
}