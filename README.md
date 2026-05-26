# Audit Fix Package — SKSS Storefront & Admin
Generated: May 2026

## How to apply these fixes

1. **Open this folder** alongside your cloned repositories
2. **For each file below**, copy it to the same relative path in the matching repo
3. **For DELETE instructions**, follow the `DELETE_THIS_FILE.md` guidance

---

## skss-storefront — Files to Replace

| File | Issue Fixed |
|------|-------------|
| `app/forgot-password/page.tsx` | H-6: Cooldown timer was declared but never ran. Added working 60s countdown to prevent email spam. |
| `app/shop/ShopContent.tsx` | H-3: Price filter text inputs accepted negative values. Added `min=0` clamping. |

---

## skss-admin — Files to Replace / Delete

| File | Issue Fixed |
|------|-------------|
| `app/api/save-stock/route.ts` | C-3: No validation on stock values — negative numbers or non-integers could corrupt inventory. Added full validation. |
| `app/orders/[id]/page.tsx` | H-5: No tracking ID validation when marking order as Shipped. Now requires ≥4 char AWB. |
| `middleware.ts` | H-8: Added prominent comment warning that in-memory rate limiter doesn't work on serverless — recommends Upstash Redis. |

### Files to DELETE (do not replace — just delete)

| File | Reason |
|------|--------|
| `app/orders/id/page.tsx` | C-1: Stale literal route conflicts with dynamic `[id]` route |
| `app/products/id/page.tsx` | C-1: Same conflict |

See `DELETE_THIS_FILE.md` in each directory for the git command to use.

---

## Full Audit Report

See `AUDIT_REPORT.md` for the complete list of all 37 issues found (Critical, High, Medium, Low).
