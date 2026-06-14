import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

export const Route = createFileRoute("/wp-json/wc/v3/products")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const { authenticateRequest, unauthorizedResponse, jsonResponse, logEvent } =
          await import("@/lib/wcAuth.server");
        const { mapProduct } = await import("@/lib/wcMap");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const cred = await authenticateRequest(request);
        if (!cred) {
          await logEvent({ kind: "api.auth_fail", path: "/wp-json/wc/v3/products", status: 401 });
          return unauthorizedResponse();
        }
        const url = new URL(request.url);
        const per_page = Math.min(Math.max(Number(url.searchParams.get("per_page") ?? 20) || 20, 1), 100);
        const page = Math.max(Number(url.searchParams.get("page") ?? 1) || 1, 1);
        const search = url.searchParams.get("search");
        const from = (page - 1) * per_page;
        const to = from + per_page - 1;

        let q = supabaseAdmin
          .from("products")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);
        if (search) q = q.ilike("name", `%${search}%`);

        const { data, error, count } = await q;
        if (error) {
          await logEvent({ kind: "api.error", path: "/wp-json/wc/v3/products", status: 500, message: error.message });
          return jsonResponse({ code: "internal_error", message: error.message }, 500);
        }
        await logEvent({
          kind: "api.products",
          path: "/wp-json/wc/v3/products",
          status: 200,
          message: `app=${cred.app_name} page=${page} count=${data?.length ?? 0}`,
        });
        return jsonResponse(
          (data ?? []).map(mapProduct),
          200,
          {
            "X-WP-Total": String(count ?? 0),
            "X-WP-TotalPages": String(Math.ceil((count ?? 0) / per_page)),
          },
        );
      },
    },
  },
});
