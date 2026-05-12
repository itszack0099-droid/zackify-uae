// CSV exporter — one row per order with ALL items combined.
// Columns:
// order_reference_id,customer_name,Address,delivery_city,delivery_country,
// customer_phone_number,product_sku,product_name,Quantity,price,
// shipping_charges,Discount,total_amount,currency,payment_mode

import { supabase } from "@/integrations/supabase/client";

type OrderItem = {
  name: string;
  qty: number;
  price: number;
  sku?: string | null;
  color?: string | null;
};
export type OrderForCsv = {
  order_number: string;
  customer_name: string;
  address: string;
  city: string;
  phone: string;
  items: OrderItem[];
  total: number;
  subtotal?: number | null;
};

const CSV_HEADER = [
  "order_reference_id",
  "customer_name",
  "Address",
  "delivery_city",
  "delivery_country",
  "customer_phone_number",
  "product_sku",
  "product_name",
  "Quantity",
  "price",
  "shipping_charges",
  "Discount",
  "total_amount",
  "currency",
  "payment_mode",
];

const escape = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const normPhone = (p: string) => (p || "").replace(/\D/g, "");

async function buildSkuMap(orders: OrderForCsv[]): Promise<Record<string, string>> {
  const names = new Set<string>();
  for (const o of orders) for (const it of o.items ?? []) if (it.name) names.add(it.name);
  if (!names.size) return {};
  const { data } = await supabase
    .from("products")
    .select("name,sku")
    .in("name", Array.from(names));
  const map: Record<string, string> = {};
  for (const r of data ?? []) if (r.name && r.sku) map[r.name] = r.sku;
  return map;
}

export async function ordersToCsv(orders: OrderForCsv[]): Promise<string> {
  const skuMap = await buildSkuMap(orders);
  const rows = [CSV_HEADER.join(",")];

  for (const o of orders) {
    const items = (o.items ?? []).filter(Boolean);
    if (!items.length) continue;

    // Dedupe items by name+color so the same product is never listed twice
    const dedup = new Map<string, OrderItem>();
    for (const it of items) {
      const key = `${(it.name || "").trim().toLowerCase()}|${(it.color || "").trim().toLowerCase()}`;
      const prev = dedup.get(key);
      if (prev) {
        prev.qty = Number(prev.qty) + Number(it.qty);
      } else {
        dedup.set(key, { ...it, qty: Number(it.qty) || 0, price: Number(it.price) || 0 });
      }
    }
    const merged = Array.from(dedup.values());

    const names = merged.map((it) => it.name).join(", ");
    const skus = merged
      .map((it) => (it.sku as string) || (it.name && skuMap[it.name]) || it.name || "")
      .join(", ");
    const qtys = merged.map((it) => Number(it.qty) || 0).join(", ");
    const prices = merged.map((it) => Number(it.price).toFixed(2)).join(", ");
    const totalQty = merged.reduce((a, it) => a + (Number(it.qty) || 0), 0);
    const itemsTotal = merged.reduce(
      (a, it) => a + Number(it.qty) * Number(it.price),
      0,
    );
    const subtotal = Number(o.subtotal ?? itemsTotal) || itemsTotal;
    const shipping = Math.max(0, Number(o.total) - subtotal);

    rows.push(
      [
        o.order_number,
        o.customer_name,
        o.address,
        o.city,
        "United Arab Emirates",
        normPhone(o.phone),
        skus,
        names,
        `${totalQty} (${qtys})`,
        prices,
        shipping.toFixed(2),
        "0",
        Number(o.total).toFixed(2),
        "AED",
        "COD",
      ]
        .map(escape)
        .join(","),
    );
  }
  return rows.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
