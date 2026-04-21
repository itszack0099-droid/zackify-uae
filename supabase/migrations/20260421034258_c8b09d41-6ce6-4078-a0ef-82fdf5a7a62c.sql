-- Enable pgcrypto in extensions schema (already there, but ensure available)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. SKU on products: unique, auto-generated when blank
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;

-- Random uppercase alphanumeric SKU helper
CREATE OR REPLACE FUNCTION public.gen_product_sku()
RETURNS text
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  candidate text;
  exists_count int;
BEGIN
  LOOP
    candidate := 'SKU-' || upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
    SELECT count(*) INTO exists_count FROM public.products WHERE sku = candidate;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Backfill missing SKUs
UPDATE public.products SET sku = public.gen_product_sku() WHERE sku IS NULL OR sku = '';

ALTER TABLE public.products ALTER COLUMN sku SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON public.products (sku);

CREATE OR REPLACE FUNCTION public.fill_product_sku()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := public.gen_product_sku();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_fill_sku ON public.products;
CREATE TRIGGER products_fill_sku
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.fill_product_sku();

-- 2. Order confirmation token + customer email
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirm_token text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;

UPDATE public.orders
SET confirm_token = encode(extensions.gen_random_bytes(24), 'hex')
WHERE confirm_token IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN confirm_token SET DEFAULT encode(extensions.gen_random_bytes(24), 'hex');
ALTER TABLE public.orders ALTER COLUMN confirm_token SET NOT NULL;

-- 3. Public storage bucket for product videos / GIFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read product media" ON storage.objects;
CREATE POLICY "Public read product media"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-media');

DROP POLICY IF EXISTS "Admins upload product media" ON storage.objects;
CREATE POLICY "Admins upload product media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update product media" ON storage.objects;
CREATE POLICY "Admins update product media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete product media" ON storage.objects;
CREATE POLICY "Admins delete product media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));