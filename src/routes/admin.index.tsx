import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, DollarSign, Package, Users } from "lucide-react";
import { formatAED } from "@/lib/cart";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, subscribers: 0 });
  const [recent, setRecent] = useState<Array<{ order_number: string; customer_name: string; total: number; status: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [ordersRes, productsRes, subsRes, recentRes] = await Promise.all([
        supabase.from("orders").select("total", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("order_number,customer_name,total,status,created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      const revenue = (ordersRes.data ?? []).reduce((s, o) => s + Number(o.total), 0);
      setStats({
        orders: ordersRes.count ?? 0,
        revenue,
        products: productsRes.count ?? 0,
        subscribers: subsRes.count ?? 0,
      });
      setRecent((recentRes.data ?? []) as typeof recent);
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Total Orders", value: stats.orders.toString(), icon: ShoppingBag },
    { label: "Total Revenue", value: formatAED(stats.revenue), icon: DollarSign },
    { label: "Products", value: stats.products.toString(), icon: Package },
    { label: "Subscribers", value: stats.subscribers.toString(), icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back to your luxury store.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={c.label} className={`glass rounded-2xl p-5 hover-lift gold-border animate-fade-in-up delay-${(i + 1) * 100}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <c.icon className="w-5 h-5 text-deep-green" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</div>
            <div className="font-display text-2xl mt-1 text-gold">{loading ? "—" : c.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-xl mb-4">Recent Orders</h2>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-shimmer-bg" />)}</div>
        ) : recent.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase">
                  <th className="py-2">Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.order_number} className="border-t border-gold/10">
                    <td className="py-3 text-gold font-medium">{o.order_number}</td>
                    <td>{o.customer_name}</td>
                    <td>{formatAED(Number(o.total))}</td>
                    <td><StatusPill status={o.status} /></td>
                    <td className="text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("en-AE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    confirmed: "bg-blue-500/20 text-blue-400",
    shipped: "bg-purple-500/20 text-purple-400",
    delivered: "bg-green-500/20 text-green-400",
    cancelled: "bg-red-500/20 text-red-400",
  };
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${map[status] ?? "bg-secondary"}`}>{status}</span>;
}
