import Razorpay from "razorpay";
import crypto from "crypto";

// Server-side Razorpay instance (lazy initialization to avoid build errors on Vercel)
export const razorpay = process.env.RAZORPAY_KEY_ID
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  : (null as unknown as Razorpay);

/**
 * Create a Razorpay order.
 * @param amountInPaise - Total amount in paise (rupees × 100)
 * @param receiptId - Our internal order UUID for cross-referencing
 */
export async function createRazorpayOrder(
  amountInPaise: number,
  receiptId: string
) {
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: receiptId,
    payment_capture: true,
  });

  return order;
}

/**
 * Verify Razorpay payment signature from client-side callback.
 * Used as a secondary check on the checkout success page.
 * Primary verification is always done in the webhook.
 */
export function verifyPaymentSignature({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(razorpay_signature)
  );
}

/**
 * Verify Razorpay webhook signature.
 * Uses the webhook secret (different from payment secret).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}
