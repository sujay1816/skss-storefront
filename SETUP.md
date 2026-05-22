# SKSS — Complete Setup Guide

Full first-time setup guide for **R Narayana and Bros** — Silks & Sarees store.  
Two Vercel projects: `skss-storefront` (customer-facing) and `skss-admin` (admin panel).

---

## Overview — Setup Order

Follow these steps **in order**. Each step depends on the one before it.

```
1. Supabase  →  2. Cloudinary  →  3. Razorpay  →  4. Resend  →  5. Shiprocket
     ↓
6. Vercel (deploy both projects)
     ↓
7. Admin Config (fill in all keys)
     ↓
8. Test the full order flow
```

---

## Step 1 — Supabase

**Where to get keys:** https://supabase.com/dashboard → your project → Settings → API

| Key | Where used |
|-----|-----------|
| Project URL | Both repos |
| Anon/Public Key | Both repos |
| Service Role Key | Both repos (server-side only) |

### 1a — Create all database tables

Run this SQL in Supabase → SQL Editor:

```sql
-- Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text, phone text, avatar_url text,
  role text default 'customer',
  is_blocked boolean default false,
  whatsapp_opted_in boolean default true,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Service role full access" on profiles using (true);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), 'customer');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null,
  description text, image_url text, is_active boolean default true,
  display_order int default 0, created_at timestamptz default now()
);
alter table categories enable row level security;
create policy "Public read" on categories for select using (true);
create policy "Service role write" on categories for all using (true);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null,
  description text, fabric text, weave_type text, origin_region text,
  occasion text[], care_instructions text, blouse_included boolean default false,
  length numeric default 5.5, weight_grams int,
  category_id uuid references categories(id),
  original_price numeric not null, sale_price numeric,
  discount_percent numeric, gst_rate numeric default 5,
  is_featured boolean default false, is_bestseller boolean default false,
  is_active boolean default true, video_url text,
  average_rating numeric default 0, review_count int default 0,
  custom_fields jsonb default '{}',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table products enable row level security;
create policy "Public read active" on products for select using (is_active = true);
create policy "Service role write" on products for all using (true);

-- Product images
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  url text not null, public_id text, alt_text text,
  is_primary boolean default false, order_index int default 0
);
alter table product_images enable row level security;
create policy "Public read" on product_images for select using (true);
create policy "Service role write" on product_images for all using (true);

-- Product variants (colours + stock)
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  colour text not null, colour_hex text default '#8B1A2B',
  stock int default 0, sku text, image_url text
);
alter table product_variants enable row level security;
create policy "Public read" on product_variants for select using (true);
create policy "Service role write" on product_variants for all using (true);

-- Carts
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid, product_name text, product_slug text, product_image text,
  colour text, colour_hex text, original_price numeric, sale_price numeric,
  quantity int default 1, stock int default 0, gst_rate numeric default 5,
  created_at timestamptz default now(),
  unique(user_id, product_id, colour)
);
alter table carts enable row level security;
create policy "Users manage own cart" on carts for all using (auth.uid() = user_id);
create policy "Service role write" on carts for all using (true);

-- Addresses
create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  full_name text, phone text, address_line1 text, address_line2 text,
  city text, state text, pincode text, is_default boolean default false,
  created_at timestamptz default now()
);
alter table addresses enable row level security;
create policy "Users manage own addresses" on addresses for all using (auth.uid() = user_id);
create policy "Service role write" on addresses for all using (true);

-- Wishlists
create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);
alter table wishlists enable row level security;
create policy "Users manage own wishlist" on wishlists for all using (auth.uid() = user_id);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  user_id uuid references profiles(id),
  status text default 'confirmed',
  payment_status text default 'pending',
  payment_method text, razorpay_order_id text, razorpay_payment_id text,
  coupon_code text, coupon_discount numeric default 0,
  subtotal numeric, shipping_charge numeric default 0,
  total_gst numeric default 0, total_amount numeric,
  address_snapshot jsonb,
  shiprocket_order_id text, tracking_id text, courier_name text,
  estimated_delivery text, return_reason text, return_image_url text,
  notes text, whatsapp_sent boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table orders enable row level security;
create policy "Users read own orders" on orders for select using (auth.uid() = user_id);
create policy "Service role full access" on orders for all using (true);

-- Order items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid, product_name text, product_image text,
  colour text, quantity int, original_price numeric, sale_price numeric,
  gst_rate numeric, gst_amount numeric, total numeric
);
alter table order_items enable row level security;
create policy "Users read own order items" on order_items for select
  using (exists (select 1 from orders where orders.id = order_id and orders.user_id = auth.uid()));
create policy "Service role full access" on order_items for all using (true);

-- Coupons
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, type text not null,
  value numeric default 0, min_order_value numeric default 0,
  max_usage_count int default 100, usage_count int default 0,
  per_user_limit int default 1, expiry_date timestamptz,
  is_active boolean default true, created_at timestamptz default now()
);
alter table coupons enable row level security;
create policy "Public read active" on coupons for select using (is_active = true);
create policy "Service role write" on coupons for all using (true);

-- Reviews
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  user_id uuid references profiles(id),
  rating int check (rating between 1 and 5),
  comment text, is_approved boolean default false,
  is_verified_purchase boolean default false,
  created_at timestamptz default now(),
  unique(product_id, user_id)
);
alter table reviews enable row level security;
create policy "Public read approved" on reviews for select using (is_approved = true);
create policy "Users insert own review" on reviews for insert with check (auth.uid() = user_id);
create policy "Service role full access" on reviews for all using (true);

-- Banners
create table banners (
  id uuid primary key default gen_random_uuid(),
  display_order int default 0, is_active boolean default true,
  overlay_style text default 'dark', text_color text default 'white',
  image_url text, image_focus text default 'center',
  video_url text, video_urls text, slides jsonb,
  heading text, heading_italic text, subheading text,
  badge_text text, cta_label text default 'Shop Now',
  cta_url text default '/shop', cta_secondary_label text, cta_secondary_url text,
  created_at timestamptz default now()
);
alter table banners enable row level security;
create policy "Public read active" on banners for select using (is_active = true);
create policy "Service role write" on banners for all using (true);

-- Site config (all admin settings live here)
create table site_config (
  key text primary key, value text,
  updated_at timestamptz default now()
);
alter table site_config enable row level security;
create policy "Public read" on site_config for select using (true);
create policy "Service role write" on site_config for all using (true);

-- Admin notifications
create table admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text, title text, message text,
  is_read boolean default false, created_at timestamptz default now()
);
alter table admin_notifications enable row level security;
create policy "Service role full access" on admin_notifications for all using (true);

-- Contact messages
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, message text not null,
  is_read boolean default false, created_at timestamptz default now()
);
alter table contact_messages enable row level security;
create policy "Anyone can submit" on contact_messages for insert with check (true);
create policy "Service role read" on contact_messages for select using (true);

-- Newsletter subscribers
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null, subscribed_at timestamptz default now()
);
alter table newsletter_subscribers enable row level security;
create policy "Anyone can subscribe" on newsletter_subscribers for insert with check (true);
create policy "Service role read" on newsletter_subscribers for select using (true);

-- Restock requests
create table restock_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  colour text, email text, user_id uuid,
  created_at timestamptz default now(),
  unique(product_id, colour, email)
);
alter table restock_requests enable row level security;
create policy "Anyone can request" on restock_requests for insert with check (true);
create policy "Service role read" on restock_requests for all using (true);

-- Audit logs
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text, table_name text, record_id text,
  user_id uuid, details jsonb, created_at timestamptz default now()
);
alter table audit_logs enable row level security;
create policy "Service role full access" on audit_logs for all using (true);
```

### 1b — Create required RPC functions

```sql
-- Atomic order placement (checks stock + creates order in one transaction)
create or replace function place_order_atomic(
  p_user_id uuid, p_order_number text, p_status text, p_payment_status text,
  p_payment_method text, p_razorpay_order_id text, p_razorpay_payment_id text,
  p_subtotal numeric, p_shipping_charge numeric, p_total_gst numeric, p_total_amount numeric,
  p_coupon_code text, p_coupon_discount numeric, p_address_snapshot jsonb, p_items jsonb
) returns uuid language plpgsql as $$
declare
  v_order_id uuid; v_item jsonb; v_stock int;
begin
  -- Check stock for all items first
  for v_item in select * from jsonb_array_elements(p_items) loop
    select stock into v_stock from product_variants
      where product_id = (v_item->>'product_id')::uuid and colour = v_item->>'colour';
    if v_stock is null or v_stock < (v_item->>'quantity')::int then
      raise exception 'Out of stock: % (%)', v_item->>'product_name', v_item->>'colour';
    end if;
  end loop;
  -- Create order
  insert into orders (user_id, order_number, status, payment_status, payment_method,
    razorpay_order_id, razorpay_payment_id, subtotal, shipping_charge, total_gst, total_amount,
    coupon_code, coupon_discount, address_snapshot, created_at, updated_at)
  values (p_user_id, p_order_number, p_status, p_payment_status, p_payment_method,
    p_razorpay_order_id, p_razorpay_payment_id, p_subtotal, p_shipping_charge, p_total_gst, p_total_amount,
    p_coupon_code, p_coupon_discount, p_address_snapshot, now(), now())
  returning id into v_order_id;
  -- Insert order items and deduct stock
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (order_id, product_id, product_name, product_image, colour, quantity,
      original_price, sale_price, gst_rate, gst_amount, total)
    values (v_order_id, (v_item->>'product_id')::uuid, v_item->>'product_name', v_item->>'product_image',
      v_item->>'colour', (v_item->>'quantity')::int, (v_item->>'original_price')::numeric,
      (v_item->>'sale_price')::numeric, (v_item->>'gst_rate')::numeric,
      (v_item->>'gst_amount')::numeric, (v_item->>'total')::numeric);
    update product_variants set stock = stock - (v_item->>'quantity')::int
      where product_id = (v_item->>'product_id')::uuid and colour = v_item->>'colour';
  end loop;
  return v_order_id;
end;
$$;

-- Deduct stock (used by update-stock API on cancellation restore reversal)
create or replace function deduct_stock(p_product_id uuid, p_colour text, p_quantity int)
returns void language plpgsql as $$
begin
  update product_variants set stock = greatest(0, stock - p_quantity)
    where product_id = p_product_id and colour = p_colour;
end;
$$;

-- Restore stock (used on order cancellation and return approval)
create or replace function restore_stock(p_product_id uuid, p_colour text, p_quantity int)
returns void language plpgsql as $$
begin
  update product_variants set stock = stock + p_quantity
    where product_id = p_product_id and colour = p_colour;
end;
$$;

-- Increment coupon usage count
create or replace function increment_coupon_usage(coupon_code text)
returns void language plpgsql as $$
begin
  update coupons set usage_count = usage_count + 1 where code = coupon_code;
end;
$$;

-- Get total revenue (used on admin dashboard)
create or replace function get_total_revenue()
returns table(sum numeric) language sql as $$
  select coalesce(sum(total_amount), 0) as sum
  from orders where payment_status = 'paid' and status != 'cancelled';
$$;

-- Set default address
create or replace function set_default_address(p_address_id uuid, p_user_id uuid)
returns void language plpgsql as $$
begin
  update addresses set is_default = false where user_id = p_user_id;
  update addresses set is_default = true where id = p_address_id and user_id = p_user_id;
end;
$$;
```

### 1c — Create superadmin account

1. Go to Supabase → Authentication → Users → Add User
2. Enter your email and a strong password
3. Run this SQL to give it superadmin role:

```sql
update profiles set role = 'superadmin' where email = 'your@email.com';
```

---

## Step 2 — Cloudinary

**Where:** https://cloudinary.com → free account (25GB storage)

**Keys to copy:**
- Cloud Name (on dashboard homepage)
- API Key
- API Secret

**Create two upload presets** (Settings → Upload → Add upload preset):

| Preset name | Signing mode | Folder |
|-------------|-------------|--------|
| `skss_products` | Unsigned | `skss/products` |
| `skss_banners` | Unsigned | `skss/banners` |

---

## Step 3 — Razorpay

**Where:** https://dashboard.razorpay.com → Settings → API Keys

Use **Test keys** (`rzp_test_...`) while testing, switch to Live keys before going live.

**Keys to copy:**
- Key ID (starts with `rzp_test_` or `rzp_live_`)
- Key Secret

---

## Step 4 — Resend (Email)

**Where:** https://resend.com → free account

1. Add and verify your domain (e.g. `rnb.com`)
2. Create an API key (API Keys → Create API Key)
3. Note the From email address you'll send from (e.g. `orders@rnb.com`)

**Keys to copy:**
- API Key (starts with `re_`)
- From Email (`orders@yourdomain.com`)
- Admin Email (where you want new order alerts sent)

---

## Step 5 — Shiprocket

**Where:** https://app.shiprocket.in → Settings → Additional Settings → API Users

1. Click **+ Add New API User**
2. Use a dedicated email (e.g. `api@rnb.com`) — **not your main login**
3. Copy the password shown — **it is only shown once**

**Keys to copy:**
- API Email
- API Password

---

## Step 6 — Deploy to Vercel

Deploy **both** projects separately.

### 6a — Environment variables for skss-storefront

Go to Vercel → skss-storefront → Settings → Environment Variables. Add:

| Variable | Value | Where to find |
|----------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase → Settings → API |
| `NEXT_PUBLIC_SITE_URL` | `https://skss-storefront.vercel.app` | Your Vercel domain |
| `NEXT_PUBLIC_BRAND_NAME` | `R Narayana and Bros` | Your choice |
| `NEXT_PUBLIC_BRAND_SHORT_NAME` | `RNB` | Used as order number prefix |

> Everything else (Razorpay, Resend, Shiprocket) is stored in the Admin Config DB and does not need to be set in Vercel.

### 6b — Environment variables for skss-admin

| Variable | Value | Where to find |
|----------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase → Settings → API |

### 6c — Redeploy both projects

After adding env vars, click **Redeploy** on both projects.

---

## Step 7 — Admin Config (fill in all keys)

Go to `skss-admin.vercel.app` → login with your superadmin account → **Config** → **Setup & Integrations**.

Fill in **each section in order** and click **Test Connection** after each one:

### Supabase
| Field | Value |
|-------|-------|
| Supabase Project URL | `https://xxxx.supabase.co` |
| Supabase Anon Key | `eyJhbGci...` (public key) |
| Supabase Service Role Key | `eyJhbGci...` (keep this secret) |

### Razorpay
| Field | Value |
|-------|-------|
| Razorpay Key ID | `rzp_test_xxxx` (test) or `rzp_live_xxxx` (live) |
| Razorpay Key Secret | From Razorpay dashboard |

Click **Test Connection** — should show ✓

### Resend
| Field | Value |
|-------|-------|
| Resend API Key | `re_xxxx` |
| From Email | `orders@yourdomain.com` |
| Admin Notification Email | `you@yourdomain.com` |

Click **Test Connection** — should show ✓

### Cloudinary
| Field | Value |
|-------|-------|
| Cloud Name | From Cloudinary dashboard |
| API Key | From Cloudinary dashboard |
| API Secret | From Cloudinary dashboard |

Click **Test Connection** — should show ✓

### Shiprocket
| Field | Value |
|-------|-------|
| Shiprocket API Email | The API user email you created |
| Shiprocket API Password | The password shown on creation |

Click **Test Connection** — should show ✓

### Site URLs
| Field | Value |
|-------|-------|
| Storefront URL | `https://skss-storefront.vercel.app` |
| Admin Panel URL | `https://skss-admin.vercel.app` |
| Internal API Secret | Any random 32-char string — generate at `generate-secret.vercel.app/32` |

Click **Save All Changes**.

---

## Step 8 — Brand & Store Settings

In Admin Config → **Brand & Design** tab:
- Upload your logo
- Set brand colours (primary crimson, accent gold)
- Set heading and body fonts

In Admin Config → **Store Settings** tab:
- Free shipping threshold (e.g. ₹1999)
- Default shipping charge (e.g. ₹99)
- Estimated delivery days (e.g. `5-7`)
- Return window days (e.g. `7`)
- Default GST rate (e.g. `5`)
- Low stock alert threshold (e.g. `5`)
- Your GSTIN
- WhatsApp number (with country code, e.g. `+919876543210`)
- Support email
- Social media URLs

---

## Step 9 — Shiprocket Pickup Pincode

Open `skss-storefront/app/api/shiprocket/route.ts` and update the pickup pincode to your warehouse/shop location:

```ts
// Change 500001 to your actual shop pincode
pickup_postcode=500001
```

Commit and push to redeploy.

---

## Step 10 — Test the Full Order Flow

1. **Add a product** — Admin → Products → New Product (add stock > 0)
2. **Place a COD order** — Go to storefront → add to cart → checkout → COD
3. **Verify stock reduced** — Admin → Stock → check the variant dropped
4. **Mark as Shipped** — Admin → Orders → open order → change status → add tracking number
5. **Test online payment** — Use Razorpay test card `4111 1111 1111 1111`, any future expiry, any CVV
6. **Test cancellation** — Place another order → cancel from storefront → verify stock restored
7. **Test return** — Mark a delivered order as return requested → Admin → Returns → Approve → verify stock restored

---

## Quick Reference — Where Each Key Comes From

| Key | Source URL | Notes |
|-----|-----------|-------|
| Supabase URL + Keys | supabase.com/dashboard → Settings → API | All 3 keys required |
| Cloudinary Cloud Name | console.cloudinary.com | On dashboard homepage |
| Cloudinary API Key + Secret | console.cloudinary.com → Settings → API Keys | Create upload presets too |
| Razorpay Key ID + Secret | dashboard.razorpay.com → Settings → API Keys | Use test keys first |
| Resend API Key | resend.com → API Keys | Verify your domain first |
| Shiprocket Email + Password | app.shiprocket.in → Settings → API Users | Use dedicated API user |
| Internal API Secret | Generate yourself | Use generate-secret.vercel.app/32 |
| Vercel domains | vercel.com → your project | After first deploy |

---

## Troubleshooting

**Test Connection fails for any integration**  
→ The button calls a server-side route — if you see a network error, check that the admin panel is fully deployed and the Supabase keys are set in Vercel.

**Orders not appearing in admin**  
→ Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly in Vercel for the storefront.

**Stock not restoring on cancellation**  
→ Make sure `setup_site_url` and `setup_internal_api_secret` are both filled in Admin Config → Site URLs. They must match between admin and storefront.

**Emails not sending**  
→ Verify your domain in Resend. The From email must be from a verified domain.

**Shiprocket pincode check always shows "delivery available"**  
→ Your Shiprocket credentials may be wrong. Test them in Admin Config → Test Connection. Also update the pickup pincode in `app/api/shiprocket/route.ts`.

**Payment showing as pending for COD orders**  
→ This is correct — COD orders start as `payment_status: pending` and only change to `paid` after delivery.
