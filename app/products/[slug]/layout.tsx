import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/products-server";

// The page itself renders on the client; this server layout gives each
// product its own title, description and share preview for search engines.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug)).catch(
    () => null
  );

  if (!product) return { title: "محصول پیدا نشد" };

  const description =
    product.description ||
    `${product.name} با کد فنی ${product.code}${product.brand ? `، مناسب ${product.brand}` : ""}`;

  return {
    title: product.name,
    description: description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: description.slice(0, 160),
      images: product.image.startsWith("/images/") ? [product.image] : [],
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
