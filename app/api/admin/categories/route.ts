import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

const categorySchema = z.object({
  name: z.string().min(2, "نام دسته‌بندی الزامی است"),
  slug: z.string().min(2, "اسلاگ دسته‌بندی الزامی است"),
  isActive: z.boolean().optional().default(true),
});

function formatCategory(category: {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
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

    const categories = await prisma.category.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      categories: categories.map(formatCategory),
    });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در دریافت دسته‌بندی‌ها" },
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

    const parsed = categorySchema.safeParse({
      ...body,
      isActive:
        typeof body?.isActive === "boolean" ? body.isActive : true,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message || "اطلاعات دسته‌بندی نامعتبر است",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existingBySlug = await prisma.category.findUnique({
      where: { slug: data.slug.trim() },
    });

    if (existingBySlug) {
      return NextResponse.json(
        { success: false, message: "این اسلاگ قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    const existingByName = await prisma.category.findFirst({
      where: { name: data.name.trim() },
    });

    if (existingByName) {
      return NextResponse.json(
        { success: false, message: "این دسته‌بندی قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    const createdCategory = await prisma.category.create({
      data: {
        name: data.name.trim(),
        slug: data.slug.trim(),
        isActive: data.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "دسته‌بندی با موفقیت ایجاد شد",
      category: formatCategory(createdCategory),
    });
  } catch (error) {
    console.error("POST /api/admin/categories error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در ایجاد دسته‌بندی" },
      { status: 500 }
    );
  }
}