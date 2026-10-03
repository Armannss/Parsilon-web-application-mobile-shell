"use client";

import { useEffect, useRef, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import ProductCard, {
  ProductCardSkeleton,
} from "@/components/home/ProductCard";
import type { PublicProduct } from "@/lib/public-products";

const RECENT_KEY = "parsilon-recent-searches";
const SUGGESTIONS = ["دیسک ترمز", "کاسه چرخ", "بلبرینگ", "پراید", "پژو 405", "پژو 206", "تیبا", "سمند"];
const PAGE_SIZE = 20;

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

export default function SearchPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [recent, setRecent] = useState<string[]>([]);

  const term = query.trim();

  useEffect(() => {
    setRecent(readRecent());

    // Arriving with ?q= (for example from a shared link) starts a search.
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) setQuery(initial);
    else inputRef.current?.focus();
  }, []);

  // Search as the visitor types, a moment after they pause.
  useEffect(() => {
    if (term.length < 2) {
      setStatus("idle");
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(term)}&limit=${PAGE_SIZE}`,
          { signal: controller.signal }
        );
        const data = await response.json();

        if (!response.ok || !data?.success) throw new Error();

        setResults(data.products);
        setTotal(data.total);
        setStatus("done");

        if (data.products.length > 0) {
          const next = [term, ...readRecent().filter((item) => item !== term)].slice(0, 6);
          setRecent(next);
          try {
            window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
          } catch {
            // Private mode: recent searches are a convenience only.
          }
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const clearRecent = () => {
    setRecent([]);
    try {
      window.localStorage.removeItem(RECENT_KEY);
    } catch {
      // nothing to clear
    }
  };

  const chips = (items: string[]) => (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setQuery(item)}
          className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-card transition-transform active:scale-95"
        >
          {item}
        </button>
      ))}
    </div>
  );

  return (
    <MobileShell>
      <AppHeader title="جستجو" backHref="/" />

      <main className="min-h-screen bg-[#F4F7FC] px-4 pb-28 pt-4 text-right">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            inputRef.current?.blur();
          }}
          className="sticky top-[76px] z-20"
        >
          <label htmlFor="search-input" className="sr-only">
            جستجوی قطعه
          </label>
          <div className="relative">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z" />
            </svg>
            <input
              id="search-input"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              enterKeyHint="search"
              autoComplete="off"
              placeholder="نام قطعه، کد فنی یا مدل خودرو"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm font-medium text-slate-900 shadow-float placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="پاک کردن جستجو"
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            ) : null}
          </div>
        </form>

        {status === "idle" ? (
          <div className="mt-6 space-y-6">
            {recent.length > 0 ? (
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-900">جستجوهای اخیر</h2>
                  <button type="button" onClick={clearRecent} className="text-xs font-bold text-slate-400">
                    پاک کردن
                  </button>
                </div>
                {chips(recent)}
              </section>
            ) : null}

            <section>
              <h2 className="text-sm font-black text-slate-900">پیشنهادها</h2>
              {chips(SUGGESTIONS)}
            </section>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="mt-5 grid grid-cols-2 gap-3" role="status" aria-label="در حال جستجو">
            {Array.from({ length: 4 }, (_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <div role="alert" className="mt-5 rounded-3xl border border-red-100 bg-white p-6 text-center">
            <p className="text-sm font-black text-red-700">جستجو انجام نشد</p>
            <p className="mt-1.5 text-xs text-slate-500">اتصال اینترنت را بررسی و دوباره تلاش کنید.</p>
          </div>
        ) : null}

        {status === "done" ? (
          results.length > 0 ? (
            <section className="mt-5" aria-live="polite">
              <p className="text-xs text-slate-500">
                <span className="font-black text-slate-900">{total.toLocaleString("fa-IR")}</span>{" "}
                نتیجه برای «{term}»
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {results.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
              {total > results.length ? (
                <a
                  href={`/products?search=${encodeURIComponent(term)}`}
                  className="mt-4 flex h-12 items-center justify-center rounded-2xl border border-brand-200 bg-white text-sm font-bold text-brand-800"
                >
                  مشاهده همه نتایج
                </a>
              ) : null}
            </section>
          ) : (
            <div className="mt-5 rounded-3xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-card" aria-live="polite">
              <p className="text-sm font-black text-slate-900">نتیجه‌ای برای «{term}» پیدا نشد</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                املای عبارت را بررسی کنید یا با کد فنی قطعه جستجو کنید.
              </p>
              {chips(SUGGESTIONS.slice(0, 4))}
            </div>
          )
        ) : null}
      </main>

      <BottomNav />
    </MobileShell>
  );
}
