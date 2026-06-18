import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout — review your order and complete payment",
};

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/checkout");

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold mb-2">
            Secure Checkout
          </p>
          <h1 className="text-3xl font-black text-foreground">Complete Your Order</h1>
        </div>
        <CheckoutForm />
      </div>
    </div>
  );
}
