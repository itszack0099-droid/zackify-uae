import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAED } from "@/lib/cart";
import { toast } from "sonner";
import { Eye, X, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

type Status = "pending" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "return_requested" | "return_approved" | "returned";

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
  status: Status;
  notes: string | null;
  created_at: string;
  tracking_number: string | null;
  courier_name: string | null;
  estimated_delivery: string | null;
};

const STATUSES: Status[] = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "return_approved", "returned"];
const STATUS_LABEL: Record<Status, string> = {
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
const COURIERS = ["Aramex", "DHL", "Emirates Post", "Fetchr", "Quiqup", "Talabat", "Careem Express", "Other"];

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

  // Realtime: new orders + status changes appear live
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          console.log("[realtime] new order", payload.new);
          const row = payload.new as Order;
          setOrders((prev) => prev.some((o) => o.id === row.id) ? prev : [row, ...prev]);
          toast.info(`New order: ${row.order_number}`);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          console.log("[realtime] order updated", payload.new);
          const row = payload.new as Order;
          setOrders((prev) => prev.map((o) => (o.id === row.id ? { ...o, ...row } : o)));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id).select();
    if (error) { console.error(error); return toast.error("Failed to update status"); }
    toast.success("Status updated");
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const deleteOrder = async (id: string, num: string) => {
    if (!confirm(`Delete order ${num}? This cannot be undone.`)) return;
    const { error, data } = await supabase.from("orders").delete().eq("id", id).select();
    if (error) { console.error(error); return toast.error("Failed to delete order"); }
    if (!data || data.length === 0) return toast.error("Delete blocked — admin permissions required");
    toast.success("Order deleted");
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (selected?.id === id) setSelected(null);
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
              {s === "all" ? "All" : STATUS_LABEL[s as Status]}
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
                <th>Tracking</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="p-2"><div className="h-10 rounded-lg animate-shimmer-bg" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders.</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                  <td className="p-4 text-gold font-medium">{o.order_number}</td>
                  <td>
                    <div>{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </td>
                  <td className="font-medium">{formatAED(Number(o.total))}</td>
                  <td>
                    <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as Status)} className="bg-card border border-gold/20 rounded-lg px-2 py-1 text-xs">
                      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </td>
                  <td className="text-xs">
                    {o.tracking_number ? (
                      <div>
                        <div className="text-gold">{o.tracking_number}</div>
                        <div className="text-muted-foreground">{o.courier_name ?? "—"}</div>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-AE")}</td>
                  <td className="pr-4 text-right whitespace-nowrap">
                    <button onClick={() => setSelected(o)} title="View / Edit" className="p-2 rounded-lg hover:bg-gold/10 hover:text-gold transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteOrder(o.id, o.order_number)} title="Delete order" className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}

const EMIRATES = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

function OrderModal({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: (o: Order) => void }) {
  const [status, setStatus] = useState<Status>(order.status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [courier, setCourier] = useState(order.courier_name ?? "");
  const [eta, setEta] = useState(order.estimated_delivery ?? "");
  const [customerName, setCustomerName] = useState(order.customer_name);
  const [phone, setPhone] = useState(order.phone);
  const [address, setAddress] = useState(order.address);
  const [city, setCity] = useState(order.city);
  const [emirate, setEmirate] = useState(order.emirate);
  const [postal, setPostal] = useState(order.postal_code ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const save = async () => {
    setSaving(true);
    const payload = {
      status,
      tracking_number: tracking.trim() || null,
      courier_name: courier.trim() || null,
      estimated_delivery: eta || null,
      customer_name: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      emirate,
      postal_code: postal.trim() || null,
      notes: notes.trim() || null,
    };
    const { data, error } = await supabase.from("orders").update(payload).eq("id", order.id).select().maybeSingle();
    setSaving(false);
    if (error || !data) {
      console.error(error);
      return toast.error("Save failed. Check admin permissions.");
    }
    toast.success("Order updated");
    onSaved(data as unknown as Order);
    setEditMode(false);
  };

  const fld = "w-full bg-card border border-gold/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-2 md:p-6" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-gold/30 max-w-2xl w-full max-h-[90vh] overflow-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gold/15 flex justify-between items-start sticky top-0 bg-card z-10">
          <div>
            <div className="text-xs text-muted-foreground">Order</div>
            <div className="font-display text-2xl text-gold">{order.order_number}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode((v) => !v)}
              className="text-xs px-3 py-1.5 rounded-full glass border border-gold/30 hover:border-gold"
            >
              {editMode ? "Done editing" : "Edit details"}
            </button>
            <button onClick={onClose} className="p-2 hover:text-gold"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {/* Customer & address — view or edit */}
          {editMode ? (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Customer & Address</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full name"><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={fld} /></Field>
                <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={fld} /></Field>
                <div className="sm:col-span-2"><Field label="Address"><input value={address} onChange={(e) => setAddress(e.target.value)} className={fld} /></Field></div>
                <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} className={fld} /></Field>
                <Field label="Emirate">
                  <select value={emirate} onChange={(e) => setEmirate(e.target.value)} className={fld}>
                    {EMIRATES.map((em) => <option key={em} value={em}>{em}</option>)}
                  </select>
                </Field>
                <Field label="Postal code"><input value={postal} onChange={(e) => setPostal(e.target.value)} className={fld} /></Field>
                <div className="sm:col-span-2"><Field label="Notes"><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={fld} /></Field></div>
              </div>
            </div>
          ) : (
            <>
              <Info label="Customer" value={`${order.customer_name} · ${order.phone}`} />
              <Info label="Address" value={`${order.address}, ${order.city}, ${order.emirate}${order.postal_code ? ` ${order.postal_code}` : ""}`} />
              {order.notes && <Info label="Notes" value={order.notes} />}
            </>
          )}

          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Items</div>
            <div className="space-y-2">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{it.name} × {it.qty}</span>
                  <span className="text-gold">{formatAED(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gold/15 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-gold font-display text-lg">{formatAED(Number(order.total))}</span>
          </div>

          <div className="border-t border-gold/15 pt-5 space-y-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Update Order</div>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={fld}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </Field>
            <Field label="Courier">
              <select value={courier} onChange={(e) => setCourier(e.target.value)} className={fld}>
                <option value="">Select courier…</option>
                {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tracking Number">
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. 1234567890" className={fld} />
            </Field>
            <Field label="Estimated Delivery">
              <input type="date" value={eta} onChange={(e) => setEta(e.target.value)} className={fld} />
            </Field>
            <button onClick={save} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold disabled:opacity-60">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}
