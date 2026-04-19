import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { RefreshCcw, Hash, Phone, MessageSquare, CheckCircle2, AlertTriangle, Send } from "lucide-react";

export const Route = createFileRoute("/return-request")({
  validateSearch: z.object({ num: z.string().optional() }),
  component: ReturnRequestPage,
});

const REASON_KEYS = ["ret.reasonDamaged", "ret.reasonWrong", "ret.reasonNotDescribed", "ret.reasonChangedMind", "ret.reasonOther"] as const;

const RETURN_WINDOW_DAYS = 3;

const Schema = z.object({
  order_number: z.string().trim().min(4, "Enter your order number"),
  phone: z.string().trim().min(6, "Enter your phone number"),
  reason: z.string().min(1, "Please choose a reason"),
  message: z.string().max(500).optional().or(z.literal("")),
});

function ReturnRequestPage() {
  const search = Route.useSearch();
  const { t } = useI18n();
  const [form, setForm] = useState({
    order_number: search.num ?? "",
    phone: "",
    reason: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (search.num) setForm((f) => ({ ...f, order_number: search.num! }));
  }, [search.num]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);

    const { data: order } = await supabase
      .from("orders")
      .select("id,order_number,phone,status,updated_at,created_at")
      .eq("order_number", parsed.data.order_number.trim().toUpperCase())
      .maybeSingle();

    if (!order) {
      setSubmitting(false);
      toast.error(t("ret.notFound"));
      return;
    }

    const norm = (s: string) => s.replace(/\D/g, "").slice(-9);
    if (norm(order.phone) !== norm(parsed.data.phone)) {
      setSubmitting(false);
      toast.error(t("track.phoneMismatch"));
      return;
    }

    if (order.status !== "delivered" && order.status !== "return_requested") {
      setSubmitting(false);
      toast.error(t("ret.notDelivered"));
      return;
    }

    const deliveredAt = new Date(order.updated_at).getTime();
    const ageDays = (Date.now() - deliveredAt) / (1000 * 60 * 60 * 24);
    if (ageDays > RETURN_WINDOW_DAYS) {
      setSubmitting(false);
      toast.error(t("ret.expired"));
      return;
    }

    const { error } = await supabase.from("return_requests").insert({
      order_id: order.id,
      order_number: order.order_number,
      phone: parsed.data.phone.trim(),
      reason: parsed.data.reason,
      message: parsed.data.message?.trim() || null,
    });

    if (error) {
      setSubmitting(false);
      console.error(error);
      toast.error(t("ret.failed"));
      return;
    }

    if (order.status === "delivered") {
      await supabase.from("orders").update({ status: "return_requested" }).eq("id", order.id);
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-6 py-20 text-center animate-fade-in-up">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 rounded-full bg-gold/30 blur-2xl animate-float" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold animate-scale-in">
              <CheckCircle2 className="w-14 h-14 text-deep-green" strokeWidth={2} />
            </div>
          </div>
          <h1 className="font-display text-3xl md:text-4xl mb-3">{t("ret.success")}</h1>
          <p className="text-foreground/70 mb-8">{t("ret.successBody")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/track-order" search={{ num: form.order_number }} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-105 transition-transform">
              {t("success.trackOrder")}
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass border border-gold/30 hover:border-gold transition-colors">
              {t("common.continueShopping")}
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-8 animate-fade-in-up">
          <RefreshCcw className="w-12 h-12 text-gold mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="font-display text-4xl mb-2">{t("ret.title")}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t("ret.subtitle")}</p>
        </div>

        <div className="glass rounded-2xl p-4 mb-6 flex items-start gap-3 border border-gold/20 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-gold mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/80">{t("ret.note")}</p>
        </div>

        <form onSubmit={onSubmit} className="glass rounded-2xl p-5 md:p-6 space-y-4 animate-fade-in-up">
          <Field label={`${t("ret.orderId")} *`} icon={<Hash className="w-4 h-4" />}>
            <input
              required
              value={form.order_number}
              onChange={(e) => setForm({ ...form, order_number: e.target.value })}
              placeholder={t("ret.orderIdPh")}
              className="w-full bg-transparent py-2.5 focus:outline-none text-sm uppercase tracking-wider"
            />
          </Field>
          <Field label={`${t("ret.phone")} *`} icon={<Phone className="w-4 h-4" />}>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder={t("ret.phonePh")}
              className="w-full bg-transparent py-2.5 focus:outline-none text-sm"
              inputMode="tel"
            />
          </Field>
          <Field label={`${t("ret.reason")} *`} icon={<RefreshCcw className="w-4 h-4" />}>
            <select
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full bg-transparent py-2.5 focus:outline-none text-sm"
            >
              <option value="">{t("ret.chooseReason")}</option>
              {REASON_KEYS.map((k) => <option key={k} value={t(k)}>{t(k)}</option>)}
            </select>
          </Field>
          <Field label={t("ret.message")} icon={<MessageSquare className="w-4 h-4" />}>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={t("ret.messagePh")}
              className="w-full bg-transparent py-2.5 focus:outline-none text-sm resize-none"
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-destructive text-destructive-foreground font-semibold shadow-md hover:scale-[1.02] transition-transform disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {submitting ? t("ret.submitting") : t("ret.submit")}
          </button>
        </form>
      </div>
    </Layout>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1.5">{label}</span>
      <div className="flex items-center gap-2 bg-card/50 border border-gold/20 rounded-xl px-3 focus-within:border-gold transition-colors">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}
