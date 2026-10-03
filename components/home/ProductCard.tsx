"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getFallbackProductImage,
  resolveProductImage,
} from "@/lib/admin-products";
import { useCart } from "@/context/CartContext";
import {
  fetchActiveBrands,
  getBrandByName,
  resolveBrandLogo,
  type Brand,
} from "@/lib/brands";

type ProductCardProps = {
  product: {
    id?: number;
    dbId?: string;
    slug: string;
    name: string;
    code: string;
    price: string;
    image: string;
    brand?: string;
    category?: string;
    categoryName?: string;
    stock?: number | string;
    isAvailable?: boolean;
  };
};

type CartProductInput = {
  id: number;
  name: string;
  code: string;
  price?: string;
  stock?: string;
  image: string;
  slug: string;
  brand?: string;
  category?: string;
};

function parseStockValue(stock?: number | string) {
  if (typeof stock === "number" && Number.isFinite(stock)) {
    return stock;
  }

  if (typeof stock === "string") {
    if (stock.includes("موجود")) return 10;
    if (stock.includes("استعلام")) return 0;
    if (stock.includes("ناموجود")) return 0;

    const englishDigits = stock
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[^\d]/g, "");

    return Number(englishDigits || 0);
  }

  return 10;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [imageSrc, setImageSrc] = useState(resolveProductImage(product.image));

  useEffect(() => {
    setImageSrc(resolveProductImage(product.image));
  }, [product.image]);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const data = await fetchActiveBrands();
        setBrands(data);
      } catch (error) {
        console.error("brand load error in ProductCard:", error);
        setBrands([]);
      }
    };

    void loadBrands();
  }, []);

  const hasInquiryPrice = String(product.price || "").includes("تماس");

  const numericStock = useMemo(() => {
    return parseStockValue(product.stock);
  }, [product.stock]);

  const isUnavailable =
    product.isAvailable === false || numericStock <= 0 || hasInquiryPrice;

  const stockLabel = isUnavailable
    ? hasInquiryPrice
      ? "استعلام موجودی"
      : "ناموجود"
    : "موجود";

  const categoryLabel = useMemo(() => {
    if (product.categoryName?.trim()) return product.categoryName.trim();
    if (product.category === "bearing") return "بلبرینگ";
    if (product.category === "brake-parts") return "قطعات ترمز";
    return product.category || "";
  }, [product.categoryName, product.category]);

  const brandLogo = useMemo(() => {
    if (!product.brand) return "";

    const brand = getBrandByName(brands, product.brand);
    if (!brand) return "";

    return resolveBrandLogo(brand.logo);
  }, [brands, product.brand]);

  useEffect(() => {
    if (!added) return;

    const timer = setTimeout(() => {
      setAdded(false);
    }, 1400);

    return () => clearTimeout(timer);
  }, [added]);

  const handleAddToCart = () => {
    const cartProduct: CartProductInput = {
      id: product.id ?? 0,
      name: product.name,
      code: product.code,
      price: product.price,
      stock: String(product.stock ?? ""),
      image: product.image,
      slug: product.slug,
      brand: product.brand,
      category: product.category,
    };

    addToCart(cartProduct);
    setAdded(true);
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white transition-transform duration-200 active:scale-[0.98]">
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none"
        aria-label={product.name}
      >
        <div className="relative aspect-square overflow-hidden bg-white">
          <img
            src={imageSrc}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImageSrc(getFallbackProductImage())}
            className={`h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04] ${
              // No photo yet: show the logo small and quiet, not as if it were the product.
              imageSrc === getFallbackProductImage()
                ? "p-9 opacity-30 mix-blend-multiply"
                : "p-3"
            } ${isUnavailable ? "opacity-60 grayscale" : ""}`}
          />

          {isUnavailable ? (
            <span className="absolute right-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-[10px] font-medium text-white">
              {stockLabel}
            </span>
          ) : null}

          {brandLogo ? (
            <img
              src={brandLogo}
              alt={product.brand || ""}
              loading="lazy"
              className="absolute left-2 top-2 h-7 w-7 rounded-full border border-slate-100 bg-white object-contain p-1 shadow-sm"
            />
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-3">
          {categoryLabel ? (
            <span className="text-[10px] font-medium text-accent-600">
              {categoryLabel}
            </span>
          ) : null}

          <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] font-extrabold leading-5 text-slate-900">
            {product.name}
          </h3>

          <p className="mt-1 text-[11px] text-slate-400" dir="ltr">
            {product.code}
          </p>

          <div
            className={`mt-auto pt-2 text-[13px] font-black ${
              hasInquiryPrice ? "text-amber-600" : "text-brand-800"
            }`}
          >
            {product.price}
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3">
        {hasInquiryPrice ? (
          <Link
            href="/wholesale"
            className="flex h-10 w-full items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700 transition-transform active:scale-[0.97]"
          >
            استعلام قیمت
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isUnavailable}
            aria-live="polite"
            className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-xs font-bold text-white transition-all duration-200 active:scale-[0.97] ${
              isUnavailable
                ? "cursor-not-allowed bg-slate-300"
                : added
                  ? "bg-emerald-600"
                  : "bg-brand-600"
            }`}
          >
            {isUnavailable ? (
              "ناموجود"
            ) : added ? (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                اضافه شد
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                افزودن به سبد
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] bg-white" aria-hidden="true">
      <div className="skeleton aspect-square" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-3 w-1/3 rounded-full" />
        <div className="skeleton h-4 w-full rounded-full" />
        <div className="skeleton h-4 w-2/3 rounded-full" />
        <div className="skeleton mt-3 h-11 w-full rounded-2xl" />
      </div>
    </div>
  );
}
