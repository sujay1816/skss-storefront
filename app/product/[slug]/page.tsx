import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import ProductDetailClient from './ProductDetailClient'
import { getSiteConfig, getCategories, getProductBySlug, getProductReviews, getRelatedProducts } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [config, categories, product] = await Promise.all([getSiteConfig(), getCategories(), getProductBySlug(params.slug)])
  if (!product) notFound()
  const [reviews, related] = await Promise.all([getProductReviews(product.id), getRelatedProducts(product.categorySlug, params.slug)])
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <>
      <Navbar categories={categories} config={config} />
      <ProductDetailClient product={product} reviews={reviews} relatedProducts={related} config={config} userId={user?.id} />
      <Footer config={config} categories={categories} />
      <WhatsAppButton number={config.whatsapp_number} />
    </>
  )
}
