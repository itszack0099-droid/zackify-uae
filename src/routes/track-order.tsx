import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Package, Search, CheckCircle2, Truck, Clock, X, Hash, Phone, Bike, CalendarClock, RefreshCcw } from "lucide-react";
import { formatAED } from "@/lib/cart";

export const Route = createFileRoute("/track-order")({
  validateSearch: z.object({ num: z.string().optional() }),
  component: TrackPage,
});

type Order = {
  order_number: string;
  customer_name: string;
  phone: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: Array<{ name: string; qty: number; price: number }>;
  tracking_number: string | null;
  courier_name: string | null;
  estimated_delivery: string | null;
};

const STEPS = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"] as const;
const LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  return_approved: "Return Approved",
  returned: "Returned",
};

const RETURN_ELIGIBLE: ReadonlyArray<string> = ["delivered"];
const RETURN_ACTIVE: ReadonlyArray<string> = ["return_requested", "return_approved", "returned"];

function TrackPage() {
  const search = Route.useSearch();
  const [num, setNum] = useState(search.num ?? "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!num.trim() || !phone.trim()) {
      setError("Please enter both your order number and phone.");
      return;
    }
    setLoading(true);
    setError(null);
    const { data } = await supabase
      .from("orders")
      .select("order_number,customer_name,phone,status,total,created_at,updated_at,items,tracking_number,courier_name,estimated_delivery")
      .eq("order_number", num.trim().toUpperCase())
      .maybeSingle();
    setLoading(false);
    if (!data) {
      setOrder(null);
      setError("Order not found. Check your number and try again.");
      return;
    }
    // Verify phone matches (last 4 digits, ignore +/spaces)
    const norm = (s: string) => s.replace(/\D/g, "").slice(-9);
    if (norm(data.phone) !== norm(phone)) {
      setOrder(null);
      setError("Phone number doesn't match this order.");
      return;
    }
    setOrder(data as unknown as Order);
  };

  const currentStep = order ? STEPS.indexOf(order.status as typeof STEPS[number]) : -1;
  const cancelled = order?.status === "cancelled";
  const inReturnFlow = order ? RETURN_ACTIVE.includes(order.status) : false;
  const canRequestReturn = order ? RETURN_ELIGIBLE.includes(order.status) : false;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-8 animate-fade-in-up">
          <Package className="w-12 h-12 text-gold mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="font-display text-4xl mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">Enter your order number and phone to see live status</p>
        </div>

        <form onSubmit={lookup} className="glass rounded-2xl p-4 md:p-5 space-y-3 mb-6 animate-fade-in-up">
          <div className="flex items-center gap-2 bg-card/50 border border-gold/20 rounded-xl px-3">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <input
              value={num}
              onChange={(e) => setNum(e.target.value)}
              placeholder="Order number e.g. ZK-XXXXXX-XXXX"
              className="flex-1 bg-transparent py-3 focus:outline-none text-sm uppercase tracking-wider"
            />
          </div>
          <div className="flex items-center gap-2 bg-card/50 border border-gold/20 rounded-xl px-3">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number used at checkout"
              className="flex-1 bg-transparent py-3 focus:outline-none text-sm"
              inputMode="tel"
            />
          </div>
          <button disabled={loading} className="w-full px-6 py-3.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold disabled:opacity-60 inline-flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            {loading ? "Tracking..." : "Track Order"}
          </button>
        </form>

        {error && (
          <div className="glass rounded-2xl p-5 text-center text-sm text-muted-foreground border border-destructive/30 mb-6 animate-fade-in">
            <X className="w-8 h-8 text-destructive mx-auto mb-2" />
            {error}
          </div>
        )}

        {order && (
          <div className="glass rounded-2xl p-5 md:p-6 animate-fade-in-up space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Order Number</div>
                <div className="font-display text-2xl text-gold font-bold">{order.order_number}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {order.customer_name} · {new Date(order.created_at).toLocaleDateString("en-AE")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
                <div className="font-display text-2xl text-gold font-bold">{formatAED(order.total)}</div>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Current Status</div>
                <div className={`font-display text-xl ${cancelled ? "text-destructive" : "text-gold"}`}>{LABELS[order.status] ?? order.status}</div>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                Last updated<br />
                {new Date(order.updated_at).toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>

            {/* Tracker */}
            {!cancelled && (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-6 gap-1 min-w-[480px]">
                  {STEPS.map((s, i) => {
                    const active = i <= currentStep;
                    const Icon = i === 5 ? CheckCircle2 : i === 4 ? Bike : i === 3 ? Truck : i === 2 ? Package : i === 1 ? CheckCircle2 : Clock;
                    return (
                      <div key={s} className="text-center">
                        <div className={`w-11 h-11 mx-auto mb-2 rounded-full flex items-center justify-center transition-all ${active ? "bg-gradient-gold text-deep-green shadow-gold" : "bg-secondary text-muted-foreground"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className={`text-[10px] uppercase tracking-wider ${active ? "text-gold font-semibold" : "text-muted-foreground"}`}>{LABELS[s]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tracking details */}
            {(order.tracking_number || order.courier_name || order.estimated_delivery) && (
              <div className="grid sm:grid-cols-3 gap-3">
                {order.courier_name && (
                  <Detail icon={<Truck className="w-4 h-4" />} label="Courier" value={order.courier_name} />
                )}
                {order.tracking_number && (
                  <Detail icon={<Hash className="w-4 h-4" />} label="Tracking #" value={order.tracking_number} />
                )}
                {order.estimated_delivery && (
                  <Detail icon={<CalendarClock className="w-4 h-4" />} label="Est. Delivery" value={new Date(order.estimated_delivery).toLocaleDateString("en-AE", { dateStyle: "medium" })} />
                )}
              </div>
            )}

            {/* Items */}
            <div className="border-t border-gold/15 pt-4 space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Items</div>
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

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-card/50 border border-gold/15">
      <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1">{icon}{label}</div>
      <div className="text-sm font-medium break-all">{value}</div>
    </div>
  );
}
