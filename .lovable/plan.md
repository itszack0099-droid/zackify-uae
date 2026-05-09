## Scope

Six related changes across orders, hot deals, and the product page.

### 1. My Orders auto-linked to profile

- Add nullable `user_id uuid` column to `orders` table + index.
- Update `checkout.tsx` to include `user_id: session?.user?.id ?? null` when inserting an order.
- Update RLS: add policy "Users view own orders" using `auth.uid() = user_id`.
- Rewrite `account.orders.tsx` to query `orders` filtered by `user_id = auth.uid()` (no order-code lookup). Show list with status pill, product thumbnail (from `items[0].image`), title, date, total, AED. Tap row → existing order tracking/details. Mobile-app style cards (rounded, soft shadow, status badge, refund/tracking summary), matching uploaded Flipkart-like reference but in current Zackify gold/green theme.

### 2. Hot deals countdown loops

- In `Countdown.tsx` (or wherever used on hot deals): when `timeLeft <= 0`, reset target to `now + 10 minutes` so it never hits 00:00:00. Refresh every 10 min automatically.

### 3. Product page redesign (mobile-app style)

In `product.$slug.tsx`:
- Sticky top: back arrow + search/cart row (compact mobile header).
- Order: gallery → **product title (medium size, `text-lg md:text-xl`)** → price/discount → **Buy Now + Add to Cart buttons immediately below title** (sticky bottom on mobile, inline on desktop).
- Move long content (description, features, returns, reviews) below.
- **Features as collapsible button**: single "Features" button with chevron; tap toggles open/close list. Use a simple `useState` accordion (no extra deps).
- Apply mobile-app vibe: full-bleed gallery on mobile, rounded card sections, sticky bottom action bar with Add to Cart (outline) + Buy Now (gold), like the reference screenshot.

### 4. Product color selection

- Add `colors text[]` column to `products` (nullable, default `{}`).
- Admin product form (`admin.products.tsx`): add a "Colors" input — comma-separated chips (e.g. Black, Silver, White) with add/remove.
- Product page: if `product.colors?.length`, show "Selected Color: X" + selectable color chips; track via `useState`. Pass selected color into cart item (append to name like `"Watch — Black"` or store as a variant note in cart line).

### 5. Technical notes

- DB migration runs first (orders.user_id + RLS policy + products.colors). After approval, code edits proceed and Supabase types regenerate automatically.
- Cart item type already supports name; we'll suffix selected color into the line name to avoid schema changes to cart.
- Keep design tokens (gold/deep-green/glass) — no new color literals.
- No business logic changes elsewhere; checkout flow, admin orders, etc. unchanged.

### Files touched

- migration: `orders.user_id`, RLS, `products.colors`
- `src/routes/checkout.tsx` — include user_id on insert
- `src/routes/account.orders.tsx` — full rewrite to user-scoped list
- `src/components/Countdown.tsx` — auto-loop logic
- `src/routes/product.$slug.tsx` — redesign + collapsible features + color picker + sticky CTA
- `src/routes/admin.products.tsx` — colors field in form

### Out of scope

- Changing checkout schema beyond adding user_id.
- New cart variant model (we encode color in the line name).
