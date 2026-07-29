"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import {
  getCartItems,
  removeFromCart,
  setCartQuantity,
  type CartItem as StoredCartItem,
} from "@/lib/utils";
import {
  getCartSummary,
  getRelatedAvailableProducts,
  type ResolvedCartItem,
} from "@/lib/cart-products";
import { resolveProductImage } from "@/lib/admin-products";
import type { PublicProduct } from "@/lib/public-products";

type CartSummaryState = {
  resolvedItems: ResolvedCartItem[];
  validItems: ResolvedCartItem[];
  subtotal: number;
  itemCount: number;
  hasMissingItems: boolean;
  hasUnavailableItems: boolean;
};

const EMPTY_SUMMARY: CartSummaryState = {
  resolvedItems: [],
  validItems: [],
  subtotal: 0,
  itemCount: 0,
  hasMissingItems: false,
  hasUnavailableItems: false,
};

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [version, setVersion] = useState(0);
  const [cartItems, setCartItems] = useState<StoredCartItem[]>([]);
  const [summary, setSummary] = useState<CartSummaryState>(EMPTY_SUMMARY);
  const [suggestedProducts, setSuggestedProducts] = useState<PublicProduct[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

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
    if (!mounted) return;
    setCartItems(getCartItems());
  }, [mounted, version]);

  useEffect(() => {
    if (!mounted) return;

    const loadCartData = async () => {
      try {
        setIsLoadingSummary(true);

        const [nextSummary, nextSuggestedProducts] = await Promise.all([
          getCartSummary(cartItems),
          getRelatedAvailableProducts(4),
        ]);

        setSummary(nextSummary);
        setSuggestedProducts(nextSuggestedProducts);
      } catch (error) {
        console.error("cart page load error", error);
        setSummary(EMPTY_SUMMARY);
        setSuggestedProducts([]);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    loadCartData();
  }, [mounted, cartItems, version]);

  const shippingCost = summary.validItems.length > 0 ? 150000 : 0;
  const total = summary.subtotal + shippingCost;

  if (!mounted) {
    return null;
  }

  return (
    <MobileShell>
      <AppHeader title="سبد خرید" backHref="/" />

      <main className="px-4 py-4 pb-28">
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white shadow-lg">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs">
            سبد خرید شما
          </div>

          <h1 className="mt-4 text-2xl font-black leading-9">
            مرور اقلام انتخاب‌شده
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-200">
            قبل از ادامه خرید، وضعیت موجودی و قیمت اقلام را بررسی کن.
          </p>
        </section>

        {isLoadingSummary ? (
          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-sm font-bold text-slate-900">
              در حال بررسی سبد خرید...
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              چند لحظه صبر کن.
            </p>
          </section>
        ) : null}

        {!isLoadingSummary && summary.hasMissingItems ? (
          <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="text-sm font-extrabold text-amber-800">
              بعضی محصولات دیگر در سیستم وجود ندارند
            </div>
            <p className="mt-2 text-sm leading-7 text-amber-700">
              این اقلام در سبد باقی مانده‌اند، ولی برای ادامه خرید باید حذف شوند.
            </p>
          </section>
        ) : null}

        {!isLoadingSummary &&
        summary.hasUnavailableItems &&
        !summary.hasMissingItems ? (
          <section className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <div className="text-sm font-extrabold text-red-700">
              بعضی محصولات فعلاً ناموجود هستند
            </div>
            <p className="mt-2 text-sm leading-7 text-red-600">
              تا زمانی که این اقلام را حذف یا اصلاح نکنی، ادامه خرید غیرفعال می‌شود.
            </p>
          </section>
        ) : null}

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              اقلام سبد
            </h2>
            <span className="text-sm text-slate-500">
              {summary.resolvedItems.length} آیتم
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {summary.resolvedItems.length === 0 && !isLoadingSummary ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className="text-sm font-bold text-slate-900">
                  سبد خرید شما خالی است
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  برای شروع، یکی از محصولات را به سبد خرید اضافه کن.
                </p>
                <Link
                  href="/products"
                  className="mt-4 inline-block rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                >
                  مشاهده محصولات
                </Link>
              </div>
            ) : (
              summary.resolvedItems.map((item) => {
                if (item.isMissing || !item.product) {
                  return (
                    <div
                      key={item.slug}
                      className="rounded-3xl border border-red-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          <Image
                            src={resolveProductImage("")}
                            alt="محصول حذف‌شده"
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-extrabold text-slate-900">
                            محصول حذف شده است
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            slug: {item.slug}
                          </div>
                          <div className="mt-2 text-xs text-red-600">
                            این محصول دیگر در سیستم موجود نیست.
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.slug)}
                          className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white"
                        >
                          حذف از سبد
                        </button>
                      </div>
                    </div>
                  );
                }

                const product = item.product;
                const isUnavailable = item.isUnavailable;

                return (
                  <div
                    key={item.slug}
                    className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <Image
                          src={item.safeImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${encodeURIComponent(product.slug)}`}
                          className="line-clamp-2 text-sm font-extrabold text-slate-900"
                        >
                          {product.name}
                        </Link>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <div>کد فنی: {product.code}</div>
                          <div>برند: {product.brand || "نامشخص"}</div>
                        </div>

                        <div className="mt-2 text-sm font-black text-blue-900">
                          {product.price}
                        </div>

                        <div className="mt-2 text-xs">
                          <span
                            className={
                              isUnavailable
                                ? "font-bold text-red-600"
                                : "font-bold text-emerald-700"
                            }
                          >
                            {isUnavailable ? "ناموجود" : "موجود"}
                          </span>

                          <span className="mr-2 text-slate-500">
                            موجودی: {product.stock ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
                      <div className="flex items-center rounded-2xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            setCartQuantity(product.slug, item.quantity - 1)
                          }
                          className="h-12 w-12 text-lg font-black text-slate-700"
                        >
                          -
                        </button>

                        <div className="flex-1 text-center text-sm font-extrabold text-slate-900">
                          {item.quantity}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setCartQuantity(product.slug, item.quantity + 1)
                          }
                          disabled={
                            isUnavailable ||
                            item.quantity >= Number(product.stock ?? 0)
                          }
                          className="h-12 w-12 text-lg font-black text-slate-700 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(product.slug)}
                        className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {summary.resolvedItems.length > 0 ? (
          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900">
              خلاصه سفارش
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">تعداد اقلام معتبر</span>
                <span className="font-bold text-slate-900">
                  {summary.itemCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">جمع کالاها</span>
                <span className="font-bold text-slate-900">
                  {summary.subtotal.toLocaleString("fa-IR")} ریال
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">هزینه ارسال</span>
                <span className="font-bold text-slate-900">
                  {shippingCost.toLocaleString("fa-IR")} ریال
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                <span className="font-bold text-slate-900">مبلغ نهایی</span>
                <span className="text-lg font-black text-blue-900">
                  {total.toLocaleString("fa-IR")} ریال
                </span>
              </div>
            </div>
          </section>
        ) : null}

        {suggestedProducts.length > 0 ? (
          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">
                پیشنهاد برای خرید
              </h2>
              <Link
                href="/products"
                className="text-sm font-bold text-blue-900"
              >
                مشاهده همه
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {suggestedProducts.map((product) => (
                <Link
                  key={product.slug}
                  href={`/products/${encodeURIComponent(product.slug)}`}
                  className="block rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <Image
                        src={resolveProductImage(product.image)}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-extrabold text-slate-900">
                        {product.name}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        کد فنی: {product.code}
                      </div>
                      <div className="mt-2 text-sm font-bold text-blue-900">
                        {product.price}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-sm -translate-x-1/2 border-t border-slate-200 bg-white p-4">
        {summary.resolvedItems.length === 0 ? (
          <Link
            href="/products"
            className="block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white"
          >
            مشاهده محصولات
          </Link>
        ) : summary.hasMissingItems || summary.hasUnavailableItems ? (
          <button
            type="button"
            disabled
            className="w-full rounded-2xl bg-slate-300 px-4 py-3 text-sm font-bold text-white"
          >
            ابتدا سبد را اصلاح کن
          </button>
        ) : (
          <Link
            href="/checkout"
            className="block rounded-2xl bg-blue-900 px-4 py-3 text-center text-sm font-bold text-white"
          >
            ادامه فرایند خرید
          </Link>
        )}
      </div>

      <BottomNav />
    </MobileShell>
  );
}