"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

function resolveProductImage(image?: string) {
  if (!image) return "/images/placeholder-product.png";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

export default function AdminProductsPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/products", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !Array.isArray(data?.products)) {
        throw new Error(data?.message || "دریافت محصولات انجام نشد.");
      }

      setItems(data.products as AdminProduct[]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "خطا در دریافت محصولات.";
      setErrorMessage(message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadProducts();
  }, [mounted, loadProducts]);

  const filteredItems = useMemo(() => {
    const query = search.trim();

    if (!query) return items;

    return items.filter((item) => {
      return (
        item.name.includes(query) ||
        item.code.includes(query) ||
        item.slug.includes(query) ||
        item.brand.includes(query) ||
        item.categoryName.includes(query) ||
        item.category.includes(query)
      );
    });
  }, [items, search]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("این محصول حذف شود؟");
    if (!confirmed) return;

    try {
      setIsDeletingId(id);
      setErrorMessage("");

      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "حذف محصول انجام نشد.");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "خطا در حذف محصول.";
      setErrorMessage(message);
    } finally {
      setIsDeletingId(null);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="px-4 py-4 pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-slate-900">
              مدیریت محصولات
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              از اینجا می‌توانی محصولات را ببینی، جستجو کنی، ویرایش کنی یا حذف
              کنی.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
          >
            افزودن محصول
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href="/admin/brands"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700"
          >
            مدیریت برندها
          </Link>

          <Link
            href="/admin/categories"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700"
          >
            مدیریت دسته‌بندی‌ها
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <section className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm font-extrabold text-red-700">
            خطا در پردازش
          </div>
          <p className="mt-2 text-sm leading-7 text-red-600">{errorMessage}</p>
        </section>
      ) : null}

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-xs font-bold text-slate-500">
          جستجو
        </label>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="نام محصول، کد فنی، برند، دسته‌بندی یا slug"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
        />
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">
            لیست محصولات
          </h2>

          <span className="text-sm text-slate-500">
            {filteredItems.length} محصول
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-sm font-bold text-slate-900">
                در حال دریافت محصولات...
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                چند لحظه صبر کن.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-sm font-bold text-slate-900">
                محصولی پیدا نشد
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                عبارت جستجو را تغییر بده.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <Image
                      src={resolveProductImage(item.image)}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-extrabold text-slate-900">
                      {item.name}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>کد فنی: {item.code}</div>
                      <div>دسته: {item.categoryName || "نامشخص"}</div>
                      <div>برند: {item.brand || "نامشخص"}</div>
                      <div>
                        قیمت: {Number(item.price || 0).toLocaleString("fa-IR")}{" "}
                        ریال
                      </div>
                    </div>

                    <div className="mt-2 text-xs">
                      <span
                        className={
                          item.isAvailable
                            ? "font-bold text-emerald-700"
                            : "font-bold text-red-600"
                        }
                      >
                        {item.isAvailable ? "موجود" : "ناموجود"}
                      </span>
                      <span className="mr-2 text-slate-500">
                        موجودی: {item.stock}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/products/${encodeURIComponent(
                      item.slug
                    )}/edit`}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700"
                  >
                    ویرایش
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeletingId === item.id}
                    className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {isDeletingId === item.id ? "در حال حذف..." : "حذف"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}