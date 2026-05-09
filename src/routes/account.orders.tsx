import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart, formatAED } from "@/lib/cart";
import {
  ArrowLeft,
  Search as SearchIcon,
  ChevronRight,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  Package,
  RotateCcw,
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
  created_at: string;
  customer_name: string;
  city: string;
  emirate: string;
  items: OrderItem[];
};

function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { add } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/account", search: { redirect: "/account/orders" } });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,status,total,created_at,customer_name,city,emirate,items")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error(error);
        toast.error("Could not load your orders");
      } else {
        setOrders((data ?? []) as unknown as Order[]);
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  // Realtime updates for the user's orders
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`my-orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as unknown as Order, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as { id: string } & Partial<Order>;
            setOrders((prev) => prev.map((o) => (o.id === row.id ? ({ ...o, ...row } as Order) : o)));
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const reorder = (order: Order) => {
    order.items.forEach((it) => {
      add(
        { id: it.id, name: it.name, slug: it.slug, price: it.price, image: it.image ?? "" },
        it.qty,
      );
    });
    toast.success("Items added to cart", { description: `Reordered ${order.order_number}` });
    navigate({ to: "/cart" });
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.items.some((it) => it.name.toLowerCase().includes(q)),
      )
    : orders;

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="h-10 w-40 mb-6 rounded-lg animate-shimmer-bg" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-shimmer-bg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Mobile-app style header */}
        <div className="flex items-center gap-3 py-3 mb-4">
          <Link
            to="/account"
            search={{ redirect: undefined }}
            className="p-2 -ml-2 rounded-full hover:bg-gold/10"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl">My Orders</h1>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your orders here"
            className="w-full pl-10 pr-4 py-3 rounded-2xl glass border border-gold/20 text-sm focus:outline-none focus:border-gold"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center gold-border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
              <Inbox className="w-8 h-8 text-gold" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl mb-2">
              {orders.length === 0 ? "No orders yet" : "No matching orders"}
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              {orders.length === 0
                ? "Place your first order — Cash on Delivery available across UAE."
                : "Try a different search term."}
            </p>
            {orders.length === 0 && (
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold"
              >
                <ShoppingBag className="w-4 h-4" /> Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o, i) => (
              <OrderRow key={o.id} order={o} index={i} onReorder={() => reorder(o)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function OrderRow({ order, index, onReorder }: { order: Order; index: number; onReorder: () => void }) {
  const first = order.items[0];
  const date = new Date(order.created_at).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const status = order.status;
  const meta = STATUS_META[status];

  return (
    <div
      className="glass rounded-2xl gold-border overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Link
        to="/track-order"
        search={{ num: order.order_number }}
        className="flex items-center gap-3 p-3.5 hover:bg-gold/5 transition-colors"
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary shrink-0">
          {first?.image ? (
            <img src={first.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-card flex items-center justify-center">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${meta.titleClass}`}>{meta.title(date)}</div>
          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {first ? first.name : "—"}
            {order.items.length > 1 && ` +${order.items.length - 1} more`}
          </div>
          <div className="text-[11px] text-muted-foreground/80 mt-0.5">
            {order.order_number} · <span className="text-gold font-medium">{formatAED(order.total)}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </Link>

      {/* Status strip */}
      <div className={`flex items-center justify-between gap-3 px-4 py-2.5 border-t border-gold/15 ${meta.stripClass}`}>
        <div className="flex items-center gap-2 text-xs">
          <meta.Icon className="w-4 h-4" />
          <span className="font-medium">{meta.label}</span>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onReorder(); }}
          className="text-[11px] inline-flex items-center gap-1 px-3 py-1 rounded-full glass border border-gold/30 hover:border-gold text-gold font-medium"
        >
          <RotateCcw className="w-3 h-3" /> Reorder
        </button>
      </div>
    </div>
  );
}

const STATUS_META: Record<
  Order["status"],
  {
    label: string;
    title: (date: string) => string;
    titleClass: string;
    stripClass: string;
    Icon: typeof Clock;
  }
> = {
  pending: {
    label: "Order placed",
    title: (d) => `Placed on ${d}`,
    titleClass: "text-foreground",
    stripClass: "bg-amber-500/5 text-amber-400",
    Icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    title: (d) => `Confirmed on ${d}`,
    titleClass: "text-foreground",
    stripClass: "bg-blue-500/5 text-blue-400",
    Icon: Package,
  },
  shipped: {
    label: "Out for delivery",
    title: (d) => `Shipped on ${d}`,
    titleClass: "text-foreground",
    stripClass: "bg-purple-500/5 text-purple-400",
    Icon: Truck,
  },
  delivered: {
    label: "Delivered",
    title: (d) => `Delivered on ${d}`,
    titleClass: "text-foreground",
    stripClass: "bg-emerald-500/5 text-emerald-400",
    Icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    title: (d) => `Cancelled on ${d}`,
    titleClass: "text-destructive",
    stripClass: "bg-destructive/5 text-destructive",
    Icon: XCircle,
  },
};
