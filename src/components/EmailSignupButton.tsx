import { Mail, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function EmailSignupButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
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
      return;
    }
    toast.success("Subscribed! Welcome to Zackify 🎉");
    setEmail("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-gold text-deep-green shadow-gold hover:scale-105 transition-transform"
        aria-label="Email signup"
      >
        <Mail className="w-3.5 h-3.5" /> Get Offers
      </button>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-full hover:bg-gold/10 hover:text-gold transition-colors"
        aria-label="Email signup"
      >
        <Mail className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md glass-strong rounded-3xl p-7 gold-border shadow-luxury animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gold/10 hover:text-gold"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-gold flex items-center justify-center shadow-gold mb-3">
                <Sparkles className="w-6 h-6 text-deep-green" />
              </div>
              <h3 className="font-display text-2xl">Join the VIP list</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Get exclusive offers & early access to drops
              </p>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-card border border-gold/25 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
              <button
                disabled={loading}
                className="w-full px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-[1.02] transition-transform disabled:opacity-60"
              >
                {loading ? "Subscribing..." : "Subscribe"}
              </button>
            </form>

            <p className="text-[11px] text-center text-muted-foreground mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
