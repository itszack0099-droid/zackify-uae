import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";

export function WishlistButton({
  productId,
  productName,
  className = "",
  size = 18,
}: {
  productId: string;
  productName?: string;
  className?: string;
  size?: number;
}) {
  const { has, toggle } = useWishlist();
  const active = has(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId, productName);
      }}
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={active}
      className={`group/wish flex items-center justify-center rounded-full backdrop-blur-md border transition-all ${
        active
          ? "bg-gold text-deep-green border-gold shadow-gold scale-105"
          : "bg-background/70 text-foreground/80 border-gold/30 hover:border-gold hover:text-gold hover:scale-110"
      } ${className}`}
    >
      <Heart
        style={{ width: size, height: size }}
        strokeWidth={2}
        className={active ? "fill-current" : "fill-none"}
      />
    </button>
  );
}
