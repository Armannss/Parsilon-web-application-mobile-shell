import { randomInt } from "crypto";

type OrderItemRecord = {
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
};

type OrderRecord = {
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
  items?: OrderItemRecord[];
  user?: { id: string; fullName: string; phone: string } | null;
};

export function generateOrderNumber(now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");

  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  return `PP-${datePart}-${timePart}${randomInt(1000, 10000)}`;
}

export function formatOrder(order: OrderRecord) {
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
    ...(order.user !== undefined
      ? {
          user: order.user
            ? {
                id: order.user.id,
                fullName: order.user.fullName,
                phone: order.user.phone,
              }
            : null,
        }
      : {}),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: (order.items ?? []).map((item) => ({
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
      brandName: item.brandName || "",
      categoryName: item.categoryName || "",
    })),
  };
}
