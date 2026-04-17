import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard, type ProductLite } from "@/components/ProductCard";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { ids, loading: wlLoading } = useWishlist();
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || ids.size === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,price,discount_price,image_url,rating,hot_deal")
        .in("id", Array.from(ids));
      setProducts((data ?? []) as ProductLite[]);
      setLoading(false);
    };
    if (!authLoading && !wlLoading) load();
  }, [user, ids, authLoading, wlLoading]);

  if (authLoading) {
    return <Layout><div className="max-w-6xl mx-auto px-6 py-16"><div className="h-32 animate-shimmer-bg rounded-2xl" /></div></Layout>;
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <Heart className="w-14 h-14 mx-auto text-gold mb-4" strokeWidth={1.5} />
          <h1 className="font-display text-3xl mb-3">Your Wishlist</h1>
          <p className="text-muted-foreground text-sm mb-6">Sign in to save items you love and shop them later.</p>
          <Link to="/account" search={{ redirect: "/wishlist" }} className="inline-block px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-105 transition-transform">
            Sign in
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
            <Heart className="w-5 h-5 text-deep-green fill-deep-green" />
          </div>
          <div>
            <h1 className="font-display text-3xl md:text-4xl">My Wishlist</h1>
            <p className="text-sm text-muted-foreground">{products.length} {products.length === 1 ? "item" : "items"} saved</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl animate-shimmer-bg" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl gold-border">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" strokeWidth={1.5} />
            <h2 className="font-display text-xl mb-2">No items saved yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Tap the heart on any product to save it here.</p>
            <Link to="/" className="inline-block px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-105 transition-transform">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
