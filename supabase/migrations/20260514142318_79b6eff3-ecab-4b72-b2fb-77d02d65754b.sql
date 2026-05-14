ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS apple_sub text,
  ADD COLUMN IF NOT EXISTS apple_email text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_apple_sub_key
  ON public.profiles (apple_sub)
  WHERE apple_sub IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  app_meta jsonb := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb);
  provider text := COALESCE(app_meta->>'provider', '');
  v_apple_sub text;
  v_apple_email text;
  v_display_name text;
BEGIN
  IF provider = 'apple' THEN
    v_apple_sub := COALESCE(meta->>'sub', meta->>'provider_id', meta->>'user_id');
    v_apple_email := COALESCE(meta->>'email', NEW.email);
    v_display_name := COALESCE(
      meta->>'full_name',
      meta->>'name',
      NULLIF(TRIM(CONCAT_WS(' ', meta->'name'->>'firstName', meta->'name'->>'lastName')), ''),
      meta->>'display_name',
      split_part(COALESCE(NEW.email, v_apple_email, ''), '@', 1)
    );
  ELSE
    v_display_name := COALESCE(meta->>'display_name', meta->>'full_name', meta->>'name', split_part(NEW.email, '@', 1));
  END IF;

  INSERT INTO public.profiles (user_id, display_name, email, apple_sub, apple_email)
  VALUES (NEW.id, v_display_name, NEW.email, v_apple_sub, v_apple_email)
  ON CONFLICT (user_id) DO UPDATE SET
    apple_sub = COALESCE(public.profiles.apple_sub, EXCLUDED.apple_sub),
    apple_email = COALESCE(public.profiles.apple_email, EXCLUDED.apple_email),
    display_name = COALESCE(NULLIF(public.profiles.display_name, ''), EXCLUDED.display_name),
    email = COALESCE(public.profiles.email, EXCLUDED.email);

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Add UNIQUE on profiles.user_id if not present (needed for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND contype = 'u'
      AND conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;