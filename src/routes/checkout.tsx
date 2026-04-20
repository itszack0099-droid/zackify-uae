import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { useCart, formatAED } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Banknote, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const EMIRATES = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

const Schema = z.object({
  customer_name: z.string().trim().min(2, "Name is too short").max(100),
  phone: z.string().trim().regex(/^(\+?971|0)?5\d{8}$/, "Enter a valid UAE mobile number"),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  emirate: z.string().min(1, "Select your emirate"),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [selectedSaved, setSelectedSaved] = useState<string>("");
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    city: "",
    emirate: "",
    postal_code: "",
    notes: "",
  });

  // Load saved addresses for signed-in users; auto-fill the default one.
  useEffect(() => {
    if (!user) return;
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as SavedAddress[];
        setSaved(list);
        const def = list.find((a) => a.is_default) ?? list[0];
        if (def) {
          setSelectedSaved(def.id);
          setForm((f) => ({
            ...f,
            customer_name: def.full_name,
            phone: def.phone,
            address: def.address,
            city: def.city,
            emirate: def.emirate,
            postal_code: def.postal_code ?? "",
          }));
        }
      });
  }, [user]);

  const applySaved = (id: string) => {
    setSelectedSaved(id);
    if (id === "new") {
      setForm({ ...form, customer_name: "", phone: "", address: "", city: "", emirate: "", postal_code: "" });
      return;
    }
    const a = saved.find((x) => x.id === id);
    if (!a) return;
    setForm({
      ...form,
      customer_name: a.full_name,
      phone: a.phone,
      address: a.address,
      city: a.city,
      emirate: a.emirate,
      postal_code: a.postal_code ?? "",
    });
  };

  const shipping = subtotal >= 200 ? 0 : 20;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <h1 className="font-display text-2xl mb-4">{t("cart.empty")}</h1>
          <Link to="/" className="text-gold hover:underline">← {t("common.continueShopping")}</Link>
        </div>
      </Layout>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);

    const { data, error } = await supabase
      .from("orders")
      .insert({
        ...parsed.data,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          slug: i.slug,
          price: i.price,
          qty: i.qty,
          image: i.image,
        })),
        subtotal,
        total,
      })
      .select("order_number")
      .single();

    setSubmitting(false);

    if (error || !data) {
      toast.error("Could not place your order. Please try again.");
      return;
    }
    try {
      const raw = localStorage.getItem("zackify_my_orders_v1");
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(data.order_number)) list.unshift(data.order_number);
      localStorage.setItem("zackify_my_orders_v1", JSON.stringify(list.slice(0, 100)));
    } catch {}
    clear();
    navigate({ to: "/order-success", search: { num: data.order_number } });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-display text-4xl mb-8">{t("checkout.title")}</h1>

        <form onSubmit={onSubmit} className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            <section className="glass rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-xl">{t("checkout.delivery")}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={`${t("checkout.fullName")} *`}>
                  <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className={inputCls} />
                </Field>
                <Field label={`${t("checkout.phone")} *`}>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05X XXX XXXX" className={inputCls} />
                </Field>
                <Field label={`${t("checkout.address")} *`} full>
                  <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={t("checkout.addressPh")} className={inputCls} />
                </Field>
                <Field label={`${t("checkout.city")} *`}>
                  <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
                </Field>
                <Field label={`${t("checkout.emirate")} *`}>
                  <select required value={form.emirate} onChange={(e) => setForm({ ...form, emirate: e.target.value })} className={inputCls}>
                    <option value="">{t("checkout.selectEmirate")}</option>
                    {EMIRATES.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </Field>
                <Field label={t("checkout.postal")}>
                  <input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className={inputCls} />
                </Field>
                <Field label={t("checkout.notes")} full>
                  <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </section>

            <section className="glass rounded-2xl p-6">
              <h2 className="font-display text-xl mb-4">{t("checkout.payment")}</h2>
              <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-gold bg-gold/5 cursor-pointer">
                <Banknote className="w-7 h-7 text-gold" />
                <div className="flex-1">
                  <div className="font-semibold">{t("checkout.cod")}</div>
                  <div className="text-xs text-muted-foreground">{t("checkout.codDesc")}</div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-gold flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                </div>
              </label>
            </section>
          </div>

          <aside className="glass rounded-2xl p-6 h-fit lg:sticky lg:top-24 space-y-4">
            <h3 className="font-display text-xl">{t("checkout.summary")}</h3>
            <div className="space-y-2 max-h-60 overflow-auto pr-2">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                    {i.image && <img src={i.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="line-clamp-1">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{t("checkout.qty")} {i.qty}</div>
                  </div>
                  <div className="text-gold font-medium whitespace-nowrap">{formatAED(i.price * i.qty)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-gold/15 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><span>{formatAED(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("common.shipping")}</span><span className="text-gold">{shipping === 0 ? t("common.free") : formatAED(shipping)}</span></div>
              <div className="flex justify-between font-bold text-lg pt-1"><span>{t("common.total")}</span><span className="text-gold font-display">{formatAED(total)}</span></div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-[1.02] transition-transform disabled:opacity-60"
            >
              <Lock className="w-4 h-4" /> {submitting ? t("checkout.placing") : t("checkout.placeOrder")}
            </button>
            <p className="text-xs text-center text-muted-foreground">{t("common.deliveredIn")}</p>
            <p className="text-[11px] text-center text-muted-foreground">{t("checkout.returnNote")}</p>
          </aside>
        </form>
      </div>
    </Layout>
  );
}

const inputCls = "w-full bg-card border border-gold/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
