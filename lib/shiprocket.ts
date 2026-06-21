/**
 * lib/shiprocket.ts
 * ─────────────────────────────────────────────────────────────
 * Shiprocket API integration for KAIVA.
 *
 * Responsibilities:
 *  1. Authenticate with Shiprocket (email + password → Bearer token).
 *  2. Create a prepaid shipment order after successful Razorpay payment.
 *  3. Fetch tracking milestones for the order tracking page.
 *
 * Token is cached in-memory for up to 9 days (Shiprocket tokens expire in 10 days).
 * On Vercel serverless, the cache lives per-instance and will re-auth naturally.
 * ─────────────────────────────────────────────────────────────
 */

import type { OrderWithItems, ShiprocketTrackingResponse } from "@/types";

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

// ─── In-memory token cache ────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // Unix ms timestamp
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000; // 9 days

// ─── Auth ─────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "[shiprocket] SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD env vars are required."
    );
  }

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[shiprocket] Auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const token = data.token as string;

  if (!token) {
    throw new Error("[shiprocket] Auth response did not contain a token.");
  }

  cachedToken = token;
  tokenExpiresAt = Date.now() + TOKEN_TTL_MS;

  console.log("[shiprocket] Authenticated successfully. Token cached.");
  return token;
}

// ─── Helpers ──────────────────────────────────────────────────

/** Split full_name into first + last for Shiprocket billing fields. */
function splitName(fullName: string | null): { first: string; last: string } {
  const parts = (fullName ?? "Customer").trim().split(" ");
  const first = parts[0] ?? "Customer";
  const last = parts.slice(1).join(" ") || ".";
  return { first, last };
}

/** Format a JS Date to Shiprocket's expected format: "YYYY-MM-DD HH:MM" */
function formatOrderDate(dateStr: string): string {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// ─── Create Shiprocket Order ───────────────────────────────────

export interface ShiprocketOrderResult {
  shiprocket_order_id: number;
  shipment_id: number;
  status: string;
  awb_code?: string;
}

/**
 * Creates a prepaid order on Shiprocket after a successful payment.
 *
 * @param order       - Full order with items, prices, and shipping address from our DB.
 * @param customerName - Customer's full name from their profile.
 * @param customerEmail - Customer's email from Supabase Auth.
 * @param customerPhone - Customer's phone from their profile.
 */
export async function createShiprocketOrder(
  order: OrderWithItems,
  customerName: string | null,
  customerEmail: string,
  customerPhone: string | null
): Promise<ShiprocketOrderResult> {
  const token = await getToken();
  const { first, last } = splitName(customerName);
  const addr = order.shipping_address;

  // Pickup location must match the name in Shiprocket → Settings → Pickup Addresses
  const pickupLocation =
    process.env.SHIPROCKET_PICKUP_LOCATION ?? "Primary";

  // Map our OrderItem rows to Shiprocket's order_items array
  const orderItems = order.order_items.map((item) => ({
    name: `${item.product_skus.products.title} (${item.product_skus.color})`,
    sku: item.sku_id,
    units: item.quantity,
    selling_price: item.purchase_price,
    discount: 0,
    tax: 0,
    hsn: 711319, // HSN code for imitation jewelry — update if needed
  }));

  const payload = {
    // ── Order Identity ──────────────────────────────────────
    order_id: order.id,                          // our UUID — Shiprocket deduplicates on this
    order_date: formatOrderDate(order.created_at),
    pickup_location: pickupLocation,

    // ── Billing / Shipping Address ─────────────────────────
    billing_customer_name: first,
    billing_last_name: last,
    billing_address: addr.line1,
    billing_address_2: addr.line2 ?? "",
    billing_city: addr.city,
    billing_pincode: addr.pincode,
    billing_state: addr.state,
    billing_country: addr.country || "India",
    billing_email: customerEmail,
    billing_phone: customerPhone ?? "9876543210",

    // Ship to same address
    shipping_is_billing: true,

    // ── Items ───────────────────────────────────────────────
    order_items: orderItems,

    // ── Payment ─────────────────────────────────────────────
    payment_method: "Prepaid",   // already paid via Razorpay
    sub_total: order.total_amount,

    // ── Package Dimensions (jewelry defaults) ───────────────
    // Override these if you have a different standard package size.
    length: 10,     // cm
    breadth: 10,    // cm
    height: 5,      // cm
    weight: 0.2,    // kg
  };

  console.log(
    `[shiprocket] Creating order for KAIVA order ${order.id}...`
  );

  const res = await fetch(`${SHIPROCKET_BASE}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `[shiprocket] Order creation failed (${res.status}): ${JSON.stringify(data)}`
    );
  }

  console.log(
    `[shiprocket] Order created → Shiprocket Order ID: ${data.order_id}, Shipment ID: ${data.shipment_id}`
  );

  return {
    shiprocket_order_id: data.order_id,
    shipment_id: data.shipment_id,
    status: data.status,
    awb_code: data.awb_code,
  };
}

// ─── Tracking ─────────────────────────────────────────────────

/**
 * Fetches live tracking milestones for a given Shiprocket AWB / tracking ID.
 * Called by GET /api/tracking?tracking_id=...
 */
export async function getTrackingInfo(
  trackingId: string
): Promise<ShiprocketTrackingResponse> {
  const token = await getToken();

  const res = await fetch(
    `${SHIPROCKET_BASE}/courier/track/shipment/${trackingId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      // Revalidate every 60 seconds on Vercel edge cache
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `[shiprocket] Tracking fetch failed (${res.status}): ${text}`
    );
  }

  const data = await res.json();

  // Normalise Shiprocket's response to our ShiprocketTrackingResponse shape
  const trackingData = data?.tracking_data;

  return {
    tracking_id: trackingId,
    current_status: trackingData?.shipment_status ?? "Unknown",
    milestones: (trackingData?.shipment_track_activities ?? []).map(
      (a: { ["sr-status-label"]: string; activity: string; date: string; location: string }) => ({
        status: a["sr-status-label"] ?? "",
        activity: a.activity ?? "",
        date: a.date ?? "",
        location: a.location ?? "",
      })
    ),
  };
}
