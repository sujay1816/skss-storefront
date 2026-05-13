# skss-storefront — Mobile UI/UX Fixes

## Files changed

| File | Issues fixed |
|------|-------------|
| `app/globals.css` | #2 Newsletter stacks on mobile; #11 Announcement bar letter-spacing reduced |
| `app/shop/ShopContent.tsx` | #1 Mobile filter bottom drawer; #4 Responsive toolbar; #7 Smart pagination |
| `app/cart/page.tsx` | #3 Qty buttons 44px touch target on mobile |
| `app/checkout/page.tsx` | #5 Address form full-width on mobile (grid-cols-1 → sm:grid-cols-2) |
| `app/product/[slug]/ProductDetailClient.tsx` | #8 Colour swatches 44px on mobile; #9 Thumbnail horizontal scroll; Zoom hint on mobile |
| `app/orders/[id]/page.tsx` | #12 Stepper connector % margins (works on 320px) |
| `components/layout/Footer.tsx` | #6 Social icons 44px touch target |
| `components/layout/Navbar.tsx` | #11 Added announcement-bar CSS class |
| `components/layout/WhatsAppButton.tsx` | #10 Raised to bottom:5rem on mobile, clears sticky bars |

## Re: zoom on mobile
Hover-zoom (mouse-track magnification) only works on desktop — touch screens don't fire mouseEnter/mouseMove. On mobile, **tapping the product image opens the full-screen lightbox** which serves as the zoom equivalent. A "Tap image to zoom" hint is now shown below the thumbnails on mobile only.

## Copy paths
```
mobilefixes/app/globals.css                              → app/globals.css
mobilefixes/app/shop/ShopContent.tsx                     → app/shop/ShopContent.tsx
mobilefixes/app/cart/page.tsx                            → app/cart/page.tsx
mobilefixes/app/checkout/page.tsx                        → app/checkout/page.tsx
mobilefixes/app/product/[slug]/ProductDetailClient.tsx   → app/product/[slug]/
mobilefixes/app/orders/[id]/page.tsx                     → app/orders/[id]/
mobilefixes/components/layout/Footer.tsx                 → components/layout/
mobilefixes/components/layout/Navbar.tsx                 → components/layout/
mobilefixes/components/layout/WhatsAppButton.tsx         → components/layout/
```
