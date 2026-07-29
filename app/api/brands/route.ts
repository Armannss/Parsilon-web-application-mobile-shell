import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      brands,
    });
  } catch (error) {
    console.error("GET /api/brands error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در دریافت برندها",
      },
      { status: 500 }
    );
  }
}