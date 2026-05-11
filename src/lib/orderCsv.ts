// CSV exporter matching the required template:
// order_reference_id,customer_name,Address,delivery_city,delivery_country,
// customer_phone_number,product_sku,Quantity,price,shipping_charges,Discount,
// total_amount,currency,payment_mode

import { supabase } from "@/integrations/supabase/client";

type OrderItem = { name: string; qty: number; price: number; sku?: string | null };
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
    const items = o.items ?? [];
    const totalQty = items.reduce((a, it) => a + (Number(it.qty) || 0), 0) || 1;
    const itemsTotal = items.reduce((a, it) => a + Number(it.qty) * Number(it.price), 0);
    const subtotal = Number(o.subtotal ?? itemsTotal) || itemsTotal;
    const shipping = Math.max(0, Number(o.total) - subtotal);
    const first = items[0];
    const sku = (first?.sku as string) || (first?.name && skuMap[first.name]) || first?.name || "";
    rows.push(
      [
        o.order_number,
        o.customer_name,
        o.address,
        o.city,
        "United Arab Emirates",
        normPhone(o.phone),
        sku,
        totalQty,
        first ? Number(first.price).toFixed(2) : "0",
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
