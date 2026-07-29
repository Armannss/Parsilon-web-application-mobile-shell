import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";

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

async function ensureAdmin() {
  const currentUser = await getCurrentUserFromCookie();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return null;
  }
  return currentUser;
}

export async function GET() {
  try {
    const admin = await ensureAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const requests = await prisma.wholesaleRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      requests: requests.map(formatWholesaleRequest),
    });
  } catch (error) {
    console.error("GET /api/admin/wholesale error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در دریافت درخواست‌های عمده" },
      { status: 500 }
    );
  }
}