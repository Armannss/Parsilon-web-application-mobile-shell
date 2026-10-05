import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center bg-white px-8 text-center">
      <div className="text-6xl font-black text-brand-100">۴۰۴</div>
      <h1 className="mt-4 text-lg font-black text-slate-900">
        این صفحه پیدا نشد
      </h1>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        ممکن است نشانی اشتباه باشد یا صفحه جابه‌جا شده باشد.
      </p>
      <div className="mt-6 flex w-full flex-col gap-3">
        <Link
          href="/products"
          className="flex h-12 items-center justify-center rounded-2xl bg-brand-800 text-sm font-bold text-white"
        >
          مشاهده محصولات
        </Link>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 text-sm font-bold text-slate-700"
        >
          بازگشت به خانه
        </Link>
      </div>
    </main>
  );
}
