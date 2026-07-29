"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import type { PublicProduct } from "@/lib/public-products";
import { resolveProductImage } from "@/lib/admin-products";
import {
  fetchActiveCategories,
  type Category,
} from "@/lib/categories";
import {
  fetchActiveBrands,
  resolveBrandLogo,
  type Brand,
} from "@/lib/brands";

const SUGGESTIONS = [
  "دیسک ترمز",
  "بلبرینگ",
  "رنو",
  "ایران‌خودرو",
  "پژو 405",
  "تیبا",
  "سمند",
];

function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
    </svg>
  );
}

function HistoryIcon({ className = "h-4 w-4" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="m14.74 9-.34 9m-4.78 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

export default function SearchPage() {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const [productsResponse, categoriesData, brandsData] = await Promise.all([
          fetch("/api/products", {
            method: "GET",
            cache: "no-store",
          }),
          fetchActiveCategories(),
          fetchActiveBrands(),
        ]);

        const productsData = await productsResponse.json().catch(() => null);

        if (
          productsResponse.ok &&
          productsData?.success &&
          Array.isArray(productsData?.products)
        ) {
          setProducts(productsData.products as PublicProduct[]);
        } else {
          setProducts([]);
        }

        setCategories(categoriesData);
        setBrands(brandsData);

        try {
          const raw = window.localStorage.getItem("parsilon-recent-searches");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setRecentSearches(
                parsed.filter((item) => typeof item === "string")
              );
            }
          }
        } catch {}
      } catch {
        setProducts([]);
        setCategories([]);
        setBrands([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!mounted) return;
    loadData();
  }, [mounted]);

  const normalizedQuery = query.trim();

  const results = useMemo(() => {
    if (!normalizedQuery) return [];

    const q = normalizedQuery.toLowerCase();

    return products.filter((product) => {
      const categoryName =
        categories.find((item) => item.slug === product.category)?.name || "";

      const searchableFields = [
        product.name,
        product.code,
        product.brand || "",
        categoryName,
        ...(product.compatibleCars || []),
      ];

      return searchableFields.some((field) =>
        String(field).toLowerCase().includes(q)
      );
    });
  }, [products, normalizedQuery, categories]);

  const saveRecentSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const next = [trimmed, ...recentSearches.filter((item) => item !== trimmed)].slice(0, 6);
    setRecentSearches(next);

    try {
      window.localStorage.setItem(
        "parsilon-recent-searches",
        JSON.stringify(next)
      );
    } catch {}
  };

  const handleSuggestionClick = (value: string) => {
    setQuery(value);
    saveRecentSearch(value);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      window.localStorage.removeItem("parsilon-recent-searches");
    } catch {}
  };

  if (!mounted) return null;

  return (
    <MobileShell>
      <AppHeader title="جستجو هوشمند" backHref="/" showBrandLogo={false} />

      <main className="bg-[#F8FAFC] pb-28 text-right" style={{ direction: "rtl" }}>
        <section className="px-4 pt-4">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#061B40] via-[#0E2F6D] to-[#17479E] p-6 text-white shadow-[0_25px_50px_rgba(14,47,109,0.04)]">
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-xl" />

            <div className="flex w-full items-center justify-between">
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black tracking-wider backdrop-blur-md shadow-inner">
                SMART ENGINE
              </div>

              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {products.length} قطعه آنلاین
              </div>
            </div>

            <h1 className="mt-5 text-xl font-black leading-tight tracking-tight drop-shadow-xs">
              موتور جستجوی اختصاصی پارسیلون
            </h1>
            <p className="mt-1.5 max-w-[290px] text-[11px] font-medium leading-5 text-slate-200/80">
              بررسی فنی دقیق کاتالوگ بر اساس کد فنی قطعه، برند یا مدل خودرو.
            </p>
          </div>
        </section>

        <section className="mt-5 space-y-5 px-4">
          <div className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_20px_45px_rgba(14,47,109,0.015)]">
            <div className="group relative flex items-center rounded-[22px] border border-slate-200/80 bg-slate-50/60 p-2 shadow-inner transition-all duration-300 focus-within:border-[#0E2F6D] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0E2F6D]/5">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => saveRecentSearch(query)}
                onKeyDown={(e) => e.key === "Enter" && saveRecentSearch(query)}
                placeholder="کد فنی قطعه، مدل خودرو یا نام قطعه..."
                className="h-10 w-full bg-transparent pr-11 pl-12 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                autoFocus
              />
              <div className="absolute right-4 text-slate-400 transition-colors group-focus-within:text-[#0E2F6D]">
                <SearchIcon className="h-5 w-5" />
              </div>

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute left-3 flex h-8 items-center justify-center rounded-xl bg-slate-100 px-3 text-[11px] font-black text-slate-500 transition-colors hover:bg-slate-200/80 active:scale-95"
                >
                  پاک کردن
                </button>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <span className="block text-[10.5px] font-black tracking-wide text-slate-400">
                پیشنهادهای هوشمند جستجو
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSuggestionClick(item)}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2 text-xs font-bold text-slate-600 transition-all duration-300 hover:border-slate-200 hover:bg-slate-100 hover:text-[#0E2F6D] active:scale-95"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {recentSearches.length > 0 && (
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] font-black tracking-wide text-slate-400">
                    <HistoryIcon />
                    <span>آخرین جستجوهای شما</span>
                  </span>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="inline-flex items-center gap-1 text-[10px] font-black text-red-500/80 transition-colors hover:text-red-600 active:scale-95"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    <span>پاک کردن سوابق</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className="rounded-xl border border-blue-100/30 bg-blue-50/40 px-3.5 py-2 text-xs font-bold text-[#0E2F6D] transition-all duration-300 hover:bg-blue-50 active:scale-95"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 px-4">
          <div className="relative flex items-center justify-between pb-3">
            <h2 className="text-xs font-black tracking-wide text-[#0E2F6D]">
              نتایج فیلتر کاتالوگ
            </h2>
            <span className="rounded-full border border-slate-100 bg-white px-2.5 py-1 text-[10px] font-black text-slate-400 shadow-2xs">
              {normalizedQuery ? `${results.length} قطعه منطبق` : "در انتظار ورودی"}
            </span>
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </div>

          {isLoading ? (
            <div className="mt-5 rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-xs">
              <div className="text-sm font-black text-slate-700">
                در حال بارگذاری کاتالوگ...
              </div>
              <p className="mx-auto mt-2 max-w-[240px] text-xs font-semibold leading-6 text-slate-400">
                چند لحظه صبر کنید.
              </p>
            </div>
          ) : !normalizedQuery ? (
            <div className="mt-5 rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-xs">
              <div className="text-sm font-black text-slate-700">
                سیستم آماده جستجو است
              </div>
              <p className="mx-auto mt-2 max-w-[240px] text-xs font-semibold leading-6 text-slate-400">
                عبارت مورد نظر خود را وارد کنید تا کاتالوگ آنلاین قطعات فعال شود.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="mt-5 rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-xs">
              <div className="text-sm font-black text-slate-800">
                نتیجه‌ای یافت نشد
              </div>
              <p className="mx-auto mt-2 max-w-[250px] text-xs font-semibold leading-6 text-slate-400">
                کد فنی یا عبارت دیگری را بررسی کنید یا فیلتر جستجو را تغییر دهید.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {results.map((product) => {
                const categoryName =
                  categories.find((item) => item.slug === product.category)?.name ||
                  product.category ||
                  "";

                const brandLogo = resolveBrandLogo(
                  brands.find((item) => item.name === product.brand)?.logo
                );

                const numericStock =
                  typeof product.stock === "number"
                    ? product.stock
                    : Number(String(product.stock ?? "").replace(/[^\d]/g, "")) || 10;

                const isUnavailable =
                  product.isAvailable === false || numericStock <= 0;

                return (
                  <Link
                    key={product.dbId || product.id || product.slug}
                    href={`/products/${product.slug}`}
                    className="group block overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
                  >
                    <div className="relative overflow-hidden bg-slate-50">
                      <img
                        src={resolveProductImage(product.image)}
                        alt={product.name}
                        className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="line-clamp-2 text-xs font-black leading-6 text-slate-800 transition-colors group-hover:text-[#17479E]">
                            {product.name}
                          </h3>
                          <p className="text-[10.5px] font-bold text-slate-400">
                            کد فنی: {product.code}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-black ${
                            isUnavailable
                              ? "bg-red-50 text-red-600"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {isUnavailable ? "ناموجود" : "موجود"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {product.brand && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-600">
                            {brandLogo && (
                              <img
                                src={brandLogo}
                                alt={product.brand}
                                className="h-3.5 w-3.5 object-contain"
                              />
                            )}
                            {product.brand}
                          </span>
                        )}

                        {categoryName && (
                          <span className="rounded-xl bg-blue-50/60 px-2.5 py-1 text-[10.5px] font-bold text-[#17479E]">
                            {categoryName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                        <div
                          className={`text-xs font-black ${
                            product.price?.includes("تماس")
                              ? "text-amber-600"
                              : "text-[#17479E]"
                          }`}
                        >
                          <span className="ml-1 text-[10px] font-bold text-slate-400">
                            قیمت واحد:
                          </span>
                          {product.price}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10.5px] font-black text-slate-600 shadow-2xs transition-all duration-300 group-hover:border-blue-200 group-hover:bg-blue-50/30 group-hover:text-[#17479E]">
                          مشاهده مشخصات قطعه
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </MobileShell>
  );
}