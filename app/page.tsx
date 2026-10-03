import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import ProductCard from "@/components/home/ProductCard";
import ProductImage from "@/components/product/ProductImage";
import Reveal from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products-server";
import { SALES_PHONE, SALES_PHONE_DISPLAY } from "@/lib/site";

// Rails show live price and stock.
export const dynamic = "force-dynamic";

// What Parsilon makes. Each line is illustrated with a real product photo
// picked from the catalogue by this keyword.
const PRODUCT_LINES = [
  { keyword: "دیسک", title: "دیسک ترمز", text: "عامل اصلی توقف خودرو" },
  { keyword: "کاسه", title: "کاسه چرخ", text: "چرخ عقب سواری و وانت" },
  { keyword: "بلبرینگ", title: "بلبرینگ چرخ", text: "چرخ جلو و عقب" },
  { keyword: "سیلندر", title: "سیلندر ترمز", text: "سیلندر چرخ عقب" },
  { keyword: "پولی", title: "پولی سر میل‌لنگ", text: "انتقال قدرت موتور" },
];

const PROMISES = [
  {
    title: "ضمانت اصالت",
    path: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  },
  {
    title: "ارسال سراسری",
    path: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
  },
  {
    title: "مستقیم از کارخانه",
    path: "M2.25 21h19.5M3.75 21V9.75l5.25 3V9.75l5.25 3V4.5h4.5V21M8.25 21v-3.75h3V21",
  },
];

function SectionHeader({
  title,
  hint,
  href,
}: {
  title: string;
  hint?: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between px-5">
      <div>
        <h2 className="text-[17px] font-black text-slate-900">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="flex items-center gap-0.5 text-xs font-bold text-brand-700">
          همه
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const [categories, productCount, lineProducts, carRows] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, products: { some: {} } },
      orderBy: { products: { _count: "desc" } },
      select: { name: true, slug: true },
    }),
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
      })
    ),
    prisma.product.findMany({ select: { compatibleCars: true } }),
  ]);

  // One rail of products per category.
  const rails = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      ...(await listProducts({ category: category.slug, limit: 10 })),
    }))
  );

  const productLines = lineProducts.filter((line) => line.count > 0);

  // Cars ranked by how many parts fit them.
  const carCounts = new Map<string, number>();
  for (const row of carRows) {
    for (const car of row.compatibleCars) {
      carCounts.set(car, (carCounts.get(car) ?? 0) + 1);
    }
  }
  const cars = [...carCounts].sort((a, b) => b[1] - a[1]);

  const stats = [
    { value: "+۲۵", label: "سال تجربه تولید" },
    { value: productCount.toLocaleString("fa-IR"), label: "قطعه" },
    { value: cars.length.toLocaleString("fa-IR"), label: "مدل خودرو" },
  ];

  const [mainLine, ...otherLines] = productLines;

  return (
    <MobileShell>
      <AppHeader />

      <main className="bg-[#F4F7FC] pb-28 text-right">
        {/* Hero: full-bleed, the products themselves are the picture */}
        <section className="relative -mt-[88px] overflow-hidden bg-brand-900 pt-[88px] text-white">
          <img
            src="/images/new-header-for-products-page.jpg"
            alt=""
            className="absolute inset-x-0 top-0 h-56 w-full object-cover object-[30%_center] opacity-90"
          />
          <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-brand-900/10 via-brand-900/30 to-brand-900" />

          <div className="relative px-5 pb-16 pt-32">
            <p className="text-xs font-bold text-accent-400">
              تولیدکننده تخصصی قطعات ترمز
            </p>
            <h1 className="mt-2 text-[30px] font-black leading-[1.45]">
              خودروی شما
              <br />
              برای ما مهم است
            </h1>

            {/* A plain GET form: works even before JavaScript loads. */}
            <form action="/products" method="get" role="search" className="relative mt-5">
              <label htmlFor="home-search" className="sr-only">
                جستجوی قطعه
              </label>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z" />
              </svg>
              <input
                id="home-search"
                name="search"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="نام قطعه یا کد فنی را بنویسید"
                className="w-full rounded-2xl border-0 bg-white py-4 pl-4 pr-12 text-sm font-medium text-slate-900 shadow-float placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </form>
          </div>
        </section>

        {/* Pick your car: the fastest way to the right part */}
        {cars.length > 0 ? (
          <section className="relative -mt-10 px-4">
            <div className="rounded-[26px] bg-white p-4 shadow-float">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 text-accent-600">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v3.5h2.5m13.5-5.5a2 2 0 0 1 2 2v3.5h-2.5m-11 0a1.5 1.5 0 1 0 3 0m-3 0a1.5 1.5 0 1 1 3 0m5 0a1.5 1.5 0 1 0 3 0m-3 0a1.5 1.5 0 1 1 3 0m-8 0h5" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-sm font-black text-slate-900">خودروی شما چیست؟</h2>
                  <p className="text-[11px] text-slate-500">قطعات سازگار را یک‌جا ببینید</p>
                </div>
              </div>

              <ul className="mt-3.5 grid grid-cols-3 gap-2">
                {cars.slice(0, 9).map(([car, count]) => (
                  <li key={car}>
                    <Link
                      href={`/products?car=${encodeURIComponent(car)}`}
                      className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 px-1.5 py-2.5 text-center transition-all active:scale-95 active:border-brand-300 active:bg-brand-50"
                    >
                      <span className="text-xs font-black leading-5 text-slate-800">{car}</span>
                      <span className="mt-0.5 text-[10px] text-slate-400">
                        {count.toLocaleString("fa-IR")} قطعه
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {cars.length > 9 ? (
                <Link
                  href="/products"
                  className="mt-3 flex h-10 items-center justify-center rounded-xl text-xs font-bold text-brand-700 active:bg-brand-50"
                >
                  همه {cars.length.toLocaleString("fa-IR")} خودرو
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* What we make */}
        {mainLine ? (
          <section className="pt-8">
            <SectionHeader title="آنچه می‌سازیم" href="/products" />

            <div className="mt-3 space-y-3 px-4">
              <Link
                href={`/products?search=${encodeURIComponent(mainLine.keyword)}`}
                className="relative flex h-40 items-center overflow-hidden rounded-[26px] bg-gradient-to-l from-brand-800 to-brand-900 pr-5 text-white shadow-float transition-transform active:scale-[0.98]"
              >
                <div className="relative z-10 max-w-[52%]">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">
                    {mainLine.count.toLocaleString("fa-IR")} مدل
                  </span>
                  <h3 className="mt-2.5 text-xl font-black">{mainLine.title}</h3>
                  <p className="mt-1 text-[11px] leading-5 text-brand-100">{mainLine.text}</p>
                </div>
                <div className="absolute -left-6 top-1/2 h-48 w-48 -translate-y-1/2 overflow-hidden rounded-full bg-white shadow-float">
                  <ProductImage src={mainLine.image} alt="" eager className="h-full w-full object-contain p-5" />
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-3">
                {otherLines.map((line) => (
                  <Link
                    key={line.keyword}
                    href={`/products?search=${encodeURIComponent(line.keyword)}`}
                    className="group overflow-hidden rounded-[22px] bg-white shadow-card ring-1 ring-slate-200/70 transition-transform active:scale-[0.97]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-white">
                      {line.image ? (
                        <ProductImage src={line.image} alt="" className="h-full w-full object-contain p-2" />
                      ) : (
                        // No photo of this line yet: a neutral part outline.
                        <div className="flex h-full items-center justify-center bg-gradient-to-b from-brand-50 to-white text-brand-200">
                          <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
                            <circle cx="12" cy="12" r="9.5" />
                            <circle cx="12" cy="12" r="4" />
                            <path strokeLinecap="round" d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-3 pb-3 pt-1">
                      <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-black text-slate-900">{line.title}</h3>
                        <p className="text-[10px] text-slate-500">
                          {line.count.toLocaleString("fa-IR")} مدل
                        </p>
                      </div>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Product rails */}
        {rails.map((rail) =>
          rail.products.length > 0 ? (
            <Reveal key={rail.slug}>
              <section className="pt-8">
                <SectionHeader
                  title={rail.name}
                  hint={`${rail.total.toLocaleString("fa-IR")} قطعه`}
                  href={`/products?category=${encodeURIComponent(rail.slug)}`}
                />
                <div className="no-scrollbar mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3">
                  {rail.products.map((product) => (
                    <ProductCard key={product.slug} product={product} compact />
                  ))}

                  <Link
                    href={`/products?category=${encodeURIComponent(rail.slug)}`}
                    className="flex aspect-square w-32 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-brand-300 bg-brand-50/60 text-xs font-bold text-brand-700"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
                      </svg>
                    </span>
                    مشاهده همه
                  </Link>
                </div>
              </section>
            </Reveal>
          ) : null
        )}

        {/* Promises */}
        <Reveal>
          <section className="px-4 pt-6">
            <ul className="grid grid-cols-3 gap-2">
              {PROMISES.map((promise) => (
                <li
                  key={promise.title}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 text-center shadow-card ring-1 ring-slate-200/70"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-700" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={promise.path} />
                  </svg>
                  <span className="text-[11px] font-black text-slate-800">{promise.title}</span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* About the brand */}
        <Reveal>
          <section className="px-4 pt-4">
            <div className="overflow-hidden rounded-[26px] bg-brand-800 text-white">
              <div className="px-5 pt-6">
                <h2 className="text-xl font-black leading-9">
                  پارسیلون؛ برند تخصصی
                  <br />
                  قطعات خودرو
                </h2>
                <p className="mt-3 text-[13px] leading-7 text-brand-100">
                  برند ثبت‌شده شرکت بهساز فولاد تهران؛ با بیش از ۲۵ سال تجربه
                  در تولید قطعه برای شرکت‌های خودروساز و مجموعه‌ساز.
                </p>
              </div>

              <dl className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-white/15 border-t border-white/15 text-center">
                {stats.map((stat) => (
                  <div key={stat.label} className="py-4">
                    <dd className="text-xl font-black">{stat.value}</dd>
                    <dt className="mt-0.5 text-[10px] text-brand-200">{stat.label}</dt>
                  </div>
                ))}
              </dl>

              <div className="flex items-center gap-3 bg-white/10 px-5 py-3.5">
                <img src="/images/IMQ_2.jpg" alt="گواهی IMQ" loading="lazy" className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
                <img src="/images/ICnet_2.jpg" alt="گواهی IQNet" loading="lazy" className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
                <p className="text-[11px] leading-5 text-brand-100">
                  دارای گواهی ISO 9001:2015
                </p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Wholesale */}
        <Reveal>
          <section className="px-4 pt-4">
            <div className="rounded-[26px] bg-white p-5 shadow-card ring-1 ring-slate-200/70">
              <h2 className="text-base font-black text-slate-900">تعمیرگاه یا فروشگاه دارید؟</h2>
              <p className="mt-1.5 text-xs leading-6 text-slate-500">
                قیمت همکاری و ارسال باربری بگیرید.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href="/wholesale"
                  className="flex h-12 items-center justify-center rounded-2xl bg-brand-800 text-xs font-black text-white transition-transform active:scale-[0.97]"
                >
                  درخواست خرید عمده
                </Link>
                <a
                  href={`tel:${SALES_PHONE}`}
                  className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 transition-transform active:scale-[0.97]"
                >
                  <span dir="ltr">{SALES_PHONE_DISPLAY}</span>
                </a>
              </div>
            </div>
          </section>
        </Reveal>

        <footer className="px-6 pt-7 text-center text-[11px] leading-6 text-slate-400">
          <p>
            شهرک صنعتی اشتهارد، بلوار ابوریحان، بلوار ملاصدرای شرقی، خیابان
            سبلان سوم، پلاک ۳۴۱۵
          </p>
          <p className="mt-1">
            <a href="tel:02637775224" dir="ltr" className="font-bold text-slate-600">
              ۰۲۶-۳۷۷۷۵۲۲۴
            </a>
            {" · "}
            <a href="mailto:info@parsilonpart.com" dir="ltr" className="font-bold text-slate-600">
              info@parsilonpart.com
            </a>
          </p>
        </footer>
      </main>

      <BottomNav />
    </MobileShell>
  );
}
