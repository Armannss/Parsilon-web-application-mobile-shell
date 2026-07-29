import type { PublicProduct } from "./public-products";

type ProductsApiResponse = {
  success: boolean;
  products: PublicProduct[];
};

type ProductApiResponse = {
  success: boolean;
  product: PublicProduct;
};

export async function fetchProducts(params?: {
  search?: string;
  brand?: string;
  category?: string;
  sort?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.search) searchParams.set("search", params.search);
  if (params?.brand) searchParams.set("brand", params.brand);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.sort) searchParams.set("sort", params.sort);

  const query = searchParams.toString();
  const response = await fetch(`/api/products${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });

  const data: ProductsApiResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error("خطا در دریافت محصولات");
  }

  return data.products;
}

export async function fetchProductBySlug(slug: string) {
  const response = await fetch(`/api/products/${slug}`, {
    cache: "no-store",
  });

  const data: ProductApiResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error("خطا در دریافت محصول");
  }

  return data.product;
}