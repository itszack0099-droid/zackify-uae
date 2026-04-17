import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Footer() {
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
      toast.success("Subscribed! Welcome to Zackify.uae 🎉");
      setEmail("");
    }
  };

  return (
    <footer className="mt-24 border-t border-gold/15 bg-secondary/30">
      {/* Trust strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gold/10 border-b border-gold/15">
        {[
          { icon: Truck, label: "Cash on Delivery" },
          { icon: RefreshCw, label: "Easy Returns" },
          { icon: ShieldCheck, label: "Premium Quality" },
          { icon: Mail, label: "2–4 Day Delivery" },
        ].map((f) => (
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
          <p className="text-sm text-muted-foreground max-w-md mb-5">
            Premium gear for the modern man in the UAE. Curated luxury accessories
            with cash on delivery and 2–4 day shipping across all emirates.
          </p>
          <form onSubmit={subscribe} className="flex gap-2 max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-card border border-gold/20 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              required
            />
            <button
              disabled={loading}
              className="px-5 py-2.5 rounded-full bg-gradient-gold text-deep-green text-sm font-semibold hover:scale-105 transition-transform shadow-gold disabled:opacity-60"
            >
              {loading ? "..." : "Join"}
            </button>
          </form>
        </div>

        <div>
          <h4 className="font-display text-gold mb-3 text-sm uppercase tracking-wider">Shop</h4>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li><Link to="/category/car-accessories" className="hover:text-gold transition-colors">Car Accessories</Link></li>
            <li><Link to="/category/gym-fitness" className="hover:text-gold transition-colors">Gym & Fitness</Link></li>
            <li><Link to="/category/phone-accessories" className="hover:text-gold transition-colors">Phone Accessories</Link></li>
            <li><Link to="/hot-deals" className="hover:text-gold transition-colors">Hot Deals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-gold mb-3 text-sm uppercase tracking-wider">Help</h4>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li><Link to="/track-order" className="hover:text-gold transition-colors">Track Order</Link></li>
            <li><Link to="/contact" className="hover:text-gold transition-colors">Contact Us</Link></li>
            <li><a href="https://wa.me/971500000000" className="hover:text-gold transition-colors">WhatsApp</a></li>
            <li><Link to="/admin" className="hover:text-gold transition-colors">Admin</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gold/15 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Zackify.uae — Premium gear, delivered.
      </div>
    </footer>
  );
}
