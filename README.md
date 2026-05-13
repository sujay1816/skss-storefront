# skss-storefront — Bug Fix Batch 3

## Files to replace

| File | Issues fixed |
|------|-------------|
| `app/page.tsx` | #1 — New Arrivals now uses `newArrivals: true` filter |
| `app/signup/page.tsx` | #2 — Shows email confirmation screen instead of redirecting; #7 — friendly error messages |
| `app/cart/page.tsx` | #3 — Coupon min order value validated; #4 — `getUser()` |
| `app/checkout/page.tsx` | #5 — Total capped at ₹0 with `Math.max(0, ...)` |
| `app/orders/page.tsx` | #4 — `getUser()` instead of `getSession()` |
| `app/profile/page.tsx` | #4 — `getUser()`; #9 — phone validation before save |
| `app/reset-password/page.tsx` | #6 — Added confirm password field with mismatch error |
| `components/layout/Navbar.tsx` | #10 — `getUser()` on mount |

Issue #11 (`/api/razorpay` dead route) intentionally left — safe to delete manually when ready.

## Copy paths

```
fixes2/app/page.tsx                        → app/page.tsx
fixes2/app/signup/page.tsx                 → app/signup/page.tsx
fixes2/app/cart/page.tsx                   → app/cart/page.tsx
fixes2/app/checkout/page.tsx               → app/checkout/page.tsx
fixes2/app/orders/page.tsx                 → app/orders/page.tsx
fixes2/app/profile/page.tsx                → app/profile/page.tsx
fixes2/app/reset-password/page.tsx         → app/reset-password/page.tsx
fixes2/components/layout/Navbar.tsx        → components/layout/Navbar.tsx
```
