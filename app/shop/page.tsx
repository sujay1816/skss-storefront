import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import { getSiteConfig, getCategories, getProducts } from '@/lib/supabase/config'
import { getUser } from '@/lib/supabase/get-user'
import ShopContent from './ShopContent'
import BackToTop from '@/components/layout/BackToTop'
export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'

export async function generateMetadata({ searchParams }: { searchParams: any }): Promise<Metadata> {
  const config = await getSiteConfig().catch(() => ({} as any))
  const brandName = config.brand_name || 'Sai Krishna Silks & Sarees'
  const category = searchParams?.category
  const filter = searchParams?.filter
  const q = searchParams?.q

  let title = 'Shop All Sarees'
  let desc = `Browse our complete collection of pure silk sarees, handloom weaves and traditional designs at ${brandName}. Free shipping above ₹1,999.`

  if (category) {
    const catName = category.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    title = `${catName} — Buy Online`
    desc = `Shop authentic ${catName} at ${brandName}. Handpicked collection with free shipping above ₹1,999. Easy returns.`
  } else if (filter === 'new') {
    title = 'New Arrivals — Latest Silk Sarees'
    desc = `Discover our latest silk saree collection at ${brandName}. Fresh arrivals updated regularly. Shop Kanjivaram, Banarasi and more.`
  } else if (filter === 'bestsellers') {
    title = 'Bestselling Sarees — Most Loved'
    desc = `Shop our most loved sarees at ${brandName}. Top-rated by thousands of customers. Authentic silk guaranteed.`
  } else if (filter === 'featured') {
    title = 'Featured Collection — Curated Sarees'
    desc = `Explore our curated featured saree collection at ${brandName}. Handpicked finest silk sarees for every occasion.`
  } else if (q) {
    title = `"${q}" — Search Results`
    desc = `Search results for "${q}" at ${brandName}. Find your perfect saree from our authentic collection.`
  }

  return {
    title,
    description: desc,
    keywords: [
      'sarees online India', 'buy silk sarees', 'kanjivaram saree online',
      'banarasi silk saree', 'bridal sarees', 'handloom sarees',
      brandName, category || 'saree collection',
    ],
    alternates: { canonical: `${SITE_URL}/shop${category ? `?category=${category}` : ''}` },
    openGraph: {
      title: `${title} | ${brandName}`,
      description: desc,
      type: 'website',
      url: `${SITE_URL}/shop`,
      siteName: brandName,
    },
    twitter: {
      card: 'summary',
      title: `${title} | ${brandName}`,
      description: desc,
    },
  }
}

export default async function ShopPage({ searchParams }: { searchParams: any }) {
  const [config, categories, user] = await Promise.all([
    getSiteConfig().catch(() => ({} as any)),
    getCategories().catch(() => []),
    getUser().catch(() => null),
  ])

  const products = await getProducts({
    category: searchParams?.category,
    featured: searchParams?.filter === 'featured',
    bestseller: searchParams?.filter === 'bestsellers',
    newArrivals: searchParams?.filter === 'new',
    search: searchParams?.q,
    limit: 48,
  }).catch(() => [])

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
    ],
  }

  // CollectionPage schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${config.brand_name || 'Sai Krishna Silks & Sarees'} — Saree Collection`,
    description: 'Premium silk sarees collection',
    url: `${SITE_URL}/shop`,
    numberOfItems: products.length,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <Navbar categories={categories} config={config} user={user} />
      <ShopContent
        products={products}
        categories={categories}
        config={config}
        userId={user?.id}
        initialCategory={searchParams?.category}
        initialSearch={searchParams?.q}
      />
      <Footer config={config} categories={categories} />
      <WhatsAppButton number={config.whatsapp_number || ''} />
    </>
  )
}
