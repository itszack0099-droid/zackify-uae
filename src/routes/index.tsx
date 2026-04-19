import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, Banknote, Gem, RefreshCcw, Sparkles, Flame, Car, Dumbbell, Smartphone } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard, type ProductLite } from "@/components/ProductCard";
import { Countdown } from "@/components/Countdown";
import { HeroShowcase } from "@/components/HeroShowcase";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
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

  const cats = [
    { slug: "car-accessories", name: t("nav.car"), Icon: Car },
    { slug: "gym-fitness", name: t("nav.gym"), Icon: Dumbbell },
    { slug: "phone-accessories", name: t("nav.phone"), Icon: Smartphone },
  ];

  return (
    <Layout>
      {/* HERO with cinematic UAE lifestyle showcase */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-radial-gold)" }}
        />

        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-10">
          {/* Cinematic showcase reel */}
          <div className="animate-fade-in">
            <HeroShowcase />
          </div>

          {/* Hero text */}
          <div className="mt-8 md:mt-12 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
            <div className="space-y-5 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-gold/30 text-xs text-gold">
                <Sparkles className="w-3.5 h-3.5" /> {t("home.heroBadge")}
              </div>
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
                {t("home.heroTitle1")}{" "}
                <span className="text-gradient-gold">{t("home.heroTitle2")}</span>
              </h1>
              <p className="text-lg text-foreground/70 max-w-xl">
                {t("home.heroDesc")}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/category/car-accessories"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-105 transition-transform"
                >
                  {t("home.shopNow")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl-flip" />
                </Link>
                <Link
                  to="/hot-deals"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full glass border border-gold/30 text-foreground hover:border-gold transition-colors"
                >
                  <Flame className="w-4 h-4 text-gold" /> {t("nav.deals")}
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Banknote className="w-4 h-4 text-gold" /> {t("home.cod")}</div>
                <div className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-gold" /> {t("home.fastDelivery")}</div>
              </div>
            </div>

            {/* Side info card */}
            <div className="hidden lg:block animate-fade-in-up delay-200">
              <div className="glass rounded-3xl p-7 gold-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold">
                    <Gem className="w-6 h-6 text-deep-green" />
                  </div>
                  <div>
                    <div className="text-xs text-gold uppercase tracking-widest">{t("home.premiumQuality")}</div>
                    <div className="font-display text-lg">Zackify.uae</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label={t("home.cod")} value={t("home.codShort")} />
                  <Stat label={t("home.fastDelivery")} value="2–4d" />
                  <Stat label={t("home.returnsTitle")} value="3d" />
                  <Stat label={t("home.support")} value="24/7" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="text-xs text-gold uppercase tracking-widest mb-2">{t("home.shopBy")}</div>
          <h2 className="font-display text-3xl md:text-4xl">{t("home.categories")}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {cats.map((c, i) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className={`group relative overflow-hidden rounded-2xl glass border border-gold/20 p-8 hover-lift gold-border animate-fade-in-up delay-${(i + 1) * 100}`}
            >
              <div className="w-16 h-16 mb-5 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform">
                <c.Icon className="w-8 h-8 text-deep-green" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-2xl mb-2 group-hover:text-gold transition-colors">{c.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gold">
                {t("home.explore")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl-flip" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs text-gold uppercase tracking-widest mb-2">{t("home.handpicked")}</div>
            <h2 className="font-display text-3xl md:text-4xl">{t("home.featured")}</h2>
          </div>
          <Link to="/category/car-accessories" className="hidden sm:flex items-center gap-1.5 text-sm text-gold hover:gap-2 transition-all">
            {t("common.viewAll")} <ArrowRight className="w-4 h-4 rtl-flip" />
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
          <div className="text-xs text-gold uppercase tracking-widest mb-2">{t("home.promise")}</div>
          <h2 className="font-display text-3xl md:text-4xl">{t("home.whyChoose")}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Banknote, title: t("home.cod"), desc: t("home.codDesc") },
            { icon: Truck, title: t("home.fastDelivery"), desc: t("home.fastDeliveryDesc") },
            { icon: Gem, title: t("home.premiumQuality"), desc: t("home.premiumQualityDesc") },
            { icon: RefreshCcw, title: t("home.returnsTitle"), desc: t("home.returnsDesc") },
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
                <div className="text-xs text-gold uppercase tracking-widest mb-2 inline-flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> {t("home.limitedTime")}</div>
                <h2 className="font-display text-3xl md:text-4xl">{t("nav.deals")}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t("home.dealsDesc")}</p>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/40 border border-gold/15 p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider line-clamp-1">{label}</div>
      <div className="text-base font-display text-gold">{value}</div>
    </div>
  );
}
