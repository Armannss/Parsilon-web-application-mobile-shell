"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  name: string;
  slug: string;
  logo: string;
};

function resolveBrandLogo(logo?: string) {
  if (!logo) return "/images/placeholder-brand.png";
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo;
  if (logo.startsWith("/")) return logo;
  return `/${logo}`;
}

function toBrandSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-");
}

export default function AdminBrandsPage() {
  const [mounted, setMounted] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    logo: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => Number(b.isActive) - Number(a.isActive));
  }, [brands]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadBrands = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/brands", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !Array.isArray(data?.brands)) {
        throw new Error(data?.message || "دریافت برندها انجام نشد.");
      }

      setBrands(data.brands);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت برندها.");
      setBrands([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    loadBrands();
  }, [mounted]);

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      logo: "",
    });
    setEditingId(null);
    setError("");
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(""), 2200);
  };

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const safeSlug = (form.slug.trim() || toBrandSlug(trimmedName)).trim();
    const safeLogo = form.logo.trim();

    if (!trimmedName) {
      setError("نام برند را وارد کن.");
      return;
    }

    if (!safeSlug) {
      setError("اسلاگ برند نامعتبر است.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (editingId) {
        const response = await fetch(`/api/admin/brands/${editingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: trimmedName,
            slug: safeSlug,
            logo: safeLogo,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "ویرایش برند انجام نشد.");
        }

        showSuccess("برند با موفقیت ویرایش شد.");
      } else {
        const response = await fetch("/api/admin/brands", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: trimmedName,
            slug: safeSlug,
            logo: safeLogo,
            isActive: true,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "ایجاد برند انجام نشد.");
        }

        showSuccess("برند جدید اضافه شد.");
      }

      await loadBrands();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره برند.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setForm({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || "",
    });
    setError("");
  };

  const handleToggleActive = async (brand: Brand) => {
    try {
      setIsTogglingId(brand.id);
      setError("");

      const response = await fetch(`/api/admin/brands/${brand.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo || "",
          isActive: !brand.isActive,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "تغییر وضعیت برند انجام نشد.");
      }

      await loadBrands();
      showSuccess(brand.isActive ? "برند غیرفعال شد." : "برند فعال شد.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "خطا در تغییر وضعیت برند."
      );
    } finally {
      setIsTogglingId(null);
    }
  };

  const handleDelete = async (brand: Brand) => {
    const confirmed = window.confirm(`آیا برند «${brand.name}» حذف شود؟`);
    if (!confirmed) return;

    try {
      setIsDeletingId(brand.id);
      setError("");

      const response = await fetch(`/api/admin/brands/${brand.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "حذف برند انجام نشد.");
      }

      if (editingId === brand.id) {
        resetForm();
      }

      await loadBrands();
      showSuccess("برند حذف شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف برند.");
    } finally {
      setIsDeletingId(null);
    }
  };

  if (!mounted) return null;

  return (
    <main className="px-4 py-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">مدیریت برندها</h1>

        <div className="mt-5 space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="نام برند"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

          <input
            type="text"
            value={form.slug}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, slug: e.target.value }))
            }
            placeholder="اسلاگ برند"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

          <input
            type="text"
            value={form.logo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, logo: e.target.value }))
            }
            placeholder="آدرس لوگوی برند"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-bold text-slate-500">
              پیش‌نمایش لوگو
            </div>
            <img
              src={resolveBrandLogo(form.logo)}
              alt={form.name || "brand-logo-preview"}
              className="h-14 w-14 rounded-xl border border-slate-200 bg-white object-contain p-2"
            />
          </div>

          {error ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {editingId !== null ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
              >
                لغو
              </button>
            ) : (
              <Link
                href="/admin/products/new"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700"
              >
                افزودن محصول
              </Link>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {isSubmitting
                ? "در حال ذخیره..."
                : editingId !== null
                ? "ذخیره تغییرات"
                : "افزودن برند"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-sm font-bold text-slate-900">
              در حال دریافت برندها...
            </div>
          </div>
        ) : sortedBrands.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-sm font-bold text-slate-900">
              هنوز برندی ثبت نشده
            </div>
          </div>
        ) : (
          sortedBrands.map((brand) => (
            <div
              key={brand.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={resolveBrandLogo(brand.logo)}
                    alt={brand.name}
                    className="h-12 w-12 rounded-xl border border-slate-200 bg-white object-contain p-2"
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-900">
                        {brand.name}
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                          brand.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {brand.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {brand.slug}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(brand)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    ویرایش
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(brand)}
                    disabled={isTogglingId === brand.id}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-60"
                  >
                    {isTogglingId === brand.id
                      ? "..."
                      : brand.isActive
                      ? "غیرفعال"
                      : "فعال"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(brand)}
                    disabled={isDeletingId === brand.id}
                    className="col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-60"
                  >
                    {isDeletingId === brand.id ? "در حال حذف..." : "حذف"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}