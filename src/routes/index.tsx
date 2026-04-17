import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, Banknote, Gem, RefreshCcw, Sparkles } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard, type ProductLite } from "@/components/ProductCard";
import { Countdown } from "@/components/Countdown";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Zackify.uae — Premium Gear for Men in UAE | Cash on Delivery" },
      {
        name: "description",
        content:
          "Shop premium car accessories, gym & fitness gear and phone accessories. Cash on Delivery, 2–4 day delivery across the UAE.",
      },
      { property: "og:title", content: "Zackify.uae — Premium Gear for Men in UAE" },
      { property: "og:description", content: "Premium gear, Cash on Delivery, 2–4 day delivery in UAE." },
    ],
  }),
});

type DealProduct = ProductLite & { deal_ends_at: string | null };

function HomePage() {
  const [featured, setFeatured] = useState<ProductLite[]>([]);
  const [deals, setDeals] = useState<DealProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: f }, { data: d }] = await Promise.all([
        supabase
          .from("products")
          .select("id,name,slug,price,discount_price,image_url,rating,hot_deal")
          .eq("featured", true)
          .limit(8),
        supabase
          .from("products")
          .select("id,name,slug,price,discount_price,image_url,rating,hot_deal,deal_ends_at")
          .eq("hot_deal", true)
          .limit(4),
      ]);
      setFeatured((f ?? []) as ProductLite[]);
      setDeals((d ?? []) as DealProduct[]);
      setLoading(false);
    })();
  }, []);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-radial-gold)" }}
        />
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gold/20 blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-deep-green/40 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-gold/30 text-xs text-gold">
              <Sparkles className="w-3.5 h-3.5" /> Curated for the UAE
            </div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
              Premium Gear for{" "}
              <span className="text-gradient-gold">Men in UAE</span>
            </h1>
            <p className="text-lg text-foreground/70 max-w-lg">
              Fast Delivery · Cash on Delivery · Premium Quality.
              Discover handpicked luxury accessories for car, fitness and phone.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/category/car-accessories"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-105 transition-transform"
              >
                Shop Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/hot-deals"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full glass border border-gold/30 text-foreground hover:border-gold transition-colors"
              >
                🔥 Hot Deals
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Banknote className="w-4 h-4 text-gold" /> Cash on Delivery</div>
              <div className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-gold" /> 2–4 Day Delivery</div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative animate-scale-in delay-200">
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-gold opacity-20 blur-3xl animate-float" />
              <div className="absolute inset-8 rounded-full glass border-2 border-gold/30 shadow-gold flex items-center justify-center">
                <div className="text-center">
                  <div className="font-display text-6xl md:text-7xl text-gradient-gold font-bold">Z</div>
                  <div className="font-display text-xl text-foreground/80 mt-2">Zackify.uae</div>
                  <div className="text-xs text-gold mt-1 tracking-widest">PREMIUM</div>
                </div>
              </div>
              {/* floating badges */}
              <div className="absolute -top-2 -right-2 glass rounded-2xl px-4 py-3 shadow-gold animate-float" style={{ animationDelay: "1s" }}>
                <div className="text-[10px] text-muted-foreground">Free Shipping</div>
                <div className="text-sm font-bold text-gold">Above 200 AED</div>
              </div>
              <div className="absolute -bottom-2 -left-2 glass rounded-2xl px-4 py-3 shadow-gold animate-float" style={{ animationDelay: "2.5s" }}>
                <div className="text-[10px] text-muted-foreground">Delivery</div>
                <div className="text-sm font-bold text-gold">2–4 Days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { slug: "car-accessories", name: "Car Accessories", emoji: "🚗" },
            { slug: "gym-fitness", name: "Gym & Fitness", emoji: "💪" },
            { slug: "phone-accessories", name: "Phone Accessories", emoji: "📱" },
          ].map((c, i) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className={`group relative overflow-hidden rounded-2xl glass border border-gold/20 p-8 hover-lift gold-border animate-fade-in-up delay-${(i + 1) * 100}`}
            >
              <div className="text-5xl mb-4">{c.emoji}</div>
              <h3 className="font-display text-2xl mb-2 group-hover:text-gold transition-colors">{c.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gold">
                Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs text-gold uppercase tracking-widest mb-2">Handpicked</div>
            <h2 className="font-display text-3xl md:text-4xl">Featured Products</h2>
          </div>
          <Link to="/category/car-accessories" className="hidden sm:flex items-center gap-1.5 text-sm text-gold hover:gap-2 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl animate-shimmer-bg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((p, i) => (
              <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WHY CHOOSE US */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-xs text-gold uppercase tracking-widest mb-2">The Zackify Promise</div>
          <h2 className="font-display text-3xl md:text-4xl">Why Choose Us</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Banknote, title: "Cash on Delivery", desc: "Pay in cash when you receive your order" },
            { icon: Truck, title: "Fast Delivery", desc: "2–4 days across all UAE emirates" },
            { icon: Gem, title: "Premium Quality", desc: "Hand-picked luxury products only" },
            { icon: RefreshCcw, title: "Easy Returns", desc: "Hassle-free 7-day return policy" },
          ].map((f, i) => (
            <div
              key={f.title}
              className={`group glass rounded-2xl p-6 text-center hover-lift gold-border animate-fade-in-up delay-${(i + 1) * 100}`}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform">
                <f.icon className="w-7 h-7 text-deep-green" />
              </div>
              <h3 className="font-display text-lg mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOT DEALS */}
      {deals.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="rounded-3xl glass border border-gold/30 p-6 md:p-10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <div className="text-xs text-gold uppercase tracking-widest mb-2">🔥 Limited Time</div>
                <h2 className="font-display text-3xl md:text-4xl">Hot Deals</h2>
                <p className="text-muted-foreground text-sm mt-1">Premium gear at unbeatable prices</p>
              </div>
              {deals[0]?.deal_ends_at && <Countdown to={deals[0].deal_ends_at} />}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {deals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
