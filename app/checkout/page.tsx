"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { getCartItems } from "@/lib/utils";
import {
  getCartSummary,
  writeProductsToApiCache,
} from "@/lib/cart-products";
import { useOrder } from "@/context/OrderContext";

const IRAN_DATA: Record<string, string[]> = {
  تهران: ["تهران", "شهریار", "اسلامشهر", "ری", "پاکدشت", "ورامین", "قدس", "ملارد", "دماوند"],
  البرز: ["کرج", "فردیس", "کمال‌شهر", "نظرآباد", "هشتگرد", "محمدشهر", "ماهدشت"],
  اصفهان: ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "شاهین‌شهر", "شهرضا", "مبارکه"],
  "خراسان رضوی": ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "قوچان", "کاشمر", "تربت جام"],
  فارس: ["شیراز", "مرودشت", "جهرم", "فسا", "کازرون", "صدرا", "لار", "فیروزآباد"],
  خوزستان: ["اهواز", "دزفول", "آبادان", "خرمشهر", "ماهشهر", "اندیمشک", "ایذه", "بهبهان"],
  "آذربایجان شرقی": ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "سهند"],
  مازندران: ["ساری", "بابل", "آمل", "قائم‌شهر", "تنکابن", "بهشهر", "بابلسر", "نوشهر"],
  گیلان: ["رشت", "بندر انزلی", "لاهیجان", "لنگرود", "تالش", "آستارا", "صومعه‌سرا"],
  کرمان: ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم", "زرند", "کهنوج"],
  "آذربایجان غربی": ["ارومیه", "خوی", "بوکان", "مهاباد", "میاندوآب", "سلماس", "پیرانشهر"],
  "سیستان و بلوچستان": ["زاهدان", "زابل", "ایرانشهر", "چابهار", "سراوان", "خاش"],
  کرمانشاه: ["کرمانشاه", "اسلام‌آباد غرب", "جوانرود", "کنگاور", "سرپل ذهاب"],
  لرستان: ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "الیگودرز", "نورآباد"],
  همدان: ["همدان", "ملایر", "نهاوند", "تویسرکان", "اسدآباد", "کبودرآهنگ"],
  یزد: ["یزد", "میبد", "اردکان", "بافق", "مهریز", "ابرکوه"],
  مرکزی: ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "شازند"],
  قم: ["قم", "قنوات", "جعفریه", "دستجرد"],
  قزوین: ["قزوین", "الوند", "محمدیه", "تاکستان", "آبیک"],
  سمنان: ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر"],
  گلستان: ["گرگان", "گنبد کاووس", "بندر ترکمن", "علی‌آباد کتول", "آزادشهر"],
  اردبیل: ["اردبیل", "مشگین‌شهر", "پارس‌آباد", "خلخال", "گرمی"],
  زنجان: ["زنجان", "ابهر", "خرمدره", "قیدار", "طارم"],
  کردستان: ["سنندج", "سقز", "مریوان", "بانه", "قروه", "کامیاران"],
  "چهارمحال و بختیاری": ["شهرکرد", "بروجن", "لردگان", "فرخ‌شهر", "فارسان"],
  "کهگیلویه و بویراحمد": ["یاسوج", "دوگنبدان", "دهدشت", "لیکک"],
  "خراسان جنوبی": ["بیرجند", "قائن", "طبس", "فردوس", "نهبندان"],
  "خراسان شمالی": ["بجنورد", "شیروان", "اسفراین", "آشخانه", "جاجرم"],
  بوشهر: ["بوشهر", "برازجان", "بندر گناوه", "خورموج", "کنگان", "عسلویه"],
  هرمزگان: ["بندرعباس", "میناب", "دهبارز", "قشم", "کیش", "بندر لنگه"],
  ایلام: ["ایلام", "ایوان", "دهلران", "آبدانان", "مهران"],
};

type CheckoutErrors = {
  fullName?: string;
  phone?: string;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
};

const EMPTY_SUMMARY = {
  resolvedItems: [],
  validItems: [],
  subtotal: 0,
  itemCount: 0,
  hasMissingItems: false,
  hasUnavailableItems: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { checkoutForm, updateCheckoutForm, createOrder } = useOrder();

  const [mounted, setMounted] = useState(false);
  const [version, setVersion] = useState(0);
  const [errors, setErrors] = useState<CheckoutErrors>({});

  useEffect(() => {
    setMounted(true);

    const handleCartUpdated = () => {
      setVersion((prev) => prev + 1);
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    const ensureProductsCache = async () => {
      if (!mounted || typeof window === "undefined") return;

      const existingCache =
        window.localStorage.getItem("parsilon-products-api-cache") ||
        window.localStorage.getItem("parsilon-products-cache");

      if (existingCache) return;

      try {
        const response = await fetch("/api/products", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !Array.isArray(data?.products)) {
          return;
        }

        writeProductsToApiCache(data.products);
        setVersion((prev) => prev + 1);
      } catch (error) {
        console.error("checkout cache bootstrap error:", error);
      }
    };

    void ensureProductsCache();
  }, [mounted]);

  const cartItems = useMemo(() => {
    if (!mounted) return [];
    return getCartItems();
  }, [mounted, version]);

  const summary = useMemo(() => {
    if (!mounted) return EMPTY_SUMMARY;
    return getCartSummary(cartItems);
  }, [mounted, cartItems, version]);

  const citiesOfProvince = useMemo(() => {
    if (!checkoutForm.province) return [];
    return IRAN_DATA[checkoutForm.province] || [];
  }, [checkoutForm.province]);

  const shippingCost =
    summary.validItems.length > 0
      ? checkoutForm.shippingMethod === "express"
        ? 300000
        : 150000
      : 0;

  const vatAmount =
    summary.validItems.length > 0
      ? Math.round((summary.subtotal + shippingCost) * 0.1)
      : 0;

  const total = summary.subtotal + shippingCost + vatAmount;

  const canContinue =
    mounted &&
    summary.validItems.length > 0 &&
    !summary.hasMissingItems &&
    !summary.hasUnavailableItems;

  const validateForm = () => {
    const nextErrors: CheckoutErrors = {};

    if (!checkoutForm.fullName.trim()) {
      nextErrors.fullName = "نام و نام خانوادگی را وارد کن.";
    }

    if (!checkoutForm.phone.trim()) {
      nextErrors.phone = "شماره تماس را وارد کن.";
    } else if (!/^(\+98|0)?9\d{9}$/.test(checkoutForm.phone.replace(/\s/g, ""))) {
      nextErrors.phone = "شماره تماس معتبر نیست.";
    }

    if (!checkoutForm.province.trim()) {
      nextErrors.province = "انتخاب استان الزامی است.";
    }

    if (!checkoutForm.city.trim()) {
      nextErrors.city = "انتخاب شهر الزامی است.";
    }

    if (!checkoutForm.address.trim()) {
      nextErrors.address = "آدرس دقیق ارسال را وارد کن.";
    }

    if (!checkoutForm.postalCode.trim()) {
      nextErrors.postalCode = "کد پستی را وارد کن.";
    } else if (!/^\d{10}$/.test(checkoutForm.postalCode.replace(/[^\d]/g, ""))) {
      nextErrors.postalCode = "کد پستی باید ۱۰ رقم باشد.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = () => {
    if (!canContinue) return;
    if (!validateForm()) return;

    createOrder();
    router.push("/payment");
  };

  if (!mounted) return null;

  return (
    <MobileShell>
      <AppHeader title="تکمیل سفارش" backHref="/cart" />

      <main
        className="pb-36 text-right"
        style={{ background: "#F4F7FC", direction: "rtl" }}
      >
        <section className="px-4 pt-4">
          <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_12px_35px_rgba(14,47,109,0.04)]">
            <div className="flex items-center justify-between border-b-4 border-[#8CC63F] bg-white px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8CC63F] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8CC63F]" />
                </span>
                <span className="text-sm font-black tracking-tight text-[#0E2F6D]">
                  تکمیل نهایی اطلاعات و تایید آدرس
                </span>
              </div>
            </div>

            <div className="space-y-1.5 p-5 pt-6">
              <h1 className="text-xl font-black tracking-tight text-[#0E2F6D]">
                اطلاعات و محل تحویل مرسوله
              </h1>
              <p className="text-sm leading-7 text-slate-500">
                مشخصات گیرنده، آدرس پستی دقیق و روش ارسال کالا را جهت صدور فاکتور
                نهایی بررسی و تایید کنید.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 px-4">
          <div className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <h2 className="mb-1 text-base font-black tracking-wide text-[#0E2F6D]">
              مشخصات و نشانی گیرنده
            </h2>

            <div className="space-y-3.5">
              <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="text"
                  value={checkoutForm.fullName}
                  onChange={(e) =>
                    updateCheckoutForm({ fullName: e.target.value })
                  }
                  placeholder="نام و نام خانوادگی گیرنده"
                  className="h-12 w-full bg-transparent px-4 text-center text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
                />
                {errors.fullName && (
                  <div className="pb-1 text-center text-[11px] font-bold text-red-500">
                    {errors.fullName}
                  </div>
                )}
              </div>

              <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="tel"
                  value={checkoutForm.phone}
                  onChange={(e) => updateCheckoutForm({ phone: e.target.value })}
                  placeholder="شماره تلفن همراه"
                  className="h-12 w-full bg-transparent px-4 text-center text-sm font-bold tracking-wide text-slate-700 outline-none placeholder:text-slate-300"
                />
                {errors.phone && (
                  <div className="pb-1 text-center text-[11px] font-bold text-red-500">
                    {errors.phone}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all focus-within:border-[#17479E] focus-within:bg-white">
                  <select
                    value={checkoutForm.province}
                    onChange={(e) => {
                      updateCheckoutForm({
                        province: e.target.value,
                        city: "",
                      });
                    }}
                    className="h-12 w-full cursor-pointer appearance-none bg-transparent px-2 text-center text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="">انتخاب استان</option>
                    {Object.keys(IRAN_DATA).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors.province && (
                    <div className="pb-1 text-center text-[10px] font-bold text-red-500">
                      {errors.province}
                    </div>
                  )}
                </div>

                <div
                  className={`flex flex-col rounded-2xl border border-slate-200/80 p-1 transition-all ${
                    !checkoutForm.province
                      ? "pointer-events-none bg-slate-100 opacity-60"
                      : "bg-slate-50/50 focus-within:border-[#17479E] focus-within:bg-white"
                  }`}
                >
                  <select
                    value={checkoutForm.city}
                    onChange={(e) => updateCheckoutForm({ city: e.target.value })}
                    disabled={!checkoutForm.province}
                    className="h-12 w-full cursor-pointer appearance-none bg-transparent px-2 text-center text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="">انتخاب شهر</option>
                    {citiesOfProvince.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <div className="pb-1 text-center text-[10px] font-bold text-red-500">
                      {errors.city}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all focus-within:border-[#17479E] focus-within:bg-white">
                <textarea
                  rows={3}
                  value={checkoutForm.address}
                  onChange={(e) =>
                    updateCheckoutForm({ address: e.target.value })
                  }
                  placeholder="نشانی دقیق پستی، خیابان، کوچه، پلاک و واحد"
                  className="w-full resize-none bg-transparent p-3 text-right text-sm font-bold leading-6 text-slate-700 outline-none placeholder:text-slate-300"
                />
                {errors.address && (
                  <div className="px-4 pb-1.5 text-right text-[11px] font-bold text-red-500">
                    {errors.address}
                  </div>
                )}
              </div>

              <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="text"
                  value={checkoutForm.postalCode}
                  onChange={(e) =>
                    updateCheckoutForm({ postalCode: e.target.value })
                  }
                  placeholder="کد پستی ۱۰ رقمی"
                  className="h-12 w-full bg-transparent px-4 text-center text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
                />
                {errors.postalCode && (
                  <div className="pb-1 text-center text-[11px] font-bold text-red-500">
                    {errors.postalCode}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {!canContinue && (
          <section className="mt-4 px-4">
            <div className="rounded-[24px] border border-red-100 bg-red-50/60 p-4 text-center">
              <div className="text-sm font-black text-red-700">
                وضعیت سبد خرید تغییر کرده است
              </div>
              <p className="mt-1 text-xs font-bold leading-6 text-red-500">
                برخی قطعات ناموجود شده یا از سیستم حذف شده‌اند. لطفاً سبد را
                بازبینی کنید.
              </p>
              <Link
                href="/cart"
                className="mt-3 inline-flex rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95"
              >
                اصلاح سبد خرید
              </Link>
            </div>
          </section>
        )}

        <section className="mt-5 px-4">
          <div className="space-y-3.5 rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <h2 className="text-base font-black tracking-wide text-[#0E2F6D]">
              انتخاب روش ارسال مرسوله
            </h2>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => updateCheckoutForm({ shippingMethod: "normal" })}
                className={`rounded-2xl border p-4 text-right transition-all duration-200 active:scale-95 ${
                  checkoutForm.shippingMethod === "normal"
                    ? "border-[#0E2F6D] bg-blue-50/40 shadow-inner"
                    : "border-slate-100 bg-slate-50/60 text-slate-400"
                }`}
              >
                <div className="text-sm font-black text-slate-800">
                  باربری / پست عادی
                </div>
                <div className="mt-2 text-sm font-black text-[#0E2F6D]">
                  ۱۵۰,۰۰۰ ریال
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateCheckoutForm({ shippingMethod: "express" })}
                className={`rounded-2xl border p-4 text-right transition-all duration-200 active:scale-95 ${
                  checkoutForm.shippingMethod === "express"
                    ? "border-[#0E2F6D] bg-blue-50/40 shadow-inner"
                    : "border-slate-100 bg-slate-50/60 text-slate-400"
                }`}
              >
                <div className="text-sm font-black text-slate-800">
                  ارسال اکسپرس سریع
                </div>
                <div className="mt-2 text-sm font-black text-[#0E2F6D]">
                  ۳۰۰,۰۰۰ ریال
                </div>
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 px-4">
          <div className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h2 className="text-base font-black text-[#0E2F6D]">
                خلاصه اقلام فاکتور
              </h2>
              <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-400">
                {summary.validItems.length} ردیف کالا
              </span>
            </div>

            <div className="no-scrollbar max-h-60 space-y-3 overflow-y-auto">
              {summary.validItems.map((item) => (
                <div
                  key={item.slug}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-2.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white">
                      <Image
                        src={item.safeImage}
                        alt={item.product?.name || "product"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="line-clamp-1 text-sm font-black text-slate-800">
                        {item.product?.name}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400">
                        کد فنی: {item.product?.code} | تعداد: {item.quantity}
                      </div>
                      <div className="text-sm font-black text-[#17479E]">
                        {item.product?.price}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-dashed border-slate-200 pt-4">
              <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                <span>جمع کل قطعات</span>
                <span className="font-black text-slate-800">
                  {summary.subtotal.toLocaleString("fa-IR")} ریال
                </span>
              </div>

              <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                <span>هزینه ارسال</span>
                <span className="font-black text-slate-800">
                  {shippingCost.toLocaleString("fa-IR")} ریال
                </span>
              </div>

              <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                <span>مالیات بر ارزش افزوده (۱۰٪)</span>
                <span className="font-black text-slate-800">
                  {vatAmount.toLocaleString("fa-IR")} ریال
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-base font-black text-slate-800">
                  مبلغ نهایی فاکتور خرید
                </span>
                <span className="text-xl font-black text-[#0E2F6D]">
                  {total.toLocaleString("fa-IR")} ریال
                </span>
              </div>

              <div className="rounded-2xl bg-blue-50/60 px-4 py-3 text-[11px] font-bold leading-6 text-[#17479E]">
                مبلغ نهایی شامل ۱۰٪ مالیات بر ارزش افزوده و هزینه ارسال است.
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-sm -translate-x-1/2 border-t border-slate-100 bg-white/95 p-4 backdrop-blur-md">
        {canContinue ? (
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-2xl bg-[#0E2F6D] py-3.5 text-center text-sm font-black text-white shadow-md transition-transform duration-200 hover:bg-[#17479E] active:scale-95"
          >
            تایید اطلاعات و اتصال به درگاه پرداخت
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-2xl bg-slate-300 py-3.5 text-center text-sm font-black text-white"
          >
            ابتدا اقلام سبد خرید را اصلاح کنید
          </button>
        )}
      </div>

      <BottomNav />
    </MobileShell>
  );
}