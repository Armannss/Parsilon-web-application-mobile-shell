"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center bg-white px-8 text-center">
      <h1 className="text-lg font-black text-slate-900">مشکلی پیش آمد</h1>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        صفحه بارگذاری نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-brand-800 text-sm font-bold text-white active:scale-[0.98]"
      >
        تلاش دوباره
      </button>
    </main>
  );
}
