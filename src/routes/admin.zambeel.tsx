import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/zambeel")({
  component: ZambeelTestPage,
});

type Credential = {
  id: string;
  app_name: string;
  scope: string;
  external_user_id: string | null;
  consumer_key: string;
  consumer_secret: string;
  callback_url: string | null;
  return_url: string | null;
  revoked_at: string | null;
  created_at: string;
};

type LogRow = {
  id: string;
  kind: string;
  path: string | null;
  status: number | null;
  message: string | null;
  created_at: string;
};

export default function ZambeelTestPage() {
  const [creds, setCreds] = useState<Credential[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [selected, setSelected] = useState<Credential | null>(null);
  const [endpoint, setEndpoint] = useState<"products" | "orders" | "customers">("products");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase
        .from("wc_api_credentials")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("wc_integration_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setCreds((c as Credential[]) ?? []);
    setLogs((l as LogRow[]) ?? []);
    if (!selected && c && c.length) setSelected(c[0] as Credential);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function runTest() {
    if (!selected) {
      setResult("Pick a credential first");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const auth = "Basic " + btoa(`${selected.consumer_key}:${selected.consumer_secret}`);
      const res = await fetch(`/wp-json/wc/v3/${endpoint}?per_page=5`, {
        headers: { Authorization: auth },
      });
      const text = await res.text();
      let body = text;
      try {
        body = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* not JSON */
      }
      setResult(`HTTP ${res.status}\n\n${body}`);
    } catch (e) {
      setResult(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      refresh();
    }
  }

  return (
    <div className="space-y-6 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Zambeel / WooCommerce-compat</h1>
        <p className="text-sm text-muted-foreground">
          Test the WooCommerce-compatible OAuth flow and REST endpoints exposed for Zambeel and other
          WooCommerce integrations.
        </p>
      </header>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-semibold">Sample authorize URL</h2>
        <p className="text-xs text-muted-foreground">Open in a new tab to test the approval screen.</p>
        <code className="block text-xs break-all bg-muted p-2 rounded">
          /wc-auth/v1/authorize?app_name=Zambeel&scope=read_write&user_id=52503&return_url=https%3A%2F%2Fhttpbin.org%2Fget&callback_url=https%3A%2F%2Fhttpbin.org%2Fpost
        </code>
        <a
          className="inline-block text-sm text-primary underline"
          href="/wc-auth/v1/authorize?app_name=Zambeel&scope=read_write&user_id=52503&return_url=https%3A%2F%2Fhttpbin.org%2Fget&callback_url=https%3A%2F%2Fhttpbin.org%2Fpost"
          target="_blank"
          rel="noreferrer"
        >
          Open authorize page →
        </a>
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Issued API credentials</h2>
          <button onClick={refresh} className="text-xs underline">
            Refresh
          </button>
        </div>
        {creds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None yet. Complete the authorization flow above to issue a key.
          </p>
        ) : (
          <div className="space-y-2">
            {creds.map((c) => (
              <label
                key={c.id}
                className={`flex items-start gap-3 rounded border p-3 cursor-pointer ${
                  selected?.id === c.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <input
                  type="radio"
                  name="cred"
                  checked={selected?.id === c.id}
                  onChange={() => setSelected(c)}
                />
                <div className="flex-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">{c.app_name}</span>
                    <span className="text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground">scope: {c.scope} · user: {c.external_user_id ?? "—"}</div>
                  <div className="font-mono break-all">key: {c.consumer_key}</div>
                  <div className="font-mono break-all">secret: {c.consumer_secret}</div>
                  {c.revoked_at ? <div className="text-destructive">revoked</div> : null}
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold">Run REST test</h2>
        <div className="flex gap-2 items-center">
          <select
            className="rounded border bg-background p-2 text-sm"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value as typeof endpoint)}
          >
            <option value="products">/wp-json/wc/v3/products</option>
            <option value="orders">/wp-json/wc/v3/orders</option>
            <option value="customers">/wp-json/wc/v3/customers</option>
          </select>
          <button
            onClick={runTest}
            disabled={loading || !selected}
            className="rounded bg-primary text-primary-foreground px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Testing…" : "Test"}
          </button>
        </div>
        {result ? (
          <pre className="text-xs bg-muted p-3 rounded max-h-96 overflow-auto whitespace-pre-wrap">
            {result}
          </pre>
        ) : null}
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold">Integration logs (latest 50)</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="space-y-1 text-xs">
            {logs.map((l) => (
              <div key={l.id} className="flex gap-2 border-b py-1">
                <span className="text-muted-foreground w-40 shrink-0">
                  {new Date(l.created_at).toLocaleString()}
                </span>
                <span className="font-mono w-44 shrink-0">{l.kind}</span>
                <span className="w-12 shrink-0">{l.status ?? ""}</span>
                <span className="flex-1 truncate">{l.message ?? l.path}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
