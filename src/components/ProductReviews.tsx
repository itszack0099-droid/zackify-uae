import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Star, ImagePlus, X, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

const MAX_RATING = 7;
const BUCKET = "review-media";

type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  media_urls: string[];
  media_types: string[];
  status: string;
  created_at: string;
};

type SignedMedia = { url: string; type: string };

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [signed, setSigned] = useState<Record<string, SignedMedia[]>>({});
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setAuthorName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
    }
  }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    const list = (data as Review[]) || [];
    setReviews(list);
    // Sign media URLs
    const sigMap: Record<string, SignedMedia[]> = {};
    await Promise.all(
      list.map(async (r) => {
        if (!r.media_urls?.length) return;
        const { data: s } = await supabase.storage.from(BUCKET).createSignedUrls(r.media_urls, 3600);
        sigMap[r.id] = (s || []).map((u, i) => ({
          url: u.signedUrl,
          type: r.media_types[i] || "image",
        }));
      }),
    );
    setSigned(sigMap);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`reviews-${productId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_reviews", filter: `product_id=eq.${productId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    const filtered = list.filter((f) => {
      if (f.size > 25 * 1024 * 1024) {
        toast.error(`${f.name} is too large (max 25 MB)`);
        return false;
      }
      return f.type.startsWith("image/") || f.type.startsWith("video/");
    });
    setFiles((prev) => [...prev, ...filtered].slice(0, 6));
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (i: number) => setFiles((f) => f.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }
    if (rating < 1) return toast.error("Pick a star rating");
    if (!body.trim()) return toast.error("Write your review");
    if (!authorName.trim()) return toast.error("Enter your name");

    setSubmitting(true);
    try {
      const paths: string[] = [];
      const types: string[] = [];
      for (const f of files) {
        const ext = f.name.split(".").pop() || "bin";
        const path = `${user.id}/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, f, {
          contentType: f.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        paths.push(path);
        types.push(f.type.startsWith("video/") ? "video" : "image");
      }

      const { error } = await (supabase as any).from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        author_name: authorName.trim().slice(0, 80),
        rating,
        title: title.trim().slice(0, 120) || null,
        body: body.trim().slice(0, 2000),
        media_urls: paths,
        media_types: types,
      });
      if (error) throw error;

      toast.success("Review posted");
      setRating(0);
      setTitle("");
      setBody("");
      setFiles([]);
    } catch (e: any) {
      toast.error(e.message || "Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-xl">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex text-gold">
                {Array.from({ length: MAX_RATING }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.round(avg) ? "fill-gold" : "fill-none opacity-30"}`}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {avg.toFixed(1)} / {MAX_RATING} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Write review */}
      <div className="glass rounded-2xl p-4 mb-6 border border-gold/15">
        <h3 className="font-semibold text-sm mb-3">Write a review</h3>
        {!user ? (
          <p className="text-sm text-muted-foreground">
            <Link to="/account" className="text-gold hover:underline">
              Sign in
            </Link>{" "}
            to share your experience.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">Your rating (out of {MAX_RATING})</div>
              <div className="flex gap-1">
                {Array.from({ length: MAX_RATING }).map((_, i) => {
                  const v = i + 1;
                  const filled = v <= (hover || rating);
                  return (
                    <button
                      key={v}
                      type="button"
                      onMouseEnter={() => setHover(v)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(v)}
                      className="p-1"
                      aria-label={`${v} star${v > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-6 h-6 transition ${filled ? "fill-gold text-gold" : "fill-none text-muted-foreground"}`}
                        strokeWidth={1.5}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={80}
              placeholder="Your name"
              className="w-full bg-transparent border border-gold/25 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Headline (optional)"
              className="w-full bg-transparent border border-gold/25 rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Share details about quality, fit, delivery, etc."
              className="w-full bg-transparent border border-gold/25 rounded-lg px-3 py-2 text-sm resize-none"
            />

            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gold/20 bg-black/40">
                    {f.type.startsWith("video/") ? (
                      <video src={URL.createObjectURL(f)} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/30 text-sm hover:bg-gold/10"
                disabled={files.length >= 6}
              >
                <ImagePlus className="w-4 h-4" /> Add photo / video
              </button>
              <input
                ref={fileRef}
                type="file"
                hidden
                multiple
                accept="image/*,video/*"
                onChange={onPickFiles}
              />
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-gold text-deep-green font-semibold text-sm disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Posting…" : "Post review"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="text-sm text-muted-foreground">No reviews yet — be the first!</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {reviews.map((r) => (
            <article key={r.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex text-gold">
                  {Array.from({ length: MAX_RATING }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < r.rating ? "fill-gold" : "fill-none opacity-30"}`}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              {r.title && <h4 className="font-semibold text-sm mb-1">{r.title}</h4>}
              <p className="text-sm text-foreground/85 whitespace-pre-wrap">{r.body}</p>
              {signed[r.id]?.length ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {signed[r.id].map((m, i) => (
                    <a
                      key={i}
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-square rounded-lg overflow-hidden border border-gold/15 bg-black/40"
                    >
                      {m.type === "video" ? (
                        <video src={m.url} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={m.url} className="w-full h-full object-cover" alt="review media" />
                      )}
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="text-xs text-muted-foreground mt-2">— {r.author_name}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
