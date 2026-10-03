"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getFallbackProductImage,
  resolveProductImage,
} from "@/lib/admin-products";
import { useCart } from "@/context/CartContext";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/pricing";

type ProductCardProps = {
  product: {
    id?: number;
    dbId?: string;
    slug: string;
    name: string;
    code: string;
    price: string;
    priceValue?: number;
    image: string;
    brand?: string;
    category?: string;
    categoryName?: string;
    stock?: number | string;
    isAvailable?: boolean;
  };
  /** Fixed-width variant for horizontal rails. */
  compact?: boolean;
};

export default function ProductCard({ product, compact = false }: ProductCardProps) {
  const { cartItems, addToCart, increaseQuantity, decreaseQuantity, isCartReady } =
    useCart();
  const [imageSrc, setImageSrc] = useState(resolveProductImage(product.image));

  const stock = typeof product.stock === "number" ? product.stock : 0;
  const hasInquiryPrice =
    product.priceValue !== undefined
      ? product.priceValue <= 0
      : product.price.includes("تماس");
  const isUnavailable = product.isAvailable === false || stock <= 0;
  const isLowStock = !isUnavailable && stock <= 5;
  const hasPhoto = imageSrc !== getFallbackProductImage();

  const quantity = isCartReady
    ? (cartItems.find((item) => item.slug === product.slug)?.quantity ?? 0)
    : 0;
  const maxQuantity = Math.min(stock, MAX_QUANTITY_PER_ITEM);

  // Split "۹٬۶۸۱٬۰۰۰ ریال" so the number can be set larger than the unit.
  const [amount, unit] = hasInquiryPrice
    ? [product.price, ""]
    : [product.price.replace(/\s*ریال$/, ""), "ریال"];

  return (
    <article
      className={`group relative flex h-full flex-col ${compact ? "w-40 shrink-0 snap-start" : ""}`}
    >
      <div className="relative">
        <Link
          href={`/products/${product.slug}`}
          aria-label={product.name}
          className="relative block aspect-square overflow-hidden rounded-[22px] bg-white shadow-card ring-1 ring-slate-200/70 transition-transform duration-200 active:scale-[0.97]"
        >
          <img
            src={imageSrc}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImageSrc(getFallbackProductImage())}
            className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-105 ${
              // No photo yet: show the logo small and quiet, not as if it were the product.
              hasPhoto ? "p-2" : "p-10 opacity-25 mix-blend-multiply"
            } ${isUnavailable ? "opacity-50 grayscale" : ""}`}
          />

          {isUnavailable ? (
            <span className="absolute right-2 top-2 rounded-full bg-slate-900/75 px-2 py-0.5 text-[10px] font-bold text-white">
              ناموجود
            </span>
          ) : isLowStock ? (
            <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {stock.toLocaleString("fa-IR")} عدد مانده
            </span>
          ) : null}
        </Link>

        {/* Add / quantity control floats on the photo, within thumb reach. */}
        {!isUnavailable && !hasInquiryPrice ? (
          <div className="absolute bottom-2 left-2">
            {quantity > 0 ? (
              <div className="flex h-10 items-center rounded-full bg-brand-800 text-white shadow-float">
                <button
                  type="button"
                  onClick={() => increaseQuantity(product.slug)}
                  disabled={quantity >= maxQuantity}
                  aria-label={`افزایش تعداد ${product.name}`}
                  className="flex h-10 w-9 items-center justify-center text-lg font-bold disabled:opacity-40"
                >
                  +
                </button>
                <span className="min-w-5 text-center text-xs font-black" aria-live="polite">
                  {quantity.toLocaleString("fa-IR")}
                </span>
                <button
                  type="button"
                  onClick={() => decreaseQuantity(product.slug)}
                  aria-label={`کاهش تعداد ${product.name}`}
                  className="flex h-10 w-9 items-center justify-center text-lg font-bold"
                >
                  −
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  addToCart({
                    id: product.id ?? 0,
                    dbId: product.dbId,
                    name: product.name,
                    code: product.code,
                    price: product.price,
                    stock,
                    image: product.image,
                    slug: product.slug,
                    brand: product.brand,
                    category: product.category,
                  })
                }
                aria-label={`افزودن ${product.name} به سبد`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 text-white shadow-float transition-transform duration-150 active:scale-90"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
              </button>
            )}
          </div>
        ) : null}
      </div>

      <Link href={`/products/${product.slug}`} tabIndex={-1} className="mt-2.5 flex flex-1 flex-col px-1">
        <h3 className="line-clamp-2 text-[13px] font-bold leading-5 text-slate-900">
          {product.name}
        </h3>

        <p className="mt-1 truncate text-[11px] text-slate-400">
          {product.brand ? `${product.brand} · ` : ""}
          <span dir="ltr">{product.code}</span>
        </p>

        <p className="mt-auto pt-1.5">
          {hasInquiryPrice ? (
            <span className="text-xs font-bold text-amber-600">استعلام قیمت</span>
          ) : (
            <>
              <span className={`text-[15px] font-black ${isUnavailable ? "text-slate-400" : "text-slate-900"}`}>
                {amount}
              </span>{" "}
              <span className="text-[10px] font-medium text-slate-500">{unit}</span>
            </>
          )}
        </p>
      </Link>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-square rounded-[22px]" />
      <div className="mt-2.5 space-y-2 px-1">
        <div className="skeleton h-3.5 w-full rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
        <div className="skeleton h-4 w-2/3 rounded-full" />
      </div>
    </div>
  );
}
