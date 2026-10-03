import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import ProductGrid from "@/components/product/ProductGrid";
import { resolveBrandLogo } from "@/lib/brands";
import { prisma } from "@/lib/prisma";
import { listProducts, type ProductSort } from "@/lib/products-server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const SORTS: Array<{ id: ProductSort; label: string }> = [
  { id: "default", label: "جدیدترین" },
  { id: "price-asc", label: "ارزان‌ترین" },
  { id: "price-desc", label: "گران‌ترین" },
];

type Filters = {
  search: string;
  brand: string;
  category: string;
  sort: ProductSort;
  available: boolean;
};

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Builds the URL for the current filters with some of them changed. */
function hrefWith(filters: Filters, changes: Partial<Filters>) {
  const next = { ...filters, ...changes };
  const params = new URLSearchParams();

  if (next.search) params.set("search", next.search);
  if (next.brand) params.set("brand", next.brand);
  if (next.category) params.set("category", next.category);
  if (next.sort !== "default") params.set("sort", next.sort);
  if (next.available) params.set("available", "1");

  const query = params.toString();
  return { href: query ? `/products?${query}` : "/products", query };
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-xs font-bold transition-all active:scale-95 ${
        active
          ? "border-brand-800 bg-brand-800 text-white shadow-card"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sortParam = first(params.sort) as ProductSort;

  const filters: Filters = {
    search: first(params.search).slice(0, 100),
    // Older links used "all" to mean "no filter".
    brand: first(params.brand) === "all" ? "" : first(params.brand),
    category: first(params.category) === "all" ? "" : first(params.category),
    sort: SORTS.some((sort) => sort.id === sortParam) ? sortParam : "default",
    available: first(params.available) === "1",
  };

  const [result, brands, categories] = await Promise.all([
    listProducts({
      search: filters.search || undefined,
      brand: filters.brand || undefined,
      category: filters.category || undefined,
      sort: filters.sort,
      availableOnly: filters.available,
      limit: PAGE_SIZE,
    }),
    prisma.brand.findMany({
      where: { isActive: true, products: { some: {} } },
      orderBy: { products: { _count: "desc" } },
      select: { name: true, slug: true, logo: true },
    }),
    prisma.category.findMany({
      where: { isActive: true, products: { some: {} } },
      orderBy: { products: { _count: "desc" } },
      select: { name: true, slug: true },
    }),
  ]);

  const activeCategory = categories.find((c) => c.slug === filters.category);
  const hasFilters = Boolean(
    filters.search || filters.brand || filters.category || filters.available
  );
  const { query } = hrefWith(filters, {});

  const heading = filters.search
    ? `نتایج «${filters.search}»`
    : (activeCategory?.name ?? filters.brand) || "همه قطعات";

  return (
    <MobileShell>
      <AppHeader title="محصولات" backHref="/" />

      <main className="min-h-screen bg-[#F4F7FC] pb-28 text-right">
        {/* Search + filters stay within reach while scrolling */}
        <div className="sticky top-[76px] z-20 border-b border-slate-200/70 bg-[#F4F7FC] pb-3 pt-3">
          <form action="/products" method="get" role="search" className="relative px-4">
            <label htmlFor="products-search" className="sr-only">
              جستجو در محصولات
            </label>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-8 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z" />
            </svg>
            <input
              id="products-search"
              name="search"
              type="search"
              defaultValue={filters.search}
              enterKeyHint="search"
              autoComplete="off"
              placeholder="نام قطعه، کد فنی یا مدل خودرو"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-12 text-sm font-medium text-slate-900 shadow-card placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {/* Searching keeps the other filters. */}
            {filters.brand ? <input type="hidden" name="brand" value={filters.brand} /> : null}
            {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
            {filters.sort !== "default" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
            {filters.available ? <input type="hidden" name="available" value="1" /> : null}
          </form>

          <nav aria-label="فیلتر محصولات" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
            <Chip
              href={hrefWith(filters, { available: !filters.available }).href}
              active={filters.available}
            >
              <span className={`h-2 w-2 rounded-full ${filters.available ? "bg-accent-400" : "bg-emerald-500"}`} />
              فقط موجود
            </Chip>

            {categories.map((category) => {
              const active = filters.category === category.slug;
              return (
                <Chip
                  key={category.slug}
                  href={hrefWith(filters, { category: active ? "" : category.slug }).href}
                  active={active}
                >
                  {category.name}
                </Chip>
              );
            })}

            <span aria-hidden="true" className="my-1.5 w-px shrink-0 bg-slate-300" />

            {brands.map((brand) => {
              const active = filters.brand === brand.name || filters.brand === brand.slug;
              return (
                <Chip
                  key={brand.slug}
                  href={hrefWith(filters, { brand: active ? "" : brand.name }).href}
                  active={active}
                >
                  <img
                    src={resolveBrandLogo(brand.logo ?? "")}
                    alt=""
                    className="h-5 w-5 rounded-full bg-white object-contain p-0.5"
                  />
                  {brand.name}
                </Chip>
              );
            })}
          </nav>
        </div>

        <section className="px-4 pt-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black text-slate-900">{heading}</h1>
              <p className="mt-0.5 text-xs text-slate-500" aria-live="polite">
                {result.total.toLocaleString("fa-IR")} قطعه
              </p>
            </div>

            {hasFilters ? (
              <Link
                href="/products"
                className="shrink-0 rounded-xl px-2 py-1.5 text-xs font-bold text-red-600 active:bg-red-50"
              >
                حذف فیلترها
              </Link>
            ) : null}
          </div>

          <div
            role="group"
            aria-label="مرتب‌سازی"
            className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/60 p-1"
          >
            {SORTS.map((sort) => {
              const active = filters.sort === sort.id;
              return (
                <Link
                  key={sort.id}
                  href={hrefWith(filters, { sort: sort.id }).href}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-xl py-2 text-center text-xs font-bold transition-all ${
                    active ? "bg-white text-brand-800 shadow-card" : "text-slate-500"
                  }`}
                >
                  {sort.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-4">
            {result.products.length > 0 ? (
              // The key resets the loaded pages whenever the filters change.
              <ProductGrid
                key={query}
                initialProducts={result.products}
                total={result.total}
                pageSize={PAGE_SIZE}
                query={query}
              />
            ) : (
              <div className="rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-card">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z" />
                  </svg>
                </div>
                <h2 className="mt-4 text-sm font-black text-slate-900">
                  قطعه‌ای با این مشخصات پیدا نشد
                </h2>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  فیلترها را کمتر کنید یا با کد فنی قطعه جستجو کنید.
                </p>
                <Link
                  href="/products"
                  className="mt-5 inline-flex h-11 items-center rounded-2xl bg-brand-800 px-6 text-xs font-bold text-white"
                >
                  نمایش همه قطعات
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </MobileShell>
  );
}
