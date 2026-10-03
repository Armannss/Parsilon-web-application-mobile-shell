import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "محصولات", template: "%s | پارسیلون پارت" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
