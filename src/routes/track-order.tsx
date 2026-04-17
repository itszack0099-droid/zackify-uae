import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Package, Search, CheckCircle2, Truck, Clock, X } from "lucide-react";
import { formatAED } from "@/lib/cart";

export const Route = createFileRoute("/track-order")({
  validateSearch: z.object({ num: z.string().optional() }),
  component: TrackPage,
});

type Order = {
  order_number: string;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
  items: Array<{ name: string; qty: number; price: number }>;
};

function TrackPage() {
  const search = Route.useSearch();
  const [num, setNum] = useState(search.num ?? "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!num.trim()) return;
    setLoading(true);
    setNotFound(false);
    const { data } = await supabase
      .from("orders")
      .select("order_number,customer_name,status,total,created_at,items")
      .eq("order_number", num.trim().toUpperCase())
      .maybeSingle();
    setLoading(false);
    if (data) setOrder(data as unknown as Order);
    else { setOrder(null); setNotFound(true); }
  };

  const STEPS = ["pending", "confirmed", "shipped", "delivered"];
  const currentStep = order ? STEPS.indexOf(order.status) : -1;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-8 animate-fade-in-up">
          <Package className="w-12 h-12 text-gold mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="font-display text-4xl mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">Enter your order number to see live status</p>
        </div>

        <form onSubmit={lookup} className="glass rounded-2xl p-2 flex gap-2 mb-8">
          <Search className="w-5 h-5 text-muted-foreground self-center ml-3" />
          <input
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="ZK-XXXXXX-XXXX"
            className="flex-1 bg-transparent px-2 py-3 focus:outline-none text-sm"
          />
          <button disabled={loading} className="px-6 py-2.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold disabled:opacity-60">
            {loading ? "..." : "Track"}
          </button>
        </form>

        {notFound && (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
            <X className="w-10 h-10 text-destructive mx-auto mb-3" />
            Order not found. Please check the number and try again.
          </div>
        )}

        {order && (
          <div className="glass rounded-2xl p-6 animate-fade-in-up">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div>
                <div className="text-xs text-muted-foreground">Order Number</div>
                <div className="font-display text-2xl text-gold font-bold">{order.order_number}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {order.customer_name} · {new Date(order.created_at).toLocaleDateString("en-AE")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-display text-2xl text-gold font-bold">{formatAED(order.total)}</div>
              </div>
            </div>

            {/* Tracker */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {STEPS.map((s, i) => {
                const active = i <= currentStep;
                const Icon = i === 3 ? CheckCircle2 : i === 2 ? Truck : i === 1 ? Package : Clock;
                return (
                  <div key={s} className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center transition-all ${active ? "bg-gradient-gold text-deep-green shadow-gold" : "bg-secondary text-muted-foreground"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className={`text-xs capitalize ${active ? "text-gold font-semibold" : "text-muted-foreground"}`}>{s}</div>
                  </div>
                );
              })}
            </div>

            {/* Items */}
            <div className="border-t border-gold/15 pt-4 space-y-2">
              {order.items?.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-foreground/80">{it.name} × {it.qty}</span>
                  <span className="text-gold">{formatAED(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
