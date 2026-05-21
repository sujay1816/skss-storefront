import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/shop`,             lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/about`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/faq`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    // E-E-A-T trust pages — Google uses these to evaluate site trustworthiness
    { url: `${SITE_URL}/policy`,           lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${SITE_URL}/privacy`,          lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${SITE_URL}/shipping`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/terms`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // Category pages — clean URLs /shop/[category] for independent ranking
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const { data: categories } = await supabase
      .from('categories').select('slug, updated_at').eq('is_active', true)
    if (categories) {
      categoryPages = categories.map(cat => ({
        url: `${SITE_URL}/shop/${cat.slug}`,
        lastModified: new Date(cat.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      }))
    }
  } catch {}

  // Product pages
  let productPages: MetadataRoute.Sitemap = []
  try {
    const { data: products } = await supabase
      .from('products').select('slug, updated_at').eq('is_active', true)
      .order('created_at', { ascending: false })
    if (products) {
      productPages = products.map(product => ({
        url: `${SITE_URL}/product/${product.slug}`,
        lastModified: new Date(product.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }))
    }
  } catch {}

  return [...staticPages, ...categoryPages, ...productPages]
}
