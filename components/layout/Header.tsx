"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCartCount } from "@/lib/utils";

export default function Header() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getCartCount());

    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-olive text-sm font-bold text-white">
            PP
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">
              Parsilon
            </p>
            <p className="text-xs text-stone-500">B2C + wholesale pantry</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-stone-700 md:flex">
          <Link href="/products">Products</Link>
          <Link href="/wholesale">Wholesale</Link>
          <Link href="/profile">Profile</Link>
          <Link
            href="/cart"
            className="rounded-full bg-ink px-4 py-2 text-white transition hover:bg-olive"
          >
            Cart ({count})
          </Link>
        </nav>
      </div>
    </header>
  );
}
