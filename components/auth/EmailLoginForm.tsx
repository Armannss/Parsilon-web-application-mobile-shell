"use client";

import { useState } from "react";

export default function EmailLoginForm() {
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-900">
        ورود با ایمیل
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        برای ورود یا ثبت‌نام، ایمیل خود را وارد کنید.
      </p>

      {step === "email" ? (
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              ایمیل
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-700"
            />
          </div>

          <button
            onClick={() => setStep("verify")}
            className="w-full rounded-2xl bg-blue-900 px-4 py-3 text-sm font-bold text-white"
          >
            ارسال کد یا لینک ورود
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
            کد یا لینک ورود به ایمیل <span className="font-bold">{email}</span> ارسال شد.
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              کد تایید
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="در صورت ورود با کد"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-700"
            />
          </div>

          <button className="w-full rounded-2xl bg-blue-900 px-4 py-3 text-sm font-bold text-white">
            تایید و ورود
          </button>

          <button
            onClick={() => setStep("email")}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            ویرایش ایمیل
          </button>
        </div>
      )}
    </div>
  );
}