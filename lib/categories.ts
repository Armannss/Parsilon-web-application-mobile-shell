export type Category = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function toCategorySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCategory(item: Category): Category {
  return {
    ...item,
    name: (item.name || "").trim(),
    slug: toCategorySlug(item.slug || item.name || ""),
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

type CategoriesApiResponse = {
  success: boolean;
  categories?: Category[];
  message?: string;
};

type CategoryApiResponse = {
  success: boolean;
  category?: Category;
  message?: string;
};

/**
 * PUBLIC
 */
export async function fetchCategories() {
  const response = await fetch("/api/categories", {
    method: "GET",
    cache: "no-store",
  });

  const data: CategoriesApiResponse = await response.json();

  if (!response.ok || !data?.success || !Array.isArray(data?.categories)) {
    throw new Error(data?.message || "خطا در دریافت دسته‌بندی‌ها");
  }

  return data.categories.map(normalizeCategory);
}

export async function fetchActiveCategories() {
  const categories = await fetchCategories();
  return categories.filter((item) => item.isActive);
}

/**
 * ADMIN
 */
export async function fetchAdminCategories() {
  const response = await fetch("/api/admin/categories", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data: CategoriesApiResponse = await response.json();

  if (!response.ok || !data?.success || !Array.isArray(data?.categories)) {
    throw new Error(data?.message || "خطا در دریافت دسته‌بندی‌ها");
  }

  return data.categories.map(normalizeCategory);
}

export async function fetchAdminCategoryById(id: string) {
  const response = await fetch(`/api/admin/categories/${id}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data: CategoryApiResponse = await response.json();

  if (!response.ok || !data?.success || !data?.category) {
    throw new Error(data?.message || "خطا در دریافت دسته‌بندی");
  }

  return normalizeCategory(data.category);
}

export function getCategoryByName(categories: Category[], name?: string) {
  if (!name) return undefined;
  return categories.find((item) => item.name === name);
}

export function getCategoryBySlug(categories: Category[], slug?: string) {
  if (!slug) return undefined;
  return categories.find((item) => item.slug === toCategorySlug(slug));
}

export function getCategoryLabel(category?: string) {
  if (category === "bearing") return "بلبرینگ";
  if (category === "brake-parts") return "قطعات ترمز";
  return category || "نامشخص";
}