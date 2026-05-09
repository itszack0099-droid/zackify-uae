import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductGallery } from "@/components/ProductGallery";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatAED } from "@/lib/cart";
import {
  Star,
  Minus,
  Plus,
  ShoppingBag,
  Banknote,
  Truck,
  RefreshCcw,
  ShieldCheck,
  Check,
  Zap,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  features: string[] | null;
  colors: string[] | null;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  images: string[] | null;
  rating: number | null;
  stock: number;
  category_slug: string;
};

function ProductPage() {
  const { slug } = useParams({ from: "/product/$slug" });
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const { add } = useCart();

  useEffect(() => {
    setLoading(true);
    supabase.from("products").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      const p = data as Product | null;
      setProduct(p);
      setLoading(false);
      setQty(1);
      setSelectedColor(p?.colors?.[0] ?? "");
    });
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid lg:grid-cols-2 gap-8">
          <div className="aspect-square rounded-2xl animate-shimmer-bg" />
          <div className="space-y-4">
            <div className="h-7 w-3/4 animate-shimmer-bg rounded" />
            <div className="h-6 w-1/2 animate-shimmer-bg rounded" />
            <div className="h-12 animate-shimmer-bg rounded-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <h1 className="font-display text-3xl mb-4">Product not found</h1>
          <Link to="/" className="text-gold hover:underline">← Back to home</Link>
        </div>
      </Layout>
    );
  }

  const images = (product.images?.length ? product.images : [product.image_url]).filter(Boolean) as string[];
  const final = product.discount_price ?? product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const hasColors = (product.colors?.length ?? 0) > 0;

  const lineName = hasColors && selectedColor ? `${product.name} — ${selectedColor}` : product.name;
  const lineId = hasColors && selectedColor ? `${product.id}::${selectedColor}` : product.id;

  const handleAdd = () => {
    add({
      id: lineId,
      name: lineName,
      slug: product.slug,
      price: final,
      image: product.image_url || "",
    }, qty);
    toast.success("Added to cart", { description: `${qty} × ${lineName}` });
  };

  const handleBuyNow = () => {
    add({
      id: lineId,
      name: lineName,
      slug: product.slug,
      price: final,
      image: product.image_url || "",
    }, qty);
    navigate({ to: "/checkout" });
  };

  return (
    <Layout>
      {/* Bottom sticky action bar (mobile-app style) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-gold/20 px-3 py-2.5 flex items-center gap-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <button
          onClick={handleAdd}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gold text-gold font-semibold text-sm hover:bg-gold/10"
        >
          <ShoppingBag className="w-4 h-4" /> Add to cart
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-gold text-deep-green font-bold text-sm shadow-gold"
        >
          <Zap className="w-4 h-4" /> Buy at {formatAED(final)}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 pb-32 lg:pb-10">
        {/* Breadcrumb (desktop only) */}
        <div className="hidden md:flex text-xs text-muted-foreground mb-5 gap-1.5">
          <Link to="/" className="hover:text-gold">Home</Link>
          <span>/</span>
          <Link to="/category/$slug" params={{ slug: product.category_slug }} className="hover:text-gold capitalize">
            {product.category_slug.replace("-", " ")}
          </Link>
          <span>/</span>
          <span className="text-foreground/80 line-clamp-1">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Gallery */}
          <div className="animate-fade-in-up">
            <ProductGallery images={images} alt={product.name} />
          </div>

          {/* Info column */}
          <div className="space-y-4 animate-fade-in-up delay-100">
            {/* Title — medium size */}
            <h1 className="font-display text-lg md:text-xl leading-snug">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating ?? 5) ? "fill-gold" : "fill-none opacity-30"}`} strokeWidth={1.5} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({product.rating ?? 5}) · 248 reviews</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display font-bold text-3xl text-gold">{formatAED(final)}</span>
              {hasDiscount && (
                <>
                  <span className="text-base text-muted-foreground line-through">{formatAED(product.price)}</span>
                  <span className="text-[11px] bg-gradient-gold text-deep-green font-bold px-2 py-0.5 rounded-full">
                    −{Math.round(((product.price - product.discount_price!) / product.price) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Quantity + Buy now / Add to cart — directly below the title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center glass rounded-full border border-gold/30">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5 hover:text-gold">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-9 text-center font-semibold text-sm">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="p-2.5 hover:text-gold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleAdd}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full glass border-2 border-gold text-gold font-semibold text-sm hover:bg-gold/10 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-gradient-gold text-deep-green font-bold text-sm shadow-gold hover:scale-[1.01] transition-transform"
              >
                <Zap className="w-4 h-4" /> Buy Now
              </button>
            </div>

            {/* Color selection */}
            {hasColors && (
              <div className="space-y-2 pt-1">
                <div className="text-sm">
                  <span className="font-semibold">Selected Color:</span>{" "}
                  <span className="text-foreground/80">{selectedColor || "—"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(product.colors ?? []).map((c) => {
                    const active = c === selectedColor;
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                          active
                            ? "bg-gradient-gold text-deep-green border-gold shadow-gold"
                            : "glass border-gold/25 text-foreground hover:border-gold"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COD + delivery badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 text-xs bg-gold/10 border border-gold/30 text-gold px-3 py-1.5 rounded-full">
                <Banknote className="w-3.5 h-3.5" /> Cash on Delivery
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs bg-gold/10 border border-gold/30 text-gold px-3 py-1.5 rounded-full">
                <Truck className="w-3.5 h-3.5" /> 2–4 days in UAE
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-foreground/75 leading-relaxed pt-2">{product.description}</p>
            )}

            {/* Features — collapsible button */}
            {product.features && product.features.length > 0 && (
              <div className="glass rounded-2xl border border-gold/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFeaturesOpen((o) => !o)}
                  aria-expanded={featuresOpen}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gold/5 transition-colors"
                >
                  <span className="font-semibold text-sm">Features</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gold transition-transform ${featuresOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {featuresOpen && (
                  <ul className="px-4 pb-4 space-y-2 animate-fade-in">
                    {product.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                        <span className="text-foreground/85">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Returns */}
            <div className="glass rounded-2xl p-4 flex items-start gap-3">
              <RefreshCcw className="w-5 h-5 text-gold mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold">3 Days Return Policy</div>
                <div className="text-xs text-muted-foreground">
                  Returns are accepted within 3 days of delivery. The product must be unused, in original condition, and in its original packaging.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-10">
          <h2 className="font-display text-xl mb-5 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold" /> Customer Reviews
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { name: "Ahmed M.", rating: 5, text: "Premium quality, exactly as shown. Fast delivery to Dubai." },
              { name: "Khalid R.", rating: 5, text: "Worth every dirham. The packaging was luxurious." },
              { name: "Yousef A.", rating: 4, text: "Great product, will order again. COD made it easy." },
            ].map((r) => (
              <div key={r.name} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-1 text-gold mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-gold" : "fill-none opacity-30"}`} strokeWidth={1.5} />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 mb-2">"{r.text}"</p>
                <div className="text-xs text-muted-foreground">— {r.name}, UAE</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
