import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, X, Upload, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatAED } from "@/lib/cart";
import { squareCompress } from "@/lib/imageCompress";
import { CsvProductUpload } from "@/components/admin/CsvProductUpload";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  features: string[] | null;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  images: string[] | null;
  category_slug: string;
  stock: number;
  featured: boolean;
  hot_deal: boolean;
  deal_ends_at: string | null;
};

type Category = { slug: string; name: string };

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const empty: Partial<Product> = {
  name: "", slug: "", description: "", price: 0, discount_price: null, image_url: "",
  images: [], category_slug: "", stock: 0, featured: false, hot_deal: false, features: [],
};

function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [featuresStr, setFeaturesStr] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [p, c] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("slug,name").order("sort_order"),
    ]);
    setItems((p.data ?? []) as Product[]);
    setCats((c.data ?? []) as Category[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(empty); setFeaturesStr(""); };
  const startEdit = (p: Product) => {
    // Backfill images from legacy image_url so the gallery UI works for old products
    const images = (p.images && p.images.length > 0) ? p.images : (p.image_url ? [p.image_url] : []);
    setEditing({ ...p, images });
    setFeaturesStr((p.features ?? []).join("\n"));
  };

  const uploadImages = async (files: FileList | File[]) => {
    if (!editing) return;
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const raw of list) {
      if (!raw.type.startsWith("image/")) {
        toast.error(`${raw.name} is not an image`);
        continue;
      }
      if (raw.size > 20 * 1024 * 1024) {
        toast.error(`${raw.name} is over 20MB`);
        continue;
      }
      let processed: File;
      try {
        // Auto-crop to square + compress under 300KB
        processed = await squareCompress(raw, { maxBytes: 300 * 1024, size: 1200, mime: "image/jpeg" });
        console.log(`[upload] ${raw.name}: ${(raw.size / 1024).toFixed(0)}KB → ${(processed.size / 1024).toFixed(0)}KB`);
      } catch (err) {
        console.error("Image compression failed, uploading original:", err);
        processed = raw;
      }
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(fileName, processed, {
        cacheControl: "3600",
        upsert: false,
        contentType: processed.type,
      });
      if (upErr) {
        toast.error(upErr.message);
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      uploaded.push(data.publicUrl);
    }
    if (uploaded.length) {
      const existing = editing.images ?? [];
      const merged = [...existing, ...uploaded];
      setEditing({
        ...editing,
        images: merged,
        // Keep image_url in sync with the first image (used in listings/cards)
        image_url: editing.image_url || merged[0],
      });
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded — auto-cropped & compressed`);
    }
    setUploading(false);
  };

  const removeImageAt = (idx: number) => {
    if (!editing) return;
    const next = (editing.images ?? []).filter((_, i) => i !== idx);
    setEditing({
      ...editing,
      images: next,
      image_url: next[0] ?? "",
    });
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    if (!editing) return;
    const arr = [...(editing.images ?? [])];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setEditing({ ...editing, images: arr, image_url: arr[0] ?? editing.image_url });
  };

  const save = async () => {
    if (!editing?.name || !editing.category_slug || !editing.price) {
      return toast.error("Name, category and price are required");
    }
    const imgs = editing.images ?? [];
    const payload = {
      name: editing.name,
      slug: editing.slug || slugify(editing.name),
      description: editing.description || null,
      features: featuresStr.split("\n").map((s) => s.trim()).filter(Boolean),
      price: Number(editing.price),
      discount_price: editing.discount_price ? Number(editing.discount_price) : null,
      image_url: editing.image_url || imgs[0] || null,
      images: imgs,
      category_slug: editing.category_slug,
      stock: Number(editing.stock ?? 0),
      featured: !!editing.featured,
      hot_deal: !!editing.hot_deal,
      deal_ends_at: editing.deal_ends_at || null,
    };
    const query = editing.id
      ? supabase.from("products").update(payload).eq("id", editing.id).select()
      : supabase.from("products").insert([payload]).select();
    const { data, error } = await query;
    if (error) {
      console.error("Product save failed:", error);
      return toast.error(error.message);
    }
    if (!data || data.length === 0) {
      console.error("Product save returned 0 rows — likely blocked by permissions (RLS).");
      return toast.error("Save was blocked. Your account may not have admin permissions.");
    }
    console.log(editing.id ? "Product updated in database:" : "Product saved to database:", data[0]);
    toast.success(editing.id ? "Product updated successfully" : "Product added successfully");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { data, error } = await supabase.from("products").delete().eq("id", id).select();
    if (error) {
      console.error("Product delete failed:", error);
      return toast.error(error.message);
    }
    if (!data || data.length === 0) {
      console.error("Delete returned 0 rows — likely blocked by permissions (RLS).");
      return toast.error("Delete was blocked. Your account may not have admin permissions.");
    }
    console.log("Product deleted from database:", id);
    toast.success("Product deleted successfully");
    setItems((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground">{items.length} products</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CsvProductUpload onDone={load} />
          <button onClick={startNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold">
            <Plus className="w-4 h-4" /> New Product
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase border-b border-gold/15">
                <th className="p-4">Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Flags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-2"><div className="h-12 rounded-lg animate-shimmer-bg" /></td></tr>
                ))
              ) : items.map((p) => (
                <tr key={p.id} className="border-b border-gold/10 hover:bg-gold/5">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary shrink-0">
                        {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="text-xs text-muted-foreground">{p.category_slug}</td>
                  <td>
                    <div className="text-gold font-medium">{formatAED(Number(p.discount_price ?? p.price))}</div>
                    {p.discount_price && <div className="text-xs text-muted-foreground line-through">{formatAED(Number(p.price))}</div>}
                  </td>
                  <td>{p.stock}</td>
                  <td className="space-x-1">
                    {p.featured && <span className="text-[10px] bg-gold/15 text-gold px-2 py-0.5 rounded-full">Featured</span>}
                    {p.hot_deal && <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">Hot</span>}
                  </td>
                  <td className="pr-4 text-right">
                    <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-gold/10 hover:text-gold"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-2 md:p-6 animate-fade-in" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-2xl border border-gold/30 max-w-2xl w-full max-h-[90vh] overflow-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gold/15 flex justify-between items-center sticky top-0 bg-card z-10">
              <h2 className="font-display text-xl">{editing.id ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:text-gold"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Name *">
                <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} className={inp} />
              </Field>
              <Field label="Slug">
                <input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} className={inp} />
              </Field>
              <Field label="Product Images (first one is the cover)">
                <div className="space-y-3">
                  {(editing.images?.length ?? 0) > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(editing.images ?? []).map((url, idx) => (
                        <div key={`${url}-${idx}`} className="relative group rounded-xl overflow-hidden border border-gold/20 bg-secondary aspect-square">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 text-[9px] uppercase tracking-wide bg-gradient-gold text-deep-green font-bold px-1.5 py-0.5 rounded">Cover</span>
                          )}
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1 bg-black/60 opacity-0 group-hover:opacity-100 transition">
                            <div className="flex gap-1">
                              <button type="button" onClick={() => moveImage(idx, -1)} disabled={idx === 0} className="text-[10px] px-1.5 py-0.5 rounded bg-white/15 hover:bg-gold hover:text-deep-green disabled:opacity-30">←</button>
                              <button type="button" onClick={() => moveImage(idx, 1)} disabled={idx === (editing.images?.length ?? 0) - 1} className="text-[10px] px-1.5 py-0.5 rounded bg-white/15 hover:bg-gold hover:text-deep-green disabled:opacity-30">→</button>
                            </div>
                            <button type="button" onClick={() => removeImageAt(idx)} className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const fs = e.target.files;
                      if (fs && fs.length) uploadImages(fs);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-gold text-deep-green text-sm font-semibold shadow-gold disabled:opacity-60"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? "Uploading..." : (editing.images?.length ?? 0) > 0 ? "Add more images" : "Upload images"}
                    </button>
                    {(editing.images?.length ?? 0) === 0 && (
                      <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Upload multiple images for the product carousel. Photos are auto-cropped to square and compressed under 300 KB before saving.</p>
                </div>
              </Field>
              <Field label="Description">
                <textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inp} />
              </Field>
              <Field label="Features (one per line)">
                <textarea rows={3} value={featuresStr} onChange={(e) => setFeaturesStr(e.target.value)} className={inp} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category *">
                  <select value={editing.category_slug ?? ""} onChange={(e) => setEditing({ ...editing, category_slug: e.target.value })} className={inp}>
                    <option value="">Select…</option>
                    {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Stock">
                  <input type="number" min={0} value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} className={inp} />
                </Field>
                <Field label="Price (AED) *">
                  <input type="number" min={0} step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className={inp} />
                </Field>
                <Field label="Discount Price">
                  <input type="number" min={0} step="0.01" value={editing.discount_price ?? ""} onChange={(e) => setEditing({ ...editing, discount_price: e.target.value ? Number(e.target.value) : null })} className={inp} />
                </Field>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="accent-[var(--gold)]" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!editing.hot_deal} onChange={(e) => setEditing({ ...editing, hot_deal: e.target.checked })} className="accent-[var(--gold)]" />
                  Hot Deal
                </label>
              </div>
              {editing.hot_deal && (
                <Field label="Deal ends at">
                  <input type="datetime-local" value={editing.deal_ends_at ? new Date(editing.deal_ends_at).toISOString().slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, deal_ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className={inp} />
                </Field>
              )}
            </div>
            <div className="p-6 border-t border-gold/15 flex justify-end gap-2 sticky bottom-0 bg-card">
              <button onClick={() => setEditing(null)} className="px-5 py-2 rounded-full glass border border-gold/20 hover:border-gold">Cancel</button>
              <button onClick={save} className="px-5 py-2 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "w-full bg-background border border-gold/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-muted-foreground mb-1 block">{label}</span>{children}</label>;
}
