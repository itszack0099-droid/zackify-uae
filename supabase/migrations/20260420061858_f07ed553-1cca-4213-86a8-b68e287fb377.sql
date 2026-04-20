-- Add delivery tracking columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS return_deadline timestamp with time zone;

-- Trigger function: when status flips to 'delivered', stamp delivery_date and compute return_deadline
CREATE OR REPLACE FUNCTION public.set_delivery_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered' OR NEW.delivery_date IS NULL) THEN
    NEW.delivery_date := COALESCE(NEW.delivery_date, now());
    NEW.return_deadline := NEW.delivery_date + interval '3 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_delivery_dates ON public.orders;
CREATE TRIGGER orders_set_delivery_dates
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_delivery_dates();

-- Backfill existing delivered orders
UPDATE public.orders
SET delivery_date = updated_at,
    return_deadline = updated_at + interval '3 days'
WHERE status IN ('delivered', 'return_requested', 'return_approved', 'returned')
  AND delivery_date IS NULL;