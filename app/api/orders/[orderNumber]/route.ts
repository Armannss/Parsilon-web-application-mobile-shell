import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { fail, handleApiError, unauthorized } from "@/lib/api";
import { formatOrder } from "@/lib/orders";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookie();
    if (!currentUser) return unauthorized();

    const { orderNumber } = await context.params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    // Someone else's order answers exactly like a missing one, so order
    // numbers cannot be probed.
    if (
      !order ||
      (order.userId !== currentUser.id && currentUser.role !== "ADMIN")
    ) {
      return fail(404, "سفارش پیدا نشد");
    }

    return NextResponse.json({ success: true, order: formatOrder(order) });
  } catch (error) {
    return handleApiError(
      "GET /api/orders/[orderNumber]",
      error,
      "خطا در دریافت سفارش"
    );
  }
}
