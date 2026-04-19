-- Add return-related order statuses
DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'return_requested' AFTER 'delivered';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'return_approved' AFTER 'return_requested';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returned' AFTER 'return_approved';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Return request status enum
DO $$ BEGIN
  CREATE TYPE return_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Return requests table
CREATE TABLE IF NOT EXISTS public.return_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  phone text NOT NULL,
  reason text NOT NULL,
  message text,
  status return_status NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON public.return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON public.return_requests(status);

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a return request" ON public.return_requests;
CREATE POLICY "Anyone can submit a return request"
  ON public.return_requests FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view return by order" ON public.return_requests;
CREATE POLICY "Anyone can view return by order"
  ON public.return_requests FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins manage return requests" ON public.return_requests;
CREATE POLICY "Admins manage return requests"
  ON public.return_requests FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_return_requests_updated_at ON public.return_requests;
CREATE TRIGGER update_return_requests_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();