import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { tooManyRequests } from "@/lib/api";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const wholesaleSchema = z.object({
  fullName: z.string().trim().min(2, "نام و نام خانوادگی الزامی است").max(80),
  phone: z.string().trim().min(5, "شماره تماس الزامی است").max(20),
  companyName: z.string().max(120).optional().default(""),
  description: z.string().max(2000, "توضیحات بیش از حد طولانی است").optional().default(""),
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
    // Public form: cap submissions per address so it cannot be flooded.
    const limit = rateLimit(
      `wholesale:ip:${getClientIp(request)}`,
      5,
      60 * 60 * 1000
    );
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const currentUser = await getCurrentUserFromCookie().catch(() => null);
    const body = await request.json().catch(() => null);

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