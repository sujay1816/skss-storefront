import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import BackToTop from '@/components/layout/BackToTop'
import { getProducts, type ProductFilters } from '@/lib/supabase/config'
import ShopContent from '../ShopContent'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60
export const dynamicParams = true

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'
const DEFAULT_FABRICS = ['Silk','Cotton','Georgette','Chiffon','Linen','Organza','Net','Crepe','Tussar','Chanderi']

// Direct DB helper — no React cache(), safe to call anywhere
async function getCategoryBySlug(slug: string) {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('categories').select('id, name, slug, image_url')
      .eq('slug', slug).eq('is_active', true).single()
    return data
  } catch { return null }
}

async function getAllCategories() {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('categories').select('id, name, slug, description, image_url, is_active, display_order')
      .eq('is_active', true).order('display_order')
    return (data || []).map((r: any) => ({
      id: r.id, name: r.name, slug: r.slug, description: r.description || '',
      imageUrl: r.image_url || '', isActive: r.is_active, displayOrder: r.display_order,
    }))
  } catch { return [] }
}

async function getSiteConfigDirect() {
  try {
    const supabase = createClient()
    const { data } = await supabase.from('site_config').select('key, value')
    const config: Record<string, string> = {}
    data?.forEach((r: any) => { config[r.key] = r.value })
    return config
  } catch { return {} as Record<string, string> }
}

async function getFabrics() {
  try {
    const supabase = createClient()
    const { data } = await supabase.from('site_config').select('value').eq('key', 'fabric_types').maybeSingle()
    if (data?.value) return JSON.parse(data.value) as string[]
  } catch {}
  return DEFAULT_FABRICS
}

export async function generateStaticParams() {
  try {
    const supabase = createClient()
    const { data } = await supabase.from('categories').select('slug').eq('is_active', true)
    return (data || []).map((c: any) => ({ category: c.slug }))
  } catch { return [] }
}

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  try {
    const [cat, config] = await Promise.all([
      getCategoryBySlug(params.category),
      getSiteConfigDirect(),
    ])
    if (!cat) return { title: 'Category Not Found' }
    const brandName = config.brand_name || process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'
    const title = `${cat.name} Sarees — Buy Online`
    const desc = `Shop authentic ${cat.name} sarees at ${brandName}. Handpicked collection with free shipping above ₹2,500. Easy 7-day returns.`
    const imageUrl = cat.image_url || `${SITE_URL}/images/logo.png`
    return {
      title,
      description: desc,
      keywords: [`${cat.name} saree`, `${cat.name} saree online`, `buy ${cat.name} saree`, 'sarees online India', brandName],
      alternates: { canonical: `${SITE_URL}/shop/${params.category}` },
      openGraph: {
        title: `${title} | ${brandName}`, description: desc,
        type: 'website', url: `${SITE_URL}/shop/${params.category}`,
        siteName: brandName, images: [{ url: imageUrl, width: 800, height: 600, alt: cat.name }],
        locale: 'en_IN',
      },
      twitter: { card: 'summary_large_image', title: `${title} | ${brandName}`, description: desc, images: [imageUrl] },
    }
  } catch { return { title: 'Shop Sarees' } }
}

export default async function CategoryPage({ params, searchParams }: { params: { category: string }; searchParams: any }) {
  // Each helper creates its own Supabase client — safe for parallel calls
  const [cat, categories, config, fabricsData] = await Promise.all([
    getCategoryBySlug(params.category),
    getAllCategories(),
    getSiteConfigDirect(),
    getFabrics(),
  ])

  if (!cat) notFound()

  const PAGE_SIZE = 16
  const currentPage = Math.max(1, parseInt(searchParams?.page || '1', 10))

  const filters: ProductFilters = {
    category:   params.category,
    fabrics:    searchParams?.fabrics ? String(searchParams.fabrics).split(',') : undefined,
    occasions:  searchParams?.occasions ? String(searchParams.occasions).split(',') : undefined,
    priceMin:   searchParams?.priceMin ? Number(searchParams.priceMin) : undefined,
    priceMax:   searchParams?.priceMax ? Number(searchParams.priceMax) : undefined,
    sortBy:     (searchParams?.sort as ProductFilters['sortBy']) || 'newest',
    limit:      PAGE_SIZE,
    offset:     (currentPage - 1) * PAGE_SIZE,
  }

  const { products, total: totalProducts } = await getProducts(filters).catch(() => ({ products: [], total: 0 }))
  const brandName = config.brand_name || process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'

  const itemListSchema = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: `${cat.name} Sarees`, url: `${SITE_URL}/shop/${params.category}`,
    numberOfItems: totalProducts,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/product/${p.slug}`, name: p.name,
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: cat.name, item: `${SITE_URL}/shop/${params.category}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Navbar categories={categories} config={config as any} user={null} />
      <ShopContent
        products={products}
        categories={categories}
        config={config as any}
        userId={undefined}
        initialCategory={params.category}
        fabrics={fabricsData}
        totalProducts={totalProducts}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        initialFilters={{
          fabrics: filters.fabrics || [],
          occasions: filters.occasions || [],
          priceMin: String(filters.priceMin || ''),
          priceMax: String(filters.priceMax || ''),
          onlyNew: false,
          sortBy: filters.sortBy || 'newest',
        }}
      />
      <Footer config={config as any} categories={categories} />
      <WhatsAppButton number={config.whatsapp_number || ''} />
      <BackToTop />
    </>
  )
}
