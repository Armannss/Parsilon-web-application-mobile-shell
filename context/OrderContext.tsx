"use client";

import { useAuth } from "@/context/AuthContext";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";

type CheckoutForm = {
  fullName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  shippingMethod: "normal" | "express";
};

type OrderLineItem = {
  id: number;
  name: string;
  code: string;
  price: string;
  image: string;
  slug: string;
  quantity: number;
  brand?: string;
  category?: string;
  productId?: string | null;
};

export type OrderStatus =
  | "pending_review"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type OrderHistoryItem = {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  customer: CheckoutForm;
  items: OrderLineItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  vat: number;
  total: number;
};


type OrderContextType = {
  orderNumber: string | null;
  checkoutForm: CheckoutForm;
  orderHistory: OrderHistoryItem[];
  isLoadingOrders: boolean;
  updateCheckoutForm: (data: Partial<CheckoutForm>) => void;
  createOrder: () => string;
  clearOrder: () => void;
  getOrderByNumber: (orderNumber: string) => OrderHistoryItem | undefined;
  updateOrderStatus: (orderNumber: string, status: OrderStatus) => void;
  refreshOrders: () => Promise<void>;
};

const defaultCheckoutForm: CheckoutForm = {
  fullName: "",
  phone: "",
  province: "",
  city: "",
  address: "",
  postalCode: "",
  shippingMethod: "normal",
};

const CHECKOUT_STORAGE_KEY = "parsilon-checkout-form-v1";

const OrderContext = createContext<OrderContextType | undefined>(undefined);

function generateTemporaryOrderNumber() {
  const year = 1405;
  const now = new Date();
  const timePart =
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `PP-${year}-${timePart}${randomPart}`;
}

function normalizeStatus(status: string): OrderStatus {
  switch (status) {
    case "PENDING_REVIEW":
    case "pending_review":
      return "pending_review";
    case "PROCESSING":
    case "processing":
      return "processing";
    case "SHIPPED":
    case "shipped":
      return "shipped";
    case "DELIVERED":
    case "delivered":
      return "delivered";
    case "CANCELLED":
    case "cancelled":
      return "cancelled";
    default:
      return "pending_review";
  }
}

function readCheckoutFormFromStorage(): CheckoutForm {
  if (typeof window === "undefined") {
    return defaultCheckoutForm;
  }

  try {
    const raw = window.localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return defaultCheckoutForm;

    const parsed = JSON.parse(raw);

    return {
      fullName:
        typeof parsed?.fullName === "string" ? parsed.fullName : "",
      phone: typeof parsed?.phone === "string" ? parsed.phone : "",
      province: typeof parsed?.province === "string" ? parsed.province : "",
      city: typeof parsed?.city === "string" ? parsed.city : "",
      address: typeof parsed?.address === "string" ? parsed.address : "",
      postalCode:
        typeof parsed?.postalCode === "string" ? parsed.postalCode : "",
      shippingMethod:
        parsed?.shippingMethod === "express" ? "express" : "normal",
    };
  } catch {
    return defaultCheckoutForm;
  }
}

function mapApiOrderToOrderHistoryItem(order: any): OrderHistoryItem {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: normalizeStatus(order.status),
    customer: {
      fullName: order.customer?.fullName || "",
      phone: order.customer?.phone || "",
      province: order.customer?.province || "",
      city: order.customer?.city || "",
      address: order.customer?.address || "",
      postalCode: order.customer?.postalCode || "",
      shippingMethod:
        order.shippingMethod === "EXPRESS" ? "express" : "normal",
    },
    items: Array.isArray(order.items)
      ? order.items.map((item: any, index: number) => ({
          id: index + 1,
          name: item.name || "",
          code: item.code || "",
          price: `${Number(item.unitPrice || 0).toLocaleString("fa-IR")} ریال`,
          image: item.image || "",
          slug: item.slug || "",
          quantity: Number(item.quantity || 0),
          brand: item.brandName || "",
          category: item.categoryName || "",
          productId: null,
        }))
      : [],
    itemCount: Number(order.itemCount || 0),
    subtotal: Number(order.subtotal || 0),
    shipping: Number(order.shipping || 0),
    vat: Number(order.vat || 0),
    total: Number(order.total || 0),
  };
}

export function getOrderStatusMeta(status: OrderStatus) {
  switch (status) {
    case "pending_review":
      return {
        label: "در انتظار بررسی",
        badgeClass: "bg-amber-50 text-amber-700",
      };
    case "processing":
      return {
        label: "در حال پردازش",
        badgeClass: "bg-blue-50 text-blue-700",
      };
    case "shipped":
      return {
        label: "ارسال شده",
        badgeClass: "bg-violet-50 text-violet-700",
      };
    case "delivered":
      return {
        label: "تحویل شده",
        badgeClass: "bg-emerald-50 text-emerald-700",
      };
    case "cancelled":
      return {
        label: "لغو شده",
        badgeClass: "bg-red-50 text-red-700",
      };
    default:
      return {
        label: "در انتظار بررسی",
        badgeClass: "bg-amber-50 text-amber-700",
      };
  }
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(
    defaultCheckoutForm
  );
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setCheckoutForm(readCheckoutFormFromStorage());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;

    window.localStorage.setItem(
      CHECKOUT_STORAGE_KEY,
      JSON.stringify(checkoutForm)
    );
  }, [checkoutForm, isReady]);

  const refreshOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true);

      const response = await fetch("/api/orders", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !Array.isArray(data?.orders)) {
        setOrderHistory([]);
        return;
      }

      setOrderHistory(data.orders.map(mapApiOrderToOrderHistoryItem));
    } catch {
      setOrderHistory([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (isAuthenticated) {
      refreshOrders();
    } else {
      setOrderHistory([]);
    }
  }, [isReady, isAuthenticated, refreshOrders]);

  const value = useMemo<OrderContextType>(
    () => ({
      orderNumber,
      checkoutForm,
      orderHistory,
      isLoadingOrders,

      updateCheckoutForm: (data: Partial<CheckoutForm>) => {
        setCheckoutForm((prev) => ({ ...prev, ...data }));
      },

      createOrder: () => {
        const tempOrderNumber = generateTemporaryOrderNumber();
        setOrderNumber(tempOrderNumber);
        return tempOrderNumber;
      },

      clearOrder: () => {
        setOrderNumber(null);
        setCheckoutForm(defaultCheckoutForm);
      },

      getOrderByNumber: (targetOrderNumber: string) =>
        orderHistory.find((item) => item.orderNumber === targetOrderNumber),

      updateOrderStatus: (
        targetOrderNumber: string,
        nextStatus: OrderStatus
      ) => {
        setOrderHistory((prev) =>
          prev.map((item) =>
            item.orderNumber === targetOrderNumber
              ? { ...item, status: nextStatus }
              : item
          )
        );
      },

      refreshOrders,
    }),
    [orderNumber, checkoutForm, orderHistory, isLoadingOrders, refreshOrders]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error("useOrder must be used inside OrderProvider");
  }

  return context;
}