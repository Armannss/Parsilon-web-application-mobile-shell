import MobileShell from "@/components/layout/MobileShell";
import { ProductCardSkeleton } from "@/components/home/ProductCard";

export default function ProductsLoading() {
  return (
    <MobileShell>
      <main
        className="min-h-screen bg-[#F4F7FC] px-4 pb-28 pt-24"
        role="status"
        aria-label="در حال دریافت محصولات"
      >
        <div className="skeleton h-12 rounded-2xl" />
        <div className="mt-3 flex gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </main>
    </MobileShell>
  );
}
