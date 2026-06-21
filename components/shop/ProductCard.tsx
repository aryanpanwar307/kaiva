"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { cn, formatPrice, getCloudinaryUrl, categoryLabel } from "@/lib/utils";
import type { ProductWithSkus } from "@/types";
import { toast } from "sonner";

interface ProductCardProps {
  product: ProductWithSkus;
}

export function ProductCard({ product }: ProductCardProps) {
  // ─── All data-fetching hooks preserved exactly as-is ───
  const { addItem, openCart } = useCartStore();
  const { isWishlisted, toggleWishlist } = useWishlistStore();

  const firstSku = product.product_skus?.[0];
  const imageUrl = firstSku?.sku_image_url
    ? getCloudinaryUrl(firstSku.sku_image_url, 600, 750)
    : null;
  const isWishlistedState = firstSku ? isWishlisted(firstSku.id) : false;
  const inStock = product.product_skus?.some((s) => s.stock_quantity > 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!firstSku || !inStock) return;
    addItem(firstSku.id);
    openCart();
    toast.success(`${product.title} added to cart!`);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!firstSku) return;
    toggleWishlist(firstSku.id);
    // Server sync happens via dedicated wishlist action
    const { toggleWishlist: serverToggle } = await import("@/actions/products");
    await serverToggle(firstSku.id);
  };

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      {/* ─── Image Container — 4:5 portrait aspect ratio ─── */}
      <div className="product-image-container relative w-full bg-[#F7F4F0]" style={{ aspectRatio: "4/5" }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F3EFEC]">
            <span className="font-serif text-4xl text-[#C5A059]/40">✦</span>
          </div>
        )}

        {/* Wishlist button — appears on hover */}
        <button
          id={`wishlist-${product.id}`}
          onClick={handleWishlist}
          className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white"
          aria-label="Add to wishlist"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isWishlistedState ? "fill-[#C5A059] text-[#C5A059]" : "text-[#6B6B6B]"
            )}
            strokeWidth={1.5}
          />
        </button>

        {/* Sold Out badge */}
        {!inStock && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#2A2A2A]/80 text-white text-[9px] uppercase tracking-widest font-sans font-medium">
            Sold Out
          </div>
        )}
      </div>

      {/* ─── Product Info — fixed height so all cards align ─── */}
      <div className="pt-4 text-center flex flex-col">
        {/* Category label */}
        <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-1.5">
          {categoryLabel(product.category)}
        </p>

        {/* Title — always exactly 2 lines tall */}
        <h3
          className="font-serif text-sm text-[#2A2A2A] leading-snug line-clamp-2 group-hover:text-[#C5A059] transition-colors duration-150 mb-2"
          style={{ minHeight: "2.6em" }} /* reserves space for 2 lines always */
        >
          {product.title}
        </h3>

        {/* Color swatches — always rendered; invisible placeholder when only 1 variant */}
        <div className="flex gap-1.5 justify-center mb-2.5" style={{ minHeight: "14px" }}>
          {product.product_skus && product.product_skus.length > 1 ? (
            <>
              {product.product_skus.slice(0, 4).map((sku) => (
                <div
                  key={sku.id}
                  title={sku.color}
                  className="h-2.5 w-2.5 rounded-full border border-[#E0DEDA]"
                  style={{
                    backgroundColor:
                      sku.color.toLowerCase() === "gold"      ? "#C5A059" :
                      sku.color.toLowerCase() === "silver"    ? "#B8B8B8" :
                      sku.color.toLowerCase() === "rose gold" ? "#C2857C" :
                      sku.color.toLowerCase() === "black"     ? "#2A2A2A" :
                      sku.color.toLowerCase() === "white"     ? "#F0F0F0" :
                      "#999",
                  }}
                />
              ))}
              {product.product_skus.length > 4 && (
                <span className="font-sans text-[10px] text-[#6B6B6B] self-center">
                  +{product.product_skus.length - 4}
                </span>
              )}
            </>
          ) : (
            /* invisible spacer — keeps price at same Y when no swatches */
            <span aria-hidden="true" />
          )}
        </div>

        {/* Price */}
        <p className="font-sans text-sm text-[#2A2A2A] font-medium mb-3">
          {formatPrice(product.base_price)}
        </p>

        {/* Add to Cart */}
        <button
          id={`quick-add-${product.id}`}
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full border border-[#C5A059] text-[#C5A059] font-sans text-[10px] font-medium uppercase tracking-[0.15em] py-2.5 transition-all duration-200 hover:bg-[#C5A059] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </Link>
  );
}
