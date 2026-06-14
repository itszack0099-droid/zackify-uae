import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { randomBytes, createHash } from "crypto";

export type WcCredential = {
  id: string;
  app_name: string;
  scope: string;
  consumer_key: string;
  consumer_secret: string;
  external_user_id: string | null;
  revoked_at: string | null;
};

function randHex(bytes: number) {
  return randomBytes(bytes).toString("hex");
}

export function generateCredentials() {
  return {
    consumer_key: `ck_${randHex(20)}`,
    consumer_secret: `cs_${randHex(20)}`,
  };
}

export async function logEvent(args: {
  kind: string;
  path?: string;
  status?: number;
  message?: string;
  payload?: unknown;
}) {
  try {
    await supabaseAdmin.from("wc_integration_logs").insert({
      kind: args.kind,
      path: args.path ?? null,
      status: args.status ?? null,
      message: args.message ?? null,
      payload: (args.payload as never) ?? null,
    });
  } catch {
    // never throw from logger
  }
}

export async function issueCredentials(opts: {
  app_name: string;
  scope: string;
  external_user_id?: string | null;
  store_domain?: string | null;
  return_url?: string | null;
  callback_url?: string | null;
}) {
  const { consumer_key, consumer_secret } = generateCredentials();
  const { data, error } = await supabaseAdmin
    .from("wc_api_credentials")
    .insert({
      app_name: opts.app_name,
      scope: opts.scope,
      external_user_id: opts.external_user_id ?? null,
      store_domain: opts.store_domain ?? null,
      return_url: opts.return_url ?? null,
      callback_url: opts.callback_url ?? null,
      consumer_key,
      consumer_secret,
    })
    .select()
    .single();
  if (error) throw error;
  return data as WcCredential;
}

/** Authenticate an inbound REST call via Basic auth OR query params. */
export async function authenticateRequest(request: Request): Promise<WcCredential | null> {
  let key: string | null = null;
  let secret: string | null = null;

  const auth = request.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("basic ")) {
    try {
      const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
      const idx = decoded.indexOf(":");
      if (idx >= 0) {
        key = decoded.slice(0, idx);
        secret = decoded.slice(idx + 1);
      }
    } catch {
      // ignore
    }
  }

  if (!key || !secret) {
    const url = new URL(request.url);
    key = url.searchParams.get("consumer_key");
    secret = url.searchParams.get("consumer_secret");
  }

  if (!key || !secret) return null;

  const { data, error } = await supabaseAdmin
    .from("wc_api_credentials")
    .select("*")
    .eq("consumer_key", key)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;
  // constant-time compare
  const a = createHash("sha256").update(secret).digest();
  const b = createHash("sha256").update(data.consumer_secret).digest();
  if (a.length !== b.length) return null;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return null;
  return data as WcCredential;
}

export function requireScope(cred: WcCredential, needed: "read" | "write"): boolean {
  const s = cred.scope.toLowerCase();
  if (needed === "read") return s.includes("read") || s.includes("write");
  return s.includes("write");
}

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...extraHeaders,
    },
  });
}

export function unauthorizedResponse(msg = "Invalid credentials") {
  return jsonResponse(
    {
      code: "woocommerce_rest_authentication_error",
      message: msg,
      data: { status: 401 },
    },
    401,
  );
}
