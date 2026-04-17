import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useCart, formatAED } from "@/lib/cart";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Banknote } from "lucide-react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, remove, setQty, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-6 py-24 text-center animate-fade-in-up">
          <ShoppingBag className="w-16 h-16 mx-auto text-gold/40 mb-6" strokeWidth={1.2} />
          <h1 className="font-display text-3xl mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Discover our premium collection and find your next favorite.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-105 transition-transform">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-display text-4xl mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="glass rounded-2xl p-4 flex gap-4 items-center animate-fade-in-up">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-secondary shrink-0">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to="/product/$slug" params={{ slug: item.slug }} className="font-medium hover:text-gold line-clamp-2">
                    {item.name}
                  </Link>
                  <div className="text-gold font-display font-bold mt-1">{formatAED(item.price)}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center glass rounded-full border border-gold/20 text-sm">
                    <button onClick={() => setQty(item.id, item.qty - 1)} className="p-2 hover:text-gold">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center">{item.qty}</span>
                    <button onClick={() => setQty(item.id, item.qty + 1)} className="p-2 hover:text-gold">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="glass rounded-2xl p-6 h-fit lg:sticky lg:top-24 space-y-4">
            <h3 className="font-display text-xl">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatAED(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-gold">{subtotal >= 200 ? "FREE" : "20 AED"}</span>
            </div>
            <div className="border-t border-gold/15 pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-gold font-display">{formatAED(subtotal + (subtotal >= 200 ? 0 : 20))}</span>
            </div>
            <Link
              to="/checkout"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-[1.02] transition-transform"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-center text-muted-foreground inline-flex items-center justify-center gap-1.5 w-full">
              <Banknote className="w-3.5 h-3.5 text-gold" /> Cash on Delivery available
            </p>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
