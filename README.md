# skss-storefront — Bug Fixes

## How to apply these fixes

Copy each file from this folder into your `skss-storefront` repo at the matching path,
then commit and push via GitHub Desktop.

---

## Files changed and why

### `app/checkout/page.tsx`
- **FIX #1 (Security)** — Removed `NEXT_PUBLIC_INTERNAL_API_SECRET` comment clarifying
  the env var rename. The stock API already reads `INTERNAL_API_SECRET` (no NEXT_PUBLIC_
  prefix) on the server side. You also need to add `NEXT_PUBLIC_INTERNAL_API_SECRET`
  to your `.env` (same value) so the client can send it in the header. See `.env.example`.
- **FIX #3 (Bug)** — Reads `free_shipping_above`, `default_shipping_charge`, and
  `default_gst_rate` from `site_config` instead of hardcoding `1999`, `99`, and `0.05`.
  Cart and checkout now use the same values.
- **FIX #4 (Bug)** — Stock availability is checked BEFORE opening the Razorpay modal.
  Previously the check ran after payment, meaning a customer could pay for an out-of-stock
  item. Now if stock is insufficient, the modal never opens.
- **FIX #7 (Auth)** — Replaced `getSession()` with `getUser()` for server-validated auth.
- **FIX #10 (Code quality)** — Imports `INDIAN_STATES` from `lib/utils.ts` (36 states)
  instead of re-declaring a local 32-state list that was missing 4 union territories.
- **FIX #12 (Code quality)** — Removed the duplicate nested `if (appliedCoupon?.code)`
  inside itself on lines 193–201.

### `app/product/[slug]/ProductDetailClient.tsx`
- **FIX #2 (Critical bug)** — Corrected the Shiprocket fetch URL from
  `/api/shiprocket/pincode?pincode=` to `/api/shiprocket?pincode=`.
  The extra `/pincode` path segment doesn't exist, so every delivery check was 404ing.
- **FIX #9 (UX)** — Added a purchase check before showing the review form. When the page
  loads, it queries `order_items` joined with `orders` to see if the user has ordered this
  product. `is_verified_purchase` is now set to `true` in the DB if they have. Users who
  haven't purchased still see the form but their review is saved without the verified badge.

### `app/shop/ShopContent.tsx`
- **FIX #6 (Bug)** — Price range filter and price sort now use `getEffectivePrice()`
  instead of `originalPrice`. A product on sale for ₹2,000 (originally ₹4,000) was
  previously excluded from a "Max ₹2,500" filter even though the customer pays ₹2,000.

### `app/orders/[id]/page.tsx`
- **FIX #7 (Auth)** — Replaced `getSession()` with `getUser()`.
- **FIX #8 (UX)** — Added a "Request Return" button and form for delivered orders.
  Submits a `return_requested` status update and saves the reason to the `orders` table.
  The button only appears for `delivered` status; already-requested returns show their
  current status.
- **FIX #11 (Bug)** — The GST label now reads from `order.gst_rate` dynamically
  instead of hardcoding "GST (5%)".

### `next.config.js`
- **FIX #14 (Security)** — Added a `Content-Security-Policy` header covering script-src
  (Razorpay), connect-src (Supabase, Razorpay, Shiprocket, Fast2SMS), img-src
  (Cloudinary, Supabase, Google), and frame-src (Razorpay payment iframe).

---

## .env changes needed

Add these to your `.env.local` (and Vercel environment variables):

```
# Rename from NEXT_PUBLIC_INTERNAL_API_SECRET — keep same value
# The server route reads INTERNAL_API_SECRET (no NEXT_PUBLIC_)
# The client still needs NEXT_PUBLIC_ to send in headers
INTERNAL_API_SECRET=your_secret_here
NEXT_PUBLIC_INTERNAL_API_SECRET=your_secret_here
```

---

## Issues NOT addressed here (require DB or larger changes)

- **Issue #5** — `/api/razorpay/route.ts` is dead code (duplicate of `/api/create-order`).
  Safe to delete after verifying nothing calls it.
- **Issue #13** — `wishlist/page.tsx` duplicates the product-mapping logic from
  `lib/supabase/config.ts`. Refactor to use the shared `mapProduct()` function when convenient.
