# skss-storefront — Complete Fix Package

All fixes from every batch combined into one zip.
TypeScript: 0 errors verified.

## Copy instructions — replace files at these exact paths

### Root
| File | What changed |
|------|-------------|
| `middleware.ts` | Redirects logged-in users away from /login and /signup; open redirect validation |
| `next.config.js` | Regex fix that was causing Vercel build errors |

### app/
| File | What changed |
|------|-------------|
| `app/page.tsx` | New Arrivals now uses `newArrivals:true` filter |
| `app/globals.css` | Mobile: newsletter stacks, lightbox pinch-zoom, announcement bar fix, skeleton shimmer |
| `app/login/page.tsx` | useSearchParams(); removed router.refresh() race condition; Suspense wrapper |
| `app/signup/page.tsx` | useSearchParams(); email confirmation screen; friendly errors; removed router.refresh() |
| `app/forgot-password/page.tsx` | Uses NEXT_PUBLIC_SITE_URL for reset link domain |
| `app/reset-password/page.tsx` | Confirm password field added |
| `app/cart/page.tsx` | getUser(); coupon min_order_value check; 44px touch targets on qty buttons |
| `app/checkout/page.tsx` | total capped at ₹0; address form grid-cols-1 on mobile |
| `app/orders/page.tsx` | getUser() instead of getSession() |
| `app/orders/[id]/page.tsx` | Redirect to /login?redirect=/orders/:id so user returns after login |
| `app/profile/page.tsx` | router.push() not window.location.href; redirect param; phone validation; safe back() |
| `app/wishlist/page.tsx` | Skeleton card grid replaces plain "Loading..." |
| `app/contact/ContactClient.tsx` | Full contact form with spinner and success state |
| `app/shop/ShopContent.tsx` | Mobile filter bottom drawer; responsive toolbar; smart pagination |
| `app/product/[slug]/ProductDetailClient.tsx` | Lightbox swipe+pinch zoom; image loading skeleton; thumbnail scroll |
| `app/auth/callback/route.ts` | Validates redirect param starts with / (prevents open redirect) |

### components/
| File | What changed |
|------|-------------|
| `components/layout/Navbar.tsx` | getUser() on mount; announcement-bar CSS class |
| `components/layout/Footer.tsx` | Social icons 44px touch targets |
| `components/layout/WhatsAppButton.tsx` | Raised to bottom:5rem on mobile to clear sticky bars |
| `components/product/ProductCard.tsx` | Image loading skeleton until loaded |
| `components/product/RecentlyViewed.tsx` | NEW FILE — recently viewed products using localStorage |

## Supabase SQL needed (run once)

### 1. Contact messages table
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
create policy "Anyone can submit" on contact_messages for insert with check (true);
```

### 2. Backfill profiles for existing users
```sql
insert into profiles (id, email, full_name, role, whatsapp_opted_in, created_at)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email,'@',1)),
  'customer',
  false,
  created_at
from auth.users
where id not in (select id from profiles);
```

## Key fix — why redirect was broken after login

`router.refresh()` was called immediately after `router.push(redirect)`.
This caused a race: refresh() re-ran the middleware server-side before the
auth cookie was fully written, so middleware still saw the user as logged out
and redirected them back to /login.

Fix: removed `router.refresh()` from both login and signup. The @supabase/ssr
browser client handles cookie propagation automatically.
