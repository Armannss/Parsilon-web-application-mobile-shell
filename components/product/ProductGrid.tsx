"use client";

import { useState } from "react";
import ProductCard, {
  ProductCardSkeleton,
} from "@/components/home/ProductCard";
import type { PublicProduct } from "@/lib/public-products";

type ProductGridProps = {
  initialProducts: PublicProduct[];
  total: number;
  pageSize: number;
  /** Query string of the active filters, without page/limit. */
  query: string;
};

/** First page comes rendered from the server; later pages load on demand. */
export default function ProductGrid({
  initialProducts,
  total,
  pageSize,
  query,
}: ProductGridProps) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const remaining = total - products.length;

  const loadMore = async () => {
    setStatus("loading");

    try {
      const response = await fetch(
        `/api/products?${query}${query ? "&" : ""}page=${page + 1}&limit=${pageSize}`
      );
      const data = await response.json();

      if (!response.ok || !data?.success) throw new Error();

      setProducts((prev) => {
        const seen = new Set(prev.map((item) => item.slug));
        return [
          ...prev,
          ...(data.products as PublicProduct[]).filter(
            (item) => !seen.has(item.slug)
          ),
        ];
      });
      setPage((prev) => prev + 1);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6">
        {products.map((product, index) => (
          <li
            key={product.slug}
            className="card-in"
            // Stagger only within each loaded page.
            style={{ animationDelay: `${(index % pageSize) * 45}ms` }}
          >
            <ProductCard product={product} />
          </li>
        ))}

        {status === "loading"
          ? Array.from({ length: Math.min(remaining, 4) }, (_, index) => (
              <li key={`skeleton-${index}`}>
                <ProductCardSkeleton />
              </li>
            ))
          : null}
      </ul>

      {remaining > 0 ? (
        <div className="mt-5 text-center">
          {status === "error" ? (
            <p role="alert" className="mb-2 text-xs font-bold text-red-600">
              بارگذاری انجام نشد. دوباره تلاش کنید.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={status === "loading"}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-brand-200 bg-white text-sm font-bold text-brand-800 transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {status === "loading"
              ? "در حال بارگذاری…"
              : `نمایش ${Math.min(remaining, pageSize).toLocaleString("fa-IR")} قطعه دیگر`}
          </button>

          <p className="mt-2 text-[11px] text-slate-400">
            {products.length.toLocaleString("fa-IR")} از{" "}
            {total.toLocaleString("fa-IR")} قطعه
          </p>
        </div>
      ) : products.length > pageSize ? (
        <p className="mt-5 text-center text-[11px] text-slate-400">
          همه {total.toLocaleString("fa-IR")} قطعه را دیدید
        </p>
      ) : null}
    </>
  );
}
