import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";

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
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productName: string;
    productCode: string;
    productSlug: string;
    productImage: string | null;
    brandName: string | null;
    categoryName: string | null;
    createdAt: Date;
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
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      name: item.productName,
      code: item.productCode,
      slug: item.productSlug,
      image: item.productImage || "",
      brandName: item.brandName || "",
      categoryName: item.categoryName || "",
      createdAt: item.createdAt,
    })),
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "ابتدا وارد حساب شوید" },
        { status: 401 }
      );
    }

    const { orderNumber } = await context.params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "سفارش پیدا نشد" },
        { status: 404 }
      );
    }

    if (order.userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order: formatOrder(order),
    });
  } catch (error) {
    console.error("GET /api/orders/[orderNumber] error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در دریافت سفارش" },
      { status: 500 }
    );
  }
}