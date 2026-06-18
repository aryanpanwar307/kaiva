"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag } from "lucide-react";

export function CartSummary() {
  const router = useRouter();
  const { closeCart } = useCartStore();

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <div className="px-6 py-5 space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Shipping</span>
        <span className="text-emerald-400 font-medium">Free</span>
      </div>
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground mb-1">Final total calculated at checkout</p>
      </div>
      <button
        id="proceed-to-checkout-btn"
        onClick={handleCheckout}
        className="w-full flex items-center justify-center gap-2 h-12 bg-gold text-[#0a0a0a] rounded-full font-bold text-sm hover:bg-gold-light transition-colors active:scale-95"
      >
        <ShoppingBag className="h-4 w-4" />
        Proceed to Checkout
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Secure checkout powered by Razorpay
      </p>
    </div>
  );
}
