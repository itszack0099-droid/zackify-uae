import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, Package, Home } from "lucide-react";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/order-success")({
  validateSearch: z.object({ num: z.string().optional() }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { num } = Route.useSearch();
  return (
    <Layout>
      <div className="max-w-xl mx-auto px-6 py-20 text-center animate-fade-in-up">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 rounded-full bg-gold/30 blur-2xl animate-float" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold animate-scale-in">
            <CheckCircle2 className="w-14 h-14 text-deep-green" strokeWidth={2} />
          </div>
        </div>

        <h1 className="font-display text-4xl md:text-5xl mb-3">Order Placed Successfully</h1>
        <p className="text-foreground/70 mb-8">
          Your order will be delivered within <span className="text-gold font-semibold">2–4 days</span> across the UAE.
        </p>

        {num && (
          <div className="glass rounded-2xl p-6 mb-8 inline-block">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Order Number</div>
            <div className="font-display text-2xl text-gold font-bold">{num}</div>
            <div className="text-xs text-muted-foreground mt-2">Save this number to track your order</div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-105 transition-transform">
            <Home className="w-4 h-4" /> Continue Shopping
          </Link>
          <Link to="/track-order" search={{ num: num ?? "" }} className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass border border-gold/30 hover:border-gold transition-colors">
            <Package className="w-4 h-4" /> Track Order
          </Link>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          💵 Pay in cash when the order arrives. Our team will call you to confirm.
        </p>
      </div>
    </Layout>
  );
}
