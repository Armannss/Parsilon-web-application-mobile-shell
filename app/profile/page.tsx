"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import AuthGuard from "@/components/auth/AuthGuard";
import { BrakeDiscArt } from "@/components/home/PartArt";
import { useAuth } from "@/context/AuthContext";
import { getOrderStatusMeta, useOrder } from "@/context/OrderContext";
import { formatRial } from "@/lib/format";
import { SALES_PHONE } from "@/lib/site";

const ICONS = {
  orders:
    "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm0 5.25h.007v.008H3.75V12Zm0 5.25h.007v.008H3.75v-.008Z",
  wholesale:
    "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
  phone:
    "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z",
  admin:
    "M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75",
};

function MenuRow({
  href,
  icon,
  title,
  hint,
  external = false,
}: {
  href: string;
  icon: string;
  title: string;
  hint?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        {hint ? <span className="mt-0.5 block text-[11px] text-slate-500">{hint}</span> : null}
      </span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
      </svg>
    </>
  );

  const className = "flex items-center gap-3 px-4 py-3.5 active:bg-slate-50";

  return external ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const { orderHistory, isLoadingOrders } = useOrder();

  const activeOrders = orderHistory.filter(
    (order) => order.status !== "delivered" && order.status !== "cancelled"
  ).length;
  const latestOrder = orderHistory[0];

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <AuthGuard>
      <MobileShell>
        <AppHeader title="حساب کاربری" backHref="/" />

        <main className="min-h-screen bg-[#F4F7FC] px-4 pb-28 pt-4 text-right">
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-bl from-brand-700 to-brand-900 p-5 text-white shadow-float">
            <BrakeDiscArt className="absolute -bottom-16 -left-14 h-44 w-44 animate-spin-slow opacity-20" />

            <div className="relative flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-black">
                {user?.fullName.trim().charAt(0) || "؟"}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black">{user?.fullName}</h1>
                <p className="mt-0.5 text-xs text-brand-100" dir="ltr">
                  {user?.phone}
                </p>
              </div>
            </div>

            <dl className="relative mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <dt className="text-[11px] text-brand-100">کل سفارش‌ها</dt>
                <dd className="mt-1 text-xl font-black">
                  {isLoadingOrders ? "…" : orderHistory.length.toLocaleString("fa-IR")}
                </dd>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <dt className="text-[11px] text-brand-100">در جریان</dt>
                <dd className="mt-1 text-xl font-black">
                  {isLoadingOrders ? "…" : activeOrders.toLocaleString("fa-IR")}
                </dd>
              </div>
            </dl>
          </section>

          {latestOrder ? (
            <section className="mt-4">
              <h2 className="px-1 text-sm font-black text-slate-900">آخرین سفارش</h2>
              <Link
                href={`/profile/orders/${latestOrder.orderNumber}`}
                className="mt-2 block rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700" dir="ltr">
                    {latestOrder.orderNumber}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getOrderStatusMeta(latestOrder.status).badgeClass}`}
                  >
                    {getOrderStatusMeta(latestOrder.status).label}
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-[11px] text-slate-500">
                    {new Date(latestOrder.createdAt).toLocaleDateString("fa-IR")} ·{" "}
                    {latestOrder.itemCount.toLocaleString("fa-IR")} عدد
                  </span>
                  <span className="text-sm font-black text-brand-900">
                    {formatRial(latestOrder.total)}
                  </span>
                </div>
              </Link>
            </section>
          ) : !isLoadingOrders ? (
            <section className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white/60 p-5 text-center">
              <p className="text-sm font-bold text-slate-700">هنوز سفارشی ثبت نکرده‌اید</p>
              <Link
                href="/products"
                className="mt-3 inline-flex h-10 items-center rounded-xl bg-brand-800 px-5 text-xs font-bold text-white"
              >
                شروع خرید
              </Link>
            </section>
          ) : null}

          <nav
            aria-label="حساب کاربری"
            className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card"
          >
            <MenuRow href="/profile/orders" icon={ICONS.orders} title="سفارش‌های من" hint="پیگیری وضعیت و جزئیات" />
            <MenuRow href="/wholesale" icon={ICONS.wholesale} title="خرید عمده" hint="ویژه تعمیرگاه و فروشگاه" />
            <MenuRow href={`tel:${SALES_PHONE}`} icon={ICONS.phone} title="تماس با پشتیبانی" external />
            {isAdmin ? (
              <MenuRow href="/admin" icon={ICONS.admin} title="پنل مدیریت" />
            ) : null}
          </nav>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl border border-red-100 bg-white text-sm font-bold text-red-600 active:bg-red-50"
          >
            خروج از حساب
          </button>
        </main>

        <BottomNav />
      </MobileShell>
    </AuthGuard>
  );
}
