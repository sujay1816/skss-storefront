import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import BackToTop from '@/components/layout/BackToTop'
import HomepageClient from './HomepageClient'
import { getSiteConfig, getCategories, getProducts, getBanners } from '@/lib/supabase/config'
import { getUser } from '@/lib/supabase/get-user'
export const dynamic = 'force-dynamic'

const DEFAULT_CONFIG = { brand_name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store', brand_tagline: 'Pure Silk. Timeless Tradition. Royal Elegance.', brand_subtitle: 'SILKS & SAREES', whatsapp_number: '', support_email: '', business_email: '', free_shipping_above: '1999', default_shipping_charge: '99', estimated_delivery_days: '5-7', return_window_days: '7', default_gst_rate: '5', cod_enabled: 'true', upi_enabled: 'true', razorpay_key_id: '', instagram_url: '', facebook_url: '', youtube_url: '', gstin: '', business_address: '', new_arrivals_days: '30', low_stock_threshold: '5' }

export default async function HomePage() {
  const [config, categories, featured, bestsellers, newArrivals, banners, user] = await Promise.all([
    getSiteConfig().catch(() => DEFAULT_CONFIG as any),
    getCategories().catch(() => []),
    getProducts({ featured: true, limit: 4 }).catch(() => []),
    getProducts({ bestseller: true, limit: 4 }).catch(() => []),
    // FIX #1: was getProducts({ limit: 4 }) — fetched random products instead of new arrivals
    getProducts({ newArrivals: true, limit: 4 }).catch(() => []),
    getBanners().catch(() => []),
    getUser().catch(() => null),
  ])
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
