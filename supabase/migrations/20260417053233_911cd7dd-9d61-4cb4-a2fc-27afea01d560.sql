
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  price NUMERIC(10,2) NOT NULL,
  discount_price NUMERIC(10,2),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  stock INT NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 4.8,
  featured BOOLEAN NOT NULL DEFAULT false,
  hot_deal BOOLEAN NOT NULL DEFAULT false,
  deal_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('ZK-' || to_char(now(), 'YYMMDD') || '-' || lpad((floor(random()*10000))::text, 4, '0')),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  emirate TEXT NOT NULL,
  postal_code TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can lookup own order by number" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Newsletter
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Car Accessories', 'car-accessories', 1),
  ('Gym & Fitness', 'gym-fitness', 2),
  ('Phone Accessories', 'phone-accessories', 3);

-- Seed products
INSERT INTO public.products (name, slug, description, features, price, discount_price, image_url, category_slug, stock, rating, featured, hot_deal, deal_ends_at) VALUES
  ('Premium Leather Car Seat Cover', 'leather-car-seat-cover', 'Luxury PU leather car seat cover with breathable design. Custom-fit for most UAE vehicles.', ARRAY['Premium PU leather','Breathable fabric','Easy installation','Universal fit'], 299, 199, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', 'car-accessories', 50, 4.8, true, true, now() + interval '3 days'),
  ('Wireless Car Charger Mount', 'wireless-car-charger', '15W fast wireless charging car phone mount with auto-clamping.', ARRAY['15W fast charge','Auto-clamp','360° rotation','Air vent mount'], 159, 99, 'https://images.unsplash.com/photo-1601999618011-cb6b8a87b6b6?w=800', 'car-accessories', 80, 4.7, true, false, NULL),
  ('LED Car Interior Light Kit', 'led-car-interior', 'RGB LED ambient light kit with app control. Transform your car interior.', ARRAY['App controlled','16M colors','Music sync','Easy install'], 129, 79, 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800', 'car-accessories', 60, 4.6, true, true, now() + interval '2 days'),
  ('Adjustable Dumbbell Set 24kg', 'adjustable-dumbbell-24kg', 'Space-saving adjustable dumbbell set. Replaces 5 pairs of weights.', ARRAY['24kg max','5 weight settings','Compact design','Steel build'], 599, 449, 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800', 'gym-fitness', 30, 4.9, true, true, now() + interval '5 days'),
  ('Premium Resistance Bands Set', 'resistance-bands-set', '5-piece resistance band set with handles and door anchor.', ARRAY['5 resistance levels','Door anchor','Carry bag','Premium latex'], 99, 59, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800', 'gym-fitness', 100, 4.7, true, false, NULL),
  ('Smart Fitness Tracker Pro', 'smart-fitness-tracker', 'Heart rate, sleep, SpO2 monitoring with 14-day battery life.', ARRAY['Heart rate','Sleep tracking','14-day battery','Waterproof IP68'], 249, 149, 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800', 'gym-fitness', 70, 4.8, true, true, now() + interval '4 days'),
  ('MagSafe Wireless Power Bank', 'magsafe-power-bank', '10000mAh magnetic wireless power bank for iPhone.', ARRAY['10000mAh','Magnetic attach','15W wireless','USB-C PD'], 199, 129, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800', 'phone-accessories', 90, 4.8, true, false, NULL),
  ('Premium Tempered Glass Screen', 'tempered-glass-screen', '9H hardness tempered glass screen protector. Crystal clear.', ARRAY['9H hardness','Anti-fingerprint','Easy install','Bubble free'], 49, 29, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800', 'phone-accessories', 200, 4.6, true, true, now() + interval '1 day'),
  ('Leather Phone Wallet Case', 'leather-phone-case', 'Genuine leather wallet case with card slots.', ARRAY['Genuine leather','3 card slots','Magnetic close','Premium stitching'], 149, 89, 'https://images.unsplash.com/photo-1603898037225-1bea09c550c3?w=800', 'phone-accessories', 75, 4.7, true, false, NULL);
