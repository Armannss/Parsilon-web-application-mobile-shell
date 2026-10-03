import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatRial } from "@/lib/format";

export const productInclude = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

export type ProductSort = "default" | "price-asc" | "price-desc" | "code-asc";

export type ProductQuery = {
  search?: string;
  brand?: string;
  category?: string;
  sort?: ProductSort;
  slugs?: string[];
  /** Hide products that cannot be ordered right now. */
  availableOnly?: boolean;
  /** Only products worth showcasing: orderable and with a real photo. */
  showcase?: boolean;
  page?: number;
  limit?: number;
};

export const MAX_PAGE_SIZE = 100;

export function formatPublicProduct(product: ProductWithRelations, index = 0) {
  return {
    id: index + 1,
    dbId: product.id,
    name: product.name,
    slug: product.slug,
    code: product.code,
    // `price` stays a display string for existing screens; use `priceValue`
    // for any arithmetic.
    price: product.price > 0 ? formatRial(product.price) : "تماس بگیرید",
    priceValue: product.price,
    image: product.image || "",
    category: product.category?.slug || "",
    categoryName: product.category?.name || "",
    brand: product.brand?.name || "",
    brandSlug: product.brand?.slug || "",
    stock: product.stock,
    isAvailable: product.isAvailable && product.stock > 0,
    shortDescription: product.description || "",
    description: product.description || "",
    compatibleCars: product.compatibleCars || [],
    warranty: "",
    shipping: "",
  };
}

export type PublicProductPayload = ReturnType<typeof formatPublicProduct>;

function buildWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const { search, brand, category, slugs, showcase, availableOnly } = query;

  return {
    ...(availableOnly ? { isAvailable: true, stock: { gt: 0 } } : {}),
    ...(showcase
      ? {
          isAvailable: true,
          stock: { gt: 0 },
          price: { gt: 0 },
          image: { startsWith: "/images/" },
        }
      : {}),
    ...(slugs ? { slug: { in: slugs } } : {}),
    // Brand filter accepts either the display name or the slug.
    ...(brand ? { brand: { is: { OR: [{ name: brand }, { slug: brand }] } } } : {}),
    ...(category ? { category: { is: { slug: category } } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { compatibleCars: { has: search } },
            { brand: { is: { name: { contains: search, mode: "insensitive" } } } },
            {
              category: {
                is: { name: { contains: search, mode: "insensitive" } },
              },
            },
          ],
        }
      : {}),
  };
}

const ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  // Available items first, then newest.
  default: [{ isAvailable: "desc" }, { createdAt: "desc" }, { id: "asc" }],
  "price-asc": [{ price: "asc" }, { id: "asc" }],
  "price-desc": [{ price: "desc" }, { id: "asc" }],
  "code-asc": [{ code: "asc" }],
};

export async function listProducts(query: ProductQuery = {}) {
  const where = buildWhere(query);
  const limit = query.limit
    ? Math.min(Math.max(1, query.limit), MAX_PAGE_SIZE)
    : undefined;
  const page = Math.max(1, query.page ?? 1);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: ORDER_BY[query.sort ?? "default"],
      ...(limit ? { take: limit, skip: (page - 1) * limit } : {}),
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((product, index) =>
      formatPublicProduct(product, (limit ? (page - 1) * limit : 0) + index)
    ),
    total,
    page,
    pageSize: limit ?? total,
    totalPages: limit ? Math.max(1, Math.ceil(total / limit)) : 1,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });

  return product ? formatPublicProduct(product) : null;
}
