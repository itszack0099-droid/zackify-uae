/** Map internal product/order/profile rows into WooCommerce-compatible shapes. */

type AnyRec = Record<string, unknown>;

export function mapProduct(p: AnyRec) {
  const images: string[] = Array.isArray(p.images) ? (p.images as string[]) : [];
  const primary = (p.image_url as string | null) ?? images[0] ?? null;
  const all = primary ? [primary, ...images.filter((u) => u !== primary)] : images;
  const price = p.discount_price != null ? Number(p.discount_price) : Number(p.price ?? 0);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    permalink: `https://zackify-uae.lovable.app/product/${p.slug}`,
    type: "simple",
    status: (p.stock as number) > 0 ? "publish" : "private",
    featured: !!p.featured,
    description: (p.description as string) ?? "",
    short_description: (p.description as string) ?? "",
    sku: p.sku,
    price: String(price),
    regular_price: String(p.price ?? 0),
    sale_price: p.discount_price != null ? String(p.discount_price) : "",
    on_sale: p.discount_price != null,
    stock_quantity: p.stock ?? 0,
    stock_status: (p.stock as number) > 0 ? "instock" : "outofstock",
    manage_stock: true,
    categories: p.category_slug
      ? [{ id: p.category_slug, name: p.category_slug, slug: p.category_slug }]
      : [],
    images: all.map((src, i) => ({ id: i, src, name: p.name, alt: p.name })),
    attributes: Array.isArray(p.colors) && (p.colors as string[]).length
      ? [{ id: 0, name: "Color", options: p.colors, visible: true, variation: false }]
      : [],
    date_created: p.created_at,
    date_modified: p.updated_at,
    meta_data: [
      { key: "hot_deal", value: p.hot_deal },
      { key: "rating", value: p.rating },
    ],
  };
}

const STATUS_MAP: Record<string, string> = {
  pending: "pending",
  confirmed: "processing",
  processing: "processing",
  shipped: "on-hold",
  out_for_delivery: "on-hold",
  delivered: "completed",
  cancelled: "cancelled",
  return_requested: "refunded",
  return_approved: "refunded",
  returned: "refunded",
};

export function mapOrder(o: AnyRec) {
  const items = Array.isArray(o.items) ? (o.items as AnyRec[]) : [];
  const nameParts = String(o.customer_name ?? "").split(" ");
  const first_name = nameParts[0] ?? "";
  const last_name = nameParts.slice(1).join(" ");
  const address = {
    first_name,
    last_name,
    address_1: (o.address as string) ?? "",
    city: (o.city as string) ?? "",
    state: (o.emirate as string) ?? "",
    postcode: (o.postal_code as string) ?? "",
    country: "AE",
    email: (o.customer_email as string) ?? "",
    phone: (o.phone as string) ?? "",
  };
  return {
    id: o.id,
    number: o.order_number,
    order_key: `wc_order_${o.id}`,
    status: STATUS_MAP[String(o.status)] ?? "pending",
    currency: "AED",
    date_created: o.created_at,
    date_modified: o.updated_at,
    total: String(o.total ?? 0),
    subtotal: String(o.subtotal ?? 0),
    shipping_total: "0",
    tax_total: "0",
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    customer_id: o.user_id ?? 0,
    customer_note: (o.notes as string) ?? "",
    billing: address,
    shipping: address,
    line_items: items.map((it, idx) => ({
      id: idx + 1,
      name: it.name,
      product_id: it.product_id ?? it.id ?? null,
      sku: it.sku ?? "",
      quantity: it.qty ?? it.quantity ?? 1,
      price: String(it.price ?? 0),
      subtotal: String(Number(it.price ?? 0) * Number(it.qty ?? 1)),
      total: String(Number(it.price ?? 0) * Number(it.qty ?? 1)),
      meta_data: [
        { key: "color", value: it.color ?? null },
        { key: "image", value: it.image ?? null },
      ],
    })),
    shipping_lines: [],
    fee_lines: [],
    coupon_lines: [],
    refunds: [],
    meta_data: [
      { key: "courier_name", value: o.courier_name },
      { key: "tracking_number", value: o.tracking_number },
      { key: "estimated_delivery", value: o.estimated_delivery },
      { key: "delivery_date", value: o.delivery_date },
    ],
  };
}

export function mapCustomer(p: AnyRec) {
  const name = String(p.display_name ?? "").split(" ");
  return {
    id: p.user_id,
    date_created: p.created_at,
    date_modified: p.updated_at,
    email: p.email ?? p.apple_email ?? "",
    first_name: name[0] ?? "",
    last_name: name.slice(1).join(" "),
    username: p.email ?? p.user_id,
    role: "customer",
    billing: {
      first_name: name[0] ?? "",
      last_name: name.slice(1).join(" "),
      email: p.email ?? "",
      phone: p.phone ?? "",
    },
    shipping: {
      first_name: name[0] ?? "",
      last_name: name.slice(1).join(" "),
    },
    is_paying_customer: false,
    meta_data: [],
  };
}
