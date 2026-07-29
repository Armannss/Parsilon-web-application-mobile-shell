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
    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md active:scale-[0.995]">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="overflow-hidden bg-slate-50">
          <img
            src={imageSrc}
            alt={product.name}
            onError={() => setImageSrc(getFallbackProductImage())}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-extrabold text-slate-900 transition-colors duration-200 group-hover:text-blue-900">
                {product.name}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                کد فنی: {product.code}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {product.brand ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 transition-colors duration-200 group-hover:bg-slate-50">
                    {brandLogo ? (
                      <img
                        src={brandLogo}
                        alt={product.brand}
                        className="h-4 w-4 rounded-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    {product.brand}
                  </span>
                ) : null}

                {categoryLabel ? (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 transition-colors duration-200 group-hover:bg-blue-100">
                    {categoryLabel}
                  </span>
                ) : null}
              </div>
            </div>

            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold transition-colors duration-200 ${
                isUnavailable
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {stockLabel}
            </span>
          </div>

          <div
            className={`mt-4 text-sm font-black transition-colors duration-200 ${
              hasInquiryPrice ? "text-amber-600" : "text-blue-900"
            }`}
          >
            {product.price}
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-4 pt-0">
        <Link
          href={`/products/${product.slug}`}
          className="rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-900 active:scale-[0.98]"
        >
          مشاهده
        </Link>

        {hasInquiryPrice ? (
          <Link
            href="/wholesale"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white transition-all duration-200 hover:bg-slate-800 active:scale-[0.98]"
          >
            استعلام قیمت
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isUnavailable}
            className={`rounded-2xl px-4 py-3 text-center text-sm font-bold text-white transition-all duration-200 ${
              isUnavailable
                ? "cursor-not-allowed bg-slate-300"
                : added
                  ? "bg-emerald-600"
                  : "bg-blue-900 hover:bg-blue-800 active:scale-[0.98]"
            }`}
          >
            {isUnavailable ? "ناموجود" : added ? "اضافه شد" : "افزودن به سبد"}
          </button>
        )}
      </div>
    </div>
  );
}