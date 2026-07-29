"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const getNavClass = (href: string) => {
    const isActive =
      href === "/admin"
        ? pathname === "/admin"
        : pathname === href || pathname.startsWith(`${href}/`);

    return `rounded-2xl px-3 py-3 text-center text-xs font-bold transition ${
      isActive
        ? "bg-slate-900 text-white shadow-sm"
        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    }`;
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <AuthGuard requireAdmin>
      <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto min-h-screen max-w-sm bg-white shadow-2xl">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="px-4 py-4">
              <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 text-white shadow-lg">
                <div className="text-xs text-white/70">پنل مدیریت</div>
                <div className="mt-2 text-lg font-black">Parsilon Admin</div>
                <div className="mt-1 text-xs leading-6 text-slate-200">
                  مدیریت سفارش‌ها، محصولات، درخواست‌های عمده و گزارش‌ها
                </div>
              </div>

              <nav className="mt-4 grid grid-cols-3 gap-2">
                <Link href="/admin" className={getNavClass("/admin")}>
                  داشبورد
                </Link>

                <Link
                  href="/admin/orders"
                  className={getNavClass("/admin/orders")}
                >
                  سفارش‌ها
                </Link>

                <Link
                  href="/admin/products"
                  className={getNavClass("/admin/products")}
                >
                  محصولات
                </Link>

                <Link
                  href="/admin/wholesale"
                  className={getNavClass("/admin/wholesale")}
                >
                  عمده
                </Link>

                <Link
                  href="/admin/reports"
                  className={getNavClass("/admin/reports")}
                >
                  گزارش‌ها
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  خروج
                </button>
              </nav>
            </div>
          </header>

          {children}
        </div>
      </div>
    </AuthGuard>
  );
}