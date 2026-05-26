import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import BackToTop from '@/components/layout/BackToTop'
import HomepageClient from './HomepageClient'
import { getSiteConfig, getCategories, getProductsSimple, getBanners } from '@/lib/supabase/config'
// PERFORMANCE: ISR — revalidate every 60s instead of force-dynamic.
// Products, categories, config are shared across all visitors.
// User session is loaded client-side in Navbar (already has useEffect for this).
export const revalidate = 60

const DEFAULT_CONFIG = { brand_name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store', brand_tagline: 'Pure Silk. Timeless Tradition. Royal Elegance.', brand_subtitle: 'SILKS & SAREES', whatsapp_number: '', support_email: '', business_email: '', free_shipping_above: '1999', default_shipping_charge: '99', estimated_delivery_days: '5-7', return_window_days: '7', default_gst_rate: '5', cod_enabled: 'true', upi_enabled: 'true', razorpay_key_id: '', instagram_url: '', facebook_url: '', youtube_url: '', gstin: '', business_address: '', new_arrivals_days: '30', low_stock_threshold: '5' }

export default async function HomePage() {
  // Lazy import supabase to avoid breaking ISR
  const { createClient: _createSB } = await import('@/lib/supabase/server')
  const _sb = _createSB()
  const [config, categories, featured, bestsellers, newArrivals, banners, occasionsRes] = await Promise.all([
    getSiteConfig().catch(() => DEFAULT_CONFIG as any),
    getCategories().catch(() => []),
    getProductsSimple({ featured: true, limit: 4 }).catch(() => []),
    getProductsSimple({ bestseller: true, limit: 4 }).catch(() => []),
    getProductsSimple({ newArrivals: true, limit: 4 }).catch(() => []),
    getBanners().catch(() => []),
    _sb.from('occasions').select('id,name,slug,image_url,display_order').eq('is_active', true).order('display_order').limit(8).then(r => r.data || []),
  ])
  const occasionsData = occasionsRes
  // PERFORMANCE: user session loaded client-side in Navbar — no server DB call needed here
  const user = null
  const safeConfig = { ...DEFAULT_CONFIG, ...config }
  return (
    <>
      <Navbar categories={categories} config={safeConfig} user={user} />
      <HomepageClient config={safeConfig} categories={categories} featured={featured} bestsellers={bestsellers} newArrivals={newArrivals} banners={banners} userId={user?.id} />
      <Footer config={safeConfig} categories={categories} />
      <WhatsAppButton number={safeConfig.whatsapp_number} />
      <BackToTop />
    </>
  )
}
