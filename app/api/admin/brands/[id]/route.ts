import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

const updateBrandSchema = z.object({
  name: z.string().min(2, "نام برند الزامی است"),
  slug: z.string().min(2, "اسلاگ برند الزامی است"),
  logo: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

function formatBrand(brand: {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo || "",
    isActive: brand.isActive,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
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

    const brand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, message: "برند پیدا نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      brand: formatBrand(brand),
    });
  } catch (error) {
    console.error("GET /api/admin/brands/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در دریافت برند" },
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

    const parsed = updateBrandSchema.safeParse({
      ...body,
      isActive:
        typeof body?.isActive === "boolean" ? body.isActive : true,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "اطلاعات برند نامعتبر است",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existingBrand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!existingBrand) {
      return NextResponse.json(
        { success: false, message: "برند پیدا نشد" },
        { status: 404 }
      );
    }

    const existingBySlug = await prisma.brand.findFirst({
      where: {
        slug: data.slug.trim(),
        NOT: { id },
      },
    });

    if (existingBySlug) {
      return NextResponse.json(
        { success: false, message: "این اسلاگ قبلاً برای برند دیگری ثبت شده است" },
        { status: 409 }
      );
    }

    const existingByName = await prisma.brand.findFirst({
      where: {
        name: data.name.trim(),
        NOT: { id },
      },
    });

    if (existingByName) {
      return NextResponse.json(
        { success: false, message: "این نام قبلاً برای برند دیگری ثبت شده است" },
        { status: 409 }
      );
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: {
        name: data.name.trim(),
        slug: data.slug.trim(),
        logo: data.logo?.trim() || "",
        isActive: data.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "برند با موفقیت ویرایش شد",
      brand: formatBrand(updatedBrand),
    });
  } catch (error) {
    console.error("PATCH /api/admin/brands/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در ویرایش برند" },
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

    const existingBrand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existingBrand) {
      return NextResponse.json(
        { success: false, message: "برند پیدا نشد" },
        { status: 404 }
      );
    }

    if (existingBrand.products.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "این برند به محصول متصل است و فعلاً قابل حذف نیست",
        },
        { status: 409 }
      );
    }

    await prisma.brand.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "برند با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("DELETE /api/admin/brands/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در حذف برند" },
      { status: 500 }
    );
  }
}