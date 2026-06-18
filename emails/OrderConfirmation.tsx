import type { OrderWithItems } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";

interface OrderConfirmationProps {
  order: OrderWithItems;
  toName: string;
}

export async function renderOrderConfirmationEmail({
  order,
  toName,
}: OrderConfirmationProps): Promise<string> {
  const itemRows = order.order_items
    .map((item) => {
      const product = Array.isArray(item.product_skus?.products)
        ? item.product_skus.products[0]
        : item.product_skus?.products;
      const sku = item.product_skus;
      const subtotal = item.purchase_price * item.quantity;

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #2a2a2a;">
            <div style="font-weight: 600; color: #f5f5f5;">${product?.title ?? "Product"}</div>
            <div style="font-size: 12px; color: #737373; margin-top: 2px;">${sku?.color ?? ""}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #2a2a2a; text-align: center; color: #a3a3a3;">
            ×${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #2a2a2a; text-align: right; color: #d4af37; font-weight: 600;">
            ${formatPrice(subtotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  const address = order.shipping_address;
  const addressStr = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation — KAIVA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 32px; font-weight: 800; letter-spacing: 0.3em; color: #d4af37; margin: 0;">KAIVA</h1>
      <p style="color: #525252; font-size: 13px; letter-spacing: 0.15em; margin: 6px 0 0; text-transform: uppercase;">Artificial Jewelry</p>
    </div>

    <!-- Hero -->
    <div style="background: linear-gradient(135deg, #1a1208 0%, #0a0a0a 100%); border: 1px solid #2a2010; border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">💎</div>
      <h2 style="font-size: 24px; font-weight: 700; color: #f5f5f5; margin: 0 0 8px;">Order Confirmed!</h2>
      <p style="color: #a3a3a3; margin: 0; font-size: 15px;">
        Hi ${toName}, thank you for your purchase. Your jewelry is being prepared with care.
      </p>
    </div>

    <!-- Order Details -->
    <div style="background: #111111; border: 1px solid #1f1f1f; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <p style="margin: 0; color: #525252; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Order ID</p>
          <p style="margin: 4px 0 0; color: #f5f5f5; font-weight: 600; font-size: 14px;">#${order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; color: #525252; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Date</p>
          <p style="margin: 4px 0 0; color: #f5f5f5; font-weight: 600; font-size: 14px;">${formatDate(order.created_at)}</p>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #2a2a2a;">
            <th style="padding: 8px 12px; text-align: left; color: #525252; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Item</th>
            <th style="padding: 8px 12px; text-align: center; color: #525252; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Qty</th>
            <th style="padding: 8px 12px; text-align: right; color: #525252; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 16px 12px 4px; text-align: right; color: #737373; font-size: 13px;">Subtotal</td>
            <td style="padding: 16px 12px 4px; text-align: right; color: #f5f5f5; font-weight: 600;">${formatPrice(order.total_amount)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 12px; text-align: right; color: #737373; font-size: 13px;">Shipping</td>
            <td style="padding: 4px 12px; text-align: right; color: #10b981; font-weight: 600;">FREE</td>
          </tr>
          <tr style="border-top: 1px solid #2a2a2a;">
            <td colspan="2" style="padding: 12px 12px 4px; text-align: right; color: #f5f5f5; font-weight: 700; font-size: 16px;">Total</td>
            <td style="padding: 12px 12px 4px; text-align: right; color: #d4af37; font-weight: 800; font-size: 18px;">${formatPrice(order.total_amount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Shipping Address -->
    <div style="background: #111111; border: 1px solid #1f1f1f; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Shipping To</h3>
      <p style="margin: 0; color: #f5f5f5; line-height: 1.6; font-size: 14px;">${addressStr}</p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 40px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}"
         style="display: inline-block; background: linear-gradient(135deg, #d4af37, #f4d03f); color: #0a0a0a; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.05em;">
        Track Your Order →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid #1a1a1a; padding-top: 32px;">
      <p style="margin: 0 0 8px; color: #d4af37; font-weight: 700; font-size: 16px; letter-spacing: 0.2em;">KAIVA</p>
      <p style="margin: 0; color: #404040; font-size: 12px;">
        Questions? Reply to this email or contact us at support@kaiva.in
      </p>
      <p style="margin: 16px 0 0; color: #2a2a2a; font-size: 11px;">
        © ${new Date().getFullYear()} KAIVA. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}
