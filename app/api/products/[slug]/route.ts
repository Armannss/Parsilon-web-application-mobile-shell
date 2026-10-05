import { NextRequest, NextResponse } from "next/server";
import { fail, handleApiError } from "@/lib/api";
import { getProductBySlug } from "@/lib/products-server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug);

    if (!product) return fail(404, "محصول پیدا نشد");

    return NextResponse.json({ success: true, product });
  } catch (error) {
    return handleApiError(
      "GET /api/products/[slug]",
      error,
      "خطا در دریافت محصول"
    );
  }
}
