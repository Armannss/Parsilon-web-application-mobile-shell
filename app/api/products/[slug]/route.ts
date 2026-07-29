import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatPrice(price: number) {
  return `${price.toLocaleString("fa-IR")} ریال`;
}

function formatPublicProduct(product: {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  image: string | null;
  price: number;
  stock: number;
  isAvailable: boolean;
  compatibleCars: string[];
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
}) {
  return {
    id: 1,
    dbId: product.id,
    name: product.name,
    slug: product.slug,
    code: product.code,
    price: formatPrice(product.price),
    image: product.image || "",
    category: product.category?.slug || "",
    brand: product.brand?.name || "",
    stock: product.stock,
    isAvailable: product.isAvailable && product.stock > 0,
    shortDescription: product.description || "",
    description: product.description || "",
    compatibleCars: product.compatibleCars || [],
    warranty: "",
    shipping: "",
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const product = await prisma.product.findUnique({
      where: {
        slug,
      },
      include: {
        brand: {
          select: {
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "محصول پیدا نشد",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: formatPublicProduct(product),
    });
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت محصول",
      },
      { status: 500 }
    );
  }
}