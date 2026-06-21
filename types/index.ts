// ============================================================
// KAIVA — Shared TypeScript Interfaces & Types
// ============================================================

// ---- Database Enums ----------------------------------------
export type ProductCategory =
  | "necklace"
  | "handband"
  | "earring"
  | "ring"
  | "anklet";

export type LifestyleTheme =
  | "daily_wear"
  | "travel"
  | "beach_trip"
  | "date_night";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

// ---- Database Row Types ------------------------------------
export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  shipping_address: ShippingAddress | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  base_price: number;
  category: ProductCategory;
  themes: LifestyleTheme[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductSku {
  id: string;
  product_id: string;
  color: string;
  stock_quantity: number;
  sku_image_url: string | null;       // primary/thumbnail image (legacy)
  sku_image_urls: string[];           // all images for this variant
  price_modifier: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithSkus extends Product {
  product_skus: ProductSku[];
}

export interface Wishlist {
  id: string;
  user_id: string;
  sku_id: string;
  created_at: string;
}

export interface WishlistWithDetails extends Wishlist {
  product_skus: ProductSku & { products: Product };
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_id: string | null;
  razorpay_order_id: string | null;
  tracking_id: string | null;
  shipping_address: ShippingAddress;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  sku_id: string;
  quantity: number;
  purchase_price: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    product_skus: ProductSku & { products: Product };
  })[];
}

// ---- Cart Types (client-side — NO prices stored) ----------
export interface CartItem {
  sku_id: string;
  quantity: number;
}

// Cart item enriched with server-fetched data for display
export interface EnrichedCartItem {
  sku_id: string;
  quantity: number;
  sku: ProductSku;
  product: Product;
  unit_price: number; // base_price + price_modifier (fetched from server)
  subtotal: number;
}

// ---- Checkout Types ----------------------------------------
export interface CheckoutRequest {
  items: CartItem[];
  shipping_address: ShippingAddress;
}

export interface CheckoutResponse {
  razorpay_order_id: string;
  amount: number; // in paise
  currency: string;
  order_id: string; // our internal DB order id
  key_id: string;
}

// ---- Filter Types ------------------------------------------
export interface ShopFilters {
  category?: ProductCategory;
  theme?: LifestyleTheme;
  color?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  search?: string;
}

// ---- Razorpay Types ----------------------------------------
export interface RazorpayPaymentHandlerArgs {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// ---- Shiprocket Types --------------------------------------
export interface ShiprocketTrackingMilestone {
  status: string;
  activity: string;
  date: string;
  location: string;
}

export interface ShiprocketTrackingResponse {
  tracking_id: string;
  current_status: string;
  milestones: ShiprocketTrackingMilestone[];
}

// ---- Admin Product Form ------------------------------------
export interface SkuInput {
  color: string;
  stock_quantity: number;
  sku_image_url: string;              // primary image (first of the array)
  sku_image_urls: string[];           // all images
  price_modifier: number;
}

export interface ProductFormData {
  title: string;
  description: string;
  base_price: number;
  category: ProductCategory;
  themes: LifestyleTheme[];
  skus: SkuInput[];
}

// ---- API Response wrapper ----------------------------------
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
