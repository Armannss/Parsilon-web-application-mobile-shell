export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const FALLBACK_BRAND_LOGO = "/images/parsilon-logo-fa.jpg";

export function toBrandSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveBrandLogo(src?: string) {
  const value = (src || "").trim();

  if (!value) return FALLBACK_BRAND_LOGO;
  if (value.startsWith("/")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  return FALLBACK_BRAND_LOGO;
}

function normalizeBrand(item: Brand): Brand {
  return {
    ...item,
    name: (item.name || "").trim(),
    slug: toBrandSlug(item.slug || item.name || ""),
    logo: (item.logo || "").trim(),
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

type BrandsApiResponse = {
  success: boolean;
  brands?: Brand[];
  message?: string;
};

type BrandApiResponse = {
  success: boolean;
  brand?: Brand;
  message?: string;
};

/**
 * PUBLIC
 */
export async function fetchBrands() {
  const response = await fetch("/api/brands", {
    method: "GET",
    cache: "no-store",
  });

  const data: BrandsApiResponse = await response.json();

  if (!response.ok || !data?.success || !Array.isArray(data?.brands)) {
    throw new Error(data?.message || "خطا در دریافت برندها");
  }

  return data.brands.map(normalizeBrand);
}

export async function fetchActiveBrands() {
  const brands = await fetchBrands();
  return brands.filter((item) => item.isActive);
}

/**
 * ADMIN
 */
export async function fetchAdminBrands() {
  const response = await fetch("/api/admin/brands", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data: BrandsApiResponse = await response.json();

  if (!response.ok || !data?.success || !Array.isArray(data?.brands)) {
    throw new Error(data?.message || "خطا در دریافت برندها");
  }

  return data.brands.map(normalizeBrand);
}

export async function fetchAdminBrandById(id: string) {
  const response = await fetch(`/api/admin/brands/${id}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data: BrandApiResponse = await response.json();

  if (!response.ok || !data?.success || !data?.brand) {
    throw new Error(data?.message || "خطا در دریافت برند");
  }

  return normalizeBrand(data.brand);
}

export function getBrandByName(brands: Brand[], name?: string) {
  if (!name) return undefined;
  return brands.find((item) => item.name === name);
}

export function getBrandBySlug(brands: Brand[], slug?: string) {
  if (!slug) return undefined;
  return brands.find((item) => item.slug === toBrandSlug(slug));
}