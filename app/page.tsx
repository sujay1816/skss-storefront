import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import HomepageClient from './HomepageClient'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DEFAULT_CONFIG = {
  brand_name: 'Sai Krishna Silks and Sarees',
  brand_tagline: 'Pure Silk. Timeless Tradition. Royal Elegance.',
  whatsapp_number: '+919999999999',
  support_email: 'support@skss.in',
  business_email: 'hello@skss.in',
  free_shipping_above: '1999',
  default_shipping_charge: '99',
  estimated_delivery_days: '5-7',
  return_window_days: '7',
  default_gst_rate: '5',
  cod_enabled: 'true',
  upi_enabled: 'true',
  razorpay_key_id: '',
  instagram_url: '',
  facebook_url: '',
  youtube_url: '',
  gstin: '',
  business_address: '',
  new_arrivals_days: '30',
  low_stock_threshold: '5',
}

export default async function HomePage() {
  try {
    const { getSiteConfig, getCategories, getProducts, getBanners } = await import('@/lib/supabase/config')
    const [config, categories, featured, bestsellers, newArrivals, banners] = await Promise.all([
      getSiteConfig().catch(() => DEFAULT_CONFIG),
      getCategories().catch(() => []),
      getProducts({ featured: true, limit: 4 }).catch(() => []),
      getProducts({ bestseller: true, limit: 4 }).catch(() => []),
      getProducts({ limit: 4 }).catch(() => []),
      getBanners().catch(() => []),
    ])

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

    const safeConfig = { ...DEFAULT_CONFIG, ...config }

    return (
      <>
        <Navbar categories={categories} config={safeConfig} />
        <HomepageClient config={safeConfig} categories={categories} featured={featured} bestsellers={bestsellers} newArrivals={newArrivals} banners={banners} userId={user?.id} />
        <Footer config={safeConfig} categories={categories} />
        <WhatsAppButton number={safeConfig.whatsapp_number} />
      </>
    )
  } catch (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'serif', background: '#FDFAF7' }}>
        <img src="/images/logo.png" alt="SKSS" style={{ width: 80, marginBottom: 24 }} />
        <h1 style={{ fontSize: 32, fontWeight: 300, color: '#8B1A2B', marginBottom: 8 }}>Sai Krishna Silks and Sarees</h1>
        <p style={{ color: '#5A4A3A', fontSize: 14 }}>Pure Silk. Timeless Tradition. Royal Elegance.</p>
        <p style={{ color: '#999', fontSize: 12, marginTop: 24 }}>Setting up... please refresh in a moment.</p>
      </div>
    )
  }
}
