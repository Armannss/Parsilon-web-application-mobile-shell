"use client";

import { useCart } from "../../context/CartContext";

export default function CartToast() {
  const { toastMessage, isToastVisible, hideToast, isCartReady } = useCart();

  if (!isCartReady) return null;
  if (!toastMessage) return null;

  return (
    <div
      className={`pointer-events-none fixed left-1/2 z-[60] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 transition-all duration-300 ${
        isToastVisible ? "bottom-24 opacity-100" : "bottom-20 opacity-0"
      }`}
    >
      <div className="pointer-events-auto rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <span className="line-clamp-2">{toastMessage}</span>
          <button
            type="button"
            onClick={hideToast}
            className="shrink-0 rounded-xl bg-white/10 px-2 py-1 text-xs font-bold text-white"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}