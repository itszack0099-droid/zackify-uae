import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard, type ProductLite } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

const NAMES: Record<string, string> = {
  "car-accessories": "Car Accessories",
  "gym-fitness": "Gym & Fitness",
  "phone-accessories": "Phone Accessories",
};

function CategoryPage() {
  const { slug } = useParams({ from: "/category/$slug" });
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc" | "rating">("new");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    supabase
      .from("products")
      .select("id,name,slug,price,discount_price,image_url,rating,hot_deal")
      .eq("category_slug", slug)
      .then(({ data }) => {
        setProducts((data ?? []) as ProductLite[]);
        setLoading(false);
      });
  }, [slug]);

  const filtered = useMemo(() => {
    let r = products.filter((p) => (p.discount_price ?? p.price) <= maxPrice);
    if (search) r = r.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    switch (sort) {
      case "price-asc": r.sort((a, b) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price)); break;
      case "price-desc": r.sort((a, b) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price)); break;
      case "rating": r.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    }
    return r;
  }, [products, sort, maxPrice, search]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 animate-fade-in-up">
          <div className="text-xs text-gold uppercase tracking-widest mb-2">Category</div>
          <h1 className="font-display text-4xl md:text-5xl">{NAMES[slug] ?? slug}</h1>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Filters */}
          <aside className="glass rounded-2xl p-5 h-fit lg:sticky lg:top-24 space-y-5">
            <div className="flex items-center gap-2 text-gold font-display">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a product..."
                className="w-full bg-card border border-gold/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Sort by</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="w-full bg-card border border-gold/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
              >
                <option value="new">Newest</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                Max price: <span className="text-gold font-semibold">{maxPrice} AED</span>
              </label>
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[var(--gold)]"
              />
            </div>
          </aside>

          {/* Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl animate-shimmer-bg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
                No products match your filters.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {filtered.map((p, i) => (
                  <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
