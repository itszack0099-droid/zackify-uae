import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard, type ProductLite } from "@/components/ProductCard";
import { Countdown } from "@/components/Countdown";
import { supabase } from "@/integrations/supabase/client";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/hot-deals")({
  component: HotDealsPage,
  head: () => ({
    meta: [
      { title: "Hot Deals — Zackify.uae" },
      { name: "description", content: "Limited-time offers on premium gear. Up to 50% off." },
    ],
  }),
});

type DealProduct = ProductLite & { deal_ends_at: string | null };

function HotDealsPage() {
  const [deals, setDeals] = useState<DealProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("id,name,slug,price,discount_price,image_url,rating,hot_deal,deal_ends_at")
      .eq("hot_deal", true)
      .then(({ data }) => {
        setDeals((data ?? []) as DealProduct[]);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="text-xs text-gold uppercase tracking-widest mb-2 inline-flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> Limited Time</div>
          <h1 className="font-display text-4xl md:text-5xl mb-3">Hot Deals</h1>
          <p className="text-muted-foreground">Premium gear at unbeatable prices — while stocks last</p>
          {deals[0]?.deal_ends_at && (
            <div className="mt-6 flex justify-center">
              <Countdown to={deals[0].deal_ends_at} />
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl animate-shimmer-bg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {deals.map((p, i) => (
              <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
