-- IDEOLOGIST POS DUMMY DATA SEED (FRESH & COMPLETE)

DO $$ 
DECLARE
  cat_coffee_id UUID;
  cat_non_coffee_id UUID;
  cat_tea_id UUID;
  cat_pastry_id UUID;
  prod_sig_id UUID;
  prod_latte_id UUID;
  prod_matcha_id UUID;
  dummy_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Consistent UUID for dummy
BEGIN
  -- 0. CLEANUP (To avoid duplicate key errors)
  TRUNCATE TABLE public.product_addons CASCADE;
  TRUNCATE TABLE public.product_variants CASCADE;
  TRUNCATE TABLE public.products CASCADE;
  TRUNCATE TABLE public.categories CASCADE;
  TRUNCATE TABLE public.transactions CASCADE;
  TRUNCATE TABLE public.settings CASCADE;

  -- 1. SETTINGS
  INSERT INTO public.settings (store_name, address, whatsapp, tax, service_charge, footer_receipt)
  VALUES (
    'Ideologist Coffee', 
    'Jl. Kopi No. 77, Jakarta Selatan', 
    '628123456789', 
    11.0, 
    5.0, 
    'Thank you for brewing ideas with us!'
  );

  -- 2. CATEGORIES
  INSERT INTO public.categories (name) VALUES ('Coffee') RETURNING id INTO cat_coffee_id;
  INSERT INTO public.categories (name) VALUES ('Non-Coffee') RETURNING id INTO cat_non_coffee_id;
  INSERT INTO public.categories (name) VALUES ('Tea') RETURNING id INTO cat_tea_id;
  INSERT INTO public.categories (name) VALUES ('Pastry') RETURNING id INTO cat_pastry_id;

  -- 3. PRODUCTS
  -- Product 1: Signature
  INSERT INTO public.products (name, category_id, price, sku, stock, description, is_available, image)
  VALUES ('Ideologist Signature Latte', cat_coffee_id, 35000, 'COF-SIG-01', 100, 'Our creamy signature brown sugar latte.', true, '/images/signature_latte.png')
  RETURNING id INTO prod_sig_id;
  
  INSERT INTO public.product_variants (product_id, name, price_modifier) VALUES (prod_sig_id, 'Hot', 0);
  INSERT INTO public.product_variants (product_id, name, price_modifier) VALUES (prod_sig_id, 'Iced', 3000);
  INSERT INTO public.product_addons (product_id, name, price) VALUES (prod_sig_id, 'Extra Shot', 10000);
  INSERT INTO public.product_addons (product_id, name, price) VALUES (prod_sig_id, 'Oat Milk', 15000);

  -- Product 2: Cafe Latte
  INSERT INTO public.products (name, category_id, price, sku, stock, description, is_available, image)
  VALUES ('Classic Cafe Latte', cat_coffee_id, 30000, 'COF-LAT-01', 100, 'Smooth classic cafe latte.', true, '/images/cafe_latte.png')
  RETURNING id INTO prod_latte_id;
  
  INSERT INTO public.product_variants (product_id, name, price_modifier) VALUES (prod_latte_id, 'Hot', 0);
  INSERT INTO public.product_variants (product_id, name, price_modifier) VALUES (prod_latte_id, 'Iced', 3000);

  -- Product 3: Matcha Latte
  INSERT INTO public.products (name, category_id, price, sku, stock, description, is_available, image)
  VALUES ('Premium Matcha Latte', cat_non_coffee_id, 38000, 'NCO-MAT-01', 5, 'Uji matcha base with fresh milk.', true, '/images/matcha_latte.png')
  RETURNING id INTO prod_matcha_id;

  -- Product 4: Butter Croissant
  INSERT INTO public.products (name, category_id, price, sku, stock, description, is_available, image)
  VALUES ('Butter Croissant', cat_pastry_id, 25000, 'PAS-CRO-01', 8, 'Classic buttery french pastry.', true, '/images/croissant.png');

  -- Generic Products
  INSERT INTO public.products (name, category_id, price, sku, stock, description, is_available, image)
  VALUES ('Americano', cat_coffee_id, 25000, 'COF-AME-01', 50, 'Bold black coffee.', true, '/images/americano.png');
  
  INSERT INTO public.products (name, category_id, price, sku, stock, description, is_available, image)
  VALUES ('Earl Grey Tea', cat_tea_id, 28000, 'TEA-EAR-01', 50, 'Fragrant bergamot tea.', true, '/images/earl_grey.png');

  -- 4. TRANSACTIONS (Dummy history for Dashboard)
  -- Note: cashier_id is left NULL if you don't have real users in auth.users yet.
  
  -- Today's Transactions
  INSERT INTO public.transactions (transaction_code, subtotal, total, payment_method, payment_status, order_status, created_at, customer_name)
  VALUES ('TRX-TODAY-01', 35000, 35000, 'Cash', 'paid', 'completed', NOW() - INTERVAL '2 hours', 'Arya');
  
  INSERT INTO public.transactions (transaction_code, subtotal, total, payment_method, payment_status, order_status, created_at, customer_name)
  VALUES ('TRX-TODAY-02', 72150, 72150, 'DOKU', 'paid', 'ready', NOW() - INTERVAL '1 hour', 'Budi');
  
  INSERT INTO public.transactions (transaction_code, subtotal, total, payment_method, payment_status, order_status, created_at, customer_name)
  VALUES ('TRX-TODAY-03', 25000, 25000, 'QRIS', 'paid', 'preparing', NOW() - INTERVAL '30 minutes', 'Citra');

  -- Last 7 Days (for Chart)
  INSERT INTO public.transactions (transaction_code, subtotal, total, payment_method, payment_status, order_status, created_at) VALUES ('TRX-W-1', 1200000, 1200000, 'QRIS', 'paid', 'completed', NOW() - INTERVAL '6 days');
  INSERT INTO public.transactions (transaction_code, subtotal, total, payment_method, payment_status, order_status, created_at) VALUES ('TRX-W-2', 1500000, 1500000, 'Cash', 'paid', 'completed', NOW() - INTERVAL '5 days');
  INSERT INTO public.transactions (transaction_code, subtotal, total, payment_method, payment_status, order_status, created_at) VALUES ('TRX-W-3', 1100000, 1100000, 'Cash', 'paid', 'completed', NOW() - INTERVAL '4 days');
  INSERT INTO public.transactions (transaction_code, subtotal, total, payment_method, payment_status, order_status, created_at) VALUES ('TRX-W-4', 1800000, 1800000, 'DOKU', 'paid', 'completed', NOW() - INTERVAL '3 days');
  INSERT INTO public.transactions (transaction_code, subtotal, total, payment_method, payment_status, order_status, created_at) VALUES ('TRX-W-5', 2500000, 2500000, 'QRIS', 'paid', 'completed', NOW() - INTERVAL '2 days');
  INSERT INTO public.transactions (transaction_code, subtotal, total, payment_method, payment_status, order_status, created_at) VALUES ('TRX-W-6', 3200000, 3200000, 'QRIS', 'paid', 'completed', NOW() - INTERVAL '1 day');

END $$;
