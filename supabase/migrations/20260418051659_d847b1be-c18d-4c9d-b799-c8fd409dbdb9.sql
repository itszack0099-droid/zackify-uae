-- Add tracking fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS estimated_delivery date;

-- Extend order_status enum with new values
DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing' BEFORE 'shipped';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery' BEFORE 'delivered';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger to auto-update updated_at on orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();