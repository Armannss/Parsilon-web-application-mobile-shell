import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import AddToCartBar from "@/components/product/AddToCartBar";
import ProductImage from "@/components/product/ProductImage";
import { resolveBrandLogo } from "@/lib/brands";
import { prisma } from "@/lib/prisma";
import { getProductBySlug, listProducts } from "@/lib/products-server";
import { SHIPPING_COST } from "@/lib/pricing";
import { formatRial } from "@/lib/format";
import { SALES_PHONE, SALES_PHONE_DISPLAY } from "@/lib/site";

// Price and stock must always be current.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

async function loadProduct(params: PageProps["params"]) {
  const { slug } = await params;
  return getProductBySlug(decodeURIComponent(slug));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await loadProduct(params).catch(() => null);

  if (!product) return { title: "محصول پیدا نشد" };

  const description = (
    product.description ||
    `${product.name} با کد فنی ${product.code}${product.brand ? `، مناسب ${product.brand}` : ""}`
  ).slice(0, 160);

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.image.startsWith("/images/") ? [product.image] : [],
    },
  };
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-accent-600" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const product = await loadProduct(params);

  if (!product) notFound();

  const [related, brand] = await Promise.all([
    product.category
      ? listProducts({ category: product.category, limit: 9 })
      : Promise.resolve({ products: [] }),
    product.brandSlug
      ? prisma.brand.findUnique({
          where: { slug: product.brandSlug },
          select: { logo: true },
        })
      : Promise.resolve(null),
  ]);

  const relatedProducts = related.products
    .filter((item) => item.slug !== product.slug)
    .slice(0, 8);

  const hasInquiryPrice = product.priceValue <= 0;
  const isLowStock = product.isAvailable && product.stock <= 5;

  const stockLabel = !product.isAvailable
    ? "ناموجود"
    : isLowStock
      ? `فقط ${product.stock.toLocaleString("fa-IR")} عدد باقی مانده`
      : "موجود در انبار";

  const specs = [
    { label: "کد فنی", value: product.code, ltr: true },
    { label: "برند خودرو", value: product.brand },
    { label: "دسته‌بندی", value: product.categoryName },
    { label: "وضعیت", value: stockLabel },
  ].filter((row) => row.value);

  // Structured data so search engines can show price and availability.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.code,
    description: product.description || undefined,
    image: product.image.startsWith("/images/") ? product.image : undefined,
    brand: { "@type": "Brand", name: "پارسیلون" },
    ...(hasInquiryPrice
      ? {}
      : {
          offers: {
            "@type": "Offer",
            price: product.priceValue,
            priceCurrency: "IRR",
            availability: product.isAvailable
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }),
  };

  return (
    <MobileShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <AppHeader title={product.name} backHref="/products" />

      <main className="bg-[#F4F7FC] pb-32 text-right">
        <section className="bg-white">
          <div className="relative aspect-square">
            <ProductImage
              src={product.image}
              alt={product.name}
              eager
              className={`h-full w-full object-contain p-6 ${
                product.isAvailable ? "" : "opacity-60 grayscale"
              }`}
            />

            {brand?.logo ? (
              <img
                src={resolveBrandLogo(brand.logo)}
                alt={product.brand}
                className="absolute left-4 top-4 h-11 w-11 rounded-full border border-slate-100 bg-white object-contain p-1.5 shadow-card"
              />
            ) : null}
          </div>
        </section>

        <section className="relative -mt-5 rounded-t-[28px] bg-white px-5 pb-5 pt-6 shadow-[0_-8px_24px_rgba(14,47,109,0.06)]">
          <nav aria-label="مسیر" className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <Link href="/products" className="font-bold text-brand-600">
              محصولات
            </Link>
            {product.categoryName ? (
              <>
                <span aria-hidden="true">/</span>
                <Link
                  href={`/products?category=${encodeURIComponent(product.category)}`}
                  className="font-bold text-brand-600"
                >
                  {product.categoryName}
                </Link>
              </>
            ) : null}
          </nav>

          <h1 className="mt-2 text-lg font-black leading-8 text-slate-900">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                !product.isAvailable
                  ? "bg-slate-100 text-slate-500"
                  : isLowStock
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {stockLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
              کد فنی <span dir="ltr">{product.code}</span>
            </span>
            {product.brand ? (
              <Link
                href={`/products?brand=${encodeURIComponent(product.brand)}`}
                className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-700"
              >
                {product.brand}
              </Link>
            ) : null}
          </div>

          <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-400">قیمت مصرف‌کننده</span>
            <span
              className={`text-xl font-black ${
                hasInquiryPrice ? "text-amber-600" : "text-brand-900"
              }`}
            >
              {product.price}
            </span>
          </div>
        </section>

        <section className="mt-3 bg-white px-5 py-5">
          <ul className="space-y-3 text-[13px] leading-6 text-slate-700">
            <li className="flex items-start gap-2.5">
              <CheckIcon />
              ضمانت اصالت و سلامت فیزیکی کالا
            </li>
            <li className="flex items-start gap-2.5">
              <CheckIcon />
              ارسال به سراسر کشور از {formatRial(SHIPPING_COST.NORMAL)}
            </li>
            <li className="flex items-start gap-2.5">
              <CheckIcon />
              پشتیبانی و مشاوره فنی پیش از خرید
            </li>
          </ul>
        </section>

        {product.compatibleCars.length > 0 ? (
          <section className="mt-3 bg-white px-5 py-5">
            <h2 className="text-sm font-black text-slate-900">
              خودروهای سازگار
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.compatibleCars.map((car) => (
                <span
                  key={car}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700"
                >
                  {car}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-3 bg-white px-5 py-5">
          <h2 className="text-sm font-black text-slate-900">مشخصات فنی</h2>
          <dl className="mt-3 divide-y divide-slate-100 text-[13px]">
            {specs.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3">
                <dt className="text-slate-500">{row.label}</dt>
                <dd className="font-bold text-slate-800" dir={row.ltr ? "ltr" : undefined}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {product.description ? (
          <section className="mt-3 bg-white px-5 py-5">
            <h2 className="text-sm font-black text-slate-900">توضیحات</h2>
            <p className="mt-3 whitespace-pre-line text-[13px] leading-7 text-slate-600">
              {product.description}
            </p>
          </section>
        ) : null}

        <section className="mx-4 mt-4 overflow-hidden rounded-3xl bg-gradient-to-l from-brand-900 to-brand-700 p-5 text-white">
          <h2 className="text-sm font-black">خرید عمده یا سؤال فنی دارید؟</h2>
          <p className="mt-1.5 text-xs leading-6 text-brand-100">
            برای تعمیرگاه‌ها و فروشگاه‌ها قیمت ویژه داریم.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/wholesale"
              className="flex h-11 items-center justify-center rounded-2xl bg-white text-xs font-bold text-brand-900 transition-transform active:scale-[0.97]"
            >
              درخواست خرید عمده
            </Link>
            <a
              href={`tel:${SALES_PHONE}`}
              className="flex h-11 items-center justify-center rounded-2xl border border-white/30 text-xs font-bold text-white transition-transform active:scale-[0.97]"
            >
              <span dir="ltr">{SALES_PHONE_DISPLAY}</span>
            </a>
          </div>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="mt-6">
            <div className="flex items-center justify-between px-5">
              <h2 className="text-sm font-black text-slate-900">
                قطعات مشابه
              </h2>
              <Link
                href={`/products?category=${encodeURIComponent(product.category)}`}
                className="text-xs font-bold text-brand-700"
              >
                مشاهده همه
              </Link>
            </div>

            <div className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
              {relatedProducts.map((item) => (
                <Link
                  key={item.slug}
                  href={`/products/${item.slug}`}
                  className="w-36 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition-transform active:scale-[0.98]"
                >
                  <div className="aspect-square bg-slate-50">
                    <ProductImage
                      src={item.image}
                      alt=""
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <div className="p-2.5">
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-bold leading-5 text-slate-800">
                      {item.name}
                    </h3>
                    <div className="mt-1.5 text-xs font-black text-brand-800">
                      {item.price}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <AddToCartBar product={product} salesPhone={SALES_PHONE} />
    </MobileShell>
  );
}
