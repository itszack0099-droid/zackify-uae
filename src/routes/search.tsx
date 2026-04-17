import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard, type ProductLite } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [results, setResults] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    supabase
      .from("products")
      .select("id,name,slug,price,discount_price,image_url,rating,hot_deal")
      .ilike("name", `%${q}%`)
      .then(({ data }) => {
        setResults((data ?? []) as ProductLite[]);
        setLoading(false);
      });
  }, [q]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gold uppercase tracking-widest mb-2">
            <Search className="w-3.5 h-3.5" /> Search Results
          </div>
          <h1 className="font-display text-3xl md:text-4xl">"{q}"</h1>
          <p className="text-muted-foreground text-sm mt-1">{results.length} products found</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl animate-shimmer-bg" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center text-muted-foreground">No products match "{q}".</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
