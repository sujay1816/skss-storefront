# skss-storefront — Zoom Fix + Loading States

## Files to replace

| File | What changed |
|------|-------------|
| `app/globals.css` | Lightbox: touch-action for pinch-zoom, swipe hint on mobile, nav arrows hidden on mobile |
| `app/product/[slug]/ProductDetailClient.tsx` | Swipe to navigate in lightbox; dot indicators; image load skeleton; reset skeleton on image switch |
| `app/wishlist/page.tsx` | Skeleton card grid replaces plain "Loading..." text |
| `app/contact/ContactClient.tsx` | Added full contact form with spinner, success state, and Supabase save |
| `components/product/ProductCard.tsx` | Skeleton overlay on each product card image until loaded |

## Zoom — what was wrong and what's fixed

The issue was `touch-action` on the lightbox overlay was set to `manipulation`
which blocks multi-touch gestures like pinch-to-zoom. The fix:

- `.lightbox-overlay` — `touch-action: manipulation` (prevents accidental
  double-tap zoom on the black background, which is correct)
- `.lightbox-img` — `touch-action: pinch-zoom pan-x pan-y` (explicitly
  ALLOWS native browser pinch-to-zoom on the image itself)
- On mobile the lightbox now shows: "Swipe to browse · Pinch to zoom" hint
- Nav arrows hidden on mobile (use swipe instead)
- Swiping left/right navigates between images (50px threshold)
- Dot indicators show which image you're on

## Contact form — Supabase table needed

The contact form saves messages to a `contact_messages` table.
Create it in Supabase SQL Editor:

```sql
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now(),
  is_read boolean default false
);
alter table contact_messages enable row level security;
-- Allow inserts from anyone (public contact form)
create policy "Anyone can submit contact" on contact_messages
  for insert with check (true);
-- Only admins can read
create policy "Service role reads contact" on contact_messages
  for select using (false);
```

## Copy paths
```
loadingfixes/app/globals.css                             → app/globals.css
loadingfixes/app/wishlist/page.tsx                       → app/wishlist/page.tsx
loadingfixes/app/contact/ContactClient.tsx               → app/contact/ContactClient.tsx
loadingfixes/app/product/[slug]/ProductDetailClient.tsx  → app/product/[slug]/
loadingfixes/components/product/ProductCard.tsx          → components/product/
```
