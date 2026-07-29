"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyProductRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const raw = params?.id;
    const value = typeof raw === "string" ? decodeURIComponent(raw) : "";

    if (value) {
      router.replace(`/products/${encodeURIComponent(value)}`);
    } else {
      router.replace("/products");
    }
  }, [params, router]);

  return null;
}