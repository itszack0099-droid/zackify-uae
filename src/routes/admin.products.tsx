import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, X, Upload, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatAED } from "@/lib/cart";

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
  category_slug: "", stock: 0, featured: false, hot_deal: false, features: [],
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
  const startEdit = (p: Product) => { setEditing(p); setFeaturesStr((p.features ?? []).join("\n")); };

  const uploadImage = async (file: File) => {
    if (!editing) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("product-images").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setEditing({ ...editing, image_url: data.publicUrl });
    setUploading(false);
    toast.success("Image uploaded");
  };

  const save = async () => {
    if (!editing?.name || !editing.category_slug || !editing.price) {
      return toast.error("Name, category and price are required");
    }
    const payload = {
      name: editing.name,
      slug: editing.slug || slugify(editing.name),
      description: editing.description || null,
      features: featuresStr.split("\n").map((s) => s.trim()).filter(Boolean),
      price: Number(editing.price),
      discount_price: editing.discount_price ? Number(editing.discount_price) : null,
      image_url: editing.image_url || null,
      category_slug: editing.category_slug,
      stock: Number(editing.stock ?? 0),
      featured: !!editing.featured,
      hot_deal: !!editing.hot_deal,
      deal_ends_at: editing.deal_ends_at || null,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Product updated" : "Product created");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setItems((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground">{items.length} products</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold">
          <Plus className="w-4 h-4" /> New Product
        </button>
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
              <Field label="Product Image">
                <div className="flex items-start gap-3">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-secondary border border-gold/20 shrink-0 flex items-center justify-center">
                    {editing.image_url ? (
                      <img src={editing.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadImage(f);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-gold text-deep-green text-sm font-semibold shadow-gold disabled:opacity-60"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? "Uploading..." : editing.image_url ? "Replace image" : "Upload image"}
                    </button>
                    {editing.image_url && (
                      <button
                        type="button"
                        onClick={() => setEditing({ ...editing, image_url: "" })}
                        className="block text-xs text-muted-foreground hover:text-destructive"
                      >
                        Remove image
                      </button>
                    )}
                    <p className="text-[11px] text-muted-foreground">PNG/JPG/WEBP, max 5 MB</p>
                  </div>
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
