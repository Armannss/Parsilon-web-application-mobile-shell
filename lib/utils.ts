export type CartItem = {
  slug: string;
  quantity: number;
};

const CART_KEY = "parsilon-cart-v2";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function getInitials(label: string) {
  return label
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(CART_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        item &&
        typeof item.slug === "string" &&
        typeof item.quantity === "number"
    );
  } catch {
    return [];
  }
}

function writeCart(cart: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCartItems() {
  return readCart();
}

export function getCartCount() {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function addToCart(product: { slug: string }, quantity = 1) {
  const cart = readCart();
  const existing = cart.find((item) => item.slug === product.slug);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ slug: product.slug, quantity });
  }

  writeCart(cart);
}

export function setCartQuantity(slug: string, quantity: number) {
  const safeQty = Math.max(0, quantity);

  const nextCart = readCart()
    .map((item) => (item.slug === slug ? { ...item, quantity: safeQty } : item))
    .filter((item) => item.quantity > 0);

  writeCart(nextCart);
}

export function removeFromCart(slug: string) {
  writeCart(readCart().filter((item) => item.slug !== slug));
}

export function clearCart() {
  writeCart([]);
}