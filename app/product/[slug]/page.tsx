import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import ProductDetailClient from './ProductDetailClient'
import { getSiteConfig, getCategories, getProductBySlug, getProductReviews, getRelatedProducts } from '@/lib/supabase/config'
import { getUser } from '@/lib/supabase/get-user'
export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [config, categories, product, user] = await Promise.all([
    getSiteConfig().catch(() => ({} as any)),
    getCategories().catch(() => []),
    getProductBySlug(params.slug).catch(() => null),
    getUser().catch(() => null),
  ])
  if (!product) notFound()
  const [reviews, related] = await Promise.all([
    getProductReviews(product.id).catch(() => []),
    getRelatedProducts(product.categorySlug, params.slug).catch(() => []),
  ])
  return (
    <>
      <Navbar categories={categories} config={config} user={user} />
      <ProductDetailClient product={product} reviews={reviews} relatedProducts={related} config={config} userId={user?.id} />
      <Footer config={config} categories={categories} />
      <WhatsAppButton number={config.whatsapp_number || ''} />
    </>
  )
}
