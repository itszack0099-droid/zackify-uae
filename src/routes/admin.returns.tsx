import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCcw, Check, X, CircleCheckBig, Info } from "lucide-react";

export const Route = createFileRoute("/admin/returns")({
  component: AdminReturns,
});

type RStatus = "pending" | "approved" | "rejected" | "completed";

type ReturnRow = {
  id: string;
  order_id: string;
  order_number: string;
  phone: string;
  reason: string;
  message: string | null;
  status: RStatus;
  created_at: string;
};

const STATUSES: RStatus[] = ["pending", "approved", "rejected", "completed"];
const LABELS: Record<RStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};
const COLORS: Record<RStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
};

function AdminReturns() {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("return_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as ReturnRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (row: ReturnRow, status: RStatus) => {
    const { error } = await supabase.from("return_requests").update({ status }).eq("id", row.id);
    if (error) { console.error(error); return toast.error("Failed to update return"); }

    // Mirror status to the underlying order so customer tracking page reflects it
    if (status === "approved") {
      await supabase.from("orders").update({ status: "return_approved" }).eq("id", row.order_id);
    } else if (status === "completed") {
      await supabase.from("orders").update({ status: "returned" }).eq("id", row.order_id);
    }

    if (status === "approved") {
      window.alert(
        "Return approved.\n\nNext steps:\nGo to fulfillment dashboard → Orders → Select this order → Create Return Request or Open Ticket.",
      );
    }
    toast.success(`Return marked ${LABELS[status]}`);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
  };

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Return Requests</h1>
          <p className="text-sm text-muted-foreground">{rows.length} total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-colors ${filter === s ? "bg-gradient-gold text-deep-green" : "glass border border-gold/20 hover:border-gold"}`}
            >
              {s === "all" ? "All" : LABELS[s as RStatus]}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase border-b border-gold/15">
                <th className="p-4">Order #</th>
                <th>Phone</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-2"><div className="h-10 rounded-lg animate-shimmer-bg" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground">
                    <RefreshCcw className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No return requests yet.
                  </td>
                </tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors align-top">
                  <td className="p-4 text-gold font-medium">{r.order_number}</td>
                  <td className="text-foreground/80">{r.phone}</td>
                  <td>
                    <div className="font-medium">{r.reason}</div>
                    {r.message && (
                      <div className="text-xs text-muted-foreground mt-1 max-w-xs flex items-start gap-1">
                        <Info className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{r.message}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`inline-block text-xs px-2 py-1 rounded-full border ${COLORS[r.status]}`}>
                      {LABELS[r.status]}
                    </span>
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-AE", { dateStyle: "medium" })}
                  </td>
                  <td className="pr-4">
                    <div className="flex justify-end gap-1.5">
                      {r.status === "pending" && (
                        <>
                          <button
                            onClick={() => setStatus(r, "approved")}
                            className="px-2.5 py-1 text-xs rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors inline-flex items-center gap-1"
                            title="Approve return"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => setStatus(r, "rejected")}
                            className="px-2.5 py-1 text-xs rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors inline-flex items-center gap-1"
                            title="Reject return"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </>
                      )}
                      {(r.status === "approved" || r.status === "pending") && (
                        <button
                          onClick={() => setStatus(r, "completed")}
                          className="px-2.5 py-1 text-xs rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors inline-flex items-center gap-1"
                          title="Mark completed"
                        >
                          <CircleCheckBig className="w-3 h-3" /> Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
