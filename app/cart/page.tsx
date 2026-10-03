"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import ProductImage from "@/components/product/ProductImage";
import { useCart } from "@/context/CartContext";
import { getCartSummary } from "@/lib/cart-products";
import { formatRial } from "@/lib/format";
import { computeOrderTotals, MAX_QUANTITY_PER_ITEM } from "@/lib/pricing";

type CartSummary = Awaited<ReturnType<typeof getCartSummary>>;

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.35 9m-4.78 0L9.26 9m9.97-3.21c.34.05.68.11 1.02.17m-1.02-.17L18.16 19.67a2.25 2.25 0 0 1-2.24 2.08H8.08a2.25 2.25 0 0 1-2.24-2.08L4.77 5.79m14.46 0a48.1 48.1 0 0 0-3.48-.4m-12 .57c.34-.06.68-.12 1.02-.17m0 0a48.1 48.1 0 0 1 3.48-.4m7.5 0v-.92c0-1.18-.91-2.16-2.09-2.2a51.96 51.96 0 0 0-3.32 0c-1.18.04-2.09 1.02-2.09 2.2v.92m7.5 0a48.67 48.67 0 0 0-7.5 0" />
    </svg>
  );
}

function CartSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="در حال بررسی سبد خرید">
      {[0, 1].map((index) => (
        <div key={index} className="flex gap-3 rounded-3xl border border-slate-200/80 bg-white p-3">
          <div className="skeleton h-24 w-24 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2 py-1">
            <div className="skeleton h-4 w-4/5 rounded-full" />
            <div className="skeleton h-3 w-1/3 rounded-full" />
            <div className="skeleton mt-4 h-9 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CartPage() {
  const {
    cartItems,
    isCartReady,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [summary, setSummary] = useState<CartSummary | null>(null);

  // Prices and stock are re-read from the server whenever the cart changes.
  useEffect(() => {
    if (!isCartReady) return;

    let cancelled = false;

    getCartSummary(cartItems).then((next) => {
      if (!cancelled) setSummary(next);
    });

    return () => {
      cancelled = true;
    };
  }, [isCartReady, cartItems]);

  const isLoading = !isCartReady || summary === null;
  const items = summary?.resolvedItems ?? [];
  const hasProblems = Boolean(
    summary && (summary.hasMissingItems || summary.hasUnavailableItems)
  );

  const totals = computeOrderTotals(
    (summary?.validItems ?? []).map((item) => ({
      unitPrice: item.product?.priceValue ?? 0,
      quantity: item.quantity,
    })),
    "NORMAL"
  );

  const canCheckout = !isLoading && totals.itemCount > 0 && !hasProblems;

  return (
    <MobileShell>
      <AppHeader title="سبد خرید" backHref="/products" />

      <main className="min-h-screen bg-[#F4F7FC] px-4 pb-44 pt-4 text-right">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">سبد خرید</h1>
            <p className="mt-1 text-xs text-slate-500">
              {isLoading
                ? "در حال بررسی قیمت و موجودی…"
                : items.length > 0
                  ? `${items.length.toLocaleString("fa-IR")} قلم، ${totals.itemCount.toLocaleString("fa-IR")} عدد`
                  : "هنوز چیزی اضافه نکرده‌اید"}
            </p>
          </div>

          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("همه اقلام سبد حذف شوند؟")) clearCart();
              }}
              className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-red-600 active:bg-red-50"
            >
              <TrashIcon />
              خالی کردن
            </button>
          ) : null}
        </div>

        {hasProblems ? (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-6 text-amber-800"
          >
            <span className="font-black">بعضی اقلام دیگر قابل سفارش نیستند.</span>{" "}
            موجودی یا وضعیت آن‌ها تغییر کرده است. برای ادامه، تعداد را کم کنید یا
            آن‌ها را حذف کنید.
          </div>
        ) : null}

        <div className="mt-4">
          {isLoading ? (
            <CartSkeleton />
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-card">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.39c.51 0 .96.34 1.09.84l.38 1.44M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.22c1.12-2.3 2.1-4.68 2.92-7.14A60.1 60.1 0 0 0 5.1 5.27M7.5 14.25 5.1 5.27M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </div>
              <h2 className="mt-5 text-base font-black text-slate-900">
                سبد خرید شما خالی است
              </h2>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                قطعه مورد نیازتان را با نام، کد فنی یا مدل خودرو پیدا کنید.
              </p>
              <Link
                href="/products"
                className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-brand-800 px-8 text-sm font-bold text-white transition-transform active:scale-[0.97]"
              >
                مشاهده محصولات
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const product = item.product;
                const unitPrice = product?.priceValue ?? 0;
                const stock = product?.stock ?? 0;
                const overStock = Boolean(product) && item.quantity > stock;
                const maxQuantity = Math.min(stock, MAX_QUANTITY_PER_ITEM);

                return (
                  <li
                    key={item.slug}
                    className={`rounded-3xl border bg-white p-3 shadow-card ${
                      item.isUnavailable ? "border-amber-200" : "border-slate-200/80"
                    }`}
                  >
                    <div className="flex gap-3">
                      <Link
                        href={`/products/${item.slug}`}
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-50"
                      >
                        <ProductImage
                          src={product?.image ?? ""}
                          alt=""
                          className={`h-full w-full object-contain p-1.5 ${
                            item.isUnavailable ? "opacity-50 grayscale" : ""
                          }`}
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.slug}`}
                          className="line-clamp-2 text-[13px] font-extrabold leading-6 text-slate-900"
                        >
                          {product?.name ?? "این محصول دیگر موجود نیست"}
                        </Link>

                        {product ? (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            کد فنی <span dir="ltr">{product.code}</span>
                          </p>
                        ) : null}

                        {item.isUnavailable ? (
                          <p className="mt-1.5 text-[11px] font-bold text-amber-700">
                            {!product
                              ? "از فروشگاه حذف شده است"
                              : overStock && stock > 0
                                ? `فقط ${stock.toLocaleString("fa-IR")} عدد موجود است`
                                : "ناموجود"}
                          </p>
                        ) : (
                          <p className="mt-1.5 text-[11px] text-slate-500">
                            واحد: {formatRial(unitPrice)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex h-10 items-center rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item.slug)}
                          disabled={!product || item.quantity >= maxQuantity}
                          aria-label="افزایش تعداد"
                          className="flex h-10 w-10 items-center justify-center text-lg font-bold text-brand-800 disabled:text-slate-300"
                        >
                          +
                        </button>
                        <span className="min-w-7 text-center text-sm font-black text-slate-900" aria-live="polite">
                          {item.quantity.toLocaleString("fa-IR")}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            item.quantity > 1
                              ? decreaseQuantity(item.slug)
                              : removeFromCart(item.slug)
                          }
                          aria-label={item.quantity > 1 ? "کاهش تعداد" : "حذف از سبد"}
                          className={`flex h-10 w-10 items-center justify-center text-lg font-bold ${
                            item.quantity > 1 ? "text-brand-800" : "text-red-500"
                          }`}
                        >
                          {item.quantity > 1 ? "−" : <TrashIcon />}
                        </button>
                      </div>

                      {item.isUnavailable ? (
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.slug)}
                          className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                        >
                          حذف از سبد
                        </button>
                      ) : (
                        <div className="text-left">
                          <div className="text-[10px] text-slate-400">جمع</div>
                          <div className="text-sm font-black text-brand-900">
                            {formatRial(unitPrice * item.quantity)}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!isLoading && totals.itemCount > 0 ? (
          <section className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card">
            <h2 className="text-sm font-black text-slate-900">خلاصه سفارش</h2>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-slate-500">جمع قطعات</dt>
                <dd className="font-bold text-slate-800">{formatRial(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">ارسال عادی</dt>
                <dd className="font-bold text-slate-800">{formatRial(totals.shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">مالیات بر ارزش افزوده (۱۰٪)</dt>
                <dd className="font-bold text-slate-800">{formatRial(totals.vat)}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-400">
              روش ارسال را در مرحله بعد انتخاب می‌کنید؛ با ارسال اکسپرس مبلغ نهایی
              تغییر می‌کند.
            </p>
          </section>
        ) : null}
      </main>

      {!isLoading && items.length > 0 ? (
        <div className="pb-safe fixed bottom-0 left-1/2 z-30 w-full max-w-sm -translate-x-1/2 border-t border-slate-100 bg-white/95 px-4 pt-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-400">مبلغ قابل پرداخت</div>
              <div className="truncate text-base font-black text-brand-900">
                {formatRial(totals.total)}
              </div>
            </div>

            {canCheckout ? (
              <Link
                href="/checkout"
                className="flex h-12 items-center justify-center rounded-2xl bg-brand-800 px-6 text-sm font-bold text-white shadow-float transition-transform active:scale-[0.97]"
              >
                ادامه خرید
              </Link>
            ) : (
              <span className="flex h-12 items-center justify-center rounded-2xl bg-slate-200 px-5 text-xs font-bold text-slate-500">
                ابتدا سبد را اصلاح کنید
              </span>
            )}
          </div>
        </div>
      ) : null}
    </MobileShell>
  );
}
