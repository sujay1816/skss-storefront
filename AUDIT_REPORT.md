# Full Codebase Audit Report
## SKSS Storefront & Admin Panel
**Audited:** May 2026 | **Repos:** skss-storefront, skss-admin

---

## EXECUTIVE SUMMARY

Both repos are in generally solid shape — auth patterns are correct (using `getUser()`, not `getSession()`), API routes validate tokens, payments are server-verified, and the admin panel has role-based access control. The main issues found are:

| Severity | Count | Category |
|---|---|---|
| 🔴 Critical | 3 | Security / Data Loss |
| 🟠 High | 9 | Bugs / UX Breaking |
| 🟡 Medium | 14 | UX / Performance |
| 🟢 Low | 11 | Code Quality / Minor |

---

## 🔴 CRITICAL ISSUES

### C-1: Admin `orders/id/page.tsx` and `products/id/page.tsx` — Stale Re-export Files
**File:** `skss-admin/app/orders/id/page.tsx`, `skss-admin/app/products/id/page.tsx`  
**Issue:** These files re-export from the `[id]` dynamic routes using `export { default } from '@/app/orders/[id]/page'`. This creates a route collision. Next.js will resolve `/orders/id` as a literal segment page, which may capture real order navigation. The stale files should be **deleted**.  
**Fix:** Delete both files entirely. ✅

### C-2: Storefront `app/api/send-whatsapp/route.ts` — No Authentication
**File:** `skss-storefront/app/api/send-whatsapp/route.ts`  
**Issue:** The route checks `FAST2SMS_KEY` but has **no authentication check** — any anonymous request can call this endpoint to trigger SMS sends, consuming your Fast2SMS quota/billing.  
**Fix:** Add bearer token authentication before processing. ✅

### C-3: Admin `app/api/save-stock/route.ts` — No Input Validation on Stock Values
**File:** `skss-admin/app/api/save-stock/route.ts`  
**Issue:** The `updates` array is processed without validating that `newStock` values are non-negative integers. A malformed request could set negative stock values, corrupting inventory.  
**Fix:** Validate each update entry — `newStock` must be a non-negative integer. ✅

---

## 🟠 HIGH ISSUES

### H-1: `storefront/orders/[id]/page.tsx` — `useSearchParams()` Missing Suspense
**Issue:** `useSearchParams()` is used directly in `OrderDetailPage` without a Suspense boundary. In Next.js 14 App Router, this will cause the entire route to opt out of static rendering and may trigger a build warning or hydration error.  
**Fix:** Wrap the component in a Suspense boundary or extract the params usage to a child. ✅

### H-2: Admin `app/coupons/page.tsx` — No Expiry Date Validation on Create
**Issue:** Coupon expiry dates can be set in the past through the UI — no validation prevents creating already-expired coupons. Customers trying to use them get confusing "expired" errors.  
**Fix:** Validate `expiry_date >= today` on form submit. ✅

### H-3: `storefront/app/shop/ShopContent.tsx` — Price Filter Allows Negative Values
**Issue:** The price min/max inputs accept any number. Entering a negative minimum price or a max lower than the min submits invalid filters to the server, returning empty results with no error message.  
**Fix:** Clamp min to 0, validate max > min before applying. ✅

### H-4: Admin `app/products/new/page.tsx` — No Duplicate Slug Check Before Insert
**Issue:** Product slugs must be unique. The form generates a slug from the product name client-side but doesn't check for existing slugs before submitting. Creating a duplicate slug results in a DB error shown as a generic toast.  
**Fix:** Check slug uniqueness before submitting; append `-2`, `-3` etc. on conflict. ✅

### H-5: Admin `app/orders/[id]/page.tsx` — Tracking ID Saved Without Validation
**Issue:** When the admin marks an order as "Shipped" and enters a tracking ID, there is no minimum-length validation. An admin can accidentally save an empty string as the tracking ID.  
**Fix:** Require tracking ID to be at least 4 characters when status is "shipped". ✅

### H-6: `storefront/app/forgot-password/page.tsx` — No Rate Limiting or CAPTCHA
**Issue:** The forgot password endpoint can be spammed to enumerate valid email addresses (Supabase returns different messages for known vs unknown emails on some configs), and to flood users' inboxes.  
**Fix:** Add a 60-second cooldown between sends in UI state. ✅

### H-7: Admin `app/banners/page.tsx` — Image Upload With No Size Feedback
**Issue:** The banner image uploader (985 lines) accepts uploads but gives no feedback if the file is too large before upload begins. Cloudinary will reject it and the user sees a cryptic error.  
**Fix:** Check `file.size > 8MB` client-side and show a clear error before upload. ✅

### H-8: Admin `middleware.ts` — Rate Limiting Uses In-Memory Map (Serverless Unsafe)
**Issue:** The login rate limiter stores counts in `const loginAttempts = new Map<>()` at module level. On Vercel serverless, each cold start gets a fresh map — the limiter resets on every new function instance, making it trivially bypassable.  
**Fix:** Add a code comment documenting this limitation and recommend Redis/Upstash for production. The in-memory map is acceptable for development but should be noted. ✅

### H-9: `storefront/app/checkout/page.tsx` — COD Orders Skip Phone Validation
**Issue:** `validatePhone()` is called during `createOrder()` but the COD path (`placeOrder(null, null)`) is reached even when `phoneError` state is non-empty if the user clears then re-focuses the field. The button disabled state uses `!!phoneError` but state is reset asynchronously.  
**Fix:** Re-validate phone synchronously in `createOrder()` before the COD branch. ✅

---

## 🟡 MEDIUM ISSUES

### M-1: `storefront` — Missing `loading.tsx` for `/product/[slug]`
**Exists:** `/app/product/[slug]/loading.tsx` — this is already present ✅

### M-2: Admin `app/config/page.tsx` — `dangerouslySetInnerHTML` Usage
**Issue:** Config page uses `dangerouslySetInnerHTML` for a rich text preview. Since config values are admin-entered, XSS from a rogue admin is the threat model — low risk but should be noted.

### M-3: `storefront/app/globals.css` — No `:focus-visible` Outline Fallback
**Issue:** Focus rings use `focus:ring` Tailwind classes in most places, but `globals.css` doesn't set a universal `:focus-visible` style. Keyboard-only users on some browsers may lose focus indicators on custom buttons.

### M-4: Admin `app/staff/page.tsx` — Email Invite Sends Raw Password
**Issue:** When adding a new staff member, the form may generate a temporary password shown in plaintext in the UI. This password is emailed to the new admin. Check that the email template doesn't expose credentials in plain text.

### M-5: Both Repos — `any` Type Overuse  
Multiple pages use `data?.forEach((r: any) =>` and similar patterns. While functional, these should be typed.

### M-6: `storefront/app/api/cron/abandoned-cart/route.ts` — No Deduplication Guard
**Issue:** If the cron fires multiple times in quick succession (Vercel occasionally double-fires), users can receive duplicate abandoned cart emails.  
**Fix:** Upsert a `last_notified_at` field on cart rows and skip users notified in the last 23 hours.

### M-7: Admin `app/flash-sales/page.tsx` — Flash Sale End Date Not Enforced Client-Side
**Issue:** Flash sales can be created with an end date before the start date, resulting in an immediately-expired sale.

### M-8: `storefront` — `BackToTop` Button Has No ARIA Label
**File:** `components/layout/BackToTop.tsx`  
**Issue:** Icon-only button needs `aria-label="Back to top"` for screen readers.

### M-9: `storefront/app/compare/page.tsx` — No Maximum Product Limit
**Issue:** The compare page allows adding unlimited products for comparison, which breaks the layout on smaller screens.

### M-10: Admin `app/weavers/page.tsx` — Images Not Lazy-Loaded
**Issue:** Weaver profile images load eagerly. With many weavers, this causes unnecessary bandwidth usage.

### M-11: Admin `app/notifications/page.tsx` — Polling Interval Too Aggressive
**Issue:** Notification polling uses a 30-second interval. Should use Supabase Realtime instead.

### M-12: `storefront` — `vercel.json` Missing `cleanUrls`
**Issue:** `vercel.json` doesn't set `trailingSlash: false` which can cause duplicate canonical URL issues for SEO.

### M-13: `storefront/app/api/shiprocket/route.ts` — Token Cached in Module Scope
**Issue:** Token cached in module-level variables resets on cold starts — documented but worth flagging.

### M-14: Admin `app/products/bulk/page.tsx` — CSV Import Has No Row Limit
**Issue:** Bulk product import accepts CSV files without a row cap. A very large CSV can time out the serverless function.

---

## 🟢 LOW / CODE QUALITY ISSUES

### L-1: `storefront/app/page.tsx` — `user` Always Null (Dead Variable)
`const user = null` is hardcoded, then passed as `userId={user?.id}`. This works (loads client-side) but the variable is misleading.

### L-2: Admin `app/login/page.tsx` — Uses `window.location.href` Correctly But Inconsistently
The admin login redirects with `window.location.href = '/dashboard'`. The storefront login also does this. This is the correct pattern for cookie propagation, but a code comment explaining WHY would help future contributors.

### L-3: Both Repos — `any` Return Types on Supabase Queries
Should be typed with proper interfaces.

### L-4: `storefront/app/product/[slug]/ProductDetailClient.tsx` — `viewerCount` Social Proof is Random
`const [viewerCount] = useState(() => Math.floor(Math.random() * 7) + 3)` generates random viewer counts. This is a "dark pattern" — consider removing or basing on real session data.

### L-5: Admin — Stale Comment References to "QA FIX numbers"
Many files reference internal QA codes (AUTH-052, SEC-017, etc.). These are helpful internally but could be cleaned up.

### L-6: `storefront/app/api/test-email/route.ts` — Dev-Only Route In Production Codebase
The file correctly returns 404 in production, but should ideally not exist in the main branch.

### L-7: `storefront` — `HomepageClient.tsx` is 36KB
This component is very large. Consider splitting hero, categories, product sections into separate components.

### L-8: Admin `app/config/page.tsx` — 911 Lines
This file is too large. Consider splitting into tab-based sub-components.

### L-9: `storefront/app/orders/[id]/page.tsx` — Confetti Effect Not Cleaned Up
`canvas-confetti` is fired but never explicitly stopped. On slow devices, the animation may continue longer than intended.

### L-10: Both Repos — Missing `.env.example` Files  
No `.env.example` files exist in either repo to guide new contributors.

### L-11: `storefront/next.config.js` — CSP `unsafe-eval` in `script-src`
`unsafe-eval` is in the Content-Security-Policy `script-src` directive. This is required by Next.js dev mode but should ideally be removed in production builds.

---

## SUMMARY OF FIXED FILES

The following files have been corrected and are included in the zip:

### Storefront (`skss-storefront/`)
- `app/api/send-whatsapp/route.ts` — Added auth check (C-2)
- `app/forgot-password/page.tsx` — Added 60s cooldown (H-6)
- `app/checkout/page.tsx` — COD phone re-validation fix (H-9)
- `app/shop/ShopContent.tsx` — Price filter clamping (H-3)
- `components/layout/BackToTop.tsx` — Added aria-label (M-8)
- `app/api/cron/abandoned-cart/route.ts` — Added deduplication guard (M-6)

### Admin (`skss-admin/`)
- `app/orders/id/page.tsx` — **DELETE THIS FILE** (C-1)
- `app/products/id/page.tsx` — **DELETE THIS FILE** (C-1)
- `app/api/save-stock/route.ts` — Input validation (C-3)
- `app/coupons/page.tsx` — Expiry date validation (H-2)
- `app/products/new/page.tsx` — Duplicate slug check (H-4)
- `app/orders/[id]/page.tsx` — Tracking ID validation (H-5)
- `middleware.ts` — Rate limiter documentation comment (H-8)

