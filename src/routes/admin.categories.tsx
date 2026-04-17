import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

type Category = { id: string; name: string; slug: string; sort_order: number };

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setItems((data ?? []) as Category[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newName.trim()) return;
    const slug = slugify(newName);
    const { error } = await supabase.from("categories").insert({ name: newName.trim(), slug, sort_order: items.length });
    if (error) return toast.error(error.message);
    toast.success("Category added");
    setNewName("");
    load();
  };
  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("categories").update({ name: editName.trim() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditId(null);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this category? Products in it must be moved first.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Categories</h1>
        <p className="text-sm text-muted-foreground">{items.length} categories</p>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name" className="flex-1 bg-card border border-gold/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gold" />
          <button onClick={create} className="inline-flex items-center gap-2 px-5 rounded-lg bg-gradient-gold text-deep-green font-semibold shadow-gold">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl divide-y divide-gold/10">
        {loading ? (
          <div className="p-6"><div className="h-10 animate-shimmer-bg rounded-lg" /></div>
        ) : items.map((c) => (
          <div key={c.id} className="p-4 flex items-center gap-3">
            {editId === c.id ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 bg-card border border-gold/30 rounded-lg px-3 py-1.5 text-sm" autoFocus />
                <button onClick={() => saveEdit(c.id)} className="p-2 text-gold hover:bg-gold/10 rounded-lg"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditId(null)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">/{c.slug}</div>
                </div>
                <button onClick={() => { setEditId(c.id); setEditName(c.name); }} className="p-2 rounded-lg hover:bg-gold/10 hover:text-gold"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => remove(c.id)} className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
