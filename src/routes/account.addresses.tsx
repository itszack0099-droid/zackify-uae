import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { MapPin, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/addresses")({
  component: AddressesPage,
});

const EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
];

const Schema = z.object({
  full_name: z.string().trim().min(2, "Name is too short").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?971|0)?5\d{8}$/, "Enter a valid UAE mobile number"),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  emirate: z.string().min(1, "Select your emirate"),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  is_default: z.boolean().optional(),
});

type Address = {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  emirate: string;
  postal_code: string | null;
  is_default: boolean;
};

const empty = {
  full_name: "",
  phone: "",
  address: "",
  city: "",
  emirate: "",
  postal_code: "",
  is_default: false,
};

function AddressesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [list, setList] = useState<Address[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!loading && !user)
      navigate({
        to: "/account",
        search: { redirect: "/account/addresses" },
        replace: true,
      });
  }, [loading, user, navigate]);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setList((data ?? []) as Address[]);
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({
      full_name: a.full_name,
      phone: a.phone,
      address: a.address,
      city: a.city,
      emirate: a.emirate,
      postal_code: a.postal_code ?? "",
      is_default: a.is_default,
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!user) return;
    setBusy(true);

    // If user marked this as default, clear other defaults first
    if (parsed.data.is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    if (editing) {
      const { error } = await supabase
        .from("addresses")
        .update(parsed.data)
        .eq("id", editing.id);
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Address updated");
    } else {
      const { error } = await supabase
        .from("addresses")
        .insert({ ...parsed.data, user_id: user.id });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Address added");
    }
    setOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Address removed");
    refresh();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    toast.success("Default address set");
    refresh();
  };

  if (loading || !user) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="h-64 rounded-2xl animate-shimmer-bg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl">Address Book</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Saved delivery locations across the UAE
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {list.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center gold-border">
            <MapPin className="w-10 h-10 mx-auto text-gold/60 mb-3" />
            <p className="text-muted-foreground mb-4">No saved addresses yet</p>
            <button
              onClick={openNew}
              className="px-5 py-2.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold"
            >
              Add your first address
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((a) => (
              <div
                key={a.id}
                className="glass rounded-2xl p-5 gold-border relative"
              >
                {a.is_default && (
                  <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider bg-gradient-gold text-deep-green px-2 py-0.5 rounded-full font-semibold">
                    Default
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{a.full_name}</p>
                    <p className="text-xs text-muted-foreground">{a.phone}</p>
                    <p className="text-sm mt-2 leading-relaxed">{a.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {a.city}, {a.emirate}
                      {a.postal_code ? ` · ${a.postal_code}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gold/15">
                  {!a.is_default && (
                    <button
                      onClick={() => setDefault(a.id)}
                      className="flex-1 text-xs flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gold/20 hover:border-gold transition-colors"
                    >
                      <Star className="w-3 h-3" /> Set default
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(a)}
                    className="flex-1 text-xs flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gold/20 hover:border-gold transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="text-xs flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
          <div className="glass-strong rounded-3xl p-6 max-w-lg w-full gold-border shadow-luxury max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">
                {editing ? "Edit Address" : "New Address"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gold/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <Inp
                label="Full Name"
                value={form.full_name}
                onChange={(v) => setForm({ ...form, full_name: v })}
              />
              <Inp
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="+9715XXXXXXXX"
              />
              <Inp
                label="Address"
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Inp
                  label="City"
                  value={form.city}
                  onChange={(v) => setForm({ ...form, city: v })}
                />
                <label className="block">
                  <span className="text-xs text-muted-foreground">Emirate</span>
                  <select
                    value={form.emirate}
                    onChange={(e) =>
                      setForm({ ...form, emirate: e.target.value })
                    }
                    className="mt-1 w-full bg-card border border-gold/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
                  >
                    <option value="">Select…</option>
                    {EMIRATES.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Inp
                label="Postal Code (optional)"
                value={form.postal_code}
                onChange={(v) => setForm({ ...form, postal_code: v })}
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={!!form.is_default}
                  onChange={(e) =>
                    setForm({ ...form, is_default: e.target.checked })
                  }
                  className="accent-gold"
                />
                Set as default delivery address
              </label>
              <button
                disabled={busy}
                className="w-full mt-3 px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-[1.02] transition-transform disabled:opacity-60"
              >
                {busy
                  ? "Saving…"
                  : editing
                    ? "Save Changes"
                    : "Add Address"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Inp({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-card border border-gold/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
      />
    </label>
  );
}
