"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type {
  ProductWithSkus,
  ShopFilters,
  ProductFormData,
  ApiResponse,
} from "@/types";
import { revalidatePath } from "next/cache";

// ---- READ OPERATIONS ----

export async function getProducts(
  filters: ShopFilters = {}
): Promise<ProductWithSkus[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_skus (*)
    `
    )
    .eq("is_active", true);

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.theme) {
    query = query.contains("themes", [filters.theme]);
  }

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters.color) {
    // Filter products that have at least one SKU with this color
    const { data: matchingSkus } = await supabase
      .from("product_skus")
      .select("product_id")
      .ilike("color", `%${filters.color}%`);

    const productIds = matchingSkus?.map((s) => s.product_id) ?? [];
    if (productIds.length === 0) return [];
    query = query.in("id", productIds);
  }

  if (filters.sort === "price_asc") {
    query = query.order("base_price", { ascending: true });
  } else if (filters.sort === "price_desc") {
    query = query.order("base_price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getProducts]", error);
    return [];
  }

  return (data ?? []) as ProductWithSkus[];
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithSkus | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_skus (*)
    `
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("[getProductBySlug]", error);
    return null;
  }

  return data as ProductWithSkus;
}

export async function getTrendingProducts(
  limit: number = 8
): Promise<ProductWithSkus[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_skus (*)
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getTrendingProducts]", error);
    return [];
  }

  return (data ?? []) as ProductWithSkus[];
}

export async function getAvailableColors(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_skus")
    .select("color")
    .order("color");

  const colors = [...new Set((data ?? []).map((s) => s.color))];
  return colors;
}

// ---- ADMIN: CREATE PRODUCT ----

export async function createProduct(
  formData: ProductFormData
): Promise<ApiResponse<{ id: string; slug: string }>> {
  const supabase = await createServiceClient();

  // Verify caller is admin
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

  const slug = slugify(formData.title);

  // Insert product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      title: formData.title,
      slug,
      description: formData.description,
      base_price: formData.base_price,
      category: formData.category,
      themes: formData.themes,
    })
    .select()
    .single();

  if (productError) {
    console.error("[createProduct] product insert:", productError);
    return { success: false, error: productError.message };
  }

  // Insert SKUs
  if (formData.skus.length > 0) {
    const { error: skuError } = await supabase.from("product_skus").insert(
      formData.skus.map((sku) => ({
        product_id: product.id,
        color: sku.color,
        stock_quantity: sku.stock_quantity,
        sku_image_url: sku.sku_image_url,
        price_modifier: sku.price_modifier,
      }))
    );

    if (skuError) {
      console.error("[createProduct] SKU insert:", skuError);
      // Rollback product
      await supabase.from("products").delete().eq("id", product.id);
      return { success: false, error: skuError.message };
    }
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");

  return { success: true, data: { id: product.id, slug: product.slug } };
}

// ---- ADMIN: UPDATE PRODUCT ----

export async function updateProduct(
  productId: string,
  formData: Partial<ProductFormData>
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

  const updates: Record<string, unknown> = {};
  if (formData.title) {
    updates.title = formData.title;
    updates.slug = slugify(formData.title);
  }
  if (formData.description !== undefined)
    updates.description = formData.description;
  if (formData.base_price !== undefined)
    updates.base_price = formData.base_price;
  if (formData.category) updates.category = formData.category;
  if (formData.themes) updates.themes = formData.themes;

  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/shop");
  revalidatePath("/admin/products");

  return { success: true, data: undefined };
}

// ---- ADMIN: LIST ALL PRODUCTS (including inactive) ----

export async function adminListProducts(): Promise<ProductWithSkus[]> {
  const supabase = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_skus (*)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[adminListProducts]", error);
    return [];
  }

  return (data ?? []) as ProductWithSkus[];
}

// ---- WISHLIST ----

export async function getWishlistSkuIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("wishlists")
    .select("sku_id")
    .eq("user_id", user.id);

  return (data ?? []).map((w) => w.sku_id);
}

export async function toggleWishlist(
  skuId: string
): Promise<ApiResponse<{ wishlisted: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("sku_id", skuId)
    .single();

  if (existing) {
    await supabase.from("wishlists").delete().eq("id", existing.id);
    return { success: true, data: { wishlisted: false } };
  } else {
    await supabase.from("wishlists").insert({ user_id: user.id, sku_id: skuId });
    return { success: true, data: { wishlisted: true } };
  }
}
