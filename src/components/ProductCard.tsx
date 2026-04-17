import { Link } from "@tanstack/react-router";
import { Star, ShoppingBag } from "lucide-react";
import { useCart, formatAED } from "@/lib/cart";
import { toast } from "sonner";

export type ProductLite = {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  rating: number | null;
  hot_deal?: boolean;
};

export function ProductCard({ product }: { product: ProductLite }) {
  const { add } = useCart();
  const final = product.discount_price ?? product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: final,
      image: product.image_url || "",
    });
    toast.success("Added to cart", { description: product.name });
  };

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group relative flex flex-col rounded-2xl bg-card/60 border border-gold/15 overflow-hidden hover-lift gold-border"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {hasDiscount && (
          <span className="bg-gradient-gold text-deep-green text-[10px] font-bold px-2.5 py-1 rounded-full shadow-gold">
            −{discountPct}%
          </span>
        )}
        {product.hot_deal && (
          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
            🔥 HOT
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <button
          onClick={handleAdd}
          className="absolute bottom-3 left-3 right-3 bg-gradient-gold text-deep-green text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-gold"
        >
          <ShoppingBag className="w-4 h-4" /> Add to Cart
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1 text-xs text-gold">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < Math.round(product.rating ?? 5) ? "fill-gold" : "fill-none opacity-30"
              }`}
              strokeWidth={1.5}
            />
          ))}
          <span className="text-muted-foreground ml-1">({product.rating ?? 5})</span>
        </div>
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mt-auto pt-2">
          <span className="font-display font-bold text-lg text-gold">{formatAED(final)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatAED(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
