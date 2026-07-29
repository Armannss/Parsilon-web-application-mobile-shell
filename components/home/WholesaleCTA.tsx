import Link from "next/link";

export default function WholesaleCTA() {
  return (
    <section className="mt-10 rounded-[2rem] bg-gradient-to-r from-clay to-orange-400 p-6 text-white md:flex md:items-center md:justify-between md:p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-orange-100">For businesses</p>
        <h2 className="mt-2 text-3xl font-semibold">Need shelf-ready cases or cafe supply?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-orange-50">
          Start with our wholesale page for case minimums, category notes, and a simple lead capture flow.
        </p>
      </div>
      <Link href="/wholesale" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-clay md:mt-0">
        Open wholesale
      </Link>
    </section>
  );
}
