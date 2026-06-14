import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function isHttpUrl(s: string | undefined | null) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/wc-auth/v1/grant")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const { logEvent, issueCredentials } = await import("@/lib/wcAuth.server");
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }

        const app_name = String(body.app_name ?? "").slice(0, 200);
        const scope = String(body.scope ?? "read").slice(0, 50);
        const user_id = body.user_id != null ? String(body.user_id).slice(0, 200) : null;
        const return_url = typeof body.return_url === "string" ? body.return_url : "";
        const callback_url = typeof body.callback_url === "string" ? body.callback_url : "";
        const action = body.action === "approve" ? "approve" : "deny";

        if (!app_name || !isHttpUrl(return_url) || !isHttpUrl(callback_url)) {
          await logEvent({
            kind: "authorize.invalid",
            path: "/api/wc-auth/v1/grant",
            status: 400,
            message: "Missing or invalid parameters",
            payload: { app_name, scope, return_url, callback_url },
          });
          return json({ error: "Missing or invalid parameters" }, 400);
        }

        if (action === "deny") {
          await logEvent({
            kind: "authorize.deny",
            path: "/api/wc-auth/v1/grant",
            status: 200,
            message: `User denied ${app_name}`,
            payload: { app_name, user_id },
          });
          const denied = new URL(return_url);
          denied.searchParams.set("success", "0");
          if (user_id) denied.searchParams.set("user_id", user_id);
          return json({ redirect: denied.toString() });
        }

        // APPROVE: issue credentials, POST to callback_url, then redirect to return_url
        let store_domain: string | null = null;
        try {
          store_domain = new URL(request.url).host;
        } catch {
          /* noop */
        }

        const cred = await issueCredentials({
          app_name,
          scope,
          external_user_id: user_id,
          store_domain,
          return_url,
          callback_url,
        });

        const callbackPayload = {
          key_id: cred.id,
          user_id,
          consumer_key: cred.consumer_key,
          consumer_secret: cred.consumer_secret,
          key_permissions: scope,
        };

        let callbackStatus = 0;
        let callbackBody = "";
        try {
          const res = await fetch(callback_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Zackify-WC-Compat/1.0",
            },
            body: JSON.stringify(callbackPayload),
          });
          callbackStatus = res.status;
          callbackBody = (await res.text()).slice(0, 2000);
        } catch (e) {
          await logEvent({
            kind: "authorize.callback.error",
            path: callback_url,
            message: e instanceof Error ? e.message : "callback failed",
            payload: { app_name, key_id: cred.id },
          });
          return json(
            { error: "Failed to deliver credentials to callback_url" },
            502,
          );
        }

        await logEvent({
          kind: "authorize.callback",
          path: callback_url,
          status: callbackStatus,
          message: callbackStatus >= 200 && callbackStatus < 300 ? "ok" : "non-2xx",
          payload: {
            app_name,
            key_id: cred.id,
            response_excerpt: callbackBody,
          },
        });

        if (callbackStatus < 200 || callbackStatus >= 300) {
          return json(
            { error: `Callback endpoint returned ${callbackStatus}` },
            502,
          );
        }

        const redirect = new URL(return_url);
        redirect.searchParams.set("success", "1");
        if (user_id) redirect.searchParams.set("user_id", user_id);

        await logEvent({
          kind: "authorize.approve",
          path: "/api/wc-auth/v1/grant",
          status: 200,
          message: `Authorized ${app_name}`,
          payload: { app_name, key_id: cred.id, user_id },
        });

        return json({ redirect: redirect.toString(), key_id: cred.id });
      },
    },
  },
});
