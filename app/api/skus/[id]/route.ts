import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_skus")
    .select(`
      id,
      color,
      price_modifier,
      stock_quantity,
      sku_image_url,
      products (
        id,
        title,
        base_price
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "SKU not found" }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
}
