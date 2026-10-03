"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import MobileShell from "@/components/layout/MobileShell";
import { BrakeDiscArt } from "@/components/home/PartArt";
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
  const [showPassword, setShowPassword] = useState(false);

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

  const isRegister = mode === "register";
  const fieldClass =
    "mt-1.5 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

  const switchMode = (next: Mode) => {
    setMode(next);
    resetFeedback();
  };

  return (
    <MobileShell>
      <main className="min-h-screen bg-[#F4F7FC] text-right">
        <div className="relative overflow-hidden bg-gradient-to-b from-brand-800 to-brand-900 px-6 pb-16 pt-10 text-white">
          <BrakeDiscArt className="absolute -left-16 -top-10 h-52 w-52 animate-spin-slow opacity-25" />

          {/* The logo file has wide empty margins, so it is cropped by its frame. */}
          <Link
            href="/"
            className="relative flex h-12 w-40 items-center justify-center overflow-hidden rounded-2xl bg-white"
          >
            <img
              src="/images/logo-header-v2.png"
              alt="پارسیلون پارت"
              className="-my-4 w-full object-contain"
            />
          </Link>

          <h1 className="relative mt-6 text-2xl font-black">{title}</h1>
          <p className="relative mt-1.5 text-xs leading-6 text-brand-100">
            {isRegister
              ? "با شماره موبایل، در کمتر از یک دقیقه حساب بسازید."
              : "برای پیگیری سفارش و خرید، وارد حساب خود شوید."}
          </p>
        </div>

        <div className="relative -mt-8 px-4 pb-10">
          <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-float">
            <div
              role="tablist"
              aria-label="ورود یا ثبت‌نام"
              className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1"
            >
              {(["login", "register"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={mode === item}
                  onClick={() => switchMode(item)}
                  className={`rounded-xl py-2.5 text-xs font-black transition-all ${
                    mode === item
                      ? "bg-white text-brand-700 shadow-card"
                      : "text-slate-500"
                  }`}
                >
                  {item === "login" ? "ورود" : "ثبت‌نام"}
                </button>
              ))}
            </div>

            <form
              className="mt-5 space-y-4"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              {isRegister ? (
                <div>
                  <label htmlFor="fullName" className="text-xs font-bold text-slate-600">
                    نام و نام خانوادگی
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              ) : null}

              <div>
                <label htmlFor="phone" className="text-xs font-bold text-slate-600">
                  شماره موبایل
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09121234567"
                  className={`${fieldClass} text-left`}
                />
              </div>

              <div>
                <label htmlFor="password" className="text-xs font-bold text-slate-600">
                  رمز عبور
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby={isRegister ? "password-hint" : undefined}
                    className={`${fieldClass} pl-14 text-left`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-pressed={showPassword}
                    className="absolute left-2 top-[calc(50%+3px)] -translate-y-1/2 rounded-lg px-2 py-1.5 text-[11px] font-bold text-brand-700"
                  >
                    {showPassword ? "پنهان" : "نمایش"}
                  </button>
                </div>
                {isRegister ? (
                  <p id="password-hint" className="mt-1.5 text-[11px] text-slate-400">
                    حداقل ۸ کاراکتر
                  </p>
                ) : null}
              </div>

              {message ? (
                <div
                  role={isError ? "alert" : "status"}
                  className={`rounded-2xl border px-4 py-3 text-xs font-bold leading-6 ${
                    isError
                      ? "border-red-100 bg-red-50 text-red-700"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand-800 text-sm font-black text-white shadow-float transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmitting
                  ? "کمی صبر کنید…"
                  : isRegister
                    ? "ساخت حساب"
                    : "ورود"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => switchMode(isRegister ? "login" : "register")}
              className="mt-4 w-full text-center text-xs font-bold text-brand-700"
            >
              {isRegister
                ? "حساب دارید؟ وارد شوید"
                : "حساب ندارید؟ ثبت‌نام کنید"}
            </button>
          </div>

          <Link
            href="/"
            className="mt-5 block text-center text-xs font-bold text-slate-400"
          >
            بازگشت به فروشگاه
          </Link>
        </div>
      </main>
    </MobileShell>
  );
}
