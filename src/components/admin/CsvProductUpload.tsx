import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";

type Props = { onDone: () => void };

type Result = {
  added: number;
  updated: number;
  errors: string[];
};

const REQUIRED = ["name", "description", "price", "discount_price", "category", "stock", "image_url"] as const;

const SAMPLE_CSV =
  "name,description,price,discount_price,category,stock,image_url\n" +
  "Smart Watch,Premium fitness watch with heart-rate monitor,79,59,Electronics,10,https://example.com/watch.jpg\n" +
  "Wireless Earbuds,Noise-cancelling earbuds with charging case,129,99,Electronics,25,https://example.com/earbuds.jpg\n" +
  'Luxury Perfume,"Long-lasting oud fragrance, 100ml",249,,Beauty,15,https://example.com/perfume.jpg\n';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Minimal RFC-4180-ish CSV parser: handles quoted fields with commas and escaped quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 0 && r.some((cell) => cell.trim() !== ""));
}

export function CsvProductUpload({ onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-sample.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      return toast.error("Please upload a .csv file");
    }
    setBusy(true);
    setResult(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error("CSV is empty");

      const header = rows[0].map((h) => h.trim().toLowerCase());
      const missing = REQUIRED.filter((c) => !header.includes(c));
      if (missing.length) {
        throw new Error(`Invalid CSV format. Missing columns: ${missing.join(", ")}`);
      }
      const idx = (k: string) => header.indexOf(k);

      // Resolve categories: build a map name->slug (case-insensitive). Auto-create missing categories.
      const { data: existingCats } = await supabase.from("categories").select("slug,name,sort_order");
      const catMap = new Map<string, string>(); // lowercase name -> slug
      (existingCats ?? []).forEach((c) => {
        catMap.set(c.name.toLowerCase(), c.slug);
        catMap.set(c.slug.toLowerCase(), c.slug);
      });
      let nextSort = (existingCats ?? []).reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0);

      // Pre-load existing product names for upsert-by-name
      const { data: existingProds } = await supabase.from("products").select("id,name");
      const prodMap = new Map<string, string>(); // lowercase name -> id
      (existingProds ?? []).forEach((p) => prodMap.set(p.name.toLowerCase(), p.id));

      const errors: string[] = [];
      let added = 0;
      let updated = 0;

      for (let r = 1; r < rows.length; r++) {
        const cells = rows[r];
        const rowNum = r + 1; // 1-based, +1 for header
        const get = (k: string) => (cells[idx(k)] ?? "").trim();
        const name = get("name");
        const description = get("description");
        const priceStr = get("price");
        const discountStr = get("discount_price");
        const categoryRaw = get("category");
        const stockStr = get("stock");
        const imageUrl = get("image_url");

        if (!name) { errors.push(`Row ${rowNum}: name is required`); continue; }
        if (!categoryRaw) { errors.push(`Row ${rowNum}: category is required`); continue; }
        const price = Number(priceStr);
        if (!priceStr || Number.isNaN(price) || price < 0) {
          errors.push(`Row ${rowNum}: price must be a number`); continue;
        }
        const stock = Number(stockStr || "0");
        if (Number.isNaN(stock) || stock < 0) {
          errors.push(`Row ${rowNum}: stock must be a number`); continue;
        }
        let discount: number | null = null;
        if (discountStr) {
          const d = Number(discountStr);
          if (Number.isNaN(d) || d < 0) { errors.push(`Row ${rowNum}: discount_price must be a number`); continue; }
          discount = d;
        }

        // Resolve category — match by name first, then slug; create if missing
        let categorySlug = catMap.get(categoryRaw.toLowerCase());
        if (!categorySlug) {
          const newSlug = slugify(categoryRaw);
          const { error: catErr } = await supabase
            .from("categories")
            .insert({ name: categoryRaw, slug: newSlug, sort_order: ++nextSort });
          if (catErr) {
            errors.push(`Row ${rowNum}: could not create category "${categoryRaw}" — ${catErr.message}`);
            continue;
          }
          catMap.set(categoryRaw.toLowerCase(), newSlug);
          catMap.set(newSlug, newSlug);
          categorySlug = newSlug;
        }

        const payload = {
          name,
          slug: slugify(name),
          description: description || null,
          price,
          discount_price: discount,
          category_slug: categorySlug,
          stock,
          image_url: imageUrl || null,
          images: imageUrl ? [imageUrl] : [],
        };

        const existingId = prodMap.get(name.toLowerCase());
        if (existingId) {
          const { error: upErr } = await supabase.from("products").update(payload).eq("id", existingId);
          if (upErr) errors.push(`Row ${rowNum}: update failed — ${upErr.message}`);
          else updated++;
        } else {
          const { data: ins, error: insErr } = await supabase.from("products").insert(payload).select("id").maybeSingle();
          if (insErr) errors.push(`Row ${rowNum}: insert failed — ${insErr.message}`);
          else { added++; if (ins) prodMap.set(name.toLowerCase(), ins.id); }
        }
      }

      setResult({ added, updated, errors });
      toast.success(`${added} added · ${updated} updated · ${errors.length} errors`);
      onDone();
    } catch (err: any) {
      console.error("CSV upload failed:", err);
      toast.error(err.message ?? "Invalid CSV format.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => { setOpen(true); setResult(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-gold/30 text-sm hover:border-gold transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" /> Upload CSV
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-2 md:p-6 animate-fade-in"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="bg-card rounded-2xl border border-gold/30 max-w-lg w-full max-h-[90vh] overflow-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gold/15 flex justify-between items-center">
              <div>
                <h3 className="font-display text-xl">Bulk Upload Products</h3>
                <p className="text-xs text-muted-foreground">Upload a CSV to add or update products</p>
              </div>
              <button onClick={() => !busy && setOpen(false)} className="p-2 hover:text-gold disabled:opacity-50" disabled={busy}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Required columns:</div>
                <code className="block bg-secondary/40 rounded-lg px-3 py-2 text-[11px] font-mono break-all">
                  name, description, price, discount_price, category, stock, image_url
                </code>
                <div className="pt-1">Existing products with the same <strong>name</strong> will be updated; new ones will be created.</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadSample}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass border border-gold/20 hover:border-gold text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Sample CSV
                </button>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <button
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-gold text-deep-green font-semibold shadow-gold disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {busy ? "Processing..." : "Choose CSV File"}
              </button>

              {result && (
                <div className="rounded-xl border border-gold/20 bg-secondary/30 p-4 space-y-2 animate-fade-in">
                  <div className="font-display text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Upload Complete
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <div className="font-display text-lg text-emerald-400">{result.added}</div>
                      <div className="text-muted-foreground">Added</div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <div className="font-display text-lg text-blue-400">{result.updated}</div>
                      <div className="text-muted-foreground">Updated</div>
                    </div>
                    <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div className="font-display text-lg text-destructive">{result.errors.length}</div>
                      <div className="text-muted-foreground">Errors</div>
                    </div>
                  </div>
                  {result.errors.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> View errors
                      </summary>
                      <ul className="mt-2 space-y-1 max-h-40 overflow-auto">
                        {result.errors.map((e, i) => (
                          <li key={i} className="text-muted-foreground">• {e}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
