import { NextRequest, NextResponse } from "next/server";
import { getTrackingInfo } from "@/lib/shiprocket";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingId = searchParams.get("tracking_id");

  if (!trackingId) {
    return NextResponse.json(
      { error: "tracking_id is required" },
      { status: 400 }
    );
  }

  try {
    const trackingData = await getTrackingInfo(trackingId);
    return NextResponse.json(trackingData, { status: 200 });
  } catch (error) {
    console.error("[tracking] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking info" },
      { status: 500 }
    );
  }
}
