import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="grid gap-6 rounded-[2rem] bg-gradient-to-br from-olive via-olive to-ink p-6 text-white shadow-card md:grid-cols-[1.3fr_0.7fr] md:p-10">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-100">
          Modern Persian pantry
        </p>
        <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
          Build a richer basket for home, gifting, or retail shelves.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-200 md:text-lg">
          Parsilon pairs thoughtful sourcing with a mobile-first storefront.
          Shop small packs, browse story-led product pages, or request wholesale-ready cases.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/products" className="rounded-full bg-clay px-5 py-3 font-semibold text-white">
            Browse products
          </Link>
          <Link href="/wholesale" className="rounded-full border border-white/25 px-5 py-3 font-semibold text-white">
            Explore wholesale
          </Link>
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.75rem] bg-white/10 p-4">
        <div className="rounded-[1.5rem] bg-white/10 p-4">
          <p className="text-sm text-emerald-100">Top seller</p>
          <p className="mt-2 text-2xl font-semibold">Zafaran Cardamom Tea</p>
          <p className="mt-2 text-sm text-stone-200">Warm spice, floral lift, and everyday brewability.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[1.5rem] bg-white/10 p-4">
            <p className="text-3xl font-semibold">48h</p>
            <p className="text-sm text-stone-200">Average dispatch</p>
          </div>
          <div className="rounded-[1.5rem] bg-white/10 p-4">
            <p className="text-3xl font-semibold">4</p>
            <p className="text-sm text-stone-200">Core categories</p>
          </div>
        </div>
      </div>
    </section>
  );
}
