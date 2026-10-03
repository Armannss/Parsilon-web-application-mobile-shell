"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useCart } from "@/context/CartContext";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 transition-colors duration-200 ${
        active ? "text-blue-900" : "text-slate-500"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 10.5L12 3l9 7.5M5.25 9.75V21h13.5V9.75"
      />
    </svg>
  );
}

function ProductsIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 transition-colors duration-200 ${
        active ? "text-blue-900" : "text-slate-500"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 7.5h16M4 12h16M4 16.5h16"
      />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 transition-colors duration-200 ${
        active ? "text-blue-900" : "text-slate-500"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function CartIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 transition-colors duration-200 ${
        active ? "text-blue-900" : "text-slate-500"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 4h2l2.2 10.2a1.5 1.5 0 001.47 1.18h8.4a1.5 1.5 0 001.46-1.15L20 8H6.2M9.5 20a.75.75 0 100-1.5.75.75 0 000 1.5zm8 0a.75.75 0 100-1.5.75.75 0 000 1.5z"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 transition-colors duration-200 ${
        active ? "text-blue-900" : "text-slate-500"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0"
      />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  const hiddenPaths = ["/cart", "/checkout", "/payment", "/order-success", "/login"];

  const navItems = useMemo(
    () => [
      {
        href: "/",
        label: "خانه",
        active: pathname === "/",
        icon: <HomeIcon active={pathname === "/"} />,
      },
      {
        href: "/products",
        label: "محصولات",
        active: pathname.startsWith("/products"),
        icon: <ProductsIcon active={pathname.startsWith("/products")} />,
      },
      {
        href: "/search",
        label: "جستجو",
        active: pathname === "/search",
        icon: <SearchIcon active={pathname === "/search"} />,
      },
      {
        href: "/cart",
        label: "سبد خرید",
        active: pathname === "/cart",
        icon: <CartIcon active={pathname === "/cart"} />,
        badge: cartCount,
      },
      {
        href: "/profile",
        label: "حساب",
        active: pathname.startsWith("/profile"),
        icon: <ProfileIcon active={pathname.startsWith("/profile")} />,
      },
    ],
    [pathname, cartCount]
  );

  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="bottom-safe fixed left-1/2 z-30 w-[calc(100%-20px)] max-w-[372px] -translate-x-1/2 rounded-[24px] border p-1.5 backdrop-blur"
      style={{
        borderColor: "#D9E1EC",
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
      }}
    >
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className="relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 transition-all duration-200 active:scale-95"
            style={
              item.active
                ? {
                    background: "#EEF3F8",
                    boxShadow: "0 2px 10px rgba(23,71,158,0.05)",
                  }
                : {}
            }
          >
            {item.active ? (
              <span
                className="absolute top-1 h-[3px] w-8 rounded-full"
                style={{ background: "#8CC63F" }}
              />
            ) : null}

            <div
              className="relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200"
              style={
                item.active
                  ? {
                      background: "#FFFFFF",
                      boxShadow: "0 2px 8px rgba(23,71,158,0.08)",
                    }
                  : {}
              }
            >
              {item.icon}

              {"badge" in item && item.badge ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white">
                  {item.badge > 99 ? "۹۹+" : item.badge.toLocaleString("fa-IR")}
                </span>
              ) : null}
            </div>

            <span
              className="whitespace-nowrap text-[10px] font-bold transition-colors duration-200"
              style={{
                color: item.active ? "#17479E" : "#6B7B95",
              }}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}