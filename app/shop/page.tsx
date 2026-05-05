import { Suspense } from 'react'
import ShopContent from './ShopContent'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import { getSiteConfig, getCategories, getProducts } from '@/lib/supabase/config'
import { getUser } from '@/lib/supabase/get-user'
export const dynamic = 'force-dynamic'

export default async function ShopPage({ searchParams }: { searchParams: { category?: string; search?: string; filter?: string } }) {
  const [config, categories, user] = await Promise.all([
    getSiteConfig().catch(() => ({} as any)),
    getCategories().catch(() => []),
    getUser().catch(() => null),
  ])
  const products = await getProducts({
    categorySlug: searchParams.category,
    search: searchParams.search,
    featured: searchParams.filter === 'featured',
    bestseller: searchParams.filter === 'bestsellers',
  }).catch(() => [])

  return (
    <>
      <Navbar categories={categories} config={config} user={user} />
      <Suspense fallback={<div className="page-container py-20 text-center text-sm">Loading...</div>}>
        <ShopContent products={products} categories={categories} config={config} userId={user?.id} initialCategory={searchParams.category} initialSearch={searchParams.search} />
      </Suspense>
      <Footer config={config} categories={categories} />
      <WhatsAppButton number={config.whatsapp_number || ''} />
    </>
  )
}
