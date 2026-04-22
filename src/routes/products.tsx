import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard, type ProductLite } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, Package } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/products")({
  component: AllProductsPage,
  head: () => ({
    meta: [
      { title: "All Products — Zackify.uae" },
      {
        name: "description",
        content:
          "Browse the complete Zackify.uae catalog: car accessories, gym & fitness gear, and phone accessories. Cash on Delivery across the UAE.",
      },
      { property: "og:title", content: "All Products — Zackify.uae" },
      { property: "og:description", content: "Shop the full Zackify.uae catalog with Cash on Delivery in the UAE." },
    ],
  }),
});

type Cat = { slug: string; name: string };

function AllProductsPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<ProductLite[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "price_asc" | "price_desc">("new");

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase
          .from("products")
          .select("id,name,slug,price,discount_price,image_url,rating,hot_deal,category_slug,created_at")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("slug,name").order("sort_order"),
      ]);
      setItems((p ?? []) as unknown as ProductLite[]);
      setCats((c ?? []) as Cat[]);
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    let arr = items as Array<ProductLite & { category_slug?: string; created_at?: string }>;
    if (cat !== "all") arr = arr.filter((p) => p.category_slug === cat);
    if (term) arr = arr.filter((p) => p.name.toLowerCase().includes(term));
    if (sort === "price_asc")
      arr = [...arr].sort((a, b) => Number(a.discount_price ?? a.price) - Number(b.discount_price ?? b.price));
    else if (sort === "price_desc")
      arr = [...arr].sort((a, b) => Number(b.discount_price ?? b.price) - Number(a.discount_price ?? a.price));
    return arr;
  }, [items, q, cat, sort]);

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="mb-8 animate-fade-in-up">
          <div className="text-xs text-gold uppercase tracking-widest mb-2 inline-flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> {t("home.shopBy")}
          </div>
          <h1 className="font-display text-3xl md:text-5xl">All Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading…" : `${visible.length} of ${items.length} products`}
          </p>
        </div>

        {/* Toolbar */}
        <div className="glass rounded-2xl p-4 gold-border mb-6 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="w-full bg-card/50 border border-gold/20 rounded-full pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="bg-card/50 border border-gold/20 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
            >
              <option value="all">All categories</option>
              {cats.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="bg-card/50 border border-gold/20 rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gold"
              >
                <option value="new">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl animate-shimmer-bg" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center text-muted-foreground gold-border">
            <Package className="w-10 h-10 mx-auto text-gold/60 mb-3" />
            <p className="mb-4">No products match your filters.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-gold text-deep-green text-sm font-semibold shadow-gold"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {visible.map((p, i) => (
              <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
