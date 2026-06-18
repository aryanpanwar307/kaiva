"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice, getCloudinaryUrl } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/types";
import Image from "next/image";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const [skuData, setSkuData] = useState<{
    color: string;
    sku_image_url: string | null;
    price_modifier: number;
    products: { title: string; base_price: number };
  } | null>(null);

  useEffect(() => {
    // Fetch SKU data from server to display in cart
    const fetchSku = async () => {
      try {
        const res = await fetch(`/api/skus/${item.sku_id}`);
        if (res.ok) {
          const data = await res.json();
          setSkuData(data);
        }
      } catch (e) {
        console.error("Failed to fetch SKU data", e);
      }
    };
    fetchSku();
  }, [item.sku_id]);

  const unitPrice = skuData
    ? skuData.products.base_price + skuData.price_modifier
    : 0;

  const imageUrl = skuData?.sku_image_url
    ? getCloudinaryUrl(skuData.sku_image_url, 120, 120)
    : null;

  return (
    <div className="flex gap-3">
      {/* Image */}
      <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt="Product" fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex items-center justify-center h-full text-2xl">💎</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-1">
          {skuData?.products.title ?? (
            <span className="skeleton h-4 w-28 rounded block" />
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{skuData?.color ?? ""}</p>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity controls */}
          <div className="flex items-center gap-1 border border-border rounded-full px-1">
            <button
              onClick={() => updateQuantity(item.sku_id, item.quantity - 1)}
              className="p-1 hover:text-gold transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.sku_id, item.quantity + 1)}
              className="p-1 hover:text-gold transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {skuData && (
              <span className="text-sm font-bold text-gold">
                {formatPrice(unitPrice * item.quantity)}
              </span>
            )}
            <button
              onClick={() => removeItem(item.sku_id)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
