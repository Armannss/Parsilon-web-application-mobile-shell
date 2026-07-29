"use client";

import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import BottomNav from "@/components/layout/BottomNav";
import AuthGuard from "@/components/auth/AuthGuard";
import AppHeader from "@/components/layout/AppHeader";
import { useAuth } from "@/context/AuthContext";

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a7.5 7.5 0 0 1 15 0"
      />
    </svg>
  );
}

function PhoneIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M2.25 4.5A2.25 2.25 0 0 1 4.5 2.25h2.118c.985 0 1.85.667 2.102 1.62l.74 2.774a2.25 2.25 0 0 1-.516 2.13l-1.208 1.208a13.5 13.5 0 0 0 6.282 6.282l1.208-1.208a2.25 2.25 0 0 1 2.13-.516l2.774.74a2.25 2.25 0 0 1 1.62 2.102V19.5a2.25 2.25 0 0 1-2.25 2.25h-.75C10.178 21.75 2.25 13.822 2.25 4.5Z"
      />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M9 12.75 11.25 15 15 9.75m6 2.25a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
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

function LogoutIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-7.5a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 6 21h7.5a2.25 2.25 0 0 0 2.25-2.25V15m5.25-3-3.75-3.75M21 12H9"
      />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <AuthGuard>
      <MobileShell>
        <AppHeader title="حساب کاربری" backHref="/" />

        <main
          className="pb-28 text-right"
          style={{ background: "#F4F7FC", direction: "rtl" }}
        >
          <section className="px-4 pt-4">
            <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_12px_35px_rgba(14,47,109,0.04)]">
              <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#06183A] via-[#0E2F6D] to-[#355FC7] p-6 text-white">
                <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-10 right-0 h-28 w-28 rounded-full bg-[#8CC63F]/20 blur-2xl" />

                <div className="relative z-10">
                  <div className="flex justify-end">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold backdrop-blur-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8CC63F] opacity-70" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8CC63F]" />
                      </span>
                      پنل کاربری
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                      <UserIcon className="h-7 w-7" />
                    </div>

                    <div>
                      <h1 className="text-[28px] font-black leading-[42px] tracking-tight">
                        حساب کاربری
                      </h1>
                      <div className="text-sm font-bold text-white/90">
                        مدیریت اطلاعات و سفارش‌های ثبت‌شده
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 max-w-[310px] text-sm leading-7 text-white/90">
                    از این بخش می‌توانی مشخصات حساب، وضعیت سفارش‌ها و دسترسی‌های
                    مرتبط با پروفایل خودت را بررسی کنی.
                  </p>

                  <div className="mt-4 h-[4px] w-16 rounded-full bg-[#8CC63F]" />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 px-4">
            <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-[#0E2F6D]">
                <ShieldIcon />
                <h2 className="text-base font-black">اطلاعات حساب</h2>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <UserIcon className="h-4 w-4" />
                    <span className="text-[11px] font-bold">نام</span>
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-800">
                    {user?.fullName || "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <PhoneIcon className="h-4 w-4" />
                    <span className="text-[11px] font-bold">شماره موبایل</span>
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-800">
                    {user?.phone || "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <div className="text-[11px] font-bold text-slate-400">
                    نوع حساب
                  </div>
                  <div className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-[#17479E]">
                    {user?.role === "admin" ? "ادمین" : "کاربر"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 px-4">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/profile/orders"
                className="group rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_10px_28px_rgba(14,47,109,0.03)] transition-all duration-200 hover:-translate-y-1 active:scale-95"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#17479E]">
                  <BoxIcon />
                </div>
                <div className="mt-4 text-sm font-black text-slate-800">
                  سفارش‌ها
                </div>
                <div className="mt-1 text-[11px] font-medium leading-5 text-slate-400">
                  مشاهده و پیگیری سفارش‌های ثبت‌شده
                </div>
              </Link>

              <Link
                href="/profile/orders"
                className="group rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_10px_28px_rgba(14,47,109,0.03)] transition-all duration-200 hover:-translate-y-1 active:scale-95"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <ShieldIcon />
                </div>
                <div className="mt-4 text-sm font-black text-slate-800">
                  وضعیت حساب
                </div>
                <div className="mt-1 text-[11px] font-medium leading-5 text-slate-400">
                  مشاهده وضعیت و سوابق سفارش
                </div>
              </Link>
            </div>
          </section>

          <section className="mt-5 px-4">
            <div className="rounded-[32px] border border-red-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
              <div className="flex items-center gap-2 text-red-600">
                <LogoutIcon />
                <h2 className="text-base font-black">خروج از حساب</h2>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                با خروج از حساب، دسترسی شما به پروفایل و پیگیری سفارش‌ها تا ورود
                مجدد متوقف می‌شود.
              </p>

              <button
                type="button"
                onClick={logout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3.5 text-sm font-black text-red-600 transition-all duration-200 hover:bg-red-100 active:scale-95"
              >
                <LogoutIcon className="h-4 w-4" />
                خروج
              </button>
            </div>
          </section>
        </main>

        <BottomNav />
      </MobileShell>
    </AuthGuard>
  );
}