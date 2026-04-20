import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type StringKey } from "@/lib/i18n";
import { Package, Search, CheckCircle2, Truck, Clock, X, Hash, Phone, Bike, CalendarClock, RefreshCcw } from "lucide-react";
import { formatAED } from "@/lib/cart";

export const Route = createFileRoute("/track-order")({
  validateSearch: z.object({ num: z.string().optional() }),
  component: TrackPage,
});

type Order = {
  id: string;
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
  delivery_date: string | null;
  return_deadline: string | null;
};

const STEPS = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"] as const;
const RETURN_ELIGIBLE: ReadonlyArray<string> = ["delivered"];
const RETURN_ACTIVE: ReadonlyArray<string> = ["return_requested", "return_approved", "returned"];

function TrackPage() {
  const search = Route.useSearch();
  const { t, lang } = useI18n();
  const [num, setNum] = useState(search.num ?? "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [livePulse, setLivePulse] = useState(false);
  const orderRef = useRef<Order | null>(null);

  useEffect(() => { orderRef.current = order; }, [order]);

  // Realtime subscription — when admin updates this order, we update live
  useEffect(() => {
    if (!order?.id) return;
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload) => {
          console.log("[realtime] order updated", payload.new);
          setOrder((prev) => prev ? { ...prev, ...(payload.new as Partial<Order>) } : prev);
          setLivePulse(true);
          setTimeout(() => setLivePulse(false), 2500);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [order?.id]);

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!num.trim() || !phone.trim()) {
      setError(t("track.bothRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    const { data } = await supabase
      .from("orders")
      .select("id,order_number,customer_name,phone,status,total,created_at,updated_at,items,tracking_number,courier_name,estimated_delivery,delivery_date,return_deadline")
      .eq("order_number", num.trim().toUpperCase())
      .maybeSingle();
    setLoading(false);
    if (!data) {
      setOrder(null);
      setError(t("track.notFound"));
      return;
    }
    const norm = (s: string) => s.replace(/\D/g, "").slice(-9);
    if (norm(data.phone) !== norm(phone)) {
      setOrder(null);
      setError(t("track.phoneMismatch"));
      return;
    }
    setOrder(data as unknown as Order);
  };

  const currentStep = order ? STEPS.indexOf(order.status as typeof STEPS[number]) : -1;
  const cancelled = order?.status === "cancelled";
  const inReturnFlow = order ? RETURN_ACTIVE.includes(order.status) : false;
  // Compute return window from return_deadline (set by DB trigger when status=delivered)
  const deadline = order?.return_deadline ? new Date(order.return_deadline).getTime() : null;
  const withinWindow = deadline ? Date.now() <= deadline : false;
  const canRequestReturn = order ? RETURN_ELIGIBLE.includes(order.status) && withinWindow : false;
  const returnExpired = order ? RETURN_ELIGIBLE.includes(order.status) && deadline !== null && !withinWindow : false;
  const locale = lang === "ar" ? "ar-AE" : "en-AE";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-8 animate-fade-in-up">
          <Package className="w-12 h-12 text-gold mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="font-display text-4xl mb-2">{t("track.title")}</h1>
          <p className="text-muted-foreground">{t("track.subtitle")}</p>
        </div>

        <form onSubmit={lookup} className="glass rounded-2xl p-4 md:p-5 space-y-3 mb-6 animate-fade-in-up">
          <div className="flex items-center gap-2 bg-card/50 border border-gold/20 rounded-xl px-3">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <input
              value={num}
              onChange={(e) => setNum(e.target.value)}
              placeholder={t("track.orderNumber")}
              className="flex-1 bg-transparent py-3 focus:outline-none text-sm uppercase tracking-wider"
            />
          </div>
          <div className="flex items-center gap-2 bg-card/50 border border-gold/20 rounded-xl px-3">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("track.phone")}
              className="flex-1 bg-transparent py-3 focus:outline-none text-sm"
              inputMode="tel"
            />
          </div>
          <button disabled={loading} className="w-full px-6 py-3.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold disabled:opacity-60 inline-flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            {loading ? t("track.tracking") : t("track.button")}
          </button>
        </form>

        {error && (
          <div className="glass rounded-2xl p-5 text-center text-sm text-muted-foreground border border-destructive/30 mb-6 animate-fade-in">
            <X className="w-8 h-8 text-destructive mx-auto mb-2" />
            {error}
          </div>
        )}

        {order && (
          <div className={`glass rounded-2xl p-5 md:p-6 animate-fade-in-up space-y-6 transition-shadow ${livePulse ? "shadow-gold ring-2 ring-gold/40" : ""}`}>
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("success.orderNumber")}</div>
                <div className="font-display text-2xl text-gold font-bold">{order.order_number}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {order.customer_name} · {new Date(order.created_at).toLocaleDateString(locale)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.total")}</div>
                <div className="font-display text-2xl text-gold font-bold">{formatAED(order.total)}</div>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  {t("track.currentStatus")}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[10px]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inset-0 rounded-full bg-gold opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
                    </span>
                    {t("track.live")}
                  </span>
                </div>
                <div className={`font-display text-xl ${cancelled ? "text-destructive" : "text-gold"}`}>
                  {t(`status.${order.status}` as StringKey) ?? order.status}
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {t("track.lastUpdated")}<br />
                {new Date(order.updated_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>

            {/* Return CTA */}
            {(canRequestReturn || inReturnFlow) && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold flex items-center gap-2 text-destructive">
                    <RefreshCcw className="w-4 h-4" />
                    {inReturnFlow ? t("track.returnInProgress") : t("track.returnAvailable")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {inReturnFlow ? t("track.returnInProgressDesc") : t("track.returnAvailableDesc")}
                    {canRequestReturn && deadline && (
                      <span className="block mt-1 text-gold">
                        {t("track.eta")}: {new Date(deadline).toLocaleDateString(locale, { dateStyle: "medium" })}
                      </span>
                    )}
                  </div>
                </div>
                {canRequestReturn && (
                  <Link
                    to="/return-request"
                    search={{ num: order.order_number }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-destructive text-destructive-foreground font-semibold text-sm shadow-md hover:scale-[1.02] transition-transform"
                  >
                    <RefreshCcw className="w-4 h-4" /> {t("track.requestReturn")}
                  </Link>
                )}
              </div>
            )}

            {/* Return expired notice */}
            {returnExpired && !inReturnFlow && (
              <div className="rounded-xl border border-muted/40 bg-muted/10 p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-foreground/80">{t("track.returnExpired")}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t("track.returnExpiredDesc")}</div>
                </div>
              </div>
            )}

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
                        <div className={`text-[10px] uppercase tracking-wider ${active ? "text-gold font-semibold" : "text-muted-foreground"}`}>
                          {t(`status.${s}` as StringKey)}
                        </div>
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
                  <Detail icon={<Truck className="w-4 h-4" />} label={t("track.courier")} value={order.courier_name} />
                )}
                {order.tracking_number && (
                  <Detail icon={<Hash className="w-4 h-4" />} label={t("track.trackingNum")} value={order.tracking_number} />
                )}
                {order.estimated_delivery && (
                  <Detail icon={<CalendarClock className="w-4 h-4" />} label={t("track.eta")} value={new Date(order.estimated_delivery).toLocaleDateString(locale, { dateStyle: "medium" })} />
                )}
              </div>
            )}

            {/* Items */}
            <div className="border-t border-gold/15 pt-4 space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("track.items")}</div>
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
