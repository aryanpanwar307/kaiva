"use client";

import { useState } from "react";
import { ShoppingBag, Heart, Check } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { formatPrice, categoryLabel, themeLabel } from "@/lib/utils";
import type { ProductWithSkus, ProductSku } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageGallery } from "./ImageGallery";
import { toggleWishlist } from "@/actions/products";

interface ProductDetailProps {
  product: ProductWithSkus;
  initialWishlisted: boolean;
}

export function ProductDetail({ product, initialWishlisted }: ProductDetailProps) {
  const [selectedSku, setSelectedSku] = useState<ProductSku>(
    product.product_skus[0]
  );
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlistStore();

  const wishlisted = isWishlisted(selectedSku.id);
  const inStock = selectedSku.stock_quantity > 0;
  const lowStock =
    inStock && selectedSku.stock_quantity <= 5;
  const unitPrice = product.base_price + selectedSku.price_modifier;

  const images = product.product_skus.map((s) => s.sku_image_url).filter(Boolean) as string[];
  const selectedImages = selectedSku.sku_image_url
    ? [selectedSku.sku_image_url, ...images.filter((i) => i !== selectedSku.sku_image_url)]
    : images;

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem(selectedSku.id);
    openCart();
    setAddedToCart(true);
    toast.success(`${product.title} (${selectedSku.color}) added to cart!`);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWishlist = async () => {
    if (wishlisted) {
      removeFromWishlist(selectedSku.id);
    } else {
      addToWishlist(selectedSku.id);
    }
    await toggleWishlist(selectedSku.id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Gallery */}
      <ImageGallery images={selectedImages} productTitle={product.title} />

      {/* Details */}
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-2">
            {categoryLabel(product.category)}
          </p>
          <h1 className="text-3xl font-black text-foreground leading-tight">
            {product.title}
          </h1>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-gold">
            {formatPrice(unitPrice)}
          </span>
          {selectedSku.price_modifier !== 0 && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.base_price)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div>
          {!inStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
              Out of Stock
            </span>
          ) : lowStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
              Only {selectedSku.stock_quantity} left!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              In Stock
            </span>
          )}
        </div>

        {/* Color / SKU Selector */}
        {product.product_skus.length > 1 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Color:{" "}
              <span className="text-foreground normal-case tracking-normal">
                {selectedSku.color}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.product_skus.map((sku) => (
                <button
                  key={sku.id}
                  id={`sku-select-${sku.id}`}
                  onClick={() => setSelectedSku(sku)}
                  disabled={sku.stock_quantity === 0}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150",
                    selectedSku.id === sku.id
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:border-gold/40 hover:text-foreground",
                    sku.stock_quantity === 0 && "opacity-40 cursor-not-allowed line-through"
                  )}
                >
                  {sku.color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Themes */}
        {product.themes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.themes.map((theme) => (
              <span
                key={theme}
                className="px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/20 text-xs font-medium"
              >
                {themeLabel(theme)}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            id="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={!inStock}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-13 rounded-full font-bold text-sm transition-all duration-200 active:scale-95",
              inStock
                ? addedToCart
                  ? "bg-emerald-500 text-white"
                  : "bg-gold text-[#0a0a0a] hover:bg-gold-light shadow-gold"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {addedToCart ? (
              <>
                <Check className="h-4 w-4" />
                Added!
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </>
            )}
          </button>

          <button
            id="wishlist-btn"
            onClick={handleWishlist}
            className={cn(
              "h-13 w-13 flex items-center justify-center rounded-full border transition-all duration-150",
              wishlisted
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-muted-foreground hover:border-gold/40 hover:text-gold"
            )}
            aria-label="Add to wishlist"
          >
            <Heart className={cn("h-5 w-5", wishlisted && "fill-gold")} />
          </button>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
          {[
            { icon: "🚚", label: "Free Shipping" },
            { icon: "↩️", label: "7-Day Returns" },
            { icon: "✅", label: "Authentic Quality" },
          ].map(({ icon, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
