"use client";

import Link from "next/link";

type BrandStripHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  dateLabel?: string;
};

export default function BrandStripHeader({
  title,
  subtitle = "قیمت‌های فوق بدون احتساب مالیات بر ارزش افزوده می‌باشد",
  backHref,
  backLabel = "بازگشت",
  dateLabel = "اردیبهشت ماه ۱۴۰۵",
}: BrandStripHeaderProps) {
  return (
    <section className="px-4 pt-4">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        {/* top texture */}
        <div className="relative h-14 bg-[#ECEFF3]">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, rgba(255,255,255,0.95) 0px, rgba(255,255,255,0.95) 2px, transparent 2px, transparent 12px)",
            }}
          />
        </div>

        {/* brand row */}
        <div className="bg-white px-4 pb-2 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <img
                src="/images/logo-header-v2.png"
                alt="پارسیلون پارت"
                className="h-auto w-[170px] max-w-full object-contain"
              />
            </div>

            <div className="shrink-0 text-left">
              <div className="flex items-center justify-end gap-2 text-[11px] font-bold text-slate-500">
                <span>{dateLabel}</span>
                <span className="text-slate-300">|</span>

                {backHref ? (
                  <Link
                    href={backHref}
                    className="inline-flex items-center gap-1 text-[#17479E]"
                  >
                    <span>{backLabel}</span>
                    <span>‹</span>
                  </Link>
                ) : null}
              </div>

              <div className="mt-1 text-sm font-extrabold text-[#17479E]">
                {title}
              </div>
            </div>
          </div>
        </div>

        {/* green line */}
        <div className="h-[4px] bg-[#8CC63F]" />

        {/* bottom strip */}
        <div className="bg-[#BFC4CB] px-4 py-1.5 text-center text-[10px] font-semibold text-white">
          {subtitle}
        </div>
      </div>
    </section>
  );
}