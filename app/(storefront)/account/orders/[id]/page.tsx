import { notFound } from "next/navigation";
import { getOrderById } from "@/actions/orders";
import { formatPrice, formatDate, paymentStatusColor, getCloudinaryUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { TrackingWidget } from "@/components/account/TrackingWidget";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order #${id.slice(0, 8).toUpperCase()}` };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const address = order.shipping_address;
  const addressStr = [address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColor(order.payment_status)}`}
        >
          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Items Ordered</h3>
            </div>
            <div className="divide-y divide-border">
              {order.order_items.map((item) => {
                const product = Array.isArray(item.product_skus?.products)
                  ? item.product_skus.products[0]
                  : item.product_skus?.products;
                const sku = item.product_skus;
                const imageUrl = sku?.sku_image_url
                  ? getCloudinaryUrl(sku.sku_image_url, 200, 200)
                  : null;

                return (
                  <div key={item.id} className="flex gap-4 px-5 py-4">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product?.title ?? "Product"}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-2xl">💎</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{product?.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sku?.color}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold text-sm">
                        {formatPrice(item.purchase_price * item.quantity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.purchase_price)} each
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-black text-gold text-lg">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Tracking */}
          {order.tracking_id && (
            <TrackingWidget trackingId={order.tracking_id} />
          )}
          {!order.tracking_id && order.payment_status === "paid" && (
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <p className="text-muted-foreground text-sm">
                🚚 Your order is being prepared for shipment. Tracking info will appear here soon.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Shipping Address */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">Shipping To</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{addressStr}</p>
          </div>

          {/* Payment Info */}
          {order.payment_id && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Payment</h3>
              <p className="text-xs text-muted-foreground">
                Payment ID:{" "}
                <span className="font-mono text-foreground">{order.payment_id}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
