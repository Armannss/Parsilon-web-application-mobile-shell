import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";

const createOrderSchema = z.object({
  shippingMethod: z.enum(["NORMAL", "EXPRESS"]),
  itemCount: z.number().int().min(1),
  subtotal: z.number().int().min(0),
  shipping: z.number().int().min(0),
  vat: z.number().int().min(0),
  total: z.number().int().min(0),

  customer: z.object({
    fullName: z.string().min(1, "نام گیرنده الزامی است"),
    phone: z.string().min(1, "شماره تماس الزامی است"),
    province: z.string().min(1, "استان الزامی است"),
    city: z.string().min(1, "شهر الزامی است"),
    address: z.string().min(1, "آدرس الزامی است"),
    postalCode: z.string().min(1, "کد پستی الزامی است"),
  }),

  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        slug: z.string().min(1),
        name: z.string().min(1),
        code: z.string().min(1),
        image: z.string().optional().default(""),
        brand: z.string().optional().default(""),
        category: z.string().optional().default(""),
        quantity: z.number().int().min(1),
        unitPrice: z.number().int().min(0),
      })
    )
    .min(1, "حداقل یک آیتم لازم است"),
});

function generateOrderNumber() {
  const now = new Date();
  const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const timePart =
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `PP-${datePart}-${timePart}${randomPart}`;
}

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
  items?: Array<{
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
    items:
      order.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        name: item.productName,
        code: item.productCode,
        slug: item.productSlug,
        image: item.productImage || "",
        brand: item.brandName || "",
        category: item.categoryName || "",
      })) || [],
  };
}

async function resolveProductForOrderItem(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">,
  item: {
    productId?: string;
    slug: string;
    name: string;
    quantity: number;
  }
) {
  if (item.productId) {
    const productById = await tx.product.findUnique({
      where: { id: item.productId },
      select: {
        id: true,
        slug: true,
        stock: true,
        isAvailable: true,
      },
    });

    if (productById) {
      return productById;
    }
  }

  const productBySlug = await tx.product.findUnique({
    where: { slug: item.slug },
    select: {
      id: true,
      slug: true,
      stock: true,
      isAvailable: true,
    },
  });

  return productBySlug;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "ابتدا وارد حساب شوید" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: currentUser.id,
      },
      include: {
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
    console.error("GET /api/orders error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در دریافت سفارش‌ها" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "ابتدا وارد حساب شوید" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message || "اطلاعات سفارش نامعتبر است",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const orderNumber = generateOrderNumber();

    const createdOrder = await prisma.$transaction(async (tx) => {
      const resolvedProducts: Array<{
        id: string;
        slug: string;
        stock: number;
        isAvailable: boolean;
        requestItem: (typeof data.items)[number];
      }> = [];

      for (const item of data.items) {
        const product = await resolveProductForOrderItem(tx, item);

        if (!product || !product.isAvailable) {
          throw new Error(`محصول ${item.name} موجود نیست`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`موجودی محصول ${item.name} کافی نیست`);
        }

        resolvedProducts.push({
          ...product,
          requestItem: item,
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          status: "PENDING_REVIEW",
          shippingMethod: data.shippingMethod,
          itemCount: data.itemCount,
          subtotal: data.subtotal,
          shipping: data.shipping,
          vat: data.vat,
          total: data.total,
          customerName: data.customer.fullName,
          customerPhone: data.customer.phone,
          province: data.customer.province,
          city: data.customer.city,
          address: data.customer.address,
          postalCode: data.customer.postalCode,
          userId: currentUser.id,
          items: {
            create: resolvedProducts.map(({ id, slug, requestItem }) => ({
              productId: id,
              quantity: requestItem.quantity,
              unitPrice: requestItem.unitPrice,
              totalPrice: requestItem.unitPrice * requestItem.quantity,
              productName: requestItem.name,
              productCode: requestItem.code,
              productSlug: slug,
              productImage: requestItem.image || "",
              brandName: requestItem.brand || "",
              categoryName: requestItem.category || "",
            })),
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of resolvedProducts) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.requestItem.quantity,
            },
          },
        });
      }

      return order;
    });

    return NextResponse.json({
      success: true,
      message: "سفارش با موفقیت ثبت شد",
      order: formatOrder(createdOrder),
    });
  } catch (error) {
    console.error("POST /api/orders error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "خطا در ثبت سفارش",
      },
      { status: 500 }
    );
  }
}