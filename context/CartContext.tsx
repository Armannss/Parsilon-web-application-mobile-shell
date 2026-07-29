"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  useEffect,
} from "react";

export type Product = {
  id?: number;
  dbId?: string;
  name: string;
  code: string;
  price?: string;
  stock?: number | string;
  image: string;
  slug: string;
  brand?: string;
  category?: string;
};

export type CartItem = Product & {
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (slug: string) => void;
  increaseQuantity: (slug: string) => void;
  decreaseQuantity: (slug: string) => void;
  clearCart: () => void;
  cartCount: number;
  toastMessage: string;
  isToastVisible: boolean;
  hideToast: () => void;
  refreshCart: () => void;
  isCartReady: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "parsilon-cart-v2";

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== "object") return false;

  const cartItem = item as Record<string, unknown>;

  return (
    typeof cartItem.slug === "string" &&
    typeof cartItem.name === "string" &&
    typeof cartItem.code === "string" &&
    typeof cartItem.image === "string" &&
    typeof cartItem.quantity === "number"
  );
}

function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidCartItem);
  } catch (error) {
    console.error("cart read error", error);
    return [];
  }
}

function saveCartToStorage(cartItems: CartItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch (error) {
    console.error("cart save error", error);
  }
}

function notifyCartUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("cart-updated"));
}

function parsePersianPrice(price?: string) {
  if (!price) return 0;
  if (price.includes("تماس")) return 0;

  const englishDigits = price
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[^\d]/g, "");

  return Number(englishDigits || 0);
}

function normalizeStockForStorage(stock?: number | string) {
  if (typeof stock === "number") return stock;
  if (typeof stock === "string") return stock;
  return "";
}

function normalizeProductForCart(product: Product): CartItem {
  return {
    id: typeof product.id === "number" ? product.id : undefined,
    dbId: product.dbId,
    name: String(product.name || "").trim(),
    code: String(product.code || "").trim(),
    price: product.price ?? "",
    stock: normalizeStockForStorage(product.stock),
    image: String(product.image || "").trim(),
    slug: String(product.slug || "").trim(),
    brand: product.brand ?? "",
    category: product.category ?? "",
    quantity: 1,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isCartReady, setIsCartReady] = useState(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    const initialCart = readCartFromStorage();
    setCartItems(initialCart);
    setIsCartReady(true);
    hasMountedRef.current = true;
    hasHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    if (!isCartReady) return;
    if (!hasHydratedRef.current) return;

    saveCartToStorage(cartItems);
    notifyCartUpdated();
  }, [cartItems, isCartReady]);

  useEffect(() => {
    const handleCartUpdated = () => {
      const nextCart = readCartFromStorage();

      setCartItems((prev) => {
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(nextCart);

        if (prevSerialized === nextSerialized) {
          return prev;
        }

        return nextCart;
      });
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setIsToastVisible(false);
    }, 2200);
  };

  const hideToast = () => {
    setIsToastVisible(false);
  };

  const refreshCart = () => {
    setCartItems(readCartFromStorage());
  };

  const addToCart = (product: Product) => {
    if (!product.slug) return;
    if (!product.price || product.price.includes("تماس")) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.slug === product.slug);

      if (existing) {
        return prev.map((item) =>
          item.slug === product.slug
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, normalizeProductForCart(product)];
    });

    showToast(`"${product.name}" به سبد خرید اضافه شد`);
  };

  const removeFromCart = (slug: string) => {
    setCartItems((prev) => prev.filter((item) => item.slug !== slug));
  };

  const increaseQuantity = (slug: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.slug === slug ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (slug: string) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.slug === slug
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        cartCount,
        toastMessage,
        isToastVisible,
        hideToast,
        refreshCart,
        isCartReady,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}

export function getItemTotal(price: string | undefined, quantity: number) {
  return parsePersianPrice(price) * quantity;
}