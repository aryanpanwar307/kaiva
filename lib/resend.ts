import { Resend } from "resend";
import { renderOrderConfirmationEmail } from "@/emails/OrderConfirmation";
import type { OrderWithItems } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(
  toEmail: string,
  toName: string,
  order: OrderWithItems
) {
  const html = await renderOrderConfirmationEmail({ order, toName });

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: toEmail,
    subject: `Your KAIVA Order #${order.id.slice(0, 8).toUpperCase()} is Confirmed! 💎`,
    html,
  });

  if (error) {
    console.error("[Resend] Failed to send order confirmation:", error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  return data;
}

export async function sendOrderShippedEmail(
  toEmail: string,
  toName: string,
  orderId: string,
  trackingId: string
) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: toEmail,
    subject: `Your KAIVA Order Has Shipped! 🚚`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #f5f5f5;">
        <h1 style="font-size: 24px; font-weight: 700; color: #d4af37; margin-bottom: 8px;">Your order is on its way!</h1>
        <p style="color: #a3a3a3; margin-bottom: 24px;">Hi ${toName}, your KAIVA jewelry is en route to you.</p>
        <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="margin: 0; color: #f5f5f5;"><strong>Order:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
          <p style="margin: 8px 0 0; color: #f5f5f5;"><strong>Tracking ID:</strong> ${trackingId}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${orderId}" 
           style="display: inline-block; background: #d4af37; color: #0a0a0a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Track Your Order
        </a>
      </div>
    `,
  });

  if (error) {
    console.error("[Resend] Failed to send shipped email:", error);
  }

  return data;
}
