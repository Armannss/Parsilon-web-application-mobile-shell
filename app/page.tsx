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
  { keyword: "دیسک", title: "دیسک ترمز", label: "BRAKE DISC", tagline: "توقف مطمئن، هر بار." },
  { keyword: "کاسه", title: "کاسه چرخ", label: "BRAKE DRUM", tagline: "استوار و بادوام." },
  { keyword: "سیلندر", title: "سیلندر ترمز", label: "BRAKE CYLINDER", tagline: "دقیق در هر فشار." },
  { keyword: "بلبرینگ", title: "بلبرینگ چرخ", label: "WHEEL BEARING", tagline: "حرکت روان." },
  { keyword: "پولی", title: "پولی سر میل‌لنگ", label: "CRANKSHAFT PULLEY", tagline: "انتقال قدرت موتور." },
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
    <Link href={href} className="inline-flex items-center gap-0.5 text-[15px] font-bold text-pack active:opacity-60">
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

      <main className="bg-[#F1F1EF] pb-28">
        {/* Hero: the brand banner, continued by its own blue band */}
        <section className="bg-pack text-white">
          <img
            src="/images/new-header-for-products-page.jpg"
            alt="قطعات ترمز پارسیلون: دیسک، کاسه چرخ، بلبرینگ و سیلندر"
            className="hero-image-in block aspect-[16/10] w-full object-cover object-[38%_bottom]"
          />

          <div className="hero-in px-6 pb-9 pt-6">
            <p className="text-[11px] font-bold tracking-[0.25em] text-white/60" dir="ltr">
              PARSILON PARTS
            </p>
            <h1 className="mt-2 text-[30px] font-black leading-[1.45]">
              خودروی شما
              <br />
              برای ما مهم است
            </h1>
            <span className="mt-4 block h-[3px] w-14 bg-white/50" />
            <p className="mt-4 text-sm leading-7 text-white/75">
              تولیدکننده تخصصی قطعات ترمز خودرو.
            </p>

            {/* A plain GET form: works even before JavaScript loads. */}
            <form action="/products" method="get" role="search" className="relative mt-6">
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
                className="w-full rounded-xl border-0 bg-white py-3.5 pl-24 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/60"
              />
              <button
                type="submit"
                className="absolute left-1.5 top-1.5 h-[calc(100%-12px)] rounded-lg bg-pack px-5 text-xs font-black text-white transition-transform active:scale-95"
              >
                جستجو
              </button>
            </form>
          </div>
        </section>

        {/* Each product line as its own box: lined grey face, blue label band */}
        <div className="space-y-4 px-4 pt-6">
          <h2 className="px-1 text-lg font-black text-slate-900">محصولات پارسیلون</h2>

          {photoLines.map((line) => (
            <Reveal key={line.keyword}>
              <Link
                href={href(line.keyword)}
                className="block overflow-hidden rounded-2xl shadow-float transition-transform active:scale-[0.985]"
              >
                <div className="brand-lines px-6 pb-2 pt-6">
                  <ProductImage
                    src={line.image}
                    alt=""
                    className="tile-image mx-auto aspect-[3/2] w-full object-contain mix-blend-multiply"
                  />
                </div>
                <div className="flex items-end justify-between bg-pack px-5 py-4 text-white">
                  <div>
                    <p className="text-lg font-black tracking-wide" dir="ltr">
                      {line.label}
                    </p>
                    <p className="mt-0.5 text-[13px] text-white/75">{line.title}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-white/90">
                    {line.count.toLocaleString("fa-IR")} مدل
                    <Chevron />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}

          {textLines.length > 0 ? (
            <Reveal>
              <div className="grid grid-cols-2 gap-3">
                {textLines.map((line) => (
                  <Link
                    key={line.keyword}
                    href={href(line.keyword)}
                    className="overflow-hidden rounded-2xl shadow-card transition-transform active:scale-[0.98]"
                  >
                    <div className="brand-lines h-16" />
                    <div className="bg-pack px-4 py-3 text-white">
                      <p className="text-[11px] font-black tracking-wide" dir="ltr">
                        {line.label}
                      </p>
                      <p className="mt-0.5 text-[13px] font-bold">{line.title}</p>
                      <p className="mt-2 flex items-center gap-0.5 text-[11px] text-white/75">
                        {line.count.toLocaleString("fa-IR")} مدل
                        <Chevron />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>

        {/* Shelf */}
        {shelf.products.length > 0 ? (
          <Reveal>
            <section className="pt-9">
              <div className="flex items-end justify-between px-6">
                <h2 className="text-lg font-black text-slate-900">آماده ارسال</h2>
              </div>

              <div className="no-scrollbar mt-5 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-4">
                {shelf.products.map((product) => (
                  <Link
                    key={product.slug}
                    href={`/products/${product.slug}`}
                    className="flex w-56 shrink-0 snap-start flex-col rounded-2xl bg-white p-4 shadow-card transition-transform active:scale-[0.98]"
                  >
                    <p className="text-[11px] font-bold text-pack">
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
                      <span className="flex h-8 items-center rounded-lg bg-pack px-4 text-[13px] font-bold text-white">
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
          <section className="mx-4 mt-9 rounded-2xl bg-pack px-6 py-10 text-center text-white">
            <p className="text-[13px] font-bold text-white/60">بهساز فولاد تهران</p>
            <h2 className="mt-3 text-[30px] font-black leading-[1.4] tracking-tight">
              بیش از ۲۵ سال
              <br />
              تجربه تولید.
            </h2>
            <p className="mx-auto mt-4 max-w-[17rem] text-[15px] leading-7 text-white/70">
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
                  <dt className="mt-1 text-[11px] text-white/60">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>

        {/* Wholesale */}
        <Reveal>
          <section className="brand-lines mx-4 mt-4 rounded-2xl px-6 py-9 text-center">
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
              <a href={`tel:${SALES_PHONE}`} className="text-[15px] font-bold text-pack" dir="ltr">
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
