import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { CheckCircle2, Package, Home, Banknote } from "lucide-react";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/order-success")({
  validateSearch: z.object({ num: z.string().optional() }),
  component: OrderSuccess,
});

// Generate a pleasant 3-note success chime in-browser (no external assets needed)
function playSuccessChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0 },     // C5
      { f: 659.25, t: 0.14 },  // E5
      { f: 783.99, t: 0.28 },  // G5
    ];
    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.18, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.55);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.6);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    /* ignore */
  }
}

function OrderSuccess() {
  const { num } = Route.useSearch();
  const played = useRef(false);

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    // Slight delay so the chime feels celebratory after the icon animates in
    const id = setTimeout(playSuccessChime, 250);
    return () => clearTimeout(id);
  }, []);

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-6 py-20 text-center animate-fade-in-up">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 rounded-full bg-gold/30 blur-2xl animate-float" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold animate-scale-in">
            <CheckCircle2 className="w-14 h-14 text-deep-green" strokeWidth={2} />
          </div>
        </div>

        <h1 className="font-display text-4xl md:text-5xl mb-3">Order Placed Successfully</h1>
        <p className="text-foreground/70 mb-8">
          Your order will be delivered within <span className="text-gold font-semibold">2–4 days</span> across the UAE.
        </p>

        {num && (
          <div className="glass rounded-2xl p-6 mb-8 inline-block">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Order Number</div>
            <div className="font-display text-2xl text-gold font-bold">{num}</div>
            <div className="text-xs text-muted-foreground mt-2">Save this number to track your order</div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold hover:scale-105 transition-transform">
            <Home className="w-4 h-4" /> Continue Shopping
          </Link>
          <Link to="/track-order" search={{ num: num ?? "" }} className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass border border-gold/30 hover:border-gold transition-colors">
            <Package className="w-4 h-4" /> Track Order
          </Link>
        </div>

        <p className="mt-10 text-sm text-muted-foreground inline-flex items-center justify-center gap-2">
          <Banknote className="w-4 h-4 text-gold" /> Pay in cash when the order arrives. Our team will call you to confirm.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Returns are accepted within <span className="text-gold font-medium">3 days</span> of delivery.
        </p>
      </div>
    </Layout>
  );
}
