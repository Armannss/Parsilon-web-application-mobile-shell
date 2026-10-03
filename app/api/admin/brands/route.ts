import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

const brandSchema = z.object({
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

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const brands = await prisma.brand.findMany({
      orderBy: [
        { isActive: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      brands: brands.map(formatBrand),
    });
  } catch (error) {
    console.error("GET /api/admin/brands error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در دریافت برندها" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const parsed = brandSchema.safeParse({
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

    const existingBySlug = await prisma.brand.findUnique({
      where: { slug: data.slug.trim() },
    });

    if (existingBySlug) {
      return NextResponse.json(
        { success: false, message: "این اسلاگ قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    const existingByName = await prisma.brand.findFirst({
      where: { name: data.name.trim() },
    });

    if (existingByName) {
      return NextResponse.json(
        { success: false, message: "این برند قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    const createdBrand = await prisma.brand.create({
      data: {
        name: data.name.trim(),
        slug: data.slug.trim(),
        logo: data.logo?.trim() || "",
        isActive: data.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "برند با موفقیت ایجاد شد",
      brand: formatBrand(createdBrand),
    });
  } catch (error) {
    console.error("POST /api/admin/brands error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در ایجاد برند" },
      { status: 500 }
    );
  }
}