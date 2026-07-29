"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  name: string;
  slug: string;
};

function toCategorySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-");
}

export default function AdminCategoriesPage() {
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>({ name: "", slug: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => Number(b.isActive) - Number(a.isActive));
  }, [categories]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/categories", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !Array.isArray(data?.categories)) {
        throw new Error(data?.message || "دریافت دسته‌بندی‌ها انجام نشد.");
      }

      setCategories(data.categories);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "خطا در دریافت دسته‌بندی‌ها."
      );
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    loadCategories();
  }, [mounted]);

  const resetForm = () => {
    setForm({ name: "", slug: "" });
    setEditingId(null);
    setError("");
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(""), 2200);
  };

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const safeSlug = (form.slug.trim() || toCategorySlug(trimmedName)).trim();

    if (!trimmedName) {
      setError("نام دسته‌بندی را وارد کن.");
      return;
    }

    if (!safeSlug) {
      setError("اسلاگ دسته‌بندی نامعتبر است.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (editingId) {
        const response = await fetch(`/api/admin/categories/${editingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: trimmedName,
            slug: safeSlug,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "ویرایش دسته‌بندی انجام نشد.");
        }

        showSuccess("دسته‌بندی با موفقیت ویرایش شد.");
      } else {
        const response = await fetch("/api/admin/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: trimmedName,
            slug: safeSlug,
            isActive: true,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "ایجاد دسته‌بندی انجام نشد.");
        }

        showSuccess("دسته‌بندی جدید اضافه شد.");
      }

      await loadCategories();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره دسته‌بندی.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
    });
    setError("");
  };

  const handleToggleActive = async (category: Category) => {
    try {
      setIsTogglingId(category.id);
      setError("");

      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: category.name,
          slug: category.slug,
          isActive: !category.isActive,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "تغییر وضعیت دسته‌بندی انجام نشد.");
      }

      await loadCategories();
      showSuccess(category.isActive ? "دسته غیرفعال شد." : "دسته فعال شد.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "خطا در تغییر وضعیت دسته‌بندی."
      );
    } finally {
      setIsTogglingId(null);
    }
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(`آیا دسته «${category.name}» حذف شود؟`);
    if (!confirmed) return;

    try {
      setIsDeletingId(category.id);
      setError("");

      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "حذف دسته‌بندی انجام نشد.");
      }

      if (editingId === category.id) {
        resetForm();
      }

      await loadCategories();
      showSuccess("دسته‌بندی حذف شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف دسته‌بندی.");
    } finally {
      setIsDeletingId(null);
    }
  };

  if (!mounted) return null;

  return (
    <main className="px-4 py-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">مدیریت دسته‌بندی‌ها</h1>

        <div className="mt-5 space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="نام دسته‌بندی"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

          <input
            type="text"
            value={form.slug}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, slug: e.target.value }))
            }
            placeholder="اسلاگ دسته‌بندی"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
          />

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
                : "افزودن دسته‌بندی"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-sm font-bold text-slate-900">
              در حال دریافت دسته‌بندی‌ها...
            </div>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-sm font-bold text-slate-900">
              هنوز دسته‌بندی‌ای ثبت نشده
            </div>
          </div>
        ) : (
          sortedCategories.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-slate-900">{category.name}</div>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                        category.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {category.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {category.slug}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    ویرایش
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(category)}
                    disabled={isTogglingId === category.id}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-60"
                  >
                    {isTogglingId === category.id
                      ? "..."
                      : category.isActive
                      ? "غیرفعال"
                      : "فعال"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={isDeletingId === category.id}
                    className="col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-60"
                  >
                    {isDeletingId === category.id ? "در حال حذف..." : "حذف"}
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