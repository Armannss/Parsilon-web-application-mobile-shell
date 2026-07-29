import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";

const updateCategorySchema = z.object({
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

async function ensureAdmin() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return null;
  }

  return currentUser;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await ensureAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "دسته‌بندی پیدا نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category: formatCategory(category),
    });
  } catch (error) {
    console.error("GET /api/admin/categories/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در دریافت دسته‌بندی" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await ensureAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateCategorySchema.safeParse({
      ...body,
      isActive: typeof body?.isActive === "boolean" ? body.isActive : true,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message ||
            "اطلاعات دسته‌بندی نامعتبر است",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "دسته‌بندی پیدا نشد" },
        { status: 404 }
      );
    }

    const existingBySlug = await prisma.category.findFirst({
      where: {
        slug: data.slug.trim(),
        NOT: { id },
      },
    });

    if (existingBySlug) {
      return NextResponse.json(
        {
          success: false,
          message: "این اسلاگ قبلاً برای دسته‌بندی دیگری ثبت شده است",
        },
        { status: 409 }
      );
    }

    const existingByName = await prisma.category.findFirst({
      where: {
        name: data.name.trim(),
        NOT: { id },
      },
    });

    if (existingByName) {
      return NextResponse.json(
        {
          success: false,
          message: "این نام قبلاً برای دسته‌بندی دیگری ثبت شده است",
        },
        { status: 409 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: data.name.trim(),
        slug: data.slug.trim(),
        isActive: data.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "دسته‌بندی با موفقیت ویرایش شد",
      category: formatCategory(updatedCategory),
    });
  } catch (error) {
    console.error("PATCH /api/admin/categories/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در ویرایش دسته‌بندی" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await ensureAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "دسته‌بندی پیدا نشد" },
        { status: 404 }
      );
    }

    if (existingCategory.products.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "این دسته‌بندی به محصول متصل است و فعلاً قابل حذف نیست",
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "دسته‌بندی با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در حذف دسته‌بندی" },
      { status: 500 }
    );
  }
}