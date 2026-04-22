import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
} as const;

export const Route = createFileRoute("/api/public/latest-order")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS_HEADERS }),

      GET: async () => {
        try {
          const { data, error } = await supabaseAdmin
            .from("orders")
            .select("id, customer_name, phone, total, status, created_at")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) {
            return new Response(
              JSON.stringify({ id: null, status: "error", error: error.message }),
              { status: 500, headers: CORS_HEADERS },
            );
          }

          if (!data) {
            return new Response(
              JSON.stringify({ id: null, status: "no_orders" }),
              { status: 200, headers: CORS_HEADERS },
            );
          }

          return new Response(
            JSON.stringify({
              id: data.id,
              customer_name: data.customer_name,
              phone: data.phone,
              total_amount: Number(data.total),
              status: data.status,
              created_at: data.created_at,
            }),
            { status: 200, headers: CORS_HEADERS },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(
            JSON.stringify({ id: null, status: "error", error: message }),
            { status: 500, headers: CORS_HEADERS },
          );
        }
      },
    },
  },
});
