import { notFound } from "next/navigation";
import { getProductBySlug, getWishlistSkuIds } from "@/actions/products";
import { ProductDetail } from "@/components/product/ProductDetail";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.title,
    description: product.description ?? `${product.title} — Luxury artificial jewelry from KAIVA`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const [product, wishlistSkuIds] = await Promise.all([
    getProductBySlug(slug),
    getWishlistSkuIds(),
  ]);

  if (!product) notFound();

  const initialWishlisted = product.product_skus.some((sku) =>
    wishlistSkuIds.includes(sku.id)
  );

  return (
    <div className="pt-20 min-h-screen">
      <ProductDetail product={product} initialWishlisted={initialWishlisted} />
    </div>
  );
}
