import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import ProductCard from "@/components/home/ProductCard";
import ProductImage from "@/components/product/ProductImage";
import Reveal from "@/components/ui/Reveal";
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

// What Parsilon makes. Each line is illustrated with a real product photo
// picked from the catalogue by this keyword.
const PRODUCT_LINES = [
  { keyword: "دیسک", title: "دیسک ترمز", text: "جلو، خنک‌شونده و ABS" },
  { keyword: "کاسه", title: "کاسه چرخ", text: "چرخ عقب سواری و وانت" },
  { keyword: "بلبرینگ", title: "بلبرینگ چرخ", text: "چرخ جلو و عقب" },
  { keyword: "سیلندر", title: "سیلندر ترمز", text: "سیلندر چرخ عقب" },
  { keyword: "پولی", title: "پولی", text: "پولی سر میل‌لنگ" },
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
  const [brands, categories, featured, productCount, lineProducts, carRows] =
    await Promise.all([
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
      Promise.all(
        PRODUCT_LINES.map(async (line) => {
          const where = { name: { contains: line.keyword } };
          const [sample, count] = await Promise.all([
            prisma.product.findFirst({
              where,
              // Prefer one that has a photo.
              orderBy: [{ image: { sort: "desc", nulls: "last" } }],
              select: { image: true },
            }),
            prisma.product.count({ where }),
          ]);

          return { ...line, image: sample?.image ?? "", count };
        }),
      ),
      prisma.product.findMany({ select: { compatibleCars: true } }),
    ]);

  const productLines = lineProducts.filter((line) => line.count > 0);
  const cars = [...new Set(carRows.flatMap((row) => row.compatibleCars))];

  const stats = [
    { value: "+۲۵", label: "سال تجربه تولید" },
    { value: productCount.toLocaleString("fa-IR"), label: "قطعه در کاتالوگ" },
    { value: cars.length.toLocaleString("fa-IR"), label: "مدل خودرو" },
  ];

  return (
    <MobileShell>
      <AppHeader />

      <main className="bg-[#F4F7FC] pb-28 text-right">
        {/* Hero: calm and photographic, like parsilonpart.com */}
        <section className="px-4 pt-4">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-card">
            <img
              src="/images/parsilon-hero-board.jpg"
              alt="دیسک ترمز، کاسه چرخ، بلبرینگ و سیلندر ترمز پارسیلون در کنار بسته‌بندی محصول"
              className="aspect-[686/617] w-full object-cover"
            />

            <div className="px-5 pb-5 pt-4 text-center">
              <h1 className="text-[22px] font-black leading-9 text-brand-900">
                خودروی شما برای ما مهم است!
              </h1>
              <span className="mx-auto mt-3 block h-[3px] w-14 rounded-full bg-slate-300" />
              <p className="mt-3 text-[13px] leading-7 text-slate-600">
                تولیدکننده تخصصی قطعات خودرو با نگاه تخصصی بر روی قطعات ترمز.
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
                  placeholder="نام قطعه، کد فنی یا خودرو"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-24 pr-4 text-right text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="submit"
                  className="absolute left-1.5 top-1.5 flex h-[calc(100%-12px)] items-center gap-1.5 rounded-xl bg-brand-800 px-4 text-xs font-black text-white transition-transform active:scale-95"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z" />
                  </svg>
                  جستجو
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Supported cars */}
        {cars.length > 0 ? (
          <section className="pt-4" aria-label="خودروهای پشتیبانی‌شده">
            <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
              {cars.map((car) => (
                <li key={car} className="shrink-0">
                  <Link
                    href={`/products?search=${encodeURIComponent(car)}`}
                    className="block whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700"
                  >
                    {car}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* What we make */}
        {productLines.length > 0 ? (
          <Reveal>
            <section className="pt-7">
              <SectionHeader title="آنچه می‌سازیم" href="/products" />
              <div className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
                {productLines.map((line) => (
                  <Link
                    key={line.keyword}
                    href={`/products?search=${encodeURIComponent(line.keyword)}`}
                    className="group relative w-40 shrink-0 snap-start overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition-transform active:scale-[0.98]"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-brand-50 to-white">
                      <ProductImage
                        src={line.image}
                        alt=""
                        className="h-full w-full object-contain p-3 "
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-brand-900/85 px-2 py-0.5 text-[10px] font-bold text-white">
                        {line.count.toLocaleString("fa-IR")} مدل
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-black text-slate-900">
                        {line.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {line.text}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        ) : null}

        {/* About the brand */}
        <Reveal>
          <section className="px-4 pt-7">
            <div className="rounded-[28px] bg-brand-800 px-5 py-6 text-white">
              <h2 className="text-xl font-black leading-9 text-sky-300">
                پارسیلون؛ برند تخصصی قطعات خودرو
              </h2>
              <span className="mt-3 block h-[3px] w-14 rounded-full bg-white/40" />
              <p className="mt-4 text-[13px] leading-7 text-brand-50">
                پارسیلون برند ثبت‌شده و ارائه‌دهنده محصولات شرکت بهساز فولاد
                تهران است؛ با بیش از ۲۵ سال تجربه در تولید قطعات خودرو برای
                شرکت‌های خودروساز و مجموعه‌ساز.
              </p>
              <dl className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-white/15 text-center">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dd className="text-xl font-black">{stat.value}</dd>
                    <dt className="mt-0.5 text-[10px] text-brand-100">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </Reveal>

        {/* Brands */}
        {brands.length > 0 ? (
          <Reveal>
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
          </Reveal>
        ) : null}

        {/* Categories */}
        {categories.length > 0 ? (
          <Reveal>
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
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.icon}`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <circle cx="12" cy="12" r="3.5" />
                          <path
                            strokeLinecap="round"
                            d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"
                          />
                        </svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-slate-900">
                          {category.name}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {category._count.products.toLocaleString("fa-IR")}{" "}
                          قطعه
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </Reveal>
        ) : null}

        {/* Featured products */}
        {featured.products.length > 0 ? (
          <Reveal>
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
          </Reveal>
        ) : null}

        {/* Trust */}
        <Reveal>
          <section className="px-4 pt-7">
            <div className="grid grid-cols-3 gap-2 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card">
              {TRUST_POINTS.map((point) => (
                <div
                  key={point.title}
                  className="flex flex-col items-center text-center"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={point.path}
                      />
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
                <img
                  src="/images/IMQ_2.jpg"
                  alt="گواهی IMQ"
                  loading="lazy"
                  className="h-12 w-12 rounded-xl border border-slate-100 object-contain p-1"
                />
                <img
                  src="/images/ICnet_2.jpg"
                  alt="گواهی IQNet"
                  loading="lazy"
                  className="h-12 w-12 rounded-xl border border-slate-100 object-contain p-1"
                />
              </div>
              <p className="text-xs leading-6 text-slate-600">
                <span className="font-black text-slate-900">
                  دارای گواهی‌های بین‌المللی کیفیت.
                </span>{" "}
                تولید مطابق استانداردهای مدیریت کیفیت.
              </p>
            </div>
          </section>
        </Reveal>

        {/* Wholesale */}
        <Reveal>
          <section className="px-4 pt-4">
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-5 text-white">
              <h2 className="relative text-base font-black">
                فروش عمده به همکاران
              </h2>
              <p className="relative mt-1.5 text-xs leading-6 text-slate-300">
                تعمیرگاه یا فروشگاه دارید؟ قیمت همکاری و ارسال باربری بگیرید.
              </p>
              <div className="relative mt-4 grid grid-cols-2 gap-3">
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
        </Reveal>

        <footer className="mx-4 mt-4 rounded-3xl bg-brand-900 px-5 py-6 text-xs leading-7 text-brand-100">
          <div className="text-sm font-black text-white">راه‌های ارتباطی</div>
          <p className="mt-2">
            شهرک صنعتی اشتهارد، بلوار ابوریحان، بلوار ملاصدرای شرقی، خیابان
            سبلان سوم، پلاک ۳۴۱۵
          </p>
          <p className="mt-1">
            تلفن:{" "}
            <a href="tel:02637775224" dir="ltr" className="font-bold text-white">
              ۰۲۶-۳۷۷۷۵۲۲۴
            </a>
          </p>
          <p>
            ایمیل:{" "}
            <a href="mailto:info@parsilonpart.com" dir="ltr" className="font-bold text-white">
              info@parsilonpart.com
            </a>
          </p>
        </footer>
      </main>

      <BottomNav />
    </MobileShell>
  );
}
