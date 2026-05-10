import { createFileRoute } from "@tanstack/react-router";
import { latestOrderResponse, LATEST_ORDER_HEADERS } from "@/lib/latestOrderResponse.server";

export const Route = createFileRoute("/api/public/latest-order")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: LATEST_ORDER_HEADERS }),

      GET: async () => latestOrderResponse(),
    },
  },
});
