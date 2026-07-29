export type AdminProduct = {
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
  createdAt?: string;
  updatedAt?: string;
};

const FALLBACK_PRODUCT_IMAGE = "/images/parsilon-logo-fa.jpg";

export function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveProductImage(src?: string) {
  const value = (src || "").trim();

  if (!value) return FALLBACK_PRODUCT_IMAGE;
  if (value.startsWith("/")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  return `/${value}`;
}

export function getFallbackProductImage() {
  return FALLBACK_PRODUCT_IMAGE;
}

function normalizeAdminProduct(product: AdminProduct): AdminProduct {
  return {
    ...product,
    name: product.name?.trim() || "",
    slug: toSlug(product.slug || product.name || ""),
    code: product.code?.trim() || "",
    description: product.description?.trim() || "",
    shortDescription: product.shortDescription?.trim() || "",
    image: (product.image || "").trim(),
    price:
      typeof product.price === "number" && Number.isFinite(product.price)
        ? product.price
        : 0,
    stock:
      typeof product.stock === "number" && Number.isFinite(product.stock)
        ? Math.max(0, Math.floor(product.stock))
        : 0,
    isAvailable: Boolean(product.isAvailable),
    compatibleCars: Array.isArray(product.compatibleCars)
      ? product.compatibleCars.filter(
          (item): item is string => typeof item === "string"
        )
      : [],
    brand: product.brand?.trim() || "",
    brandSlug: product.brandSlug?.trim() || "",
    category: product.category?.trim() || "",
    categoryName: product.categoryName?.trim() || "",
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

type AdminProductsApiResponse = {
  success: boolean;
  products?: AdminProduct[];
  message?: string;
};

type AdminProductApiResponse = {
  success: boolean;
  product?: AdminProduct;
  message?: string;
};

export async function fetchAdminProducts() {
  const response = await fetch("/api/admin/products", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data: AdminProductsApiResponse = await response.json();

  if (!response.ok || !data?.success || !Array.isArray(data?.products)) {
    throw new Error(data?.message || "خطا در دریافت محصولات");
  }

  return data.products.map(normalizeAdminProduct);
}

export async function fetchAdminProductById(id: string) {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data: AdminProductApiResponse = await response.json();

  if (!response.ok || !data?.success || !data?.product) {
    throw new Error(data?.message || "خطا در دریافت محصول");
  }

  return normalizeAdminProduct(data.product);
}

export async function fetchAdminProductBySlug(slug: string) {
  const products = await fetchAdminProducts();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    throw new Error("محصول پیدا نشد");
  }

  return product;
}

export function getCategoryLabel(category?: string) {
  if (category === "bearing") return "بلبرینگ";
  if (category === "brake-parts") return "قطعات ترمز";
  return "نامشخص";
}