import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

const updateProductSchema = z.object({
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "محصول پیدا نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: formatAdminProduct(product),
    });
  } catch (error) {
    console.error("GET /api/admin/products/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در دریافت محصول" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateProductSchema.safeParse({
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

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "محصول پیدا نشد" },
        { status: 404 }
      );
    }

    const existingBySlug = await prisma.product.findFirst({
      where: {
        slug: data.slug.trim(),
        NOT: { id },
      },
    });

    if (existingBySlug) {
      return NextResponse.json(
        { success: false, message: "این اسلاگ قبلاً برای محصول دیگری ثبت شده است" },
        { status: 409 }
      );
    }

    const existingByCode = await prisma.product.findFirst({
      where: {
        code: data.code.trim(),
        NOT: { id },
      },
    });

    if (existingByCode) {
      return NextResponse.json(
        { success: false, message: "این کد قبلاً برای محصول دیگری ثبت شده است" },
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

    const updatedProduct = await prisma.product.update({
      where: { id },
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
      message: "محصول با موفقیت ویرایش شد",
      product: formatAdminProduct(updatedProduct),
    });
  } catch (error) {
    console.error("PATCH /api/admin/products/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در ویرایش محصول" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "محصول پیدا نشد" },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "محصول با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در حذف محصول" },
      { status: 500 }
    );
  }
}