"use client";

import { useState } from "react";

export default function MobileLoginForm() {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-900">
        ورود با شماره موبایل
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        برای ورود یا ثبت‌نام، شماره موبایل خود را وارد کنید.
      </p>

      {step === "mobile" ? (
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              شماره موبایل
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="مثلاً 09123456789"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-700"
            />
          </div>

          <button
            onClick={() => setStep("otp")}
            className="w-full rounded-2xl bg-blue-900 px-4 py-3 text-sm font-bold text-white"
          >
            ارسال کد تایید
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
            کد تایید به شماره <span className="font-bold">{mobile}</span> ارسال شد.
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              کد تایید
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="کد ۵ یا ۶ رقمی"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-700"
            />
          </div>

          <button className="w-full rounded-2xl bg-blue-900 px-4 py-3 text-sm font-bold text-white">
            تایید و ورود
          </button>

          <button
            onClick={() => setStep("mobile")}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            ویرایش شماره موبایل
          </button>
        </div>
      )}
    </div>
  );
}