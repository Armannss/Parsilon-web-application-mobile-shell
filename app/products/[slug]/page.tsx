"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import {
  fetchActiveBrands,
  getBrandByName,
  resolveBrandLogo,
  type Brand,
} from "@/lib/brands";
import {
  fetchActiveCategories,
  type Category,
} from "@/lib/categories";
import { useCart } from "@/context/CartContext";
import type { PublicProduct } from "@/lib/public-products";
import { writeProductsToApiCache } from "@/lib/cart-products";

function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function CartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15.75 10.5V6a3.75 3.75 0 1 0-7 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
      />
    </svg>
  );
}

function resolveProductImage(image?: string) {
  if (!image) return "/images/parsilon-logo-fa.jpg";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

function parseStockValue(stock: unknown) {
  if (typeof stock === "number") return stock;

  if (typeof stock === "string") {
    if (stock.includes("موجود")) return 10;
    if (stock.includes("استعلام")) return 0;
    if (stock.includes("ناموجود")) return 0;

    const englishDigits = stock
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[^\d]/g, "");

    return Number(englishDigits || 0);
  }

  return 0;
}

export default function ProductDetailPage() {
  const params = useParams();
  const { addToCart } = useCart();

  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<PublicProduct[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const slugParam = useMemo(() => {
    const raw = params?.slug;
    return typeof raw === "string" ? decodeURIComponent(raw) : "";
  }, [params]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [brandsData, categoriesData] = await Promise.all([
          fetchActiveBrands(),
          fetchActiveCategories(),
        ]);

        setBrands(brandsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("reference data load error:", error);
        setBrands([]);
        setCategories([]);
      }
    };

    if (!mounted) return;
    void loadReferenceData();
  }, [mounted]);

  useEffect(() => {
    const loadProductPageData = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const productResponse = await fetch(
          `/api/products/${encodeURIComponent(slugParam)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const productData = await productResponse.json().catch(() => null);

        if (
          !productResponse.ok ||
          !productData?.success ||
          !productData?.product
        ) {
          throw new Error(
            productData?.message || "دریافت اطلاعات محصول انجام نشد."
          );
        }

        const currentProduct = productData.product as PublicProduct;
        setProduct(currentProduct);
        writeProductsToApiCache([currentProduct]);

        const relatedResponse = await fetch("/api/products", {
          method: "GET",
          cache: "no-store",
        });

        const relatedData = await relatedResponse.json().catch(() => null);

        if (
          relatedResponse.ok &&
          relatedData?.success &&
          Array.isArray(relatedData?.products)
        ) {
          const products = relatedData.products as PublicProduct[];
          writeProductsToApiCache(products);

          const related = products
            .filter(
              (item) =>
                item.slug !== currentProduct.slug &&
                (item.category === currentProduct.category ||
                  item.brand === currentProduct.brand)
            )
            .slice(0, 3);

          setRelatedProducts(related);
        } else {
          setRelatedProducts([]);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "خطا در دریافت اطلاعات محصول.";
        setLoadError(message);
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!mounted || !slugParam) return;
    void loadProductPageData();
  }, [mounted, slugParam]);

  const categoryName = useMemo(() => {
    if (!product?.category) return "";
    return (
      categories.find((item) => item.slug === product.category)?.name ||
      product.category ||
      ""
    );
  }, [categories, product]);

  const brandLogo = useMemo(() => {
    if (!product?.brand) return "";
    return resolveBrandLogo(getBrandByName(brands, product.brand)?.logo);
  }, [brands, product]);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <MobileShell>
        <div
          dir="rtl"
          className="min-h-screen text-right"
          style={{ background: "#F4F7FC" }}
        >
          <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                href="/products"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-500 shadow-2xs"
              >
                <ArrowRightIcon />
              </Link>
              <div className="text-center">
                <div className="text-base font-black text-[#0E2F6D]">
                  جزئیات محصول
                </div>
                <div className="mt-0.5 text-[10px] font-bold text-slate-400">
                  Parsilon Part
                </div>
              </div>
              <div className="w-9" />
            </div>
          </header>

          <main className="px-4 py-12">
            <div className="rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-sm">
              <h2 className="text-base font-black text-slate-800">
                در حال دریافت اطلاعات قطعه...
              </h2>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                چند لحظه صبر کنید.
              </p>
            </div>
          </main>
        </div>
      </MobileShell>
    );
  }

  if (!product) {
    return (
      <MobileShell>
        <div
          dir="rtl"
          className="min-h-screen text-right"
          style={{ background: "#F4F7FC" }}
        >
          <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                href="/products"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-500 shadow-2xs"
              >
                <ArrowRightIcon />
              </Link>
              <div className="text-center">
                <div className="text-base font-black text-[#0E2F6D]">
                  جزئیات محصول
                </div>
                <div className="mt-0.5 text-[10px] font-bold text-slate-400">
                  Parsilon Part
                </div>
              </div>
              <div className="w-9" />
            </div>
          </header>

          <main className="px-4 py-12">
            <div className="rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-sm">
              <h2 className="text-base font-black text-slate-800">
                قطعه مورد نظر پیدا نشد!
              </h2>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                {loadError ||
                  "ممکن است این محصول از کاتالوگ حذف شده یا آدرس آن تغییر کرده باشد."}
              </p>
              <Link
                href="/products"
                className="mt-5 inline-flex rounded-xl bg-[#0E2F6D] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
              >
                بازگشت به کاتالوگ قطعات
              </Link>
            </div>
          </main>
        </div>
      </MobileShell>
    );
  }

  const numericStock = parseStockValue(product.stock);

  const hasInquiryPrice =
    product.price?.includes("تماس") || numericStock <= 0;

  const isUnavailable =
    product.isAvailable === false ||
    numericStock <= 0 ||
    String(product.stock ?? "").includes("استعلام") ||
    String(product.stock ?? "").includes("ناموجود");

  const stockLabel = isUnavailable ? "ناموجود" : "موجود در انبار مرکزی";

  const productDescription =
    product.shortDescription?.trim() ||
    product.description?.trim() ||
    "توضیحات تکمیلی برای این قطعه ثبت نشده است.";

  const compatibleCars =
    Array.isArray(product.compatibleCars) && product.compatibleCars.length > 0
      ? product.compatibleCars
      : ["عمومی / سازگار با تمام مدل‌های استاندارد"];

  return (
    <MobileShell>
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-4">
          <Link
            href="/products"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-500 shadow-2xs transition-transform active:scale-95"
          >
            <ArrowRightIcon />
          </Link>

          <div className="text-center">
            <div className="text-base font-black tracking-tight text-[#0E2F6D]">
              جزئیات قطعه فنی
            </div>
            <div className="mt-0.5 text-[10px] font-bold text-slate-400">
              برند پارسیلون
            </div>
          </div>

          <Link
            href="/cart"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-500 shadow-2xs transition-transform active:scale-95"
          >
            <CartIcon />
          </Link>
        </div>
      </header>

      <main
        className="pb-32 text-right"
        style={{ background: "#F4F7FC", direction: "rtl" }}
      >
        <section className="relative h-80 w-full overflow-hidden bg-slate-100">
          <img
            src={resolveProductImage(product.image)}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#F4F7FC] via-transparent to-black/10" />
        </section>

        <section className="relative z-20 -mt-10 px-4">
          <div className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(14,47,109,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-lg font-black leading-8 text-slate-800">
                  {product.name}
                </h1>
                <p className="font-mono text-xs font-bold text-slate-400">
                  کد کالا: {product.code}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black tracking-wide ${
                  isUnavailable
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {stockLabel}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {product.brand && (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                  {brandLogo && (
                    <img
                      src={brandLogo}
                      alt={product.brand}
                      className="h-4 w-4 rounded-full object-contain"
                    />
                  )}
                  {product.brand}
                </span>
              )}

              {categoryName && (
                <span className="rounded-xl bg-blue-50/60 px-3 py-1.5 text-[11px] font-bold text-[#17479E]">
                  {categoryName}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <span className="text-xs font-bold text-slate-400">
                {hasInquiryPrice ? "وضعیت مالی قطعه:" : "قیمت واحد کاتالوگ:"}
              </span>
              <span
                className={`text-xl font-black ${
                  hasInquiryPrice ? "text-amber-600" : "text-[#0E2F6D]"
                }`}
              >
                {product.price}
              </span>
            </div>
          </div>
        </section>

        <section className="px-4 pt-4">
          <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
            <h2 className="mb-3 border-b border-slate-50 pb-2.5 text-xs font-black tracking-wide text-[#0E2F6D]">
              توضیحات و مشخصات فنی
            </h2>
            <p className="text-xs font-medium leading-6 text-slate-500">
              {productDescription}
            </p>
          </div>
        </section>

        <section className="px-4 pt-4">
          <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
            <h2 className="mb-3 border-b border-slate-50 pb-2.5 text-xs font-black tracking-wide text-[#0E2F6D]">
              خودروهای سازگار با این قطعه
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {compatibleCars.map((car: string) => (
                <span
                  key={car}
                  className="rounded-xl border border-slate-100/70 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600"
                >
                  {car}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pt-4">
          <div className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
            <h2 className="border-b border-slate-50 pb-1 text-xs font-black tracking-wide text-[#0E2F6D]">
              ضمانت اصالت و سلامت قطعه
            </h2>

            <div className="flex items-start gap-3 rounded-2xl border border-green-100/50 bg-green-50/50 p-3">
              <div className="text-green-600">
                <ShieldCheckIcon />
              </div>
              <p className="text-xs font-bold leading-5 text-green-700">
                {product.warranty ||
                  "دارای ضمانت اصالت رسمی برند پارسیلون و سلامت فیزیکی هنگام تحویل"}
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <span className="block text-[11px] font-bold text-slate-400">
                نحوه ارسال بار:
              </span>
              <p className="text-xs font-medium leading-5 text-slate-500">
                {product.shipping ||
                  "ارسال این محصول از انبار مرکزی طبق هماهنگی تلفنی واحد تدارکات انجام می‌شود."}
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 pt-4">
          <div className="space-y-4 rounded-[32px] bg-gradient-to-br from-[#061B40] to-[#0E2F6D] p-5 text-white shadow-md">
            <div className="space-y-1">
              <h2 className="text-sm font-black tracking-tight">
                درخواست سفارش عمده و تیراژ بالا
              </h2>
              <p className="text-xs font-medium leading-5 text-slate-300">
                برای مغازه‌داران، بنکداران و شرکت‌های پخش با قیمت ویژه همکاری
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                href="/wholesale"
                className="flex items-center justify-center rounded-xl bg-[#8CC63F] py-2.5 text-center text-xs font-black text-white shadow-sm transition-transform active:scale-95"
              >
                ثبت فرم عمده
              </Link>
              <a
                href="tel:09003132532"
                className="flex items-center justify-center rounded-xl border border-white/25 bg-white/10 py-2.5 text-center text-xs font-black text-white transition-transform active:scale-95"
              >
                تماس با تدارکات
              </a>
            </div>
          </div>
        </section>

        <section className="space-y-4 px-4 pb-6 pt-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-[#0E2F6D]">
              قطعات مرتبط دیگر
            </h2>
            <Link
              href="/products"
              className="text-xs font-bold text-[#17479E] hover:underline"
            >
              مشاهده همه کاتالوگ
            </Link>
          </div>

          <div className="space-y-4">
            {relatedProducts.map((item) => {
              const relatedStock = parseStockValue(item.stock);
              const relatedUnavailable =
                item.isAvailable === false || relatedStock <= 0;

              return (
                <Link
                  key={item.dbId || item.id || item.slug}
                  href={`/products/${item.slug}`}
                  className="group flex overflow-hidden rounded-2xl border border-slate-100 bg-white p-2.5 shadow-2xs transition-all hover:shadow-sm"
                >
                  <img
                    src={resolveProductImage(item.image)}
                    alt={item.name}
                    className="h-20 w-24 shrink-0 rounded-xl bg-slate-50 object-cover"
                  />
                  <div className="mr-3 flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <h3 className="line-clamp-1 text-xs font-black text-slate-800 transition-colors group-hover:text-[#17479E]">
                      {item.name}
                    </h3>
                    <p className="font-mono text-[10px] text-slate-400">
                      کد: {item.code}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`text-[11px] font-black ${
                          item.price?.includes("تماس")
                            ? "text-amber-600"
                            : "text-[#17479E]"
                        }`}
                      >
                        {item.price}
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                          relatedUnavailable
                            ? "bg-red-50 text-red-500"
                            : "bg-green-50 text-green-500"
                        }`}
                      >
                        {relatedUnavailable ? "ناموجود" : "موجود"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-sm -translate-x-1/2 border-t border-slate-100 bg-white/95 p-4 backdrop-blur-md">
        {hasInquiryPrice ? (
          <div className="grid grid-cols-2 gap-3.5">
            <a
              href="tel:09003132532"
              className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#0E2F6D] to-[#17479E] py-3.5 text-xs font-black text-white shadow-md transition-transform active:scale-95"
            >
              تماس مستقیم با فروش
            </a>
            <Link
              href="/wholesale"
              className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-xs font-black text-slate-600 transition-transform active:scale-95"
            >
              استعلام فوری قیمت
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() =>
                addToCart({
                  id: typeof product.id === "number" ? product.id : 0,
                  dbId: product.dbId,
                  name: product.name,
                  code: product.code,
                  price: product.price,
                  stock: product.stock,
                  image: product.image,
                  slug: product.slug,
                  brand: product.brand,
                  category: product.category,
                })
              }
              disabled={isUnavailable}
              className="flex items-center justify-center rounded-2xl bg-[#0E2F6D] py-3.5 text-xs font-black text-white shadow-md transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
            >
              {isUnavailable ? "قطعه ناموجود است" : "افزودن به سبد قطعات"}
            </button>

            <Link
              href="/checkout"
              className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-black text-slate-600 transition-transform active:scale-95"
            >
              خرید و تسویه آنلاین
            </Link>
          </div>
        )}
      </div>
    </MobileShell>
  );
}