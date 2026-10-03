import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import ProductImage from "@/components/product/ProductImage";
import Reveal from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products-server";
import { SALES_PHONE, SALES_PHONE_DISPLAY } from "@/lib/site";

// The shelf shows live price and stock.
export const dynamic = "force-dynamic";

// One large tile per product line, illustrated with a real catalogue photo
// found by this keyword. Lines without a photo are listed as text below.
const PRODUCT_LINES = [
  { keyword: "دیسک", title: "دیسک ترمز", tagline: "توقف مطمئن، هر بار." },
  { keyword: "کاسه", title: "کاسه چرخ", tagline: "استوار و بادوام." },
  { keyword: "سیلندر", title: "سیلندر ترمز", tagline: "دقیق در هر فشار." },
  { keyword: "بلبرینگ", title: "بلبرینگ چرخ", tagline: "حرکت روان." },
  { keyword: "پولی", title: "پولی سر میل‌لنگ", tagline: "انتقال قدرت موتور." },
];

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-[15px] font-medium text-brand-600 active:opacity-60">
      {children}
      <Chevron />
    </Link>
  );
}

export default async function HomePage() {
  const [lines, shelf, productCount, carRows] = await Promise.all([
    Promise.all(
      PRODUCT_LINES.map(async (line) => {
        const where = { name: { contains: line.keyword } };
        const [sample, count] = await Promise.all([
          prisma.product.findFirst({
            where: { ...where, image: { startsWith: "/images/" } },
            orderBy: { code: "asc" },
            select: { image: true },
          }),
          prisma.product.count({ where }),
        ]);

        return { ...line, image: sample?.image ?? "", count };
      })
    ),
    listProducts({ showcase: true, limit: 8 }),
    prisma.product.count(),
    prisma.product.findMany({ select: { compatibleCars: true } }),
  ]);

  const photoLines = lines.filter((line) => line.count > 0 && line.image).slice(0, 3);
  const textLines = lines.filter(
    (line) => line.count > 0 && !photoLines.includes(line)
  );
  const carCount = new Set(carRows.flatMap((row) => row.compatibleCars)).size;

  const href = (keyword: string) => `/products?search=${encodeURIComponent(keyword)}`;

  return (
    <MobileShell>
      <AppHeader />

      <main className="bg-[#F5F5F7] pb-28">
        {/* Hero */}
        <section className="bg-[#F5F5F7] px-6 pt-10 text-center">
          <div className="hero-in">
            <p className="text-[13px] font-medium text-slate-500">پارسیلون پارت</p>
            <h1 className="mt-2 text-[34px] font-black leading-[1.35] tracking-tight text-slate-900">
              خودروی شما
              <br />
              برای ما مهم است.
            </h1>
            <p className="mx-auto mt-3 max-w-[16rem] text-[15px] leading-7 text-slate-500">
              قطعات ترمز، مستقیم از تولیدکننده.
            </p>

            <div className="mt-6 flex items-center justify-center gap-5">
              <Link
                href="/products"
                className="flex h-11 items-center rounded-full bg-brand-600 px-6 text-[15px] font-medium text-white transition-transform active:scale-95"
              >
                مشاهده محصولات
              </Link>
              <TextLink href="/search">جستجو</TextLink>
            </div>
          </div>

          <img
            src="/images/parsilon-hero-board.jpg"
            alt="دیسک ترمز، کاسه چرخ، بلبرینگ و سیلندر ترمز پارسیلون در کنار بسته‌بندی محصول"
            className="hero-image-in -mx-6 mt-8 w-[calc(100%+3rem)] max-w-none mix-blend-multiply"
          />
        </section>

        {/* One generous tile per product line */}
        <div className="space-y-3 px-3 pt-3">
          {photoLines.map((line) => (
            <Reveal key={line.keyword}>
              <section className="overflow-hidden rounded-[28px] bg-white px-6 pt-10 text-center">
                <h2 className="text-[28px] font-black tracking-tight text-slate-900">
                  {line.title}
                </h2>
                <p className="mt-1.5 text-[17px] text-slate-500">{line.tagline}</p>
                <div className="mt-4 flex items-center justify-center gap-5">
                  <TextLink href={href(line.keyword)}>
                    {line.count.toLocaleString("fa-IR")} مدل
                  </TextLink>
                </div>

                <Link href={href(line.keyword)} tabIndex={-1} aria-hidden="true" className="mt-4 block">
                  <ProductImage
                    src={line.image}
                    alt=""
                    className="tile-image mx-auto aspect-[4/3] w-full object-contain"
                  />
                </Link>
              </section>
            </Reveal>
          ))}

          {textLines.length > 0 ? (
            <Reveal>
              <div className="grid grid-cols-2 gap-3">
                {textLines.map((line) => (
                  <Link
                    key={line.keyword}
                    href={href(line.keyword)}
                    className="flex min-h-36 flex-col justify-between rounded-[28px] bg-white p-5 transition-transform active:scale-[0.98]"
                  >
                    <div>
                      <h2 className="text-lg font-black leading-7 text-slate-900">{line.title}</h2>
                      <p className="mt-1 text-[13px] text-slate-500">{line.tagline}</p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-0.5 text-[13px] font-medium text-brand-600">
                      {line.count.toLocaleString("fa-IR")} مدل
                      <Chevron />
                    </span>
                  </Link>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>

        {/* Shelf */}
        {shelf.products.length > 0 ? (
          <Reveal>
            <section className="pt-12">
              <div className="flex items-end justify-between px-6">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  منتخب.{" "}
                  <span className="text-slate-400">آماده ارسال.</span>
                </h2>
              </div>

              <div className="no-scrollbar mt-5 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-4">
                {shelf.products.map((product) => (
                  <Link
                    key={product.slug}
                    href={`/products/${product.slug}`}
                    className="flex w-60 shrink-0 snap-start flex-col rounded-[24px] bg-white p-5 transition-transform active:scale-[0.98]"
                  >
                    <p className="text-[11px] font-medium text-accent-600">
                      {product.categoryName}
                    </p>
                    <h3 className="mt-1 line-clamp-2 min-h-[3.25rem] text-[17px] font-black leading-[1.55] text-slate-900">
                      {product.name}
                    </h3>
                    <ProductImage
                      src={product.image}
                      alt=""
                      className="mt-2 aspect-square w-full object-contain"
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[13px] text-slate-700">{product.price}</span>
                      <span className="flex h-8 items-center rounded-full bg-brand-600 px-4 text-[13px] font-medium text-white">
                        خرید
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="px-6 text-center">
                <TextLink href="/products">
                  همه {productCount.toLocaleString("fa-IR")} قطعه
                </TextLink>
              </div>
            </section>
          </Reveal>
        ) : null}

        {/* Brand statement */}
        <Reveal>
          <section className="mx-3 mt-12 rounded-[28px] bg-[#1D1D1F] px-6 py-12 text-center text-white">
            <p className="text-[13px] font-medium text-accent-400">بهساز فولاد تهران</p>
            <h2 className="mt-3 text-[30px] font-black leading-[1.4] tracking-tight">
              بیش از ۲۵ سال
              <br />
              تجربه تولید.
            </h2>
            <p className="mx-auto mt-4 max-w-[17rem] text-[15px] leading-7 text-slate-400">
              تولیدکننده قطعه برای شرکت‌های خودروساز و مجموعه‌ساز.
            </p>

            <dl className="mt-9 grid grid-cols-3">
              {[
                { value: productCount.toLocaleString("fa-IR"), label: "قطعه" },
                { value: carCount.toLocaleString("fa-IR"), label: "مدل خودرو" },
                { value: "ISO 9001", label: "گواهی کیفیت", ltr: true },
              ].map((stat) => (
                <div key={stat.label}>
                  <dd className="text-xl font-black" dir={stat.ltr ? "ltr" : undefined}>
                    {stat.value}
                  </dd>
                  <dt className="mt-1 text-[11px] text-slate-500">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>

        {/* Wholesale */}
        <Reveal>
          <section className="mx-3 mt-3 rounded-[28px] bg-white px-6 py-10 text-center">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              خرید عمده.
            </h2>
            <p className="mt-1.5 text-[15px] text-slate-500">
              ویژه تعمیرگاه‌ها و فروشگاه‌ها.
            </p>
            <div className="mt-5 flex items-center justify-center gap-5">
              <Link
                href="/wholesale"
                className="flex h-11 items-center rounded-full bg-brand-600 px-6 text-[15px] font-medium text-white transition-transform active:scale-95"
              >
                ثبت درخواست
              </Link>
              <a href={`tel:${SALES_PHONE}`} className="text-[15px] font-medium text-brand-600" dir="ltr">
                {SALES_PHONE_DISPLAY}
              </a>
            </div>
          </section>
        </Reveal>

        <footer className="px-6 pt-8 text-[11px] leading-6 text-slate-400">
          <p className="border-t border-slate-300/70 pt-4">
            شهرک صنعتی اشتهارد، بلوار ابوریحان، بلوار ملاصدرای شرقی، خیابان
            سبلان سوم، پلاک ۳۴۱۵
          </p>
          <p className="mt-1">
            <a href="tel:02637775224" dir="ltr">۰۲۶-۳۷۷۷۵۲۲۴</a>
            {" · "}
            <a href="mailto:info@parsilonpart.com" dir="ltr">info@parsilonpart.com</a>
          </p>
        </footer>
      </main>

      <BottomNav />
    </MobileShell>
  );
}
