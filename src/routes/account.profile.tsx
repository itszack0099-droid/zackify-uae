import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { User as UserIcon, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/profile")({
  component: ProfilePage,
});

const Schema = z.object({
  display_name: z.string().trim().min(2, "Name is too short").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?971|0)?5\d{8}$/, "Enter a valid UAE mobile number")
    .or(z.literal("")),
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ display_name: "", phone: "" });

  useEffect(() => {
    if (!loading && !user)
      navigate({
        to: "/account",
        search: { redirect: "/account/profile" },
        replace: true,
      });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setForm({
            display_name: data.display_name ?? "",
            phone: data.phone ?? "",
          });
      });
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = Schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.display_name,
        phone: parsed.data.phone || null,
      })
      .eq("user_id", user.id);
    if (!error) {
      await supabase.auth.updateUser({
        data: { display_name: parsed.data.display_name },
      });
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  if (loading || !user) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-6 py-16">
          <div className="h-64 rounded-2xl animate-shimmer-bg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl mb-2">My Profile</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Update your personal information
        </p>

        <div className="glass rounded-3xl p-6 gold-border">
          <form onSubmit={submit} className="space-y-4">
            <Field icon={UserIcon} label="Full Name">
              <input
                value={form.display_name}
                onChange={(e) =>
                  setForm({ ...form, display_name: e.target.value })
                }
                className={inp}
                placeholder="Ahmed Al Maktoum"
              />
            </Field>
            <Field icon={Mail} label="Email (read-only)">
              <input
                value={user.email ?? ""}
                disabled
                className={inp + " opacity-70 cursor-not-allowed"}
              />
            </Field>
            <Field icon={Phone} label="Phone Number">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inp}
                placeholder="+9715XXXXXXXX"
              />
            </Field>

            <button
              disabled={busy}
              className="w-full mt-2 px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-[1.02] transition-transform disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

const inp =
  "w-full bg-card border border-gold/20 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="relative mt-1">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
        {children}
      </div>
    </label>
  );
}
