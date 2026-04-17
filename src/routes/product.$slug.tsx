import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatAED } from "@/lib/cart";
import { Star, Minus, Plus, ShoppingBag, Banknote, Truck, RefreshCcw, ShieldCheck, Check, Zap } from "lucide-react";
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
  const [activeImg, setActiveImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const { add } = useCart();

  useEffect(() => {
    setLoading(true);
    supabase.from("products").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      setProduct(data as Product | null);
      setLoading(false);
      setActiveImg(0);
      setQty(1);
    });
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-2 gap-10">
          <div className="aspect-square rounded-2xl animate-shimmer-bg" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-shimmer-bg rounded" />
            <div className="h-6 w-1/2 animate-shimmer-bg rounded" />
            <div className="h-32 animate-shimmer-bg rounded" />
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

  const handleAdd = () => {
    add({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: final,
      image: product.image_url || "",
    }, qty);
    toast.success("Added to cart", { description: `${qty} × ${product.name}` });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="text-xs text-muted-foreground mb-6 flex gap-1.5">
          <Link to="/" className="hover:text-gold">Home</Link>
          <span>/</span>
          <Link to="/category/$slug" params={{ slug: product.category_slug }} className="hover:text-gold capitalize">
            {product.category_slug.replace("-", " ")}
          </Link>
          <span>/</span>
          <span className="text-foreground/80 line-clamp-1">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Images */}
          <div className="space-y-4 animate-fade-in-up">
            <div
              className="relative aspect-square rounded-2xl overflow-hidden glass border border-gold/20 cursor-zoom-in group"
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
            >
              {images[activeImg] && (
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-transform duration-500 ${zoom ? "scale-150" : "scale-100"}`}
                />
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      i === activeImg ? "border-gold shadow-gold" : "border-gold/15 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5 animate-fade-in-up delay-100">
            <h1 className="font-display text-3xl md:text-4xl">{product.name}</h1>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating ?? 5) ? "fill-gold" : "fill-none opacity-30"}`} strokeWidth={1.5} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({product.rating ?? 5}) · 248 reviews</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-display font-bold text-4xl text-gold">{formatAED(final)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatAED(product.price)}</span>
                  <span className="text-xs bg-gradient-gold text-deep-green font-bold px-2.5 py-1 rounded-full">
                    −{Math.round(((product.price - product.discount_price!) / product.price) * 100)}%
                  </span>
                </>
              )}
            </div>

            <p className="text-foreground/75 leading-relaxed">{product.description}</p>

            {product.features && product.features.length > 0 && (
              <ul className="space-y-2">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* COD badge */}
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs bg-gold/10 border border-gold/30 text-gold px-3 py-1.5 rounded-full">
                <Banknote className="w-3.5 h-3.5" /> Cash on Delivery
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs bg-gold/10 border border-gold/30 text-gold px-3 py-1.5 rounded-full">
                <Truck className="w-3.5 h-3.5" /> 2–4 days delivery in UAE
              </div>
            </div>

            {/* Quantity + add */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center glass rounded-full border border-gold/30">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:text-gold">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:text-gold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-[1.02] transition-transform"
              >
                <ShoppingBag className="w-5 h-5" /> Add to Cart
              </button>
            </div>

            {/* Returns */}
            <div className="glass rounded-2xl p-4 flex items-start gap-3">
              <RefreshCcw className="w-5 h-5 text-gold mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold">Easy 7-day Returns</div>
                <div className="text-xs text-muted-foreground">
                  Not satisfied? Return within 7 days for a full refund. Item must be unused.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16">
          <h2 className="font-display text-2xl mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold" /> Customer Reviews
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Ahmed M.", rating: 5, text: "Premium quality, exactly as shown. Fast delivery to Dubai." },
              { name: "Khalid R.", rating: 5, text: "Worth every dirham. The packaging was luxurious." },
              { name: "Yousef A.", rating: 4, text: "Great product, will order again. COD made it easy." },
            ].map((r) => (
              <div key={r.name} className="glass rounded-2xl p-5">
                <div className="flex items-center gap-1 text-gold mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-gold" : "fill-none opacity-30"}`} strokeWidth={1.5} />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 mb-3">"{r.text}"</p>
                <div className="text-xs text-muted-foreground">— {r.name}, UAE</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
