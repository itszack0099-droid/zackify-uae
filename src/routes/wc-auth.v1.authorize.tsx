import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";

type Search = {
  app_name?: string;
  scope?: string;
  user_id?: string;
  return_url?: string;
  callback_url?: string;
};

export const Route = createFileRoute("/wc-auth/v1/authorize")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    app_name: typeof s.app_name === "string" ? s.app_name : undefined,
    scope: typeof s.scope === "string" ? s.scope : undefined,
    user_id: typeof s.user_id === "string" ? s.user_id : String(s.user_id ?? ""),
    return_url: typeof s.return_url === "string" ? s.return_url : undefined,
    callback_url: typeof s.callback_url === "string" ? s.callback_url : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Authorize Application — Zackify.uae" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthorizePage,
});

function AuthorizePage() {
  const search = useSearch({ from: "/wc-auth/v1/authorize" }) as Search;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scopeLabel = useMemo(() => {
    const s = (search.scope ?? "read").toLowerCase();
    if (s.includes("write") && s.includes("read")) return "View and manage";
    if (s === "write" || s.includes("write")) return "Manage (create / update / delete)";
    return "View (read-only)";
  }, [search.scope]);

  const valid = !!(search.app_name && search.scope && search.return_url && search.callback_url);

  async function handle(action: "approve" | "deny") {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/wc-auth/v1/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...search, action }),
      });
      const data = (await res.json()) as { redirect?: string; error?: string };
      if (!res.ok || !data.redirect) {
        setError(data.error ?? "Authorization failed");
        setSubmitting(false);
        return;
      }
      window.location.href = data.redirect;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setSubmitting(false);
    }
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-2xl border bg-card p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid authorization request</h1>
          <p className="text-muted-foreground text-sm">
            This authorization link is missing required parameters
            (<code>app_name</code>, <code>scope</code>, <code>return_url</code>, <code>callback_url</code>).
            Please return to the application and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-lg w-full rounded-2xl border bg-card shadow-2xl overflow-hidden">
        <div className="bg-primary text-primary-foreground p-6">
          <p className="text-xs uppercase tracking-widest opacity-80">Application Authorization</p>
          <h1 className="text-2xl font-bold mt-1">Zackify.uae</h1>
          <p className="text-sm opacity-90 mt-1">zackify-uae.lovable.app</p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{search.app_name}</strong> would like to connect to your
              Zackify.uae store.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Application</span>
              <span className="font-medium text-foreground">{search.app_name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Permissions</span>
              <span className="font-medium text-foreground">{scopeLabel}</span>
            </div>
            {search.user_id ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">User reference</span>
                <span className="font-mono text-xs text-foreground">{search.user_id}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Returns to</span>
              <span className="truncate font-mono text-xs text-foreground max-w-[60%]">
                {safeHost(search.return_url)}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
            Only approve if you trust this application. It will receive API credentials
            able to access your store data within the permissions above.
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              onClick={() => handle("deny")}
              disabled={submitting}
              className="flex-1 rounded-lg border border-input bg-background hover:bg-muted px-4 py-3 text-sm font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handle("approve")}
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 px-4 py-3 text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting ? "Authorizing…" : "Approve"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function safeHost(url?: string) {
  if (!url) return "";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
