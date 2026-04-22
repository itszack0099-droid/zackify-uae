import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WHATSAPP_URL } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: trimmed });
    setLoading(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("Could not subscribe. Try again.");
    } else {
      toast.success("Subscribed! Welcome to Zackify.uae");
      setEmail("");
    }
  };

  const trust = [
    { icon: Truck, label: t("footer.trust1") },
    { icon: RefreshCw, label: t("footer.trust2") },
    { icon: ShieldCheck, label: t("footer.trust3") },
    { icon: Mail, label: t("footer.trust4") },
  ];

  return (
    <footer className="mt-24 border-t border-gold/15 bg-secondary/30">
      {/* Trust strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gold/10 border-b border-gold/15">
        {trust.map((f) => (
          <div key={f.label} className="bg-background flex items-center justify-center gap-2 py-4 px-2 text-sm">
            <f.icon className="w-4 h-4 text-gold" />
            <span className="text-foreground/80">{f.label}</span>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="font-display font-bold text-2xl mb-3">
            <span className="text-gradient-gold">Zackify</span>
            <span className="text-foreground/80">.uae</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mb-5">{t("footer.tagline")}</p>
          <form onSubmit={subscribe} className="flex gap-2 max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("footer.emailPh")}
              className="flex-1 bg-card border border-gold/20 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              required
            />
            <button
              disabled={loading}
              className="px-5 py-2.5 rounded-full bg-gradient-gold text-deep-green text-sm font-semibold hover:scale-105 transition-transform shadow-gold disabled:opacity-60"
            >
              {loading ? "..." : t("footer.subscribe")}
            </button>
          </form>
        </div>

        <div>
          <h4 className="font-display text-gold mb-3 text-sm uppercase tracking-wider">{t("footer.shop")}</h4>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li><Link to="/category/$slug" params={{ slug: "car-accessories" }} className="hover:text-gold transition-colors">{t("nav.car")}</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "gym-fitness" }} className="hover:text-gold transition-colors">{t("nav.gym")}</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "phone-accessories" }} className="hover:text-gold transition-colors">{t("nav.phone")}</Link></li>
            <li><Link to="/hot-deals" className="hover:text-gold transition-colors">{t("nav.deals")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-gold mb-3 text-sm uppercase tracking-wider">{t("footer.help")}</h4>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li><Link to="/track-order" className="hover:text-gold transition-colors">{t("footer.trackOrder")}</Link></li>
            <li><Link to="/return-request" className="hover:text-gold transition-colors">{t("footer.requestReturn")}</Link></li>
            <li><Link to="/contact" className="hover:text-gold transition-colors">{t("footer.contact")}</Link></li>
            <li><a href={WHATSAPP_URL} target="_blank" rel="noopener" className="hover:text-gold transition-colors">{t("footer.whatsapp")}</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gold/15 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Zackify.uae — {t("footer.copyright")}
      </div>
    </footer>
  );
}
