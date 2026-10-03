"use client";

import { useState } from "react";
import {
  getFallbackProductImage,
  resolveProductImage,
} from "@/lib/admin-products";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
};

/** Product photo that falls back to the brand placeholder if the file is missing. */
export default function ProductImage({
  src,
  alt,
  className,
  eager = false,
}: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(resolveProductImage(src));

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setImageSrc(getFallbackProductImage())}
      className={className}
    />
  );
}
