import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart, formatAED } from "@/lib/cart";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
  ChevronRight,
  ShoppingBag,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/orders")({
  component: OrdersPage,
});

type OrderItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  qty: number;
  image?: string;
};

type Order = {
  id: string;
  order_number: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total: number;
  subtotal: number;
  created_at: string;
  customer_name: string;
  emirate: string;
  city: string;
  items: OrderItem[];
};

const STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;

function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { add } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/account", search: { redirect: "/account/orders" } });
      return;
    }
    (async () => {
      // Match by customer email (orders table has no user_id; we filter by phone+email pattern)
      // Best-effort: fetch all orders where the customer email/phone matches the signed-in user's email
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,status,total,subtotal,created_at,customer_name,emirate,city,items,phone")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        toast.error("Could not load your orders");
        setLoading(false);
        return;
      }

      // Filter client-side to those that belong to this user (by email match in notes/phone is unreliable;
      // we use localStorage of order numbers placed during this browser session as the source of truth)
      const mineRaw = typeof window !== "undefined" ? localStorage.getItem("zackify_my_orders_v1") : null;
      const mineNums: string[] = mineRaw ? JSON.parse(mineRaw) : [];
      const filtered = (data ?? []).filter((o: any) => mineNums.includes(o.order_number));

      setOrders(filtered as unknown as Order[]);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  // Realtime live updates for the user's orders (incl. return status)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`my-orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as { id: string } & Partial<Order>;
          console.log("[realtime] my order updated", row);
          setOrders((prev) => prev.map((o) => (o.id === row.id ? { ...o, ...row } as Order : o)));
          if (row.status) toast.success(`Order ${row.order_number ?? ""} updated`);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const reorder = (order: Order) => {
    order.items.forEach((it) => {
      add(
        {
          id: it.id,
          name: it.name,
          slug: it.slug,
          price: it.price,
          image: it.image ?? "",
        },
        it.qty,
      );
    });
    toast.success("Items added to cart", { description: `Reordered ${order.order_number}` });
    navigate({ to: "/cart" });
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="h-10 w-56 mb-6 rounded-lg animate-shimmer-bg" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl animate-shimmer-bg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div>
            <div className="text-xs text-gold uppercase tracking-widest mb-1.5">My Account</div>
            <h1 className="font-display text-3xl md:text-4xl">Order History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {orders.length === 0 ? "You haven't placed any orders yet" : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Link
            to="/account"
            className="text-sm text-gold hover:underline hidden sm:inline"
          >
            ← Account
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center gold-border animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gold/10 flex items-center justify-center">
              <Inbox className="w-10 h-10 text-gold" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl mb-2">No orders yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Start exploring our premium collection. Cash on Delivery available across the UAE.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-105 transition-transform"
            >
              <ShoppingBag className="w-4 h-4" /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order, idx) => (
              <OrderCard key={order.id} order={order} index={idx} onReorder={() => reorder(order)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function OrderCard({ order, index, onReorder }: { order: Order; index: number; onReorder: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const cancelled = order.status === "cancelled";
  const currentStep = cancelled ? -1 : STEPS.indexOf(order.status as typeof STEPS[number]);
  const date = new Date(order.created_at).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="glass rounded-2xl gold-border overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex flex-wrap items-center gap-4 p-5 text-left hover:bg-gold/5 transition-colors"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold shrink-0">
          <Package className="w-6 h-6 text-deep-green" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg text-gold font-bold truncate">{order.order_number}</div>
          <div className="text-xs text-muted-foreground">
            {date} · {order.items.length} item{order.items.length === 1 ? "" : "s"} · {order.city}, {order.emirate}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-lg text-gold font-bold">{formatAED(order.total)}</div>
          <StatusBadge status={order.status} />
        </div>
        <ChevronRight
          className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-gold/15 p-5 space-y-5 animate-fade-in">
          {/* Timeline */}
          {cancelled ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <XCircle className="w-5 h-5 text-destructive shrink-0" />
              <div className="text-sm text-destructive">This order was cancelled.</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {STEPS.map((s, i) => {
                const active = i <= currentStep;
                const done = i < currentStep;
                const Icon = i === 3 ? CheckCircle2 : i === 2 ? Truck : i === 1 ? Package : Clock;
                return (
                  <div key={s} className="relative text-center">
                    {i > 0 && (
                      <div
                        className={`absolute top-5 right-1/2 w-full h-0.5 -z-0 ${
                          done || active ? "bg-gradient-gold" : "bg-border"
                        }`}
                        style={{ transform: "translateX(50%)" }}
                      />
                    )}
                    <div
                      className={`relative w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center transition-all ${
                        active
                          ? "bg-gradient-gold text-deep-green shadow-gold"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div
                      className={`text-[11px] capitalize ${
                        active ? "text-gold font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {s}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Items */}
          <div className="space-y-2.5">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {it.image ? (
                    <img src={it.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary to-card" />
                  )}
                </div>
                <Link
                  to="/product/$slug"
                  params={{ slug: it.slug }}
                  className="flex-1 min-w-0 hover:text-gold transition-colors"
                >
                  <div className="line-clamp-1">{it.name}</div>
                  <div className="text-xs text-muted-foreground">Qty {it.qty}</div>
                </Link>
                <div className="text-gold font-medium whitespace-nowrap">
                  {formatAED(it.price * it.qty)}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onReorder}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-gold text-deep-green text-sm font-semibold shadow-gold hover:scale-[1.02] transition-transform"
            >
              <RotateCcw className="w-4 h-4" /> Reorder
            </button>
            <Link
              to="/track-order"
              search={{ num: order.order_number }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-gold/25 text-sm hover:border-gold transition-colors"
            >
              <Truck className="w-4 h-4" /> Track Order
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const map = {
    pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    confirmed: { label: "Confirmed", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    shipped: { label: "Shipped", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
    delivered: { label: "Delivered", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    cancelled: { label: "Cancelled", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  } as const;
  const m = map[status];
  return (
    <span className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.cls}`}>
      {m.label}
    </span>
  );
}
