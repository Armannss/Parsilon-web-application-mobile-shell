"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard, {
  ProductCardSkeleton,
} from "@/components/home/ProductCard";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import {
  fetchActiveBrands,
  resolveBrandLogo,
  type Brand,
} from "@/lib/brands";
import {
  fetchActiveCategories,
  type Category,
} from "@/lib/categories";
import type { PublicProduct } from "@/lib/public-products";

type SortOption = "default" | "price-asc" | "price-desc" | "code-asc";

const PAGE_SIZE = 8;

function SearchIcon({ className = "h-5 w-5" }) {
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
        strokeWidth={1.6}
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
      />
    </svg>
  );
}

function FilterIcon({ className = "h-4 w-4" }) {
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
        strokeWidth={1.6}
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
      />
    </svg>
  );
}

function RefreshIcon({ className = "h-4 w-4" }) {
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
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m-3.182-5.648v4.992"
      />
    </svg>
  );
}

function isValidSortOption(value: string): value is SortOption {
  return (
    value === "default" ||
    value === "price-asc" ||
    value === "price-desc" ||
    value === "code-asc"
  );
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [allProducts, setAllProducts] = useState<PublicProduct[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [brandsData, categoriesData] = await Promise.all([
          fetchActiveBrands(),
          fetchActiveCategories(),
        ]);

        setBrands(brandsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("reference data load error:", error);
        setBrands([]);
        setCategories([]);
      }
    };

    if (!mounted) return;
    void loadReferenceData();
  }, [mounted]);

  useEffect(() => {
    const nextSearch = searchParams.get("search") || "";
    const nextBrand = searchParams.get("brand") || "all";
    const nextCategory = searchParams.get("category") || "all";
    const nextSort = searchParams.get("sort") || "default";

    setSearch(nextSearch);
    setBrandFilter(nextBrand);
    setCategoryFilter(nextCategory);
    setSortBy(isValidSortOption(nextSort) ? nextSort : "default");
  }, [searchParams]);

  const updateUrl = useCallback(
    ({
      nextSearch = search,
      nextBrand = brandFilter,
      nextCategory = categoryFilter,
      nextSort = sortBy,
    }: {
      nextSearch?: string;
      nextBrand?: string;
      nextCategory?: string;
      nextSort?: SortOption;
    } = {}) => {
      const params = new URLSearchParams();
      const trimmedSearch = nextSearch.trim();

      if (trimmedSearch) params.set("search", trimmedSearch);
      if (nextBrand !== "all") params.set("brand", nextBrand);
      if (nextCategory !== "all") params.set("category", nextCategory);
      if (nextSort !== "default") params.set("sort", nextSort);

      const queryString = params.toString();
      router.replace(queryString ? `/products?${queryString}` : "/products");
    },
    [router, search, brandFilter, categoryFilter, sortBy]
  );

  useEffect(() => {
    if (!mounted) return;

    const timeout = setTimeout(() => {
      updateUrl();
    }, 300);

    return () => clearTimeout(timeout);
  }, [mounted, updateUrl]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, brandFilter, categoryFilter, sortBy]);

  useEffect(() => {
    if (!mounted) return;

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const params = new URLSearchParams();

        if (search.trim()) params.set("search", search.trim());
        if (brandFilter !== "all") params.set("brand", brandFilter);
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (sortBy !== "default") params.set("sort", sortBy);

        const response = await fetch(
          `/api/products${params.toString() ? `?${params.toString()}` : ""}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !Array.isArray(data?.products)) {
          throw new Error(data?.message || "دریافت محصولات انجام نشد.");
        }

        setAllProducts(data.products as PublicProduct[]);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "خطا در دریافت محصولات.";
        setLoadError(message);
        setAllProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProducts();
  }, [mounted, search, brandFilter, categoryFilter, sortBy]);

  const clearAllFilters = () => {
    setSearch("");
    setBrandFilter("all");
    setCategoryFilter("all");
    setSortBy("default");
    setVisibleCount(PAGE_SIZE);
    router.replace("/products");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    brandFilter !== "all" ||
    categoryFilter !== "all" ||
    sortBy !== "default";

  const getBrandProductCount = useCallback(
    (brandName: string) => {
      if (brandName === "all") return allProducts.length;
      return allProducts.filter((p) => p.brand === brandName).length;
    },
    [allProducts]
  );

  const availableCategories = useMemo(() => {
    if (brandFilter === "all") return categories;

    const activeProductCategories = allProducts
      .filter((p) => p.brand === brandFilter)
      .map((p) => p.category);

    return categories.filter((c) => activeProductCategories.includes(c.slug));
  }, [brandFilter, categories, allProducts]);

  useEffect(() => {
    if (
      categoryFilter !== "all" &&
      !availableCategories.some((c) => c.slug === categoryFilter)
    ) {
      setCategoryFilter("all");
    }
  }, [brandFilter, availableCategories, categoryFilter]);

  const visibleProducts = allProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < allProducts.length;

  if (!mounted) return null;

  return (
    <MobileShell>
      <AppHeader title="محصولات پارسیلون" backHref="/" />

      <main
        className="bg-[#F8FAFC] pb-28 text-right"
        style={{ direction: "rtl" }}
      >
        <section className="px-4 pt-4">
          <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_20px_45px_rgba(14,47,109,0.03)] transition-all duration-300 hover:shadow-[0_25px_55px_rgba(14,47,109,0.06)]">
            <div className="flex items-center justify-between border-b-2 border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8CC63F] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8CC63F]" />
                </div>
                <span className="text-xs font-black tracking-tight text-[#0E2F6D]">
                  لیست قطعات تخصصی پارسیلون پارت
                </span>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
                〈
              </span>
            </div>

            <div className="group relative flex min-h-[190px] flex-col justify-between overflow-hidden bg-slate-950 p-5">
              <div
                className="absolute inset-0 z-0 bg-cover bg-no-repeat transition-transform duration-[8s] ease-out group-hover:scale-105"
                style={{
                  backgroundImage:
                    "url('/images/new-header-for-products-page.jpg')",
                  backgroundPosition: "center center",
                }}
              />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/10" />

              <div className="relative z-20 flex w-full items-center justify-end">
                <span className="inline-flex animate-pulse rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-black text-amber-300 shadow-sm backdrop-blur-md">
                  ✦ قیمت‌ها بدون احتساب ارزش افزوده
                </span>
              </div>

              <div className="relative z-20 mt-auto space-y-1.5">
                <h1 className="text-xl font-black tracking-tight text-white drop-shadow-md">
                  قطعات خودرو پارسیلون پارت
                </h1>
                <p className="max-w-[290px] text-[11px] font-medium leading-5 text-slate-200/90 drop-shadow-sm">
                  بررسی فنی و جستجوی هوشمند قطعات بر اساس برند خودرو و کد فنی تخصصی.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-50 bg-white p-4">
              <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/60 p-1 shadow-inner transition-all duration-300 focus-within:border-[#0E2F6D] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0E2F6D]/5">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="نام قطعه، کد فنی یا مدل خودرو را بنویسید..."
                  className="h-10 w-full bg-transparent pr-4 pl-12 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                />
                <div className="absolute left-4 text-slate-400">
                  <SearchIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 space-y-4 px-4">
          <div className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black text-[#0E2F6D]">
                <FilterIcon />
                <span>برند خودرو</span>
              </span>
              {brandFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setBrandFilter("all")}
                  className="text-[10px] font-black text-red-500 transition-colors hover:text-red-600"
                >
                  حذف فیلتر
                </button>
              )}
            </div>

            <div className="relative -mx-4 px-4">
              <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-white via-white/80 to-transparent" />
              <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-white via-white/80 to-transparent" />

              <div className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 select-none">
                <button
                  type="button"
                  onClick={() => setBrandFilter("all")}
                  className={`flex min-w-fit snap-square items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition-all duration-300 active:scale-95 ${
                    brandFilter === "all"
                      ? "border-[#0E2F6D] bg-[#0E2F6D] text-white shadow-md shadow-blue-950/10"
                      : "border-slate-100 bg-slate-50/80 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>همه برندها</span>
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                      brandFilter === "all"
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/70 text-slate-500"
                    }`}
                  >
                    {getBrandProductCount("all")}
                  </span>
                </button>

                {brands.map((brand) => {
                  const isActive = brandFilter === brand.name;
                  const count = getBrandProductCount(brand.name);

                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => setBrandFilter(brand.name)}
                      className={`flex min-w-fit snap-square items-center gap-2.5 rounded-xl border py-1.5 pr-2 pl-3.5 text-xs font-black transition-all duration-300 active:scale-95 ${
                        isActive
                          ? "border-[#0E2F6D] bg-[#0E2F6D] text-white shadow-md shadow-blue-950/10"
                          : "border-slate-100 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border bg-white p-0.5 shadow-xs transition-colors duration-300 ${
                          isActive ? "border-white/20" : "border-slate-100"
                        }`}
                      >
                        <img
                          src={resolveBrandLogo(brand.logo)}
                          alt={brand.name}
                          className={`h-4 w-4 object-contain transition-all duration-500 ${
                            isActive
                              ? "scale-105 grayscale-0"
                              : "grayscale opacity-40"
                          }`}
                        />
                      </div>
                      <span>{brand.name}</span>
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-200/70 text-slate-400"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black text-[#0E2F6D]">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V16zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V16z"
                  />
                </svg>
                <span>
                  دسته‌بندی قطعات {brandFilter !== "all" && `(${brandFilter})`}
                </span>
              </span>
              {categoryFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className="text-[10px] font-black text-red-500 transition-colors hover:text-red-600"
                >
                  حذف فیلتر
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`rounded-xl py-2.5 text-xs font-bold transition-all duration-300 active:scale-[0.98] ${
                  categoryFilter === "all"
                    ? "bg-[#0E2F6D] text-white shadow-md"
                    : "border border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                همه دسته‌ها
              </button>

              {availableCategories.map((category) => {
                const isActive = categoryFilter === category.slug;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryFilter(category.slug)}
                    className={`rounded-xl py-2.5 text-xs font-bold transition-all duration-300 active:scale-[0.98] ${
                      isActive
                        ? "bg-[#0E2F6D] text-white shadow-md"
                        : "border border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm">
            <span className="mb-2.5 block text-[11px] font-bold text-slate-400">
              مرتب‌سازی بر اساس:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "default", label: "پیش‌فرض" },
                { id: "price-asc", label: "ارزان‌ترین" },
                { id: "price-desc", label: "گران‌ترین" },
                { id: "code-asc", label: "کد فنی" },
              ].map((opt) => {
                const isSelected = sortBy === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortBy(opt.id as SortOption)}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "border-blue-100 bg-blue-50 text-[#0E2F6D] shadow-inner"
                        : "border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100/70 bg-red-50 px-4 py-3 text-xs font-black text-red-600 shadow-xs transition-all hover:bg-red-100/50 active:scale-95"
            >
              <RefreshIcon />
              <span>بازنشانی و حذف تمام فیلترها</span>
            </button>
          )}
        </section>

        <section className="mt-6 px-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-[#0E2F6D]">نتایج جستجو</h2>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-400">
              {allProducts.length} قطعه پیدا شد
            </span>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3" role="status" aria-label="در حال دریافت محصولات">
                {Array.from({ length: 6 }, (_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : loadError ? (
              <div className="rounded-[32px] border border-red-100 bg-white p-8 text-center shadow-xs">
                <div className="text-sm font-black text-red-700">
                  خطا در دریافت محصولات
                </div>
                <p className="mt-2 text-xs leading-6 text-red-500">
                  {loadError}
                </p>
              </div>
            ) : visibleProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.dbId || product.id || product.slug}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-xs">
                <div className="text-sm font-black text-slate-800">
                  قطعه مورد نظر یافت نشد
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  فیلترها را تغییر دهید یا عبارت دیگری را جستجو کنید.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95"
                >
                  <RefreshIcon />
                  <span>حذف فیلترها</span>
                </button>
              </div>
            )}
          </div>

          {hasMoreProducts && !isLoading && !loadError && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-black text-slate-600 shadow-xs transition-all hover:border-slate-300 hover:text-slate-900 active:scale-95"
            >
              مشاهده محصولات بیشتر
            </button>
          )}
        </section>
      </main>

      <BottomNav />
    </MobileShell>
  );
}

function ProductsPageFallback() {
  return (
    <MobileShell>
      <AppHeader title="محصولات پارسیلون" backHref="/" />
      <main
        className="bg-[#F8FAFC] pb-28 px-4 pt-4 text-right"
        style={{ direction: "rtl" }}
      >
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-xs">
          <div className="text-sm font-black text-slate-800">
            در حال آماده‌سازی صفحه محصولات...
          </div>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  );
}