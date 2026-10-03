"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import MobileShell from "@/components/layout/MobileShell";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "register";

type AuthUser = {
  id?: string;
  fullName?: string;
  phone?: string;
  role?: "USER" | "ADMIN";
};

type AuthActionResult = {
  success: boolean;
  message: string;
  user?: AuthUser;
};

export default function LoginPage() {
  const { login, register, isReady } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = useMemo(() => {
    return mode === "register" ? "ثبت‌نام کاربر جدید" : "ورود به حساب";
  }, [mode]);

  const resetFeedback = () => {
    setMessage("");
    setIsError(false);
  };

  // Where the visitor was heading before being sent to login. Only same-site
  // paths are accepted, so the parameter cannot redirect to another website.
  const readNextPath = () => {
    const next = new URLSearchParams(window.location.search).get("next");

    if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
      return null;
    }

    return next;
  };

  const resolveRedirectPath = async (
    resultUser?: AuthUser
  ): Promise<string> => {
    const next = readNextPath();

    if (next && (resultUser?.role === "ADMIN" || !next.startsWith("/admin"))) {
      return next;
    }

    if (resultUser?.role === "ADMIN") {
      return "/admin";
    }

    if (resultUser?.role === "USER") {
      return "/profile";
    }

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);
      const role = data?.user?.role;

      if (response.ok && data?.success && role === "ADMIN") {
        return "/admin";
      }

      if (response.ok && data?.success && role === "USER") {
        return "/profile";
      }
    } catch {
      // ignore and use fallback below
    }

    return "/profile";
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    resetFeedback();
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const result = (await register({
          fullName,
          phone,
          password,
        })) as AuthActionResult;
        setMessage(result.message);
        setIsError(!result.success);

        if (result.success) {
          const redirectPath = await resolveRedirectPath(result.user);
          window.location.href = redirectPath;
        }

        return;
      }

      const result = (await login({
        phone,
        password,
      })) as AuthActionResult;
      setMessage(result.message);
      setIsError(!result.success);

      if (result.success) {
        const redirectPath = await resolveRedirectPath(result.user);
        window.location.href = redirectPath;
      }
    } catch (error) {
      console.error("LOGIN PAGE ERROR:", error);
      setMessage("خطای غیرمنتظره در ورود/ثبت‌نام");
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isReady) return null;

  return (
    <MobileShell>
      <main
        className="pb-24 text-right"
        style={{ background: "#F4F7FC", direction: "rtl" }}
      >
        <div className="mx-auto max-w-sm px-4 pt-6">
          <div className="space-y-6 rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <div className="space-y-3 rounded-[24px] border border-slate-100 bg-slate-50/50 p-4 text-center shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <div className="mx-auto flex h-14 w-44 items-center justify-center overflow-hidden">
                <img
                  src="/images/logo-header-v2.png"
                  alt="پارسیلون پارت"
                  className="w-full object-contain -mt-4 -mb-4"
                />
              </div>

              <div className="mx-auto h-[3px] w-12 rounded-full bg-[#8CC63F]" />

              <p className="mx-auto max-w-[280px] text-[11px] font-bold leading-5 text-slate-400">
                اپلیکیشن تخصصی فروش آنلاین و عمده قطعات خودرو در ایران
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-center">
              <h1 className="text-xl font-black tracking-tight text-[#0E2F6D]">
                {title}
              </h1>
              <p className="text-xs font-bold text-slate-400">
                {mode === "register"
                  ? "اطلاعات خود را برای ساخت حساب وارد کنید."
                  : "برای ادامه، اطلاعات حساب خود را وارد کنید."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  resetFeedback();
                }}
                className={`rounded-xl py-2.5 text-xs font-black transition-all duration-300 active:scale-95 ${
                  mode === "login"
                    ? "bg-white text-[#17479E] shadow-[0_4px_12px_rgba(23,71,158,0.06)]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                ورود
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  resetFeedback();
                }}
                className={`rounded-xl py-2.5 text-xs font-black transition-all duration-300 active:scale-95 ${
                  mode === "register"
                    ? "bg-white text-[#17479E] shadow-[0_4px_12px_rgba(23,71,158,0.06)]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                ثبت‌نام
              </button>
            </div>

            <div className="space-y-3.5">
              {mode === "register" && (
                <div className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50/30 shadow-inner transition-all focus-within:border-[#17479E] focus-within:bg-white">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="نام و نام خانوادگی"
                    className="h-11 w-full bg-transparent px-4 text-center text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300"
                  />
                </div>
              )}

              <div className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50/30 shadow-inner transition-all focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="شماره موبایل"
                  className="h-11 w-full bg-transparent px-4 text-center text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300"
                  style={{ direction: phone ? "ltr" : "rtl" }}
                />
              </div>

              <div className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50/30 shadow-inner transition-all focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور"
                  className="h-11 w-full bg-transparent px-4 text-center text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300"
                  style={{ direction: password ? "ltr" : "rtl" }}
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#0E2F6D] via-[#17479E] to-[#2C63C7] text-xs font-black text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.96] disabled:opacity-60"
              >
                {isSubmitting
                  ? "در حال پردازش..."
                  : mode === "register"
                    ? "ایجاد حساب کاربری"
                    : "ورود به اپلیکیشن"}
              </button>
            </div>

            {message ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-xs font-bold leading-6 ${
                  isError
                    ? "border-red-100 bg-red-50/60 text-red-600"
                    : "border-green-100 bg-green-50/60 text-green-600"
                }`}
              >
                {message}
              </div>
            ) : null}

            <div className="border-t border-slate-50 pt-1 text-center">
              {mode === "register" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    resetFeedback();
                  }}
                  className="text-xs font-black text-[#17479E] transition-colors hover:text-[#0E2F6D]"
                >
                  قبلاً ثبت‌نام کرده‌ام؟ ورود به حساب
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    resetFeedback();
                  }}
                  className="text-xs font-black text-[#17479E] transition-colors hover:text-[#0E2F6D]"
                >
                  هنوز حساب نداری؟ ثبت‌نام جدید
                </button>
              )}
            </div>

            <Link
              href="/"
              className="block text-center text-xs font-black text-slate-400 transition-colors hover:text-slate-600"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </main>
    </MobileShell>
  );
}