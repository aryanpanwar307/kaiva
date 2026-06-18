import type {
  ShiprocketTrackingResponse,
  ShiprocketTrackingMilestone,
} from "@/types";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Authenticate with Shiprocket and cache the JWT token.
 * Tokens are valid for 24 hours; we refresh proactively.
 */
async function getAuthToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 5-minute buffer)
  if (cachedToken && tokenExpiry && now < tokenExpiry - 5 * 60 * 1000) {
    return cachedToken;
  }

  const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`Shiprocket auth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.token as string;
  tokenExpiry = now + 24 * 60 * 60 * 1000; // 24 hours from now

  return cachedToken;
}

/**
 * Fetch tracking milestones for a given Shiprocket tracking ID.
 */
export async function getTrackingInfo(
  trackingId: string
): Promise<ShiprocketTrackingResponse> {
  const token = await getAuthToken();

  const res = await fetch(
    `${SHIPROCKET_BASE_URL}/courier/track/awb/${trackingId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    }
  );

  if (!res.ok) {
    throw new Error(`Shiprocket tracking fetch failed: ${res.status}`);
  }

  const data = await res.json();

  // Normalize Shiprocket response to our internal format
  const trackingData = data?.tracking_data;
  const shipmentTrack = trackingData?.shipment_track?.[0];
  const activities: ShiprocketTrackingMilestone[] = (
    trackingData?.shipment_track_activities ?? []
  ).map(
    (a: {
      date: string;
      activity: string;
      location: string;
    }) => ({
      status: a.activity,
      activity: a.activity,
      date: a.date,
      location: a.location ?? "",
    })
  );

  return {
    tracking_id: trackingId,
    current_status: shipmentTrack?.current_status ?? "Processing",
    milestones: activities,
  };
}

/**
 * Create a Shiprocket shipment order.
 * Called after payment confirmation from the webhook.
 */
export async function createShipment(payload: {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_phone: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_pincode: string;
  billing_country: string;
  shipping_is_billing: boolean;
  order_items: {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
  }[];
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}): Promise<{ shipment_id: string; awb_code: string }> {
  const token = await getAuthToken();

  const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shiprocket shipment creation failed: ${err}`);
  }

  const data = await res.json();
  return {
    shipment_id: String(data.shipment_id),
    awb_code: data.awb_code ?? "",
  };
}
