"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { clearCart, getCartItems, type CartItem } from "@/lib/utils";
import { computeOrderTotals } from "@/lib/pricing";
import {
  getCartSummary,
  type ResolvedCartItem,
} from "@/lib/cart-products";
import { useOrder } from "@/context/OrderContext";

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
        d="M9 12.75 11.25 15 15 9.75M5.25 4.804A9.708 9.708 0 0 1 12 2.25c2.331 0 4.47.815 6.75 2.554v5.796c0 4.542-2.912 8.57-6.75 10.15-3.838-1.58-6.75-5.608-6.75-10.15V4.804Z"
      />
    </svg>
  );
}

function ReceiptIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M9 14.25h6m-6-3h6m-6-3h6M5.25 3.75h13.5v16.5l-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5V3.75Z"
      />
    </svg>
  );
}

function TruckIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M8.25 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm10.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3 4.5h10.5v10.5H3V4.5Zm10.5 3h3.879a1.5 1.5 0 0 1 1.2.6l1.671 2.228V15h-6.75V7.5Z"
      />
    </svg>
  );
}

function LocationIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M12 21a31.847 31.847 0 0 0 4.5-5.169c1.5-2.094 2.25-3.891 2.25-5.331a6.75 6.75 0 1 0-13.5 0c0 1.44.75 3.237 2.25 5.331A31.847 31.847 0 0 0 12 21Zm0-8.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
      />
    </svg>
  );
}

type CartSummary = {
  resolvedItems: ResolvedCartItem[];
  validItems: ResolvedCartItem[];
  subtotal: number;
  itemCount: number;
  hasMissingItems: boolean;
  hasUnavailableItems: boolean;
};

const EMPTY_SUMMARY: CartSummary = {
  resolvedItems: [],
  validItems: [],
  subtotal: 0,
  itemCount: 0,
  hasMissingItems: false,
  hasUnavailableItems: false,
};

export default function PaymentPage() {
  const router = useRouter();
  const { checkoutForm, clearOrder } = useOrder();

  const [mounted, setMounted] = useState(false);
  const [version, setVersion] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>(EMPTY_SUMMARY);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
    const loadSummary = async () => {
      try {
        setIsLoadingSummary(true);
        const nextSummary = await getCartSummary(cartItems);
        setSummary(nextSummary);
      } catch (error) {
        console.error("payment summary error:", error);
        setSummary(EMPTY_SUMMARY);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    if (!mounted) return;
    loadSummary();
  }, [mounted, cartItems]);

  const {
    shipping: shippingCost,
    vat: vatAmount,
    total,
  } = computeOrderTotals(
    summary.validItems.map((item) => ({
      unitPrice: item.product?.priceValue ?? 0,
      quantity: item.quantity,
    })),
    checkoutForm.shippingMethod === "express" ? "EXPRESS" : "NORMAL"
  );

  const canPay =
    !isLoadingSummary &&
    summary.validItems.length > 0 &&
    !summary.hasMissingItems &&
    !summary.hasUnavailableItems &&
    Boolean(checkoutForm.fullName.trim()) &&
    Boolean(checkoutForm.phone.trim()) &&
    Boolean(checkoutForm.province.trim()) &&
    Boolean(checkoutForm.city.trim()) &&
    Boolean(checkoutForm.address.trim()) &&
    Boolean(checkoutForm.postalCode.trim());

  const handlePayment = async () => {
    if (!canPay || isPaying) return;

    try {
      setIsPaying(true);
      setSubmitError("");

      const orderItems = summary.validItems
        .filter(
          (
            item
          ): item is ResolvedCartItem & {
            product: NonNullable<ResolvedCartItem["product"]>;
          } => Boolean(item.product)
        )
        .map((item) => ({
          productId: item.product.dbId || undefined,
          slug: item.product.slug,
          quantity: item.quantity,
        }));

      const shippingMethod =
        checkoutForm.shippingMethod === "express" ? "EXPRESS" : "NORMAL";

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          shippingMethod,
          customer: {
            fullName: checkoutForm.fullName,
            phone: checkoutForm.phone,
            province: checkoutForm.province,
            city: checkoutForm.city,
            address: checkoutForm.address,
            postalCode: checkoutForm.postalCode,
          },
          items: orderItems,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.order?.orderNumber) {
        throw new Error(data?.message || "ثبت سفارش انجام نشد.");
      }

      clearCart();
      clearOrder();

      router.push(
        `/order-success?orderNumber=${encodeURIComponent(
          data.order.orderNumber
        )}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ثبت سفارش انجام نشد.";
      setSubmitError(message);
    } finally {
      setIsPaying(false);
    }
  };

  if (!mounted) return null;

  return (
    <MobileShell>
      <AppHeader title="پرداخت" backHref="/checkout" />

      <main
        className="pb-36 text-right"
        style={{ background: "#F4F7FC", direction: "rtl" }}
      >
        <section className="px-4 pt-4">
          <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_12px_35px_rgba(14,47,109,0.04)]">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#06183A] via-[#0E2F6D] to-[#355FC7] p-6 text-white">
              <div className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-12 right-0 h-32 w-32 rounded-full bg-[#8CC63F]/10 blur-2xl" />

              <div className="relative z-10">
                <div className="flex justify-end">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8CC63F] opacity-70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8CC63F]" />
                    </span>
                    مرحله نهایی سفارش
                  </div>
                </div>

                <h1 className="mt-5 text-[28px] font-black leading-[42px] tracking-tight">
                  تایید و پرداخت
                  <span className="mt-1 block text-white/95">سفارش</span>
                </h1>

                <p className="mt-3 max-w-[300px] text-sm leading-7 text-white/90">
                  اطلاعات سفارش را یک بار دیگر بررسی کن و پس از تایید، پرداخت را
                  نهایی کن.
                </p>

                <div className="mt-4 h-[4px] w-16 rounded-full bg-[#8CC63F]" />
              </div>
            </div>
          </div>
        </section>

        {isLoadingSummary ? (
          <section className="mt-5 px-4">
            <div className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-black text-slate-700">
                در حال بررسی اطلاعات سبد خرید...
              </div>
            </div>
          </section>
        ) : null}

        {!isLoadingSummary && !canPay ? (
          <section className="mt-5 px-4">
            <div className="rounded-[28px] border border-red-100 bg-red-50/70 p-4 shadow-sm">
              <div className="text-sm font-black text-red-700">
                امکان نهایی کردن پرداخت وجود ندارد
              </div>
              <p className="mt-2 text-sm leading-7 text-red-600">
                سبد خرید یا اطلاعات گیرنده ناقص است. ابتدا به مرحله قبل برگرد و
                اطلاعات را تکمیل کن.
              </p>
              <Link
                href="/checkout"
                className="mt-4 inline-flex rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white active:scale-95"
              >
                بازگشت به تکمیل سفارش
              </Link>
            </div>
          </section>
        ) : null}

        {submitError ? (
          <section className="mt-5 px-4">
            <div className="rounded-[28px] border border-red-100 bg-red-50/70 p-4 shadow-sm">
              <div className="text-sm font-black text-red-700">
                ثبت سفارش انجام نشد
              </div>
              <p className="mt-2 text-sm leading-7 text-red-600">
                {submitError}
              </p>
            </div>
          </section>
        ) : null}

        <section className="mt-5 px-4">
          <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#0E2F6D]">
                <LocationIcon />
                <h2 className="text-base font-black">اطلاعات گیرنده</h2>
              </div>

              <Link
                href="/checkout"
                className="text-[11px] font-black text-[#17479E]"
              >
                ویرایش
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50/70 p-3">
                <div className="text-[11px] font-bold text-slate-400">
                  نام گیرنده
                </div>
                <div className="mt-2 text-sm font-black text-slate-800">
                  {checkoutForm.fullName || "-"}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50/70 p-3">
                <div className="text-[11px] font-bold text-slate-400">
                  شماره تماس
                </div>
                <div className="mt-2 text-sm font-black text-slate-800">
                  {checkoutForm.phone || "-"}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50/70 p-3">
                <div className="text-[11px] font-bold text-slate-400">استان</div>
                <div className="mt-2 text-sm font-black text-slate-800">
                  {checkoutForm.province || "-"}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50/70 p-3">
                <div className="text-[11px] font-bold text-slate-400">شهر</div>
                <div className="mt-2 text-sm font-black text-slate-800">
                  {checkoutForm.city || "-"}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-50/70 p-4">
              <div className="text-[11px] font-bold text-slate-400">آدرس</div>
              <div className="mt-2 break-words text-sm font-black leading-7 text-slate-800">
                {checkoutForm.address || "-"}
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-50/70 p-4">
              <div className="text-[11px] font-bold text-slate-400">
                کد پستی
              </div>
              <div className="mt-2 text-sm font-black text-slate-800">
                {checkoutForm.postalCode || "-"}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 px-4">
          <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#0E2F6D]">
                <ShieldIcon />
                <h2 className="text-base font-black">اقلام سفارش</h2>
              </div>

              <span className="rounded-xl bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                {summary.validItems.length} قلم
              </span>
            </div>

            <div className="space-y-3">
              {summary.validItems.map((item) => (
                <div
                  key={item.slug}
                  className="rounded-[24px] border border-slate-100 bg-slate-50/50 p-3 transition-all duration-300 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white">
                      <Image
                        src={item.safeImage}
                        alt={item.product?.name || "product"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-black leading-6 text-slate-800">
                        {item.product?.name}
                      </div>

                      <div className="mt-1 text-[11px] font-medium text-slate-400">
                        کد فنی: {item.product?.code}
                      </div>

                      <div className="mt-1 text-[11px] font-medium text-slate-400">
                        تعداد: {item.quantity}
                      </div>

                      <div className="mt-2 text-sm font-black text-[#17479E]">
                        {item.product?.price}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 px-4">
          <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-[#0E2F6D]">
              <ReceiptIcon />
              <h2 className="text-base font-black">خلاصه مالی</h2>
            </div>

            <div className="rounded-2xl bg-slate-50/60 p-4">
              <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                <span>جمع کالاها</span>
                <span className="font-black text-slate-800">
                  {summary.subtotal.toLocaleString("fa-IR")} ریال
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm font-bold text-slate-500">
                <span className="flex items-center gap-2">
                  <TruckIcon className="h-4 w-4" />
                  هزینه ارسال
                </span>
                <span className="font-black text-slate-800">
                  {shippingCost.toLocaleString("fa-IR")} ریال
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm font-bold text-slate-500">
                <span>مالیات بر ارزش افزوده (۱۰٪)</span>
                <span className="font-black text-slate-800">
                  {vatAmount.toLocaleString("fa-IR")} ریال
                </span>
              </div>

              <div className="mt-4 border-t border-dashed border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-slate-800">
                    مبلغ نهایی
                  </span>
                  <span className="text-xl font-black text-[#0E2F6D]">
                    {total.toLocaleString("fa-IR")} ریال
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-blue-50/60 px-4 py-3 text-[11px] font-bold leading-6 text-[#17479E]">
              مبلغ نهایی شامل هزینه ارسال و ۱۰٪ مالیات بر ارزش افزوده است.
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-sm -translate-x-1/2 border-t border-slate-100 bg-white/95 p-4 backdrop-blur-md">
        {canPay ? (
          <button
            type="button"
            onClick={handlePayment}
            disabled={isPaying || isLoadingSummary}
            className="w-full rounded-2xl bg-[#0E2F6D] px-4 py-3.5 text-sm font-black text-white shadow-md transition-all duration-200 hover:bg-[#17479E] active:scale-95 disabled:opacity-60"
          >
            {isPaying
              ? "در حال ثبت سفارش..."
              : isLoadingSummary
              ? "در حال بررسی..."
              : "پرداخت و ثبت سفارش"}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-2xl bg-slate-300 px-4 py-3.5 text-sm font-black text-white"
          >
            ابتدا اطلاعات سفارش را کامل کن
          </button>
        )}
      </div>

      <BottomNav />
    </MobileShell>
  );
}