"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      className="mt-6 flex flex-col gap-3 rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-card md:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
      }}
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search tea, sweets, gifts, wholesale packs..."
        className="h-12 flex-1 rounded-full border border-stone-200 px-4 outline-none ring-0 placeholder:text-stone-400"
      />
      <button type="submit" className="h-12 rounded-full bg-ink px-6 font-semibold text-white">
        Search
      </button>
    </form>
  );
}
