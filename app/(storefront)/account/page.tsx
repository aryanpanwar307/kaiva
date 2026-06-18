import { getMyOrders } from "@/actions/orders";
import Link from "next/link";
import { formatPrice, formatDate, paymentStatusColor } from "@/lib/utils";
import { Package, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Orders" };

export default async function AccountPage() {
  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Package className="h-16 w-16 text-border mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No orders yet
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Start shopping to see your orders here
        </p>
        <Link
          href="/shop"
          className="px-6 py-3 bg-gold text-[#0a0a0a] rounded-full font-bold text-sm hover:bg-gold-light transition-colors"
        >
          Browse Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground mb-6">
        Your Orders ({orders.length})
      </h2>

      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          id={`order-row-${order.id}`}
          className="group flex items-center justify-between p-5 bg-card border border-border rounded-xl hover:border-gold/40 transition-all duration-150"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(order.created_at)} ·{" "}
                {order.order_items?.length ?? 0} item(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-gold">{formatPrice(order.total_amount)}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentStatusColor(order.payment_status)}`}
              >
                {order.payment_status.charAt(0).toUpperCase() +
                  order.payment_status.slice(1)}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
