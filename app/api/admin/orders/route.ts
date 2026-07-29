import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";

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

function formatOrder(order: {
  id: string;
  orderNumber: string;
  status: string;
  shippingMethod: string;
  itemCount: number;
  subtotal: number;
  shipping: number;
  vat: number;
  total: number;
  customerName: string;
  customerPhone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; fullName: string; phone: string } | null;
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productName: string;
    productCode: string;
  }>;
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    shippingMethod: order.shippingMethod,
    itemCount: order.itemCount,
    subtotal: order.subtotal,
    shipping: order.shipping,
    vat: order.vat,
    total: order.total,
    customer: {
      fullName: order.customerName,
      phone: order.customerPhone,
      province: order.province,
      city: order.city,
      address: order.address,
      postalCode: order.postalCode,
    },
    user: order.user
      ? {
          id: order.user.id,
          fullName: order.user.fullName,
          phone: order.user.phone,
        }
      : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items:
      order.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        name: item.productName,
        code: item.productCode,
      })) || [],
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

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map(formatOrder),
    });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در دریافت سفارش‌های ادمین" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await ensureAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است",
        },
        { status: 400 }
      );
    }

    const { orderNumber, status } = parsed.data;

    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: "سفارش پیدا نشد" },
        { status: 404 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { orderNumber },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "وضعیت سفارش به‌روزرسانی شد",
      order: formatOrder(updatedOrder),
    });
  } catch (error) {
    console.error("PATCH /api/admin/orders error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در به‌روزرسانی سفارش" },
      { status: 500 }
    );
  }
}