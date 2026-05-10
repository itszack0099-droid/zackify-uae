import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const LATEST_ORDER_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
} as const;

export async function latestOrderResponse() {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, customer_name, phone, total, status, created_at, address, city, emirate, items")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ id: null, status: "error", error: error.message }), {
        status: 500,
        headers: LATEST_ORDER_HEADERS,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ id: null, status: "no_orders" }), {
        status: 200,
        headers: LATEST_ORDER_HEADERS,
      });
    }

    const items = Array.isArray(data.items) ? data.items : [];
    const firstItem = items[0] as Record<string, unknown> | undefined;

    return new Response(
      JSON.stringify({
        id: data.id,
        order_number: data.order_number,
        customer_name: data.customer_name,
        phone: data.phone,
        total_amount: Number(data.total),
        status: data.status,
        created_at: data.created_at,
        address: data.address,
        city: data.city,
        emirate: data.emirate,
        product_name: typeof firstItem?.name === "string" ? firstItem.name : null,
        quantity: typeof firstItem?.qty === "number" ? firstItem.qty : null,
        total_price: Number(data.total),
        order_date: data.created_at,
        items: items.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            id: row.id ?? null,
            product_id: row.product_id ?? row.id ?? null,
            product_name: row.name ?? null,
            quantity: row.qty ?? null,
            price: row.price ?? null,
            color: row.color ?? null,
            image: row.image ?? null,
          };
        }),
      }),
      { status: 200, headers: LATEST_ORDER_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ id: null, status: "error", error: message }), {
      status: 500,
      headers: LATEST_ORDER_HEADERS,
    });
  }
}
