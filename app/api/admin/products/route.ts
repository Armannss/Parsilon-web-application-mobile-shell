import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

const productSchema = z.object({
  name: z.string().min(2, "نام محصول الزامی است"),
  slug: z.string().min(2, "اسلاگ محصول الزامی است"),
  code: z.string().min(2, "کد محصول الزامی است"),
  description: z.string().optional().default(""),
  image: z.string().optional().default(""),
  price: z.number().int("قیمت باید عدد صحیح باشد").min(0, "قیمت نامعتبر است").max(2_000_000_000, "قیمت نامعتبر است"),
  stock: z.number().int("موجودی باید عدد صحیح باشد").min(0, "موجودی نامعتبر است").max(1_000_000, "موجودی نامعتبر است"),
  isAvailable: z.boolean().default(true),
  compatibleCars: z.array(z.string()).optional().default([]),
  brandSlug: z.string().optional().default(""),
  categorySlug: z.string().optional().default(""),
});

function formatAdminProduct(product: {
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
  createdAt: Date;
  updatedAt: Date;
  brand: { id: string; name: string; slug: string; logo: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
}) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    code: product.code,
    description: product.description || "",
    shortDescription: product.description || "",
    image: product.image || "",
    price: product.price,
    stock: product.stock,
    isAvailable: product.isAvailable,
    compatibleCars: product.compatibleCars || [],
    brand: product.brand?.name || "",
    brandSlug: product.brand?.slug || "",
    category: product.category?.slug || "",
    categoryName: product.category?.name || "",
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "دسترسی غیرمجاز",
        },
        { status: 403 }
      );
    }

    const products = await prisma.product.findMany({
      include: {
        brand: true,
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      products: products.map(formatAdminProduct),
    });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت محصولات ادمین",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "دسترسی غیرمجاز",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const parsed = productSchema.safeParse({
      ...body,
      price: Number(body?.price),
      stock: Number(body?.stock),
      isAvailable: Boolean(body?.isAvailable),
      compatibleCars: Array.isArray(body?.compatibleCars)
        ? body.compatibleCars
        : typeof body?.compatibleCars === "string"
          ? body.compatibleCars
              .split(",")
              .map((item: string) => item.trim())
              .filter(Boolean)
          : [],
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "اطلاعات محصول نامعتبر است",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existingBySlug = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingBySlug) {
      return NextResponse.json(
        {
          success: false,
          message: "این اسلاگ قبلاً ثبت شده است",
        },
        { status: 409 }
      );
    }

    const existingByCode = await prisma.product.findUnique({
      where: { code: data.code },
    });

    if (existingByCode) {
      return NextResponse.json(
        {
          success: false,
          message: "این کد محصول قبلاً ثبت شده است",
        },
        { status: 409 }
      );
    }

    const brand =
      data.brandSlug && data.brandSlug.trim()
        ? await prisma.brand.findUnique({
            where: { slug: data.brandSlug.trim() },
          })
        : null;

    const category =
      data.categorySlug && data.categorySlug.trim()
        ? await prisma.category.findUnique({
            where: { slug: data.categorySlug.trim() },
          })
        : null;

    const createdProduct = await prisma.product.create({
      data: {
        name: data.name.trim(),
        slug: data.slug.trim(),
        code: data.code.trim(),
        description: data.description?.trim() || "",
        image: data.image?.trim() || "",
        price: data.price,
        stock: data.stock,
        isAvailable: data.isAvailable,
        compatibleCars: data.compatibleCars,
        brandId: brand?.id || null,
        categoryId: category?.id || null,
      },
      include: {
        brand: true,
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "محصول با موفقیت ایجاد شد",
      product: formatAdminProduct(createdProduct),
    });
  } catch (error) {
    console.error("POST /api/admin/products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ایجاد محصول",
      },
      { status: 500 }
    );
  }
}