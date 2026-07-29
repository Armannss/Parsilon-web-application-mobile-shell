"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { resolveProductImage } from "@/lib/admin-products";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  showBrandLogo?: boolean;
};

function parsePersianPrice(price?: string) {
  if (!price || price.includes("تماس")) return 0;

  const englishDigits = price
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[^\d]/g, "");

  return Number(englishDigits || 0);
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-[18px] w-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5.4 5M7 13l-1 5h13M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-[18px] w-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-[18px] w-[18px]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
        d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
      />
    </svg>
  );
}

export default function AppHeader({
  title,
  subtitle,
  backHref,
  backLabel = "بازگشت",
  showBrandLogo = true,
}: AppHeaderProps) {
  const pathname = usePathname();

  const {
    cartCount,
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    isCartReady,
  } = useCart();

  const isHome = pathname === "/";

  const [mounted, setMounted] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    lastScrollYRef.current = window.scrollY;
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      if (tickingRef.current) return;

      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const lastScrollY = lastScrollYRef.current;
        const diff = currentScrollY - lastScrollY;

        if (currentScrollY <= 20) {
          setIsHeaderVisible(true);
        } else if (diff > 8) {
          setIsHeaderVisible(false);
        } else if (diff < -8) {
          setIsHeaderVisible(true);
        }

        lastScrollYRef.current = currentScrollY;
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !isCartReady) return;
    if (cartCount <= 0) return;

    setAnimateCart(true);

    const timeout = setTimeout(() => {
      setAnimateCart(false);
    }, 450);

    return () => clearTimeout(timeout);
  }, [cartCount, mounted, isCartReady]);

  useEffect(() => {
    if (!mounted || !isMiniCartOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setIsHeaderVisible(true);

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMiniCartOpen, mounted]);

  const safeCartItems = mounted && isCartReady ? cartItems : [];
  const safeCartCount = mounted && isCartReady ? cartCount : 0;

  const latestItems = useMemo(() => {
    return [...safeCartItems].reverse();
  }, [safeCartItems]);

  const subtotal = useMemo(() => {
    return safeCartItems.reduce((sum, item) => {
      return sum + parsePersianPrice(item.price) * item.quantity;
    }, 0);
  }, [safeCartItems]);

  return (
    <>
      <div className="sticky top-0 z-30">
        <div className="mx-auto w-full max-w-[392px] px-3 pt-3">
          <div
            className={`transition-all duration-300 ${
              isHeaderVisible
                ? "translate-y-0 opacity-100"
                : "-translate-y-[120%] opacity-0"
            }`}
          >
            <div
              className="relative flex items-center justify-between rounded-[24px] border px-4 py-3 backdrop-blur"
              style={{
                background: "rgba(255,255,255,0.96)",
                borderColor: "#D9E1EC",
                boxShadow: "0 8px 24px rgba(14,47,109,0.08)",
              }}
            >
              <div className="flex w-[48px] justify-start">
                {isHome ? (
                  <Link
                    href="/search"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition"
                    style={{
                      borderColor: "#D9E1EC",
                      background: "#F8FAFC",
                      color: "#17479E",
                    }}
                  >
                    <SearchIcon />
                  </Link>
                ) : backHref ? (
                  <Link
                    href={backHref}
                    className="inline-flex h-11 items-center gap-1.5 rounded-2xl border px-3 text-[14px] font-bold transition"
                    style={{
                      borderColor: "#D9E1EC",
                      background: "#F8FAFC",
                      color: "#43546D",
                    }}
                  >
                    <span>{backLabel}</span>
                    <BackIcon />
                  </Link>
                ) : (
                  <div className="h-11 w-11" />
                )}
              </div>

              {showBrandLogo ? (
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <img
                    src="/images/logo-header-v2.png"
                    alt="پارسیلون پارت"
                    className={`h-auto object-contain ${
                      isHome ? "w-[165px]" : "w-[150px]"
                    }`}
                  />
                </div>
              ) : (
                <div className="absolute left-1/2 top-1/2 min-w-0 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div
                    className="text-[15px] font-black tracking-tight"
                    style={{ color: "#0E2F6D" }}
                  >
                    {title}
                  </div>
                  {subtitle ? (
                    <div className="mt-0.5 text-[10px]" style={{ color: "#7C8CA5" }}>
                      {subtitle}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="flex w-[48px] justify-end">
                <button
                  type="button"
                  onClick={() => setIsMiniCartOpen(true)}
                  className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                    animateCart ? "scale-105" : "scale-100"
                  }`}
                  style={{
                    borderColor: animateCart ? "#8CC63F" : "#D9E1EC",
                    background: "#F8FAFC",
                    color: "#17479E",
                  }}
                >
                  <CartIcon />

                  {safeCartCount > 0 ? (
                    <span
                      className={`absolute -right-2 -top-2 min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[9px] font-bold text-white shadow-md transition ${
                        animateCart ? "scale-125" : "scale-100"
                      }`}
                      style={{
                        background:
                          "linear-gradient(135deg, #0E2F6D 0%, #17479E 60%, #2C63C7 100%)",
                      }}
                    >
                      {safeCartCount}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </div>

          <div className="h-[10px]" />
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 transition ${
          isMiniCartOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          onClick={() => setIsMiniCartOpen(false)}
          className={`absolute inset-0 transition-opacity duration-300 ${
            isMiniCartOpen ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: "rgba(14,47,109,0.45)" }}
        />

        <div
          className={`absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ${
            isMiniCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b px-4 py-4" style={{ borderColor: "#D9E1EC" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-black" style={{ color: "#0E2F6D" }}>
                    سبد خرید
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "#7C8CA5" }}>
                    {mounted && isCartReady
                      ? `${safeCartCount} آیتم در سبد شما`
                      : "در حال بارگذاری..."}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMiniCartOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-white shadow-sm"
                  style={{ borderColor: "#D9E1EC", color: "#43546D" }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!mounted || !isCartReady ? (
                <div
                  className="rounded-2xl p-4 text-sm"
                  style={{ background: "#F8FAFC", color: "#6B7B95" }}
                >
                  در حال بارگذاری سبد خرید...
                </div>
              ) : safeCartItems.length === 0 ? (
                <div
                  className="rounded-2xl p-4 text-sm"
                  style={{ background: "#F8FAFC", color: "#6B7B95" }}
                >
                  هنوز محصولی به سبد اضافه نشده است.
                </div>
              ) : (
                <div className="space-y-3">
                  {latestItems.map((item) => {
                    const rowTotal =
                      parsePersianPrice(item.price) * item.quantity;

                    return (
                      <div
                        key={item.slug}
                        className="rounded-2xl border p-3"
                        style={{ borderColor: "#D9E1EC", background: "#F8FAFC" }}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveProductImage(item.image)}
                            alt={item.name}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <div
                              className="line-clamp-2 text-xs font-bold"
                              style={{ color: "#24364F" }}
                            >
                              {item.name}
                            </div>
                            <div className="mt-1 text-[11px]" style={{ color: "#6B7B95" }}>
                              قیمت واحد: {item.price || "نامشخص"}
                            </div>
                            <div
                              className="mt-1 text-[11px] font-bold"
                              style={{ color: "#17479E" }}
                            >
                              جمع ردیف: {rowTotal.toLocaleString("fa-IR")} ریال
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              decreaseQuantity(item.slug);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-sm font-bold"
                            style={{ borderColor: "#D9E1EC", color: "#43546D" }}
                          >
                            -
                          </button>

                          <div
                            className="flex-1 rounded-xl bg-white px-3 py-2 text-center text-xs font-bold"
                            style={{ color: "#43546D" }}
                          >
                            {item.quantity}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              increaseQuantity(item.slug);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, #0E2F6D 0%, #17479E 60%, #2C63C7 100%)",
                            }}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFromCart(item.slug);
                          }}
                          className="mt-3 w-full rounded-xl border bg-white px-3 py-2 text-xs font-bold"
                          style={{ borderColor: "#F3C5C5", color: "#D93C3C" }}
                        >
                          حذف از سبد
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t bg-white px-4 py-4" style={{ borderColor: "#D9E1EC" }}>
              {mounted && isCartReady && safeCartItems.length > 0 ? (
                <>
                  <div className="mb-3 rounded-2xl p-3" style={{ background: "#F8FAFC" }}>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "#6B7B95" }}>جمع کالاها</span>
                      <span className="font-bold" style={{ color: "#24364F" }}>
                        {subtotal.toLocaleString("fa-IR")} ریال
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/cart"
                      onClick={() => setIsMiniCartOpen(false)}
                      className="rounded-2xl border px-4 py-3 text-center text-sm font-bold"
                      style={{ borderColor: "#D9E1EC", color: "#43546D" }}
                    >
                      سبد خرید
                    </Link>

                    <Link
                      href="/checkout"
                      onClick={() => setIsMiniCartOpen(false)}
                      className="rounded-2xl px-4 py-3 text-center text-sm font-bold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #0E2F6D 0%, #17479E 60%, #2C63C7 100%)",
                      }}
                    >
                      تسویه‌حساب
                    </Link>
                  </div>
                </>
              ) : (
                <Link
                  href="/products"
                  onClick={() => setIsMiniCartOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-center text-sm font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #0E2F6D 0%, #17479E 60%, #2C63C7 100%)",
                  }}
                >
                  مشاهده محصولات
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}