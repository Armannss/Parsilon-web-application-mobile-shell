"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/pricing";

type AddToCartBarProps = {
  product: {
    id: number;
    dbId: string;
    name: string;
    code: string;
    price: string;
    stock: number;
    image: string;
    slug: string;
    brand: string;
    category: string;
    isAvailable: boolean;
    priceValue: number;
  };
  salesPhone: string;
};

export default function AddToCartBar({ product, salesPhone }: AddToCartBarProps) {
  const { cartItems, addToCart, increaseQuantity, decreaseQuantity, isCartReady } =
    useCart();

  const quantityInCart =
    cartItems.find((item) => item.slug === product.slug)?.quantity ?? 0;
  const hasInquiryPrice = product.priceValue <= 0;
  const maxQuantity = Math.min(product.stock, MAX_QUANTITY_PER_ITEM);

  return (
    <div className="pb-safe fixed bottom-0 left-1/2 z-30 w-full max-w-sm -translate-x-1/2 border-t border-slate-100 bg-white/95 px-4 pt-3 backdrop-blur-md">
      {hasInquiryPrice ? (
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${salesPhone}`}
            className="flex h-12 items-center justify-center rounded-2xl bg-brand-800 text-sm font-bold text-white transition-transform active:scale-[0.97]"
          >
            تماس با فروش
          </a>
          <Link
            href="/wholesale"
            className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 transition-transform active:scale-[0.97]"
          >
            استعلام قیمت
          </Link>
        </div>
      ) : !product.isAvailable ? (
        <div className="flex h-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500">
          این قطعه فعلاً موجود نیست
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-slate-400">قیمت</div>
            <div className="truncate text-base font-black text-brand-900">
              {product.price}
            </div>
          </div>

          {isCartReady && quantityInCart > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex h-12 items-center rounded-2xl border border-brand-200 bg-brand-50">
                <button
                  type="button"
                  onClick={() => increaseQuantity(product.slug)}
                  disabled={quantityInCart >= maxQuantity}
                  aria-label="افزایش تعداد"
                  className="flex h-12 w-11 items-center justify-center text-xl font-bold text-brand-800 disabled:text-slate-300"
                >
                  +
                </button>
                <span
                  className="min-w-6 text-center text-sm font-black text-brand-900"
                  aria-live="polite"
                >
                  {quantityInCart.toLocaleString("fa-IR")}
                </span>
                <button
                  type="button"
                  onClick={() => decreaseQuantity(product.slug)}
                  aria-label="کاهش تعداد"
                  className="flex h-12 w-11 items-center justify-center text-xl font-bold text-brand-800"
                >
                  −
                </button>
              </div>

              <Link
                href="/cart"
                className="flex h-12 items-center justify-center rounded-2xl bg-accent-600 px-4 text-sm font-bold text-white transition-transform active:scale-[0.97]"
              >
                مشاهده سبد
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(product)}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-800 px-6 text-sm font-bold text-white shadow-float transition-transform active:scale-[0.97]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              افزودن به سبد
            </button>
          )}
        </div>
      )}
    </div>
  );
}
