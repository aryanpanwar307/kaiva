"use client";

import { useCartStore } from "@/store/cartStore";
import { X, ShoppingBag } from "lucide-react";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { isOpen, items, closeCart } = useCartStore();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-card border-l border-border shadow-card",
          "transition-transform duration-350 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-gold" />
            <h2 className="font-semibold text-foreground">Your Cart</h2>
            {items.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-xs font-medium">
                {items.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            id="close-cart-btn"
            onClick={closeCart}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-16 w-16 text-border mb-4" />
              <h3 className="font-semibold text-foreground mb-1">Your cart is empty</h3>
              <p className="text-muted-foreground text-sm mb-6">Add some beautiful pieces to get started</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="px-6 py-2.5 bg-gold text-[#0a0a0a] rounded-full font-semibold text-sm hover:bg-gold-light transition-colors"
              >
                Browse Collection
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem key={item.sku_id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div className="border-t border-border">
            <CartSummary />
          </div>
        )}
      </div>
    </>
  );
}
