import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatPrice(price: number) {
  return `${price.toLocaleString("fa-IR")} ریال`;
}

type ProductListItem = {
  id: number;
  dbId: string;
  name: string;
  slug: string;
  code: string;
  price: string;
  image: string;
  category: string;
  categoryName: string;
  brand: string;
  stock: number;
  isAvailable: boolean;
  shortDescription: string;
  description: string;
  compatibleCars: string[];
  warranty: string;
  shipping: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const brand = searchParams.get("brand")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const sort = searchParams.get("sort")?.trim() || "default";

    const products = await prisma.product.findMany({
      where: {
        ...(brand
          ? {
              brand: {
                is: {
                  name: brand,
                },
              },
            }
          : {}),
        ...(category
          ? {
              category: {
                is: {
                  slug: category,
                },
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
                { compatibleCars: { has: search } },
                {
                  brand: {
                    is: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                },
                {
                  category: {
                    is: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        brand: true,
        category: true,
      },
    });

    type ProductWithRelations = (typeof products)[number];

    const mapped: ProductListItem[] = products.map(
      (product: ProductWithRelations, index: number) => ({
        id: index + 1,
        dbId: product.id,
        name: product.name,
        slug: product.slug,
        code: product.code,
        price: formatPrice(product.price),
        image: product.image || "",
        category: product.category?.slug || "",
        categoryName: product.category?.name || "",
        brand: product.brand?.name || "",
        stock: product.stock,
        isAvailable: product.isAvailable && product.stock > 0,
        shortDescription: product.description || "",
        description: product.description || "",
        compatibleCars: product.compatibleCars || [],
        warranty: "",
        shipping: "",
      })
    );

    switch (sort) {
      case "price-asc":
        mapped.sort((a: ProductListItem, b: ProductListItem) => {
          const aPrice = Number(String(a.price).replace(/[^\d]/g, ""));
          const bPrice = Number(String(b.price).replace(/[^\d]/g, ""));
          return aPrice - bPrice;
        });
        break;

      case "price-desc":
        mapped.sort((a: ProductListItem, b: ProductListItem) => {
          const aPrice = Number(String(a.price).replace(/[^\d]/g, ""));
          const bPrice = Number(String(b.price).replace(/[^\d]/g, ""));
          return bPrice - aPrice;
        });
        break;

      case "code-asc":
        mapped.sort((a: ProductListItem, b: ProductListItem) =>
          a.code.localeCompare(b.code, "fa")
        );
        break;

      default:
        break;
    }

    return NextResponse.json({
      success: true,
      products: mapped,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت لیست محصولات",
      },
      { status: 500 }
    );
  }
}

