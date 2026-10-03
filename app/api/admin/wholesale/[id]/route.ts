import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

const updateWholesaleStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]),
});

function formatWholesaleRequest(request: {
  id: string;
  fullName: string;
  phone: string;
  companyName: string | null;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; fullName: string; phone: string } | null;
}) {
  return {
    id: request.id,
    fullName: request.fullName,
    phone: request.phone,
    companyName: request.companyName || "",
    description: request.description || "",
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    user: request.user
      ? {
          id: request.user.id,
          fullName: request.user.fullName,
          phone: request.user.phone,
        }
      : null,
  };
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
    const parsed = updateWholesaleStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message || "وضعیت درخواست نامعتبر است",
        },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.wholesaleRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, message: "درخواست پیدا نشد" },
        { status: 404 }
      );
    }

    const updatedRequest = await prisma.wholesaleRequest.update({
      where: { id },
      data: {
        status: parsed.data.status,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "وضعیت درخواست عمده به‌روزرسانی شد",
      request: formatWholesaleRequest(updatedRequest),
    });
  } catch (error) {
    console.error("PATCH /api/admin/wholesale/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در به‌روزرسانی درخواست عمده" },
      { status: 500 }
    );
  }
}