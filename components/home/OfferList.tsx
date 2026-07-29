import { offers } from "@/lib/data";

export default function OfferList() {
  return (
    <section className="mt-10 grid gap-4 md:grid-cols-3">
      {offers.map((offer) => (
        <article
          key={offer.title}
          className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-card"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-clay">
            Offer
          </p>
          <h3 className="mt-3 text-xl font-semibold text-ink">
            {offer.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            {offer.subtitle}
          </p>
        </article>
      ))}
    </section>
  );
}