"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { OrderWithItems, ApiResponse } from "@/types";

export async function getMyOrders(): Promise<OrderWithItems[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyOrders]", error);
    return [];
  }

  return (data ?? []) as unknown as OrderWithItems[];
}

export async function getOrderById(
  orderId: string
): Promise<OrderWithItems | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
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
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("[getOrderById]", error);
    return null;
  }

  return data as unknown as OrderWithItems;
}

export async function adminGetAllOrders(): Promise<OrderWithItems[]> {
  const supabase = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return [];

  const { data, error } = await supabase
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
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[adminGetAllOrders]", error);
    return [];
  }

  return (data ?? []) as unknown as OrderWithItems[];
}

export async function updateTrackingId(
  orderId: string,
  trackingId: string
): Promise<ApiResponse<void>> {
  const supabase = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { success: false, error: "Insufficient permissions" };
  }

  const { error } = await supabase
    .from("orders")
    .update({ tracking_id: trackingId })
    .eq("id", orderId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
