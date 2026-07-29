import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";

const wholesaleSchema = z.object({
  fullName: z.string().min(2, "نام و نام خانوادگی الزامی است"),
  phone: z.string().min(5, "شماره تماس الزامی است"),
  companyName: z.string().optional().default(""),
  description: z.string().optional().default(""),
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

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie().catch(() => null);
    const body = await request.json();

    const parsed = wholesaleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message || "اطلاعات درخواست نامعتبر است",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const createdRequest = await prisma.wholesaleRequest.create({
      data: {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        companyName: data.companyName?.trim() || "",
        description: data.description?.trim() || "",
        userId: currentUser?.id || null,
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
      message: "درخواست خرید عمده با موفقیت ثبت شد",
      request: formatWholesaleRequest(createdRequest),
    });
  } catch (error) {
    console.error("POST /api/wholesale error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ثبت درخواست خرید عمده",
      },
      { status: 500 }
    );
  }
}