"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string;
  shortDescription: string;
  image: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  compatibleCars: string[];
  brand: string;
  brandSlug: string;
  category: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-");
}

function parsePriceInput(value: string) {
  const englishDigits = value
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[^\d]/g, "");

  return Number(englishDigits || 0);
}

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();

  const slugParam = useMemo(() => {
    const raw = params?.slug;
    return typeof raw === "string" ? decodeURIComponent(raw) : "";
  }, [params]);

  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productId, setProductId] = useState("");

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !slugParam) return;

    const loadPageData = async () => {
      try {
        setLoaded(false);
        setError("");

        const [productsResponse, brandsResponse, categoriesResponse] =
          await Promise.all([
            fetch("/api/admin/products", {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }),
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

        const productsData = await productsResponse.json().catch(() => null);
        const brandsData = await brandsResponse.json().catch(() => null);
        const categoriesData = await categoriesResponse.json().catch(() => null);

        if (
          !productsResponse.ok ||
          !productsData?.success ||
          !Array.isArray(productsData?.products)
        ) {
          throw new Error(productsData?.message || "دریافت محصولات انجام نشد.");
        }

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

        const product = (productsData.products as AdminProduct[]).find(
          (item) => item.slug === slugParam
        );

        if (!product) {
          throw new Error("محصول پیدا نشد.");
        }

        setProductId(product.id);
        setForm({
          name: product.name || "",
          slug: product.slug || "",
          code: product.code || "",
          price: String(product.price ?? ""),
          image: product.image || "",
          categorySlug: product.category || "",
          brandSlug: product.brandSlug || "",
          stock: String(product.stock ?? 0),
          shortDescription:
            product.shortDescription || product.description || "",
          compatibleCars: Array.isArray(product.compatibleCars)
            ? product.compatibleCars.join(", ")
            : "",
          isAvailable: Boolean(product.isAvailable),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "خطا در دریافت محصول.";
        setError(message);
      } finally {
        setLoaded(true);
      }
    };

    loadPageData();
  }, [mounted, slugParam]);

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const trimmedSlug = (form.slug.trim() || toSlug(trimmedName)).trim();
    const trimmedCode = form.code.trim();

    if (!trimmedName || !trimmedSlug || !trimmedCode || !form.price.trim()) {
      setError("نام، اسلاگ، کد فنی و قیمت الزامی هستند.");
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

    if (!productId) {
      setError("شناسه محصول پیدا نشد.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const numericStock = Math.max(0, Number(form.stock) || 0);

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
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
          price: parsePriceInput(form.price),
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
        throw new Error(data?.message || "ویرایش محصول انجام نشد.");
      }

      router.push("/admin/products");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "خطا در ویرایش محصول.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !loaded) {
    return null;
  }

  return (
    <main className="px-4 py-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">ویرایش محصول</h1>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">
              نام محصول
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">
              اسلاگ
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">
              کد فنی
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, code: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">
              قیمت
            </label>
            <input
              type="text"
              value={form.price}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, price: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">
              آدرس تصویر
            </label>
            <input
              type="text"
              value={form.image}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, image: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-500">
                دسته‌بندی
              </label>
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
              <label className="mb-2 block text-xs font-bold text-slate-500">
                برند
              </label>
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

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">
              موجودی
            </label>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, stock: e.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">
              توضیح کوتاه
            </label>
            <textarea
              rows={4}
              value={form.shortDescription}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  shortDescription: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">
              خودروهای سازگار
            </label>
            <textarea
              rows={3}
              value={form.compatibleCars}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  compatibleCars: e.target.value,
                }))
              }
              placeholder="مثلاً: پژو 405, پارس, سمند"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-3 pt-2">
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
              {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}