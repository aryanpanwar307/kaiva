import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import type { CartItem, CheckoutRequest, CheckoutResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body: CheckoutRequest = await request.json();

    if (
      !body.items ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        { error: "Cart is empty or invalid" },
        { status: 400 }
      );
    }

    if (!body.shipping_address) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    const items: CartItem[] = body.items;

    // 3. Use service client to bypass RLS for atomic operations
    const serviceSupabase = await createServiceClient();

    // 4. Fetch ALL SKU data (prices) directly from DB — NEVER trust client prices
    const skuIds = items.map((i) => i.sku_id);
    const { data: skus, error: skuError } = await serviceSupabase
      .from("product_skus")
      .select(
        `
        id,
        price_modifier,
        stock_quantity,
        products (
          id,
          base_price,
          title,
          is_active
        )
      `
      )
      .in("id", skuIds);

    if (skuError || !skus) {
      console.error("[checkout] SKU fetch error:", skuError);
      return NextResponse.json(
        { error: "Failed to fetch product data" },
        { status: 500 }
      );
    }

    // 5. Validate all SKUs exist and products are active
    if (skus.length !== skuIds.length) {
      return NextResponse.json(
        { error: "One or more items are no longer available" },
        { status: 400 }
      );
    }

    // 6. Compute true total from DB prices (client price is completely ignored)
    let totalAmount = 0;
    const lineItems: {
      sku_id: string;
      quantity: number;
      unit_price: number;
    }[] = [];

    for (const item of items) {
      const sku = skus.find((s) => s.id === item.sku_id);
      if (!sku) {
        return NextResponse.json(
          { error: `SKU ${item.sku_id} not found` },
          { status: 400 }
        );
      }

      const product = Array.isArray(sku.products)
        ? sku.products[0]
        : sku.products;

      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: `Product is no longer active` },
          { status: 400 }
        );
      }

      // 7. Validate stock availability
      if (sku.stock_quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.title}. Available: ${sku.stock_quantity}`,
          },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.base_price) + Number(sku.price_modifier);
      totalAmount += unitPrice * item.quantity;

      lineItems.push({
        sku_id: item.sku_id,
        quantity: item.quantity,
        unit_price: unitPrice,
      });
    }

    // 8. Create Razorpay order first (get the order ID)
    const amountInPaise = Math.round(totalAmount * 100);
    const tempReceiptId = `kaiva_${Date.now()}`;
    const razorpayOrder = await createRazorpayOrder(
      amountInPaise,
      tempReceiptId
    );

    // 9. Insert order with PENDING status
    const { data: order, error: orderError } = await serviceSupabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        payment_status: "pending",
        razorpay_order_id: razorpayOrder.id,
        shipping_address: body.shipping_address,
        idempotency_key: razorpayOrder.id, // Use Razorpay order ID as idempotency key
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("[checkout] Order insert error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // 10. Insert order items with locked purchase_price from DB
    const { error: itemsError } = await serviceSupabase
      .from("order_items")
      .insert(
        lineItems.map((li) => ({
          order_id: order.id,
          sku_id: li.sku_id,
          quantity: li.quantity,
          purchase_price: li.unit_price, // Server-computed — never from client
        }))
      );

    if (itemsError) {
      console.error("[checkout] Order items insert error:", itemsError);
      // Cleanup orphaned order
      await serviceSupabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 }
      );
    }

    // 11. Return Razorpay session payload to client
    const response: CheckoutResponse = {
      razorpay_order_id: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      order_id: order.id,
      key_id: process.env.RAZORPAY_KEY_ID!,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[checkout] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
