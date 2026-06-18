import { createServiceClient } from "@/lib/supabase/server";
import { adminGetAllOrders } from "@/actions/orders";
import { adminListProducts } from "@/actions/products";
import { formatPrice } from "@/lib/utils";
import { Package, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const [orders, products] = await Promise.all([
    adminGetAllOrders(),
    adminListProducts(),
  ]);

  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingOrders = orders.filter((o) => o.payment_status === "pending").length;

  const stats = [
    { label: "Total Revenue", value: formatPrice(totalRevenue), icon: DollarSign, color: "text-gold" },
    { label: "Total Orders", value: paidOrders.length, icon: ShoppingBag, color: "text-emerald-400" },
    { label: "Pending Orders", value: pendingOrders, icon: TrendingUp, color: "text-amber-400" },
    { label: "Total Products", value: products.length, icon: Package, color: "text-blue-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, Admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
              <div className={`p-2 rounded-lg bg-muted`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-gold hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-border">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-foreground">{formatPrice(order.total_amount)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  order.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                  order.payment_status === "pending" ? "bg-amber-500/10 text-amber-400" :
                  "bg-red-500/10 text-red-400"
                }`}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="px-6 py-8 text-center text-muted-foreground text-sm">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
