import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/** Soft 3-note chime synthesised in the browser — no audio file dependency. */
export function playAlertChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const notes = [880, 1108.73, 1318.51]; // A5 C#6 E6 — luxury triad
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    /* audio unavailable — silently ignore */
  }
}

/** Request OS notification permission once. Safe to call repeatedly. */
export async function ensureNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      /* ignore */
    }
  }
}

function notify(title: string, body: string) {
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      const n = new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: title,
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch {
      /* ignore */
    }
  }
}

/**
 * Subscribes to inserts on `orders` and `return_requests`.
 * Plays a chime + shows a browser notification on each new event,
 * even when the admin tab is in the background.
 */
export function subscribeAdminAlerts(opts: {
  onNewOrder?: () => void;
  onNewReturn?: () => void;
}): () => void {
  const channels: RealtimeChannel[] = [];

  channels.push(
    supabase
      .channel("admin-alerts-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new as {
            order_number?: string;
            customer_name?: string;
            total?: number;
          };
          playAlertChime();
          notify(
            "🛒 New order received",
            `${o.order_number ?? "Order"} · ${o.customer_name ?? ""} · AED ${o.total ?? ""}`,
          );
          opts.onNewOrder?.();
        },
      )
      .subscribe(),
  );

  channels.push(
    supabase
      .channel("admin-alerts-returns")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "return_requests" },
        (payload) => {
          const r = payload.new as { order_number?: string; reason?: string };
          playAlertChime();
          notify(
            "↩️ New return request",
            `${r.order_number ?? "Order"} · ${r.reason ?? ""}`,
          );
          opts.onNewReturn?.();
        },
      )
      .subscribe(),
  );

  return () => {
    channels.forEach((c) => supabase.removeChannel(c));
  };
}
