# skss-storefront — UI/UX Fixes

## Files to replace (copy into your repo at the same path)

| File | What changed |
|------|-------------|
| `app/product/[slug]/ProductDetailClient.tsx` | Image zoom on hover (desktop), RecentlyViewed section |
| `app/cart/page.tsx` | Low stock warnings per cart item |
| `app/checkout/page.tsx` | Saved address picker dropdown |
| `app/orders/[id]/page.tsx` | Order progress stepper (Confirmed → Shipped → Delivered) |
| `app/login/page.tsx` | Friendlier error messages + blocked account detection |
| `app/shop/ShopContent.tsx` | Price range sliders can't cross each other |
| `components/layout/WhatsAppButton.tsx` | Hidden on /checkout and /cart pages |
| `components/product/RecentlyViewed.tsx` | NEW FILE — add to components/product/ |

## Detail of each change

### ProductDetailClient.tsx
- **Image zoom**: hover over the main product image on desktop to zoom in at 2× centred on cursor position. Click still opens the lightbox.
- **Recently Viewed**: records this product to localStorage on mount. Shows a row of up to 6 recently viewed products at the bottom of the page (excluding the current one).

### cart/page.tsx
- Shows "⚠ Only N left in stock" when item.stock ≤ 3
- Shows "✕ Out of stock — please remove" if item.stock = 0
- Shows "Max quantity reached" when quantity equals stock

### checkout/page.tsx
- If the user has saved addresses, a dropdown appears at the top of the address form with all their saved addresses. Clicking one fills the form instantly.

### orders/[id]/page.tsx
- Three-step progress stepper: Confirmed → Shipped → Delivered with a crimson progress line connecting filled/unfilled nodes. Hidden for cancelled/return states.

### login/page.tsx
- "Invalid login credentials" → "Incorrect email or password. Please try again."
- "Email not confirmed" → "Please verify your email address before signing in."
- After login, checks if the account `is_blocked` in profiles table. If blocked, signs out and shows "Your account has been suspended. Please contact support."

### ShopContent.tsx
- Min slider is blocked from exceeding Max − ₹500
- Max slider is blocked from going below Min + ₹500

### WhatsAppButton.tsx
- Uses `usePathname()` to hide itself on `/checkout` and `/cart` pages so it doesn't distract during the payment flow.
