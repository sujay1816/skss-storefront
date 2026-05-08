import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import ShopClient from './ShopClient'
import { getSiteConfig, getCategories, getProducts } from '@/lib/supabase/config'
import { getUser } from '@/lib/supabase/get-user'
export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: { searchParams: any }): Promise<Metadata> {
  const config = await getSiteConfig().catch(() => ({} as any))
  const brandName = config.brand_name || 'RN Bros'
  const category = searchParams?.category
  const filter = searchParams?.filter
  const q = searchParams?.q

  let title = `Shop All Sarees`
  let desc = `Browse our complete collection of pure silk sarees, handloom weaves and traditional designs.`

  if (category) {
    title = `${category.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
    desc = `Shop ${title} at ${brandName}. Authentic handpicked collection with free shipping above ₹1,999.`
  } else if (filter === 'new') {
    title = 'New Arrivals'
    desc = `Discover our latest silk saree collection at ${brandName}. Fresh arrivals updated regularly.`
  } else if (filter === 'bestsellers') {
    title = 'Bestselling Sarees'
    desc = `Shop our most loved sarees at ${brandName}. Customer favorites with top ratings.`
  } else if (q) {
    title = `Search: ${q}`
    desc = `Search results for "${q}" at ${brandName}.`
  }

  return {
    title,
    description: desc,
    keywords: ['sarees online', 'buy sarees', 'silk sarees India', brandName, category || 'saree collection'],
    openGraph: {
      title: `${title} | ${brandName}`,
      description: desc,
      type: 'website',
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

  return (
    <>
      <Navbar categories={categories} config={config} user={user} />
      <ShopClient products={products} categories={categories} config={config} userId={user?.id} searchParams={searchParams} />
      <Footer config={config} categories={categories} />
      <WhatsAppButton number={config.whatsapp_number || ''} />
    </>
  )
}
