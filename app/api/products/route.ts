import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { listProducts, type ProductSort } from "@/lib/products-server";

const SORTS: ProductSort[] = ["default", "price-asc", "price-desc", "code-asc"];

function readPositiveInt(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const sortParam = searchParams.get("sort")?.trim() as ProductSort;
    // An explicit but empty `slugs` means "none of them", not "everything".
    const slugsParam = searchParams.get("slugs");

    const result = await listProducts({
      search: searchParams.get("search")?.trim().slice(0, 100) || undefined,
      brand: searchParams.get("brand")?.trim() || undefined,
      category: searchParams.get("category")?.trim() || undefined,
      sort: SORTS.includes(sortParam) ? sortParam : "default",
      slugs:
        slugsParam === null
          ? undefined
          : slugsParam
              .split(",")
              .map((slug) => slug.trim())
              .filter(Boolean)
              .slice(0, 100),
      page: readPositiveInt(searchParams.get("page")),
      // Without `limit` the full list is returned, as older screens expect.
      limit: readPositiveInt(searchParams.get("limit")),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(
      "GET /api/products",
      error,
      "خطا در دریافت لیست محصولات"
    );
  }
}
