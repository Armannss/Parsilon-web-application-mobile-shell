"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchActiveBrands,
  resolveBrandLogo,
  type Brand,
} from "@/lib/brands";
import {
  fetchActiveCategories,
  type Category,
} from "@/lib/categories";

type QuickBrandItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  logo: string;
};

type QuickCategoryItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export default function CategoryGrid() {
  const [mounted, setMounted] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setMounted(true);

    const loadData = async () => {
      try {
        const [activeBrands, activeCategories] = await Promise.all([
          fetchActiveBrands(),
          fetchActiveCategories(),
        ]);

        setBrands(activeBrands);
        setCategories(activeCategories);
      } catch (error) {
        console.error("CATEGORY GRID LOAD ERROR:", error);
        setBrands([]);
        setCategories([]);
      }
    };

    void loadData();
  }, []);

  const quickBrandItems = useMemo<QuickBrandItem[]>(() => {
    return brands.slice(0, 2).map((brand) => ({
      id: brand.id,
      title: brand.name,
      subtitle: `قطعات مناسب خودروهای ${brand.name}`,
      href: `/products?brand=${encodeURIComponent(brand.name)}`,
      logo: resolveBrandLogo(brand.logo),
    }));
  }, [brands]);

  const quickCategoryItems = useMemo<QuickCategoryItem[]>(() => {
    return categories.slice(0, 2).map((category) => ({
      id: category.id,
      title: category.name,
      subtitle:
        category.name === "بلبرینگ"
          ? "انواع بلبرینگ چرخ جلو و عقب"
          : category.name === "قطعات ترمز"
            ? "دیسک ترمز، کاسه چرخ، سیلندر ترمز و بیشتر"
            : `مشاهده محصولات ${category.name}`,
      href: `/products?category=${encodeURIComponent(category.slug)}`,
    }));
  }, [categories]);

  if (!mounted) {
    return null;
  }

  return (
    <section className="mt-6 px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">
          دسته‌بندی‌های سریع
        </h2>

        <Link href="/products" className="text-sm font-bold text-blue-800">
          همه
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {quickBrandItems.map((item) => (
          <Link
            key={`brand-${item.id}`}
            href={item.href}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                <img
                  src={item.logo}
                  alt={item.title}
                  className="h-9 w-9 object-contain"
                />
              </div>

              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                برند
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-black text-slate-900">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                {item.subtitle}
              </p>

              <div className="mt-3 text-sm font-bold text-slate-400">
                {item.title}
              </div>
            </div>
          </Link>
        ))}

        {quickCategoryItems.map((item) => (
          <Link
            key={`category-${item.id}`}
            href={item.href}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl shadow-sm">
                {item.title === "بلبرینگ" ? "⚙️" : "🛞"}
              </div>

              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                دسته
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-black text-slate-900">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                {item.subtitle}
              </p>

              <div className="mt-3 text-sm font-bold text-slate-400">
                {item.title}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}