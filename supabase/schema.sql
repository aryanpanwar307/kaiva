-- ============================================================
-- KAIVA — Supabase PostgreSQL Schema
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE product_category AS ENUM (
  'necklace',
  'handband',
  'earring',
  'ring',
  'anklet'
);

CREATE TYPE lifestyle_theme AS ENUM (
  'daily_wear',
  'travel',
  'beach_trip',
  'date_night'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

-- ============================================================
-- TABLE: profiles
-- Extends auth.users — created automatically via trigger
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  phone          TEXT,
  shipping_address JSONB,          -- { line1, line2, city, state, pincode, country }
  is_admin       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Extended user profile data linked to Supabase auth.users';
COMMENT ON COLUMN public.profiles.shipping_address IS 'JSON: { line1, line2, city, state, pincode, country }';

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  base_price  NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
  category    product_category NOT NULL,
  themes      lifestyle_theme[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.products IS 'Core jewelry product catalog';
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_themes   ON public.products USING GIN(themes);
CREATE INDEX IF NOT EXISTS idx_products_slug     ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active   ON public.products(is_active);

-- ============================================================
-- TABLE: product_skus
-- Each SKU = one color variant of a product
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_skus (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  color          TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku_image_url  TEXT,
  price_modifier NUMERIC(10, 2) NOT NULL DEFAULT 0,   -- added to base_price to get final SKU price
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, color)
);

COMMENT ON TABLE public.product_skus IS 'Per-color SKU variants. stock_quantity is decremented atomically on purchase.';
CREATE INDEX IF NOT EXISTS idx_skus_product_id ON public.product_skus(product_id);

-- ============================================================
-- TABLE: wishlists
-- Server-side wishlist items per user
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sku_id     UUID NOT NULL REFERENCES public.product_skus(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sku_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  total_amount     NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_status   payment_status NOT NULL DEFAULT 'pending',
  payment_id       TEXT,                  -- Razorpay payment_id after capture
  razorpay_order_id TEXT,                 -- Razorpay order_id
  tracking_id      TEXT,                  -- Shiprocket tracking ID
  shipping_address JSONB NOT NULL,        -- Snapshot at time of order
  idempotency_key  TEXT UNIQUE,           -- Prevents duplicate processing
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.orders IS 'Customer orders. payment_status updated exclusively by server-side webhook.';
CREATE INDEX IF NOT EXISTS idx_orders_user_id        ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay       ON public.orders(razorpay_order_id);

-- ============================================================
-- TABLE: order_items
-- Line items with price locked at time of purchase
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sku_id         UUID NOT NULL REFERENCES public.product_skus(id) ON DELETE RESTRICT,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  purchase_price NUMERIC(10, 2) NOT NULL CHECK (purchase_price >= 0),  -- locked at checkout time
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.order_items IS 'purchase_price is the final price from the DB at checkout — never from client input.';
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku_id   ON public.order_items(sku_id);

-- ============================================================
-- FUNCTION: handle_new_user
-- Auto-creates a profile row when a new user registers
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: fire after every new auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- FUNCTION: update_updated_at
-- Auto-updates updated_at column on row modification
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER set_skus_updated_at
  BEFORE UPDATE ON public.product_skus
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================================
-- FUNCTION: decrement_stock
-- Atomically decrement stock with row-level lock.
-- Call inside a transaction from the webhook handler.
-- Raises an exception if stock would go negative.
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_sku_id  UUID,
  p_qty     INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_current INTEGER;
BEGIN
  -- Acquire a row-level lock to prevent concurrent oversell
  SELECT stock_quantity INTO v_current
  FROM public.product_skus
  WHERE id = p_sku_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'SKU % not found', p_sku_id;
  END IF;

  IF v_current < p_qty THEN
    RAISE EXCEPTION 'Insufficient stock for SKU %. Available: %, Requested: %',
      p_sku_id, v_current, p_qty;
  END IF;

  UPDATE public.product_skus
  SET stock_quantity = stock_quantity - p_qty
  WHERE id = p_sku_id;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_skus  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items   ENABLE ROW LEVEL SECURITY;

-- ---- profiles ----
-- Users can read and update only their own profile
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to check admin status without triggering RLS on profiles
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = user_id;
  RETURN COALESCE(v_is_admin, FALSE);
END;
$$;

-- Admins can read all profiles
CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ---- products (public read, admin write) ----
CREATE POLICY "products: public read active"
  ON public.products FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "products: admin full access"
  ON public.products FOR ALL
  USING (public.is_admin(auth.uid()));

-- ---- product_skus (public read, admin write) ----
CREATE POLICY "skus: public read"
  ON public.product_skus FOR SELECT
  USING (TRUE);

CREATE POLICY "skus: admin full access"
  ON public.product_skus FOR ALL
  USING (public.is_admin(auth.uid()));

-- ---- wishlists ----
CREATE POLICY "wishlists: own access"
  ON public.wishlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- orders ----
CREATE POLICY "orders: own read"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders: own insert"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders: admin full access"
  ON public.orders FOR ALL
  USING (public.is_admin(auth.uid()));

-- ---- order_items ----
CREATE POLICY "order_items: own read via order"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items: admin full access"
  ON public.order_items FOR ALL
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- SERVICE ROLE BYPASS (for server-side webhook/actions)
-- The service role key bypasses RLS by default in Supabase.
-- No additional policy needed — just use service role client
-- in server-side Route Handlers and Server Actions.
-- ============================================================

-- ============================================================
-- SAMPLE: Grant service role explicit access (safety net)
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
