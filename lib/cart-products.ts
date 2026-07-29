import type { PublicProduct } from "./public-products";
import { resolveProductImage } from "./admin-products";
import type { CartItem as StoredCartItem } from "./utils";

export type ResolvedCartItem = {
  slug: string;
  quantity: number;
  product: PublicProduct | null;
  isMissing: boolean;
  isUnavailable: boolean;
  safeImage: string;
};

const PRODUCTS_CACHE_KEYS = [
  "parsilon-products-cache",
  "parsilon-products-cache-v1",
  "parsilon-products-api-cache",
];

function parseStockValue(stock: unknown) {
  if (typeof stock === "number" && Number.isFinite(stock)) {
    return stock;
  }

  if (typeof stock === "string") {
    if (stock.includes("موجود")) return 10;
    if (stock.includes("استعلام")) return 0;
    if (stock.includes("ناموجود")) return 0;

    const englishDigits = stock
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[^\d]/g, "");

    return Number(englishDigits || 0);
  }

  return 0;
}

export function parsePersianPrice(price?: string) {
  if (!price || price.includes("تماس")) return 0;

  const englishDigits = price
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[^\d]/g, "");

  return Number(englishDigits || 0);
}

function isValidProduct(item: unknown): item is PublicProduct {
  if (!item || typeof item !== "object") return false;

  const candidate = item as Record<string, unknown>;

  return (
    typeof candidate.slug === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.code === "string"
  );
}

function normalizeProduct(item: PublicProduct): PublicProduct {
  return {
    ...item,
    id:
      typeof item.id === "number" && Number.isFinite(item.id)
        ? item.id
        : 0,
    dbId: item.dbId,
    name: String(item.name || "").trim(),
    slug: String(item.slug || "").trim(),
    code: String(item.code || "").trim(),
    price: String(item.price || "").trim(),
    image: String(item.image || "").trim(),
    category: String(item.category || "").trim(),
    brand: String(item.brand || "").trim(),
    stock:
      typeof item.stock === "number" && Number.isFinite(item.stock)
        ? item.stock
        : parseStockValue(item.stock),
    isAvailable: Boolean(item.isAvailable),
    shortDescription: String(item.shortDescription || "").trim(),
    description: String(item.description || "").trim(),
    compatibleCars: Array.isArray(item.compatibleCars)
      ? item.compatibleCars.filter(
          (car): car is string => typeof car === "string"
        )
      : [],
    warranty: String(item.warranty || "").trim(),
    shipping: String(item.shipping || "").trim(),
  };
}

function readProductsFromApiCache(): PublicProduct[] {
  if (typeof window === "undefined") return [];

  for (const key of PRODUCTS_CACHE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;

      const products = parsed
        .filter(isValidProduct)
        .map(normalizeProduct)
        .filter((product) => product.slug);

      if (products.length > 0) {
        return products;
      }
    } catch {
      continue;
    }
  }

  return [];
}

export function writeProductsToApiCache(products: PublicProduct[]) {
  if (typeof window === "undefined") return;

  const normalized = products
    .filter(isValidProduct)
    .map(normalizeProduct)
    .filter((product) => product.slug);

  try {
    window.localStorage.setItem(
      "parsilon-products-cache",
      JSON.stringify(normalized)
    );
    window.localStorage.setItem(
      "parsilon-products-api-cache",
      JSON.stringify(normalized)
    );
  } catch {
    // ignore localStorage write errors
  }
}

export function resolveCartItems(
  cartItems: StoredCartItem[]
): ResolvedCartItem[] {
  const products = readProductsFromApiCache();

  const productsMap = new Map<string, PublicProduct>();
  for (const product of products) {
    if (product?.slug) {
      productsMap.set(product.slug, product);
    }
  }

  return cartItems.map((item) => {
    const product = productsMap.get(item.slug) || null;
    const isMissing = !product;

    const stockValue = parseStockValue(product?.stock);
    const isUnavailable = !product
      ? true
      : product.isAvailable === false || stockValue <= 0;

    return {
      slug: item.slug,
      quantity: item.quantity,
      product,
      isMissing,
      isUnavailable,
      safeImage: resolveProductImage(product?.image || ""),
    };
  });
}

export function getCartSummary(cartItems: StoredCartItem[]) {
  const resolvedItems = resolveCartItems(cartItems);

  const validItems = resolvedItems.filter(
    (item) => item.product && !item.isMissing && !item.isUnavailable
  );

  const subtotal = validItems.reduce((sum, item) => {
    return sum + parsePersianPrice(item.product?.price) * item.quantity;
  }, 0);

  const itemCount = validItems.reduce((sum, item) => {
    return sum + item.quantity;
  }, 0);

  const hasMissingItems = resolvedItems.some((item) => item.isMissing);
  const hasUnavailableItems = resolvedItems.some((item) => item.isUnavailable);

  return {
    resolvedItems,
    validItems,
    subtotal,
    itemCount,
    hasMissingItems,
    hasUnavailableItems,
  };
}

export function getRelatedAvailableProducts(limit = 4) {
  const products = readProductsFromApiCache();

  return products
    .filter((item) => {
      const stockValue = parseStockValue(item.stock);
      return item.isAvailable !== false && stockValue > 0;
    })
    .slice(0, limit);
}