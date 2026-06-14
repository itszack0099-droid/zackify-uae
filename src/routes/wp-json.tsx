import { createFileRoute } from "@tanstack/react-router";

/** WooCommerce-compatibility index. Some clients hit /wp-json/ to discover the API. */
export const Route = createFileRoute("/wp-json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        return new Response(
          JSON.stringify({
            name: "Zackify.uae",
            description: "WooCommerce-compatible REST bridge",
            url: origin,
            home: origin,
            namespaces: ["wc/v3"],
            routes: {
              "/wc/v3/products": { _links: { self: `${origin}/wp-json/wc/v3/products` } },
              "/wc/v3/orders": { _links: { self: `${origin}/wp-json/wc/v3/orders` } },
              "/wc/v3/customers": { _links: { self: `${origin}/wp-json/wc/v3/customers` } },
            },
            authentication: {
              "wc/v3": { type: "http_basic", note: "Use consumer_key as username and consumer_secret as password" },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
        );
      },
    },
  },
});
