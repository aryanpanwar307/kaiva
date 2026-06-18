"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { Lock, CreditCard } from "lucide-react";
import type { ShippingAddress, RazorpayPaymentHandlerArgs } from "@/types";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayPaymentHandlerArgs) => void;
  modal?: { ondismiss?: () => void };
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});

  const validateAddress = (): boolean => {
    const newErrors: Partial<ShippingAddress> = {};
    if (!address.line1) newErrors.line1 = "Street address is required";
    if (!address.city) newErrors.city = "City is required";
    if (!address.state) newErrors.state = "State is required";
    if (!address.pincode || !/^\d{6}$/.test(address.pincode))
      newErrors.pincode = "Valid 6-digit pincode required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateAddress()) return;
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirectTo=/checkout");
        return;
      }

      // Call secure checkout API — server fetches prices, we only send sku_id + qty
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ sku_id, quantity }) => ({ sku_id, quantity })),
          shipping_address: address,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.error ?? "Checkout failed. Please try again.");
        return;
      }

      const checkout = await res.json();

      // Load Razorpay script
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      const rzp = new window.Razorpay({
        key: checkout.key_id,
        amount: checkout.amount,
        currency: checkout.currency,
        name: "KAIVA Jewelry",
        description: "Order Payment",
        order_id: checkout.razorpay_order_id,
        prefill: {
          name: profile?.full_name ?? "",
          email: user.email ?? "",
          contact: profile?.phone ?? "",
        },
        theme: { color: "#d4af37" },
        handler: async (response: RazorpayPaymentHandlerArgs) => {
          // Payment captured — webhook will do the actual fulfillment
          // Just navigate to success page
          clearCart();
          router.push(`/checkout/success?order_id=${checkout.order_id}`);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast("Payment cancelled");
          },
        },
      });

      rzp.open();
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      {/* Address Form */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Shipping Address</h2>
          <p className="text-sm text-muted-foreground">Where should we deliver your jewelry?</p>
        </div>

        <div className="space-y-4">
          <Input
            id="checkout-line1"
            label="Street Address"
            placeholder="123 Main Street, Apartment 4B"
            value={address.line1}
            onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            error={errors.line1}
          />
          <Input
            id="checkout-line2"
            label="Apartment / Floor (Optional)"
            placeholder="Building name, landmark"
            value={address.line2}
            onChange={(e) => setAddress({ ...address, line2: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="checkout-city"
              label="City"
              placeholder="Mumbai"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              error={errors.city}
            />
            <Input
              id="checkout-state"
              label="State"
              placeholder="Maharashtra"
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              error={errors.state}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="checkout-pincode"
              label="Pincode"
              placeholder="400001"
              maxLength={6}
              value={address.pincode}
              onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
              error={errors.pincode}
            />
            <Input
              id="checkout-country"
              label="Country"
              value="India"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-2">
        <div className="bg-card border border-border rounded-2xl p-6 sticky top-28">
          <h2 className="font-bold text-foreground mb-4">Order Summary</h2>

          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.sku_id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item × {item.quantity}</span>
                <span className="text-foreground font-medium text-xs text-muted-foreground">
                  (Price at checkout)
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-emerald-400 font-medium">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Total</span>
              <span className="text-gold font-bold">Calculated securely</span>
            </div>
          </div>

          <button
            id="pay-now-btn"
            onClick={handlePayment}
            disabled={loading || items.length === 0}
            className="w-full flex items-center justify-center gap-2 h-12 bg-gold text-[#0a0a0a] rounded-full font-bold text-sm hover:bg-gold-light transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {loading ? "Processing..." : "Pay with Razorpay"}
          </button>

          <div className="flex items-center justify-center gap-2 mt-3">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">256-bit SSL encrypted checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
