import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import ProductCard from "@/components/home/ProductCard";
import { resolveBrandLogo } from "@/lib/brands";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products-server";
import { SALES_PHONE, SALES_PHONE_DISPLAY } from "@/lib/site";

// Featured products show live price and stock.
export const dynamic = "force-dynamic";

const CATEGORY_STYLES = [
  { tile: "from-brand-50 to-white", icon: "bg-brand-100 text-brand-700" },
  { tile: "from-emerald-50 to-white", icon: "bg-emerald-100 text-emerald-700" },
  { tile: "from-amber-50 to-white", icon: "bg-amber-100 text-amber-700" },
  { tile: "from-violet-50 to-white", icon: "bg-violet-100 text-violet-700" },
];

const TRUST_POINTS = [
  {
    title: "ضمانت اصالت",
    text: "تولید مطابق استاندارد",
    path: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  },
  {
    title: "ارسال سراسری",
    text: "پست و باربری به همه استان‌ها",
    path: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
  },
  {
    title: "قیمت عمده",
    text: "ویژه تعمیرگاه و فروشگاه",
    path: "M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  },
];

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-5">
      <h2 className="text-base font-black text-slate-900">{title}</h2>
      {href ? (
        <Link href={href} className="text-xs font-bold text-brand-700">
          مشاهده همه
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const [brands, categories, featured, productCount] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true, products: { some: {} } },
      orderBy: { products: { _count: "desc" } },
      select: { name: true, slug: true, logo: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { products: { _count: "desc" } },
      select: {
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    }),
    listProducts({ showcase: true, limit: 6 }),
    prisma.product.count(),
  ]);

  return (
    <MobileShell>
      <AppHeader />

      <main className="bg-[#F4F7FC] pb-28 text-right">
        {/* Hero + search */}
        <section className="px-4 pt-4">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-bl from-brand-700 via-brand-800 to-brand-900 p-5 text-white shadow-float">
            <div
              aria-hidden="true"
              className="absolute -left-10 -top-10 h-40 w-40 rounded-full border-[18px] border-white/5"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-14 left-10 h-36 w-36 rounded-full border-[14px] border-accent-500/15"
            />

            <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-accent-400">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              تولیدکننده قطعات ترمز و بلبرینگ
            </span>

            <h1 className="relative mt-3 text-2xl font-black leading-10">
              قطعه اصلی، مستقیم از
              <br />
              پارسیلون پارت
            </h1>

            <p className="relative mt-2 text-xs leading-6 text-brand-100">
              با نام قطعه، کد فنی یا مدل خودرو جستجو کنید.
            </p>

            {/* A plain GET form: works even before JavaScript loads. */}
            <form action="/products" method="get" role="search" className="relative mt-4">
              <label htmlFor="home-search" className="sr-only">
                جستجوی قطعه
              </label>
              <input
                id="home-search"
                name="search"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="مثلاً دیسک ترمز پراید یا 6010101"
                className="w-full rounded-2xl border-0 bg-white py-3.5 pl-24 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <button
                type="submit"
                className="absolute left-1.5 top-1.5 flex h-[calc(100%-12px)] items-center gap-1.5 rounded-xl bg-accent-500 px-4 text-xs font-black text-brand-900 transition-transform active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z" />
                </svg>
                جستجو
              </button>
            </form>
          </div>
        </section>

        {/* Brands */}
        {brands.length > 0 ? (
          <section className="pt-6">
            <SectionHeader title="خودروی شما" />
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/products?brand=${encodeURIComponent(brand.name)}`}
                  className="flex w-[76px] shrink-0 flex-col items-center gap-2 transition-transform active:scale-95"
                >
                  <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full border border-slate-200 bg-white shadow-card">
                    <img
                      src={resolveBrandLogo(brand.logo ?? "")}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 object-contain"
                    />
                  </span>
                  <span className="text-[11px] font-bold text-slate-700">
                    {brand.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Categories */}
        {categories.length > 0 ? (
          <section className="pt-6">
            <SectionHeader title="دسته‌بندی قطعات" href="/products" />
            <div className="mt-3 grid grid-cols-2 gap-3 px-4">
              {categories.map((category, index) => {
                const style = CATEGORY_STYLES[index % CATEGORY_STYLES.length];

                return (
                  <Link
                    key={category.slug}
                    href={`/products?category=${encodeURIComponent(category.slug)}`}
                    className={`flex items-center gap-3 rounded-3xl border border-slate-200/80 bg-gradient-to-l ${style.tile} p-4 shadow-card transition-transform active:scale-[0.98]`}
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.icon}`}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="3.5" />
                        <path strokeLinecap="round" d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-900">
                        {category.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {category._count.products.toLocaleString("fa-IR")} قطعه
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Featured products */}
        {featured.products.length > 0 ? (
          <section className="pt-7">
            <SectionHeader title="قطعات منتخب" href="/products" />
            <div className="mt-3 grid grid-cols-2 gap-3 px-4">
              {featured.products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
            <div className="px-4">
              <Link
                href="/products"
                className="mt-4 flex h-12 items-center justify-center rounded-2xl border border-brand-200 bg-white text-sm font-bold text-brand-800 transition-transform active:scale-[0.98]"
              >
                مشاهده هر {productCount.toLocaleString("fa-IR")} قطعه
              </Link>
            </div>
          </section>
        ) : null}

        {/* Trust */}
        <section className="px-4 pt-7">
          <div className="grid grid-cols-3 gap-2 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="flex flex-col items-center text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={point.path} />
                  </svg>
                </span>
                <span className="mt-2 text-xs font-black text-slate-900">
                  {point.title}
                </span>
                <span className="mt-1 text-[10px] leading-4 text-slate-500">
                  {point.text}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="flex shrink-0 gap-2">
              <img src="/images/IMQ_2.jpg" alt="گواهی IMQ" loading="lazy" className="h-12 w-12 rounded-xl border border-slate-100 object-contain p-1" />
              <img src="/images/ICnet_2.jpg" alt="گواهی IQNet" loading="lazy" className="h-12 w-12 rounded-xl border border-slate-100 object-contain p-1" />
            </div>
            <p className="text-xs leading-6 text-slate-600">
              <span className="font-black text-slate-900">
                دارای گواهی‌های بین‌المللی کیفیت.
              </span>{" "}
              تولید مطابق استانداردهای مدیریت کیفیت.
            </p>
          </div>
        </section>

        {/* Wholesale */}
        <section className="px-4 pt-4">
          <div className="overflow-hidden rounded-3xl bg-slate-900 p-5 text-white">
            <h2 className="text-base font-black">فروش عمده به همکاران</h2>
            <p className="mt-1.5 text-xs leading-6 text-slate-300">
              تعمیرگاه یا فروشگاه دارید؟ قیمت همکاری و ارسال باربری بگیرید.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/wholesale"
                className="flex h-11 items-center justify-center rounded-2xl bg-accent-500 text-xs font-black text-slate-900 transition-transform active:scale-[0.97]"
              >
                ثبت درخواست عمده
              </Link>
              <a
                href={`tel:${SALES_PHONE}`}
                className="flex h-11 items-center justify-center rounded-2xl border border-white/25 text-xs font-bold transition-transform active:scale-[0.97]"
              >
                <span dir="ltr">{SALES_PHONE_DISPLAY}</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </MobileShell>
  );
}
