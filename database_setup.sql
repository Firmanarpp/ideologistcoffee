-- IDEOLOGIST POS SUPABASE SCHEMA & POLICIES (FRESH SETUP)

-- 0. CLEANUP (Optional: Only if you want to start totally fresh)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user();
-- DROP TABLE IF EXISTS stock_movements;
-- DROP TABLE IF EXISTS payments;
-- DROP TABLE IF EXISTS transaction_items;
-- DROP TABLE IF EXISTS transactions;
-- DROP TABLE IF EXISTS product_addons;
-- DROP TABLE IF EXISTS product_variants;
-- DROP TABLE IF EXISTS products;
-- DROP TABLE IF EXISTS categories;
-- DROP TABLE IF EXISTS settings;
-- DROP TABLE IF EXISTS users;

-- 1. EXTENSIONS
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Commented out to avoid read-only transaction errors. Usually pre-enabled in Supabase.

--------------------------------------------------------
-- 2. USERS TABLE (mapped to Supabase Auth)
--------------------------------------------------------
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier')) DEFAULT 'cashier',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Helper functions (MUST be created before policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_cashier()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'cashier')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON public.users FOR SELECT USING (public.is_admin());

--------------------------------------------------------
-- 3. SETTINGS TABLE
--------------------------------------------------------
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT NOT NULL DEFAULT 'Ideologist',
  address TEXT,
  whatsapp TEXT,
  tax DECIMAL(5,2) DEFAULT 0.00,
  service_charge DECIMAL(5,2) DEFAULT 0.00,
  footer_receipt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE 
  TO authenticated 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

--------------------------------------------------------
-- 4. CATEGORIES TABLE
--------------------------------------------------------
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL 
  TO authenticated 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

--------------------------------------------------------
-- 5. PRODUCTS TABLE
--------------------------------------------------------
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL,
  sku TEXT UNIQUE,
  stock INT NOT NULL DEFAULT 0,
  image TEXT,
  description TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL 
  TO authenticated 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

--------------------------------------------------------
-- 6. PRODUCT VARIANTS TABLE
--------------------------------------------------------
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variants are viewable by everyone" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL 
  TO authenticated 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

--------------------------------------------------------
-- 7. PRODUCT ADDONS TABLE
--------------------------------------------------------
CREATE TABLE public.product_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Addons are viewable by everyone" ON public.product_addons FOR SELECT USING (true);
CREATE POLICY "Admins can manage addons" ON public.product_addons FOR ALL 
  TO authenticated 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

--------------------------------------------------------
-- 8. TRANSACTIONS TABLE
--------------------------------------------------------
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_code TEXT UNIQUE NOT NULL,
  cashier_id UUID REFERENCES public.users(id),
  customer_name TEXT,
  customer_phone TEXT,
  order_type TEXT,
  table_number TEXT,
  notes TEXT,
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) DEFAULT 0.00,
  discount DECIMAL(12,2) DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL, 
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'expired'
  order_status TEXT NOT NULL DEFAULT 'pending',   -- 'pending', 'preparing', 'ready', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read transactions" ON public.transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update transactions" ON public.transactions FOR UPDATE USING (public.is_admin() OR public.is_cashier());

--------------------------------------------------------
-- 9. TRANSACTION ITEMS TABLE
--------------------------------------------------------
CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  qty INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  variant TEXT,
  addons TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read transaction items" ON public.transaction_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create transaction items" ON public.transaction_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

--------------------------------------------------------
-- 10. PAYMENTS TABLE
--------------------------------------------------------
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES public.transactions(id),
  provider TEXT NOT NULL,
  reference TEXT,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  raw_request JSONB,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read payments" ON public.payments FOR SELECT USING (public.is_admin());
CREATE POLICY "System can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update payments" ON public.payments FOR UPDATE USING (true);

--------------------------------------------------------
-- 11. STOCK MOVEMENTS TABLE
--------------------------------------------------------
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id),
  type TEXT NOT NULL,
  qty INT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read stock movements" ON public.stock_movements FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can insert stock movements" ON public.stock_movements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

--------------------------------------------------------
-- 12. TRIGGERS: AUTOMATIC STOCK DEDUCTION
--------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    UPDATE public.products p
    SET stock = p.stock - ti.qty
    FROM public.transaction_items ti
    WHERE ti.transaction_id = NEW.id AND p.id = ti.product_id;
    
    INSERT INTO public.stock_movements (product_id, type, qty, note)
    SELECT product_id, 'out', qty, 'Transaction ' || NEW.transaction_code
    FROM public.transaction_items
    WHERE transaction_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock
AFTER UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.deduct_stock_on_transaction();

CREATE OR REPLACE FUNCTION public.deduct_stock_on_item_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
  v_transaction_code TEXT;
BEGIN
  SELECT payment_status, transaction_code INTO v_status, v_transaction_code 
  FROM public.transactions WHERE id = NEW.transaction_id;
  
  IF v_status = 'paid' THEN
    UPDATE public.products SET stock = stock - NEW.qty WHERE id = NEW.product_id;
    INSERT INTO public.stock_movements (product_id, type, qty, note)
    VALUES (NEW.product_id, 'out', NEW.qty, 'Transaction ' || v_transaction_code);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_item_insert_stock
AFTER INSERT ON public.transaction_items
FOR EACH ROW
EXECUTE FUNCTION public.deduct_stock_on_item_insert();

--------------------------------------------------------
-- 13. TRIGGER: AUTH -> PUBLIC USERS
--------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Staff Member'),
    'cashier'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove existing if exists to avoid errors on recreation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
--------------------------------------------------------
-- 14. STORAGE CONFIGURATION (Supabase Dashboard Instructions)
--------------------------------------------------------
/* 
  NOTE: If you get "permission denied for table buckets", 
  please create the bucket MANUALLY in the Supabase Dashboard:
  1. Go to Storage -> New Bucket
  2. Name it: 'product-images'
  3. Make it: Public
  4. Then run the policies below:
*/

-- 1. Policies for 'product-images' bucket
-- Allow public access to read images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

-- Allow staff to upload images
CREATE POLICY "Staff can upload images" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  (public.is_admin() OR public.is_cashier())
);

-- Allow staff to update/delete images
CREATE POLICY "Staff can update/delete images" ON storage.objects FOR ALL
USING (
  bucket_id = 'product-images' AND 
  (public.is_admin() OR public.is_cashier())
);
