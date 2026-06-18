import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface SuccessPageProps {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { order_id } = await searchParams;

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4 animate-scale-in">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-emerald-400" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-foreground mb-3">
          Order Placed! 🎉
        </h1>
        <p className="text-muted-foreground mb-2">
          Your jewelry is being prepared with care. You&apos;ll receive a
          confirmation email shortly.
        </p>
        {order_id && (
          <p className="text-sm text-muted-foreground mb-8">
            Order ID:{" "}
            <span className="text-gold font-mono font-semibold">
              #{order_id.slice(0, 8).toUpperCase()}
            </span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {order_id && (
            <Link
              href={`/account/orders/${order_id}`}
              id="view-order-btn"
              className="px-6 py-3 bg-gold text-[#0a0a0a] rounded-full font-bold text-sm hover:bg-gold-light transition-colors"
            >
              Track Your Order
            </Link>
          )}
          <Link
            href="/shop"
            className="px-6 py-3 border border-border text-foreground rounded-full font-semibold text-sm hover:border-gold hover:text-gold transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
