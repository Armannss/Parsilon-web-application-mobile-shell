import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { ApiError, fail, forbidden, handleApiError } from "@/lib/api";
import { formatOrder } from "@/lib/orders";

const updateStatusSchema = z.object({
  orderNumber: z.string().min(1, "شماره سفارش الزامی است"),
  status: z.enum([
    "PENDING_REVIEW",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});

const orderInclude = {
  user: { select: { id: true, fullName: true, phone: true } },
  items: true,
} as const;

export async function GET() {
  try {
    if (!(await getCurrentAdmin())) return forbidden();

    const orders = await prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => formatOrder(order)),
    });
  } catch (error) {
    return handleApiError(
      "GET /api/admin/orders",
      error,
      "خطا در دریافت سفارش‌های ادمین"
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await getCurrentAdmin())) return forbidden();

    const parsed = updateStatusSchema.safeParse(
      await request.json().catch(() => null)
    );

    if (!parsed.success) {
      return fail(400, parsed.error.issues[0]?.message || "اطلاعات نامعتبر است");
    }

    const { orderNumber, status } = parsed.data;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      });

      if (!order) throw new ApiError(404, "سفارش پیدا نشد");

      if (order.status === status) {
        return tx.order.findUniqueOrThrow({
          where: { orderNumber },
          include: orderInclude,
        });
      }

      // A cancelled order already gave its stock back; reviving it would need
      // that stock again, so the customer has to place a new order instead.
      if (order.status === "CANCELLED") {
        throw new ApiError(409, "سفارش لغوشده قابل بازگردانی نیست");
      }

      // Guarding on the previous status makes the transition happen exactly
      // once, even if two admins press the button together.
      const { count } = await tx.order.updateMany({
        where: { orderNumber, status: order.status },
        data: { status },
      });

      if (count !== 1) {
        throw new ApiError(409, "وضعیت سفارش هم‌زمان تغییر کرده است");
      }

      if (status === "CANCELLED") {
        for (const item of order.items) {
          if (!item.productId) continue;

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.findUniqueOrThrow({
        where: { orderNumber },
        include: orderInclude,
      });
    });

    return NextResponse.json({
      success: true,
      message: "وضعیت سفارش به‌روزرسانی شد",
      order: formatOrder(updatedOrder),
    });
  } catch (error) {
    return handleApiError(
      "PATCH /api/admin/orders",
      error,
      "خطا در به‌روزرسانی سفارش"
    );
  }
}
