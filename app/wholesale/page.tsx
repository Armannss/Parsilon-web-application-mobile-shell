"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";

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

function ArrowRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PhoneIcon({ className = "h-4 w-4" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.506-5.129-3.812-6.635-6.635l1.293-.97a1.125 1.125 0 0 0 .417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

function MailIcon({ className = "h-4 w-4" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

export default function WholesalePage() {
  const [mounted, setMounted] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [productInfo, setProductInfo] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const citiesOfProvince = useMemo(() => {
    if (!selectedProvince) return [];
    return IRAN_DATA[selectedProvince] || [];
  }, [selectedProvince]);

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedCity("");
  };

  const resetFeedback = () => {
    setSubmitMessage("");
    setSubmitError("");
  };

  const resetForm = () => {
    setFullName("");
    setCompanyName("");
    setPhone("");
    setEmail("");
    setProductInfo("");
    setQuantity("");
    setDescription("");
    setSelectedProvince("");
    setSelectedCity("");
  };

  const handleFinalSubmit = async () => {
    resetFeedback();

    if (!fullName.trim() || !phone.trim() || !selectedProvince || !selectedCity) {
      setSubmitError("لطفاً فیلدهای ضروری شامل نام، شماره تماس، استان و شهر را تکمیل کنید.");
      return;
    }

    try {
      setIsSubmitting(true);

      const mergedDescription = [
        selectedProvince ? `استان: ${selectedProvince}` : "",
        selectedCity ? `شهر: ${selectedCity}` : "",
        email.trim() ? `ایمیل: ${email.trim()}` : "",
        productInfo.trim() ? `محصول/کد فنی: ${productInfo.trim()}` : "",
        quantity.trim() ? `تعداد مورد نیاز: ${quantity.trim()}` : "",
        description.trim() ? `توضیحات: ${description.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch("/api/wholesale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          companyName: companyName.trim(),
          description: mergedDescription,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "ثبت درخواست انجام نشد.");
      }

      setSubmitMessage(
        "درخواست خرید عمده با موفقیت ثبت شد. کارشناسان فروش در اولین فرصت با شما تماس می‌گیرند."
      );

      resetForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "خطا در ثبت درخواست خرید عمده.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <MobileShell>
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-4.5">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-500 shadow-2xs transition-all active:scale-95"
          >
            <ArrowRightIcon />
          </Link>

          <div className="text-center">
            <div className="text-base font-black tracking-tight text-[#0E2F6D]">
              خرید عمده
            </div>
            <div className="mt-0.5 text-[10px] font-bold text-slate-400">
              Parsilon Part
            </div>
          </div>

          <div className="w-9" />
        </div>
      </header>

      <main
        className="pb-32 text-right"
        style={{ background: "#F4F7FC", direction: "rtl" }}
      >
        <section className="px-4 pt-4">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#061B40] via-[#0E2F6D] to-[#1D4ED8] p-6 text-white shadow-[0_10px_30px_rgba(14,47,109,0.12)]">
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-xl" />

            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wide backdrop-blur-md shadow-inner">
              درخواست همکاری و خرید عمده
            </div>

            <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight drop-shadow-sm">
              برای خرید عمده با واحد فروش در ارتباط باشید
            </h1>
            <p className="mt-2 max-w-[280px] text-xs leading-6 text-slate-200/90 drop-shadow-sm">
              اطلاعات خود و نیازتان را ثبت کنید تا کارشناسان فروش پارسیلون پارت با شما تماس بگیرند.
            </p>
          </div>
        </section>

        <section className="mt-5 px-4">
          <div className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <h2 className="mb-2 text-sm font-black tracking-wide text-[#0E2F6D]">
              فرم درخواست خرید عمده
            </h2>

            {submitMessage ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold leading-6 text-emerald-700">
                {submitMessage}
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold leading-6 text-red-600">
                {submitError}
              </div>
            ) : null}

            <div className="space-y-3.5">
              <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all duration-300 focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="نام و نام خانوادگی"
                  className="h-11 w-full bg-transparent px-4 text-center text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>

              <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all duration-300 focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="نام فروشگاه یا شرکت"
                  className="h-11 w-full bg-transparent px-4 text-center text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>

              <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all duration-300 focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="شماره تماس"
                  className="h-11 w-full bg-transparent px-4 text-center text-xs font-bold tracking-wide text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>

              <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all duration-300 focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="آدرس ایمیل"
                  className="h-11 w-full bg-transparent px-4 text-center text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>

              <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all duration-300 focus-within:border-[#17479E] focus-within:bg-white">
                <select
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none bg-transparent px-4 text-center text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="" disabled>
                    انتخاب استان محل فعالیت
                  </option>
                  {Object.keys(IRAN_DATA).map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-4 text-[10px] text-slate-400">
                  ▼
                </div>
              </div>

              <div
                className={`relative flex items-center rounded-2xl border border-slate-200/80 p-1 transition-all duration-300 ${
                  !selectedProvince
                    ? "pointer-events-none bg-slate-100 opacity-60"
                    : "bg-slate-50/50 focus-within:border-[#17479E] focus-within:bg-white"
                }`}
              >
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedProvince}
                  className="h-11 w-full cursor-pointer appearance-none bg-transparent px-4 text-center text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="" disabled>
                    انتخاب شهر محل فعالیت
                  </option>
                  {citiesOfProvince.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-4 text-[10px] text-slate-400">
                  ▼
                </div>
              </div>

              <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all duration-300 focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="text"
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  placeholder="نام محصول یا کد فنی"
                  className="h-11 w-full bg-transparent px-4 text-center text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>

              <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all duration-300 focus-within:border-[#17479E] focus-within:bg-white">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="تعداد مورد نیاز"
                  className="h-11 w-full bg-transparent px-4 text-center text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>

              <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 p-1 transition-all duration-300 focus-within:border-[#17479E] focus-within:bg-white">
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="نیاز یا توضیحات تکمیلی خود را برای کارشناسان بنویسید..."
                  className="w-full resize-none bg-transparent p-4 text-right text-xs font-bold leading-6 text-slate-700 outline-none placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 px-4">
          <div className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <h2 className="text-sm font-black tracking-wide text-[#0E2F6D]">
              تماس مستقیم با واحد فروش
            </h2>

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <a
                href="tel:09003132532"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0E2F6D] to-[#17479E] py-3.5 text-xs font-black text-white shadow-md transition-all hover:shadow-lg active:scale-95"
              >
                <PhoneIcon />
                <span>تماس با واحد فروش</span>
              </a>

              <a
                href="mailto:info@parsilonpart.com"
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-xs font-black text-slate-600 transition-all hover:bg-slate-100 active:scale-95"
              >
                <MailIcon />
                <span>ارسال ایمیل رسمی</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-sm -translate-x-1/2 border-t border-slate-100 bg-white/95 p-4 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-3.5">
          <Link
            href="/products"
            className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5 text-center text-xs font-black text-slate-600 shadow-2xs transition-all hover:border-blue-200 hover:text-[#17479E] active:scale-95"
          >
            مشاهده محصولات
          </Link>

          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="flex items-center justify-center rounded-2xl bg-[#0E2F6D] py-3.5 text-center text-xs font-black text-white shadow-md transition-all hover:bg-[#17479E] active:scale-95 disabled:bg-slate-300"
          >
            {isSubmitting ? "در حال ثبت درخواست..." : "ثبت نهایی درخواست"}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}