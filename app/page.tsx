"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { offers } from "@/lib/data";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import { useCart } from "../context/CartContext";
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
import { resolveProductImage } from "@/lib/admin-products";

type QuickItem =
  | {
      id: string;
      title: string;
      description: string;
      href: string;
      type: "brand";
      logo: string;
      bgClass: string;
      iconBg: string;
    }
  | {
      id: string;
      title: string;
      description: string;
      href: string;
      type: "category";
      bgClass: string;
      iconBg: string;
      iconType: "bearing" | "brake";
    };

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

function ArrowLeftIcon({ className = "h-4 w-4" }) {
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
        strokeWidth={2}
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 animate-pulse"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
  );
}

function PremiumBearingIcon() {
  return (
    <svg
      className="h-5 w-5 text-indigo-600 transition-transform duration-700 group-hover:rotate-180"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PremiumBrakeIcon() {
  return (
    <svg
      className="h-5 w-5 text-emerald-600 transition-transform duration-500 group-hover:scale-110"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage() {
  const { addToCart } = useCart();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<PublicProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setIsLoading(true);

        const [brandsData, categoriesData, productsResponse] = await Promise.all(
          [
            fetchActiveBrands(),
            fetchActiveCategories(),
            fetch("/api/products", {
              method: "GET",
              cache: "no-store",
            }),
          ]
        );

        const productsData = await productsResponse.json().catch(() => null);

        setBrands(brandsData);
        setCategories(categoriesData);

        if (
          productsResponse.ok &&
          productsData?.success &&
          Array.isArray(productsData?.products)
        ) {
          setFeaturedProducts((productsData.products as PublicProduct[]).slice(0, 4));
        } else {
          setFeaturedProducts([]);
        }
      } catch (error) {
        console.error("home data load error:", error);
        setBrands([]);
        setCategories([]);
        setFeaturedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!mounted) return;
    loadHomeData();
  }, [mounted]);

  useEffect(() => {
    if (recentlyAddedId === null) return;
    const timeout = setTimeout(() => setRecentlyAddedId(null), 1400);
    return () => clearTimeout(timeout);
  }, [recentlyAddedId]);

  const quickItems = useMemo<QuickItem[]>(() => {
    const quickBrands: QuickItem[] = brands.slice(0, 2).map((brand) => {
      const isBenz = brand.name.includes("بنز");

      return {
        id: `brand-${brand.id}`,
        title: brand.name,
        description: `قطعات مناسب خودروهای ${brand.name}`,
        href: `/products?brand=${encodeURIComponent(brand.name)}`,
        type: "brand",
        logo: resolveBrandLogo(brand.logo),
        bgClass: isBenz
          ? "bg-slate-900/[0.02] border-slate-200/60"
          : "bg-blue-500/[0.02] border-blue-100/60",
        iconBg: isBenz
          ? "bg-slate-900/5 text-slate-800"
          : "bg-blue-500/5 text-blue-600",
      };
    });

    const quickCategories: QuickItem[] = categories.slice(0, 2).map((category) => {
      const isBearing = category.name === "بلبرینگ";

      return {
        id: `category-${category.id}`,
        title: category.name,
        description: isBearing
          ? "انواع بلبرینگ چرخ جلو و عقب"
          : "دیسک ترمز، کاسه چرخ و سیلندر ترمز",
        href: `/products?category=${encodeURIComponent(category.slug)}`,
        type: "category",
        bgClass: isBearing
          ? "bg-indigo-500/[0.02] border-indigo-100/60"
          : "bg-emerald-500/[0.02] border-emerald-100/60",
        iconBg: isBearing ? "bg-indigo-500/10" : "bg-emerald-500/10",
        iconType: isBearing ? "bearing" : "brake",
      };
    });

    return [...quickBrands, ...quickCategories];
  }, [brands, categories]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((item) => [item.slug, item.name]));
  }, [categories]);

  const handleSearch = () => {
    const trimmed = search.trim();

    if (!trimmed) {
      router.push("/products");
      return;
    }

    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleAddToCart = (product: PublicProduct) => {
    addToCart({
      id: typeof product.id === "number" ? product.id : 0,
      name: product.name,
      code: product.code,
      price: product.price,
      stock: String(product.stock ?? ""),
      image: product.image,
      slug: product.slug,
      brand: product.brand,
      category: product.category,
    });

    setRecentlyAddedId(product.id ?? Date.now());
  };

  if (!mounted) return null;

  return (
    <MobileShell>
      <AppHeader showBrandLogo />

      <main className="bg-slate-50/50 pb-28 text-right" style={{ direction: "rtl" }}>
        <section className="px-4 pt-4">
          <div className="relative min-h-[460px] overflow-hidden rounded-[32px] border border-slate-100 shadow-[0_15px_45px_rgba(14,47,109,0.04)]">
            <div
              className="absolute inset-0 bg-cover bg-no-repeat scale-100 transition-transform duration-[10s] hover:scale-105"
              style={{
                backgroundImage: "url('/images/parsilon-hero-board.jpg')",
                backgroundPosition: "center top",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#061B40] via-[#0E2F6D]/50 to-transparent" />

            <div className="relative z-10 flex min-h-[460px] flex-col justify-between p-6">
              <div className="flex justify-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/40 bg-white/95 px-3.5 py-1.5 text-[11px] font-bold text-[#0E2F6D] shadow-sm backdrop-blur-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#8CC63F]" />
                  پلتفرم تخصصی قطعات خودرو
                </div>
              </div>

              <div className="mt-auto space-y-5">
                <div className="space-y-2">
                  <h1 className="text-[26px] font-black leading-[40px] tracking-tight text-white">
                    مرجع تخصصی
                    <span className="mt-0.5 block font-extrabold text-white">
                      قطعات ترمز خودرو
                    </span>
                  </h1>
                  <p className="max-w-[300px] text-xs leading-6 text-slate-100">
                    جستجوی هوشمند، انتخاب دقیق و دسترسی سریع به قطعات مناسب هر خودرو، در یک تجربه حرفه‌ای.
                  </p>
                  <div className="mt-3 h-[4px] w-12 rounded-full bg-[#8CC63F]" />
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <Link
                    href="/products"
                    className="group flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-[#0E2F6D] shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                  >
                    <div className="text-right">
                      <div className="text-[12px] font-black">مشاهده محصولات</div>
                      <div className="mt-0.5 flex items-center gap-0.5 text-[10px] font-bold text-slate-400">
                        <span>ورود به لیست</span>
                        <ArrowLeftIcon className="h-2 w-2 text-slate-400 transition-transform group-hover:-translate-x-0.5" />
                      </div>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#17479E]">
                      <BagIcon />
                    </div>
                  </Link>

                  <Link
                    href="/wholesale"
                    className="group flex items-center justify-between rounded-2xl border border-white/20 bg-[#0E2F6D]/85 px-4 py-3.5 text-white shadow-lg shadow-black/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                  >
                    <div className="text-right">
                      <div className="text-[12px] font-black">خرید عمده</div>
                      <div className="mt-0.5 flex items-center gap-0.5 text-[10px] font-bold text-white/70">
                        <span>ثبت درخواست</span>
                        <ArrowLeftIcon className="h-2 w-2 text-white/70 transition-transform group-hover:-translate-x-0.5" />
                      </div>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                      <BoxIcon />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pt-5">
          <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
            <div className="space-y-1 text-center">
              <h2 className="text-base font-black text-[#0E2F6D]">جستجوی سریع محصول</h2>
              <p className="text-xs text-slate-400">
                با نام قطعه، کد فنی، برند یا مدل خودرو جستجو کن
              </p>
            </div>

            <div className="relative mt-5 flex items-stretch gap-2.5 rounded-[22px] border border-slate-200/80 bg-slate-50/50 p-1.5 transition-all duration-300 focus-within:border-[#17479E] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="مثلاً: دیسک ترمز، 6010101، پژو 405"
                className="w-full bg-transparent pr-10 pl-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="rounded-[16px] bg-[#0E2F6D] px-5 py-2.5 text-xs font-black text-white shadow-md transition-all duration-200 hover:bg-[#17479E] active:scale-95"
              >
                جستجو
              </button>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2">
              <Link
                href="/products"
                className="group flex flex-col items-center justify-center rounded-2xl bg-blue-50/40 p-2.5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50/70"
              >
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-105">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm7.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM3.75 12h16.5M4.5 12V6.75A2.25 2.25 0 0 1 6.75 4.5h10.5a2.25 2.25 0 0 1 2.25 2.25V12" />
                  </svg>
                </div>
                <span className="text-[11px] font-black tracking-tight text-slate-800">همه محصولات</span>
                <span className="mt-0.5 text-[9px] text-slate-400">مشاهده لیست</span>
              </Link>

              <button
                onClick={() => setSearch("6010101")}
                className="group flex flex-col items-center justify-center rounded-2xl bg-amber-50/40 p-2.5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-50/70"
              >
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-transform group-hover:rotate-6">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
                  </svg>
                </div>
                <span className="text-[11px] font-black tracking-tight text-slate-800">کد فنی</span>
                <span className="mt-0.5 text-[9px] text-slate-400">جستجوی دقیق</span>
              </button>

              <Link
                href="/products"
                className="group flex flex-col items-center justify-center rounded-2xl bg-purple-50/40 p-2.5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-50/70"
              >
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 transition-transform group-hover:rotate-12">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.767c-.31.236-.456.63-.392.1a1.5 1.5 0 010 .254c-.064.372.08.766.392.1l1.003.767a1.125 1.125 0 01.26 1.43l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.216-.456c-.356-.133-.751-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.767c.311-.236.456-.63.392-.1a1.5 1.5 0 010-.254c.063-.372-.08-.766-.392-.1l-1.004-.767a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.49l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  </svg>
                </div>
                <span className="text-[11px] font-black tracking-tight text-slate-800">دسته‌بندی‌ها</span>
                <span className="mt-0.5 text-[9px] text-slate-400">مرور سریع</span>
              </Link>

              <Link
                href="/wholesale"
                className="group flex flex-col items-center justify-center rounded-2xl bg-green-50/40 p-2.5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-50/70"
              >
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-600 transition-transform group-hover:scale-105">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <span className="text-[11px] font-black tracking-tight text-slate-800">فروش عمده</span>
                <span className="mt-0.5 text-[9px] text-slate-400">ثبت درخواست</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pt-6">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-base font-black text-[#0E2F6D]">دسته‌بندی‌های سریع</h2>
            <Link href="/products" className="group inline-flex items-center gap-1 text-xs font-bold text-[#17479E]">
              <span>مشاهده همه</span>
              <ArrowLeftIcon className="transition-transform group-hover:-translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {quickItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`group relative overflow-hidden rounded-[24px] border bg-white p-4 shadow-[0_4px_25px_rgba(0,0,0,0.005)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-98 ${item.bgClass}`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="z-10 flex-1 space-y-1">
                    <h3 className="text-sm font-black text-slate-800 transition-colors group-hover:text-[#17479E]">
                      {item.title}
                    </h3>
                    <p className="line-clamp-2 text-[11px] font-medium leading-5 text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  {item.type === "brand" ? (
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white transition-all duration-300 group-hover:scale-105 ${item.iconBg}`}
                    >
                      <img src={item.logo} alt={item.title} className="h-8 w-8 object-contain" />
                    </div>
                  ) : (
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${item.iconBg}`}
                    >
                      {item.iconType === "bearing" ? <PremiumBearingIcon /> : <PremiumBrakeIcon />}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 right-4 h-[2.5px] w-6 rounded-full bg-[#8CC63F] opacity-0 transition-all duration-300 group-hover:w-12 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </section>

        <section className="px-4 pt-6">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-base font-black text-[#0E2F6D]">پیشنهادهای ویژه</h2>
            <Link href="/products" className="group inline-flex items-center gap-1 text-xs font-bold text-[#17479E]">
              <span>مشاهده همه</span>
              <ArrowLeftIcon className="transition-transform group-hover:-translate-x-0.5" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {offers.map((offer) => {
              const isWholesale = offer.title.includes("عمده");

              return (
                <Link
                  key={offer.title}
                  href={isWholesale ? "/wholesale" : "/products"}
                  className={`group block overflow-hidden rounded-[24px] border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                    isWholesale
                      ? "border-emerald-100/50 bg-gradient-to-l from-emerald-500/[0.02] to-white"
                      : "border-rose-100/50 bg-gradient-to-l from-rose-500/[0.02] to-white"
                  }`}
                >
                  <div className="flex justify-end">
                    <div
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${
                        isWholesale
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {offer.title.includes("ویژه")
                        ? "پیشنهاد ویژه"
                        : isWholesale
                        ? "فروش عمده"
                        : "آفر فروش"}
                    </div>
                  </div>
                  <h3 className="mt-3 text-sm font-black text-slate-800 transition-colors group-hover:text-[#17479E]">
                    {offer.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{offer.subtitle}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-[11px] text-slate-400">برای مشاهده جزئیات کلیک کنید</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#17479E]">
                      <span>{isWholesale ? "ثبت درخواست" : "مشاهده"}</span>
                      <ArrowLeftIcon className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="px-4 pt-6">
          <div className="rounded-[28px] border border-blue-100/60 bg-white p-5 shadow-[0_4px_25px_rgba(14,47,109,0.02)]">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <h2 className="text-xs font-black tracking-tight text-[#0E2F6D]">
                استانداردها و اصالت بین‌المللی پارسیلون
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="group flex min-h-[165px] flex-col items-center justify-between rounded-2xl border border-white/5 bg-[#0e213d] p-3 text-center shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-950/20">
                <div className="flex h-16 w-full items-center justify-center rounded-lg bg-[#0e213d] px-1">
                  <img
                    src="/images/IMQ_2.jpg"
                    alt="ISO 9001:2015 Registered Firm IMQ"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-2.5 space-y-0.5">
                  <div className="text-[11px] font-black text-white">ISO 9001:2015</div>
                  <p className="text-[9px] font-medium leading-3 text-slate-400">
                    مدیریت کیفیت و پایداری قطعات
                  </p>
                </div>
              </div>

              <div className="group flex min-h-[165px] flex-col items-center justify-between rounded-2xl border border-white/5 bg-[#0e213d] p-3 text-center shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-950/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0e213d] p-0.5">
                  <img
                    src="/images/ICnet_2.jpg"
                    alt="Certified Quality System IQNet"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-2.5 space-y-0.5">
                  <div className="text-[11px] font-black text-white">شبکه جهانی IQNet</div>
                  <p className="text-[9px] font-medium leading-3 text-slate-400">
                    تضمین اصالت کالا در سطح بین‌الملل
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-3.5 border-t border-slate-50 pt-2.5 text-center text-[10px] font-semibold leading-4 text-slate-400">
              تمامی محصولات پارسیلون تحت نظارت استاندارد کارخانه‌ای منطبق بر سیستم جهانی مدیریت کیفیت عرضه می‌شوند.
            </p>
          </div>
        </section>

        <section className="px-4 pt-6">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-base font-black text-[#0E2F6D]">محصولات منتخب</h2>
            <Link href="/products" className="group inline-flex items-center gap-1 text-xs font-bold text-[#17479E]">
              <span>همه محصولات</span>
              <ArrowLeftIcon className="transition-transform group-hover:-translate-x-0.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-[24px] border border-slate-100 bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm">
              در حال دریافت محصولات...
            </div>
          ) : (
            <div className="space-y-4">
              {featuredProducts.map((product) => {
                const hasInquiryPrice =
                  product.price.includes("تماس") ||
                  String(product.stock ?? "").includes("استعلام");

                const justAdded =
                  recentlyAddedId !== null && (product.id ?? -1) === recentlyAddedId;

                const isUnavailable =
                  product.isAvailable === false || Number(product.stock ?? 0) <= 0;

                const categoryName =
                  categoriesMap.get(product.category || "") ||
                  product.category ||
                  "";

                const brandLogo = product.brand
                  ? resolveBrandLogo(
                      brands.find((item) => item.name === product.brand)?.logo
                    )
                  : "";

                return (
                  <div
                    key={product.dbId || product.id || product.slug}
                    className="group overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
                  >
                    <Link
                      href={`/products/${product.slug}`}
                      className="block overflow-hidden bg-slate-50"
                    >
                      <img
                        src={resolveProductImage(product.image)}
                        alt={product.name}
                        className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <Link href={`/products/${product.slug}`} className="block">
                            <h3 className="text-sm font-black leading-6 text-slate-800 transition-colors hover:text-[#17479E]">
                              {product.name}
                            </h3>
                          </Link>
                          <p className="text-[11px] text-slate-400">کد فنی: {product.code}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            isUnavailable
                              ? "bg-red-50 text-red-600"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {isUnavailable ? "ناموجود" : "موجود"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {product.brand && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
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
                          <span className="rounded-xl bg-blue-50/60 px-2.5 py-1 text-[11px] font-medium text-[#17479E]">
                            {categoryName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                        <div>
                          <div className="text-[10px] text-slate-400">
                            {hasInquiryPrice ? "وضعیت قیمت" : "قیمت واحد"}
                          </div>
                          <div
                            className={`mt-0.5 text-sm font-black ${
                              hasInquiryPrice ? "text-amber-600" : "text-[#17479E]"
                            }`}
                          >
                            {product.price}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => !isUnavailable && handleAddToCart(product)}
                          disabled={isUnavailable}
                          className={`rounded-xl px-5 py-2.5 text-xs font-black text-white shadow-sm transition-all duration-300 active:scale-95 ${
                            isUnavailable
                              ? "cursor-not-allowed bg-slate-200 shadow-none"
                              : justAdded
                              ? "bg-green-600"
                              : "bg-[#0E2F6D] hover:bg-[#17479E]"
                          }`}
                        >
                          {isUnavailable ? "ناموجود" : justAdded ? "✓ اضافه شد" : "افزودن به سبد"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!isLoading && featuredProducts.length === 0 && (
                <div className="rounded-[24px] border border-slate-100 bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm">
                  فعلاً محصولی برای نمایش موجود نیست.
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </MobileShell>
  );
}