import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/resend";
import { createShiprocketOrder } from "@/lib/shiprocket";
import type { OrderWithItems } from "@/types";

// IMPORTANT: Disable body parsing to preserve raw body for HMAC verification
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Read raw body BEFORE any parsing — needed for HMAC signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("[webhook] Missing Razorpay signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // 2. Verify HMAC-SHA256 signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("[webhook] Invalid Razorpay signature — rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Parse the verified payload
    const payload = JSON.parse(rawBody);
    const event = payload.event as string;

    console.log(`[webhook] Received event: ${event}`);

    // 4. Handle payment.captured event only
    if (event !== "payment.captured") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const razorpayOrderId = payload.payload?.payment?.entity?.order_id as string;
    const razorpayPaymentId = payload.payload?.payment?.entity?.id as string;

    if (!razorpayOrderId || !razorpayPaymentId) {
      console.error("[webhook] Missing order_id or payment_id in payload");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();

    // 5. Idempotency check — prevent double processing
    const { data: existingOrder, error: fetchError } = await serviceSupabase
      .from("orders")
      .select("id, payment_status, user_id")
      .eq("razorpay_order_id", razorpayOrderId)
      .single();

    if (fetchError || !existingOrder) {
      console.error("[webhook] Order not found for Razorpay order:", razorpayOrderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existingOrder.payment_status === "paid") {
      console.log("[webhook] Order already processed — idempotent skip:", existingOrder.id);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 6. Fetch order items for stock decrement
    const { data: orderItems, error: itemsError } = await serviceSupabase
      .from("order_items")
      .select("sku_id, quantity")
      .eq("order_id", existingOrder.id);

    if (itemsError || !orderItems) {
      console.error("[webhook] Failed to fetch order items:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      );
    }

    // 7. Atomic stock decrement using our DB function (SELECT FOR UPDATE inside)
    for (const item of orderItems) {
      const { error: stockError } = await serviceSupabase.rpc("decrement_stock", {
        p_sku_id: item.sku_id,
        p_qty: item.quantity,
      });

      if (stockError) {
        console.error(
          `[webhook] Stock decrement failed for SKU ${item.sku_id}:`,
          stockError
        );
        // Mark order as failed if stock is insufficient
        await serviceSupabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", existingOrder.id);

        return NextResponse.json(
          { error: "Stock decrement failed — order marked as failed" },
          { status: 422 }
        );
      }
    }

    // 8. Update order status to paid
    const { error: updateError } = await serviceSupabase
      .from("orders")
      .update({
        payment_status: "paid",
        payment_id: razorpayPaymentId,
      })
      .eq("id", existingOrder.id);

    if (updateError) {
      console.error("[webhook] Order status update failed:", updateError);
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    // 9. Fetch full order + user data for email
    const { data: fullOrder } = await serviceSupabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          product_skus (
            *,
            products (*)
          )
        )
      `
      )
      .eq("id", existingOrder.id)
      .single();

    const { data: userData } = await serviceSupabase.auth.admin.getUserById(
      existingOrder.user_id
    );

    // 10. Send order confirmation email via Resend
    if (fullOrder && userData?.user?.email) {
      try {
        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("full_name")
          .eq("id", existingOrder.user_id)
          .single();

        await sendOrderConfirmationEmail(
          userData.user.email,
          profile?.full_name ?? "Valued Customer",
          fullOrder as unknown as OrderWithItems
        );
        console.log(`[webhook] Confirmation email sent to ${userData.user.email}`);
      } catch (emailError) {
        // Log but don't fail the webhook — order is already marked paid
        console.error("[webhook] Email send failed:", emailError);
      }
    }

    // 11. Create Shiprocket shipment — runs after email to keep webhook fast
    if (fullOrder && userData?.user?.email) {
      try {
        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", existingOrder.user_id)
          .single();

        const shiprocketResult = await createShiprocketOrder(
          fullOrder as unknown as OrderWithItems,
          profile?.full_name ?? null,
          userData.user.email,
          profile?.phone ?? null
        );

        // Store the Shiprocket shipment_id as the tracking reference on the order
        await serviceSupabase
          .from("orders")
          .update({ tracking_id: String(shiprocketResult.shipment_id) })
          .eq("id", existingOrder.id);

        console.log(
          `[webhook] Shiprocket shipment created → shipment_id: ${shiprocketResult.shipment_id}`
        );
      } catch (shiprocketError) {
        // Log but never fail the webhook — payment is confirmed, shipping can be retried
        console.error("[webhook] Shiprocket order creation failed:", shiprocketError);
      }
    }

    console.log(`[webhook] Order ${existingOrder.id} fulfilled successfully`);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[webhook] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
