"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  isActive: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type FormState = {
  name: string;
  slug: string;
  code: string;
  price: string;
  image: string;
  categorySlug: string;
  brandSlug: string;
  stock: string;
  shortDescription: string;
  compatibleCars: string;
  isAvailable: boolean;
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-");
}

export default function AdminNewProductPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    code: "",
    price: "",
    image: "",
    categorySlug: "",
    brandSlug: "",
    stock: "10",
    shortDescription: "",
    compatibleCars: "",
    isAvailable: true,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setIsLoadingMeta(true);
        setError("");

        const [brandsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/admin/brands", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/admin/categories", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const brandsData = await brandsResponse.json().catch(() => null);
        const categoriesData = await categoriesResponse.json().catch(() => null);

        if (
          !brandsResponse.ok ||
          !brandsData?.success ||
          !Array.isArray(brandsData?.brands)
        ) {
          throw new Error(brandsData?.message || "دریافت برندها انجام نشد.");
        }

        if (
          !categoriesResponse.ok ||
          !categoriesData?.success ||
          !Array.isArray(categoriesData?.categories)
        ) {
          throw new Error(
            categoriesData?.message || "دریافت دسته‌بندی‌ها انجام نشد."
          );
        }

        const activeBrands = (brandsData.brands as Brand[]).filter(
          (item) => item.isActive
        );
        const activeCategories = (categoriesData.categories as Category[]).filter(
          (item) => item.isActive
        );

        setBrands(activeBrands);
        setCategories(activeCategories);

        setForm((prev) => ({
          ...prev,
          brandSlug: prev.brandSlug || activeBrands[0]?.slug || "",
          categorySlug: prev.categorySlug || activeCategories[0]?.slug || "",
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "خطا در دریافت اطلاعات اولیه."
        );
        setBrands([]);
        setCategories([]);
      } finally {
        setIsLoadingMeta(false);
      }
    };

    if (!mounted) return;
    loadMeta();
  }, [mounted]);

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const trimmedSlug = (form.slug.trim() || toSlug(trimmedName)).trim();
    const trimmedCode = form.code.trim();
    const numericPrice = Number(form.price);
    const numericStock = Math.max(0, Number(form.stock) || 0);

    if (!trimmedName || !trimmedSlug || !trimmedCode) {
      setError("نام، اسلاگ و کد فنی الزامی هستند.");
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("قیمت محصول نامعتبر است.");
      return;
    }

    if (!form.brandSlug.trim()) {
      setError("برند محصول را انتخاب کن.");
      return;
    }

    if (!form.categorySlug.trim()) {
      setError("دسته‌بندی محصول را انتخاب کن.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          slug: trimmedSlug,
          code: trimmedCode,
          description: form.shortDescription.trim(),
          image: form.image.trim(),
          price: numericPrice,
          stock: numericStock,
          isAvailable: form.isAvailable && numericStock > 0,
          compatibleCars: form.compatibleCars
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          brandSlug: form.brandSlug,
          categorySlug: form.categorySlug,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "ایجاد محصول انجام نشد.");
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره محصول.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  if (isLoadingMeta) {
    return (
      <main className="px-4 py-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-sm font-bold text-slate-900">
            در حال دریافت اطلاعات فرم...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="px-4 py-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">افزودن محصول</h1>

        <div className="mt-5 space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="نام محصول"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

          <input
            type="text"
            value={form.slug}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, slug: e.target.value }))
            }
            placeholder="اسلاگ"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

          <input
            type="text"
            value={form.code}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="کد فنی"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, price: e.target.value }))
            }
            placeholder="قیمت"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

          <input
            type="text"
            value={form.image}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, image: e.target.value }))
            }
            placeholder="آدرس تصویر"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-500">
                  دسته‌بندی
                </label>
                <Link
                  href="/admin/categories"
                  className="text-[11px] font-bold text-blue-700"
                >
                  مدیریت دسته‌ها
                </Link>
              </div>

              <select
                value={form.categorySlug}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    categorySlug: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <option value="">دسته‌بندی فعالی وجود ندارد</option>
                )}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-500">
                  برند
                </label>
                <Link
                  href="/admin/brands"
                  className="text-[11px] font-bold text-blue-700"
                >
                  مدیریت برندها
                </Link>
              </div>

              <select
                value={form.brandSlug}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    brandSlug: e.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
              >
                {brands.length > 0 ? (
                  brands.map((brand) => (
                    <option key={brand.id} value={brand.slug}>
                      {brand.name}
                    </option>
                  ))
                ) : (
                  <option value="">برند فعالی وجود ندارد</option>
                )}
              </select>
            </div>
          </div>

          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, stock: e.target.value }))
            }
            placeholder="موجودی"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

          <textarea
            rows={4}
            value={form.shortDescription}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                shortDescription: e.target.value,
              }))
            }
            placeholder="توضیح کوتاه / توضیحات محصول"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <textarea
            rows={3}
            value={form.compatibleCars}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                compatibleCars: e.target.value,
              }))
            }
            placeholder="خودروهای سازگار را با کاما جدا کن. مثال: پژو 405, پارس, سمند"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isAvailable: e.target.checked,
                }))
              }
            />
            محصول فعال و قابل فروش باشد
          </label>

          {error ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/products"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700"
            >
              انصراف
            </Link>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {isSubmitting ? "در حال ذخیره..." : "ذخیره محصول"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}