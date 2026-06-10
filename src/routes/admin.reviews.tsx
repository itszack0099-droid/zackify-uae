import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviewsPage,
});

type Review = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  media_urls: string[];
  media_types: string[];
  status: string;
  created_at: string;
};

type ProductMini = { id: string; name: string; slug: string };

function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Record<string, ProductMini>>({});
  const [signed, setSigned] = useState<Record<string, { url: string; type: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");

  const load = async () => {
    setLoading(true);
    let q = (supabase as any).from("product_reviews").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    const list = (data as Review[]) || [];
    setReviews(list);

    const ids = Array.from(new Set(list.map((r) => r.product_id)));
    if (ids.length) {
      const { data: prods } = await supabase.from("products").select("id, name, slug").in("id", ids);
      const map: Record<string, ProductMini> = {};
      (prods || []).forEach((p: any) => (map[p.id] = p));
      setProducts(map);
    }

    const sigMap: Record<string, { url: string; type: string }[]> = {};
    await Promise.all(
      list.map(async (r) => {
        if (!r.media_urls?.length) return;
        const { data: s } = await supabase.storage.from("review-media").createSignedUrls(r.media_urls, 3600);
        sigMap[r.id] = (s || [])
          .filter((u) => !!u.signedUrl)
          .map((u, i) => ({ url: u.signedUrl as string, type: r.media_types[i] || "image" }));
      }),
    );
    setSigned(sigMap);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_reviews" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("product_reviews").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(`Marked ${status}`);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    const { error } = await (supabase as any).from("product_reviews").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Reviews</h1>
        <div className="flex gap-1 text-xs">
          {(["all", "approved", "pending", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full border ${filter === s ? "bg-gold/20 border-gold text-gold" : "border-gold/20 hover:bg-gold/10"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-sm text-muted-foreground">No reviews.</div>
      ) : (
        <div className="grid gap-3">
          {reviews.map((r) => {
            const p = products[r.product_id];
            return (
              <div key={r.id} className="glass rounded-2xl p-4 border border-gold/15">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {p ? p.name : r.product_id} · {new Date(r.created_at).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-gold">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-gold" : "fill-none opacity-30"}`} strokeWidth={1.5} />
                        ))}
                      </div>
                      <span className="text-xs">by {r.author_name}</span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${r.status === "approved" ? "border-green-500/40 text-green-500" : r.status === "rejected" ? "border-red-500/40 text-red-500" : "border-gold/40 text-gold"}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {r.status !== "approved" && (
                      <button onClick={() => setStatus(r.id, "approved")} className="p-2 rounded-lg border border-green-500/30 hover:bg-green-500/10 text-green-500" title="Approve">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {r.status !== "rejected" && (
                      <button onClick={() => setStatus(r.id, "rejected")} className="p-2 rounded-lg border border-orange-500/30 hover:bg-orange-500/10 text-orange-500" title="Reject">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => remove(r.id)} className="p-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-500" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {r.title && <div className="font-semibold text-sm mb-1">{r.title}</div>}
                <p className="text-sm whitespace-pre-wrap text-foreground/85">{r.body}</p>
                {signed[r.id]?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {signed[r.id].map((m, i) => (
                      <a key={i} href={m.url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-lg overflow-hidden border border-gold/15 block bg-black/40">
                        {m.type === "video" ? (
                          <video src={m.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={m.url} className="w-full h-full object-cover" alt="" />
                        )}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
