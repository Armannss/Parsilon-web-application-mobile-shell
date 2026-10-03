export type PublicProduct = {
  id: number;
  dbId?: string;
  name: string;
  slug: string;
  code: string;
  price: string;
  /** Price in rials as a number; use this for arithmetic. */
  priceValue?: number;
  image: string;
  category?: string;
  categoryName?: string;
  brand?: string;
  brandSlug?: string;
  stock: number;
  isAvailable: boolean;
  shortDescription?: string;
  description?: string;
  compatibleCars?: string[];
  warranty?: string;
  shipping?: string;
};

type ProductsApiResponse = {
  success: boolean;
  products: PublicProduct[];
};

type ProductApiResponse = {
  success: boolean;
  product: PublicProduct;
};

export async function fetchPublicProducts(params?: {
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
    method: "GET",
    cache: "no-store",
  });

  const data: ProductsApiResponse = await response.json();

  if (!response.ok || !data?.success || !Array.isArray(data?.products)) {
    throw new Error("خطا در دریافت محصولات");
  }

  return data.products;
}

export async function fetchPublicProductBySlug(slug: string) {
  const response = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
    method: "GET",
    cache: "no-store",
  });

  const data: ProductApiResponse = await response.json();

  if (!response.ok || !data?.success || !data?.product) {
    throw new Error("خطا در دریافت محصول");
  }

  return data.product;
}

export async function getPublicProductBySlug(slug: string) {
  const products = await fetchPublicProducts();
  return products.find((item) => item.slug === slug);
}

export async function getPublicProductsByCategory(category?: string) {
  if (!category) {
    return fetchPublicProducts();
  }

  return fetchPublicProducts({ category });
}