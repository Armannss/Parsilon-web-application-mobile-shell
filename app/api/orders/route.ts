import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";
import {
  ApiError,
  fail,
  handleApiError,
  tooManyRequests,
  unauthorized,
} from "@/lib/api";
import { formatOrder, generateOrderNumber } from "@/lib/orders";
import { normalizeIranMobile } from "@/lib/phone";
import { toEnglishDigits } from "@/lib/format";
import { computeOrderTotals, MAX_QUANTITY_PER_ITEM } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";

// Only identity and quantity are accepted from the client. Names, prices and
// totals are always read from the database; any such fields in the request
// body are ignored.
const createOrderSchema = z.object({
  shippingMethod: z.enum(["NORMAL", "EXPRESS"]),
  customer: z.object({
    fullName: z.string().trim().min(3, "نام گیرنده الزامی است").max(80),
    phone: z.string().trim().min(1, "شماره تماس الزامی است").max(20),
    province: z.string().trim().min(2, "استان الزامی است").max(60),
    city: z.string().trim().min(2, "شهر الزامی است").max(60),
    address: z.string().trim().min(10, "آدرس را کامل وارد کنید").max(500),
    postalCode: z.string().trim().min(1, "کد پستی الزامی است").max(20),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).nullish(),
        slug: z.string().min(1).max(200),
        quantity: z
          .number()
          .int()
          .min(1)
          .max(MAX_QUANTITY_PER_ITEM, "تعداد انتخاب‌شده بیش از حد مجاز است"),
      })
    )
    .min(1, "حداقل یک آیتم لازم است")
    .max(100, "تعداد اقلام سفارش بیش از حد مجاز است"),
});

const ORDER_NUMBER_ATTEMPTS = 3;

export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookie();
    if (!currentUser) return unauthorized();

    const orders = await prisma.order.findMany({
      where: { userId: currentUser.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => formatOrder(order)),
    });
  } catch (error) {
    return handleApiError("GET /api/orders", error, "خطا در دریافت سفارش‌ها");
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();
    if (!currentUser) return unauthorized();

    const limit = rateLimit(`order:${currentUser.id}`, 10, 10 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = createOrderSchema.safeParse(
      await request.json().catch(() => null)
    );

    if (!parsed.success) {
      return fail(
        400,
        parsed.error.issues[0]?.message || "اطلاعات سفارش نامعتبر است"
      );
    }

    const { shippingMethod, customer } = parsed.data;

    const customerPhone = normalizeIranMobile(customer.phone);
    if (!customerPhone) return fail(400, "شماره تماس گیرنده معتبر نیست");

    const postalCode = toEnglishDigits(customer.postalCode).replace(/\D/g, "");
    if (postalCode.length !== 10) return fail(400, "کد پستی باید ۱۰ رقم باشد");

    // The same product sent twice counts as one line.
    const quantityBySlug = new Map<string, number>();
    for (const item of parsed.data.items) {
      quantityBySlug.set(
        item.slug,
        (quantityBySlug.get(item.slug) ?? 0) + item.quantity
      );
    }

    for (const quantity of quantityBySlug.values()) {
      if (quantity > MAX_QUANTITY_PER_ITEM) {
        return fail(400, "تعداد انتخاب‌شده بیش از حد مجاز است");
      }
    }

    const createOrder = (orderNumber: string) =>
      prisma.$transaction(async (tx) => {
        const products = await tx.product.findMany({
          where: { slug: { in: [...quantityBySlug.keys()] } },
          include: {
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        });

        const productBySlug = new Map(products.map((p) => [p.slug, p]));

        const lines = [...quantityBySlug].map(([slug, quantity]) => {
          const product = productBySlug.get(slug);

          if (!product || !product.isAvailable || product.price <= 0) {
            throw new ApiError(
              409,
              `محصول «${product?.name ?? slug}» در حال حاضر قابل سفارش نیست`
            );
          }

          return { product, quantity, unitPrice: product.price };
        });

        // Decrement only if enough stock is still there. Checking and
        // decrementing in one statement is what prevents overselling when two
        // orders race for the last items.
        for (const line of lines) {
          const { count } = await tx.product.updateMany({
            where: { id: line.product.id, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });

          if (count !== 1) {
            throw new ApiError(
              409,
              `موجودی محصول «${line.product.name}» کافی نیست`
            );
          }
        }

        const totals = computeOrderTotals(lines, shippingMethod);

        return tx.order.create({
          data: {
            orderNumber,
            status: "PENDING_REVIEW",
            shippingMethod,
            ...totals,
            customerName: customer.fullName,
            customerPhone,
            province: customer.province,
            city: customer.city,
            address: customer.address,
            postalCode,
            userId: currentUser.id,
            items: {
              create: lines.map(({ product, quantity, unitPrice }) => ({
                productId: product.id,
                quantity,
                unitPrice,
                totalPrice: unitPrice * quantity,
                productName: product.name,
                productCode: product.code,
                productSlug: product.slug,
                productImage: product.image || "",
                brandName: product.brand?.name || "",
                categoryName: product.category?.name || "",
              })),
            },
          },
          include: { items: true },
        });
      });

    for (let attempt = 1; ; attempt += 1) {
      try {
        const order = await createOrder(generateOrderNumber());

        return NextResponse.json({
          success: true,
          message: "سفارش با موفقیت ثبت شد",
          order: formatOrder(order),
        });
      } catch (error) {
        const isOrderNumberCollision =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002";

        if (!isOrderNumberCollision || attempt >= ORDER_NUMBER_ATTEMPTS) {
          throw error;
        }
      }
    }
  } catch (error) {
    return handleApiError("POST /api/orders", error, "خطا در ثبت سفارش");
  }
}
