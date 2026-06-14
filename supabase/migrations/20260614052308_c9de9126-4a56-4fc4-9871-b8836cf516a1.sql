
CREATE TABLE public.wc_api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name text NOT NULL,
  scope text NOT NULL DEFAULT 'read',
  external_user_id text,
  store_domain text,
  consumer_key text NOT NULL UNIQUE,
  consumer_secret text NOT NULL,
  return_url text,
  callback_url text,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wc_api_credentials TO authenticated;
GRANT ALL ON public.wc_api_credentials TO service_role;

ALTER TABLE public.wc_api_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read wc credentials"
  ON public.wc_api_credentials FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update wc credentials"
  ON public.wc_api_credentials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER wc_api_credentials_updated_at
  BEFORE UPDATE ON public.wc_api_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.wc_integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  path text,
  status int,
  message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wc_integration_logs TO authenticated;
GRANT ALL ON public.wc_integration_logs TO service_role;

ALTER TABLE public.wc_integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read wc logs"
  ON public.wc_integration_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX wc_integration_logs_created_at_idx ON public.wc_integration_logs (created_at DESC);
