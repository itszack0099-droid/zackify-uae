import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAED } from "@/lib/cart";
import { toast } from "sonner";
import { Eye, X } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  emirate: string;
  postal_code: string | null;
  items: Array<{ name: string; qty: number; price: number; image?: string }>;
  total: number;
  subtotal: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  notes: string | null;
  created_at: string;
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data ?? []) as unknown as Order[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, status: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error("Failed to update");
    toast.success("Order updated");
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-colors ${filter === s ? "bg-gradient-gold text-deep-green" : "glass border border-gold/20 hover:border-gold"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase border-b border-gold/15">
                <th className="p-4">Order #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-2"><div className="h-10 rounded-lg animate-shimmer-bg" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders.</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                  <td className="p-4 text-gold font-medium">{o.order_number}</td>
                  <td>
                    <div>{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </td>
                  <td className="font-medium">{formatAED(Number(o.total))}</td>
                  <td>
                    <select value={o.status} onChange={(e) => update(o.id, e.target.value as Order["status"])} className="bg-card border border-gold/20 rounded-lg px-2 py-1 text-xs uppercase">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-AE")}</td>
                  <td className="pr-4">
                    <button onClick={() => setSelected(o)} className="p-2 rounded-lg hover:bg-gold/10 hover:text-gold transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-2 md:p-6" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl border border-gold/30 max-w-2xl w-full max-h-[90vh] overflow-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gold/15 flex justify-between items-start sticky top-0 bg-card">
              <div>
                <div className="text-xs text-muted-foreground">Order</div>
                <div className="font-display text-2xl text-gold">{selected.order_number}</div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:text-gold"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <Info label="Customer" value={`${selected.customer_name} · ${selected.phone}`} />
              <Info label="Address" value={`${selected.address}, ${selected.city}, ${selected.emirate}${selected.postal_code ? ` ${selected.postal_code}` : ""}`} />
              {selected.notes && <Info label="Notes" value={selected.notes} />}
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Items</div>
                <div className="space-y-2">
                  {selected.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{it.name} × {it.qty}</span>
                      <span className="text-gold">{formatAED(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gold/15 pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-gold font-display text-lg">{formatAED(Number(selected.total))}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
