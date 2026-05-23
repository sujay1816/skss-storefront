import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import ProductDetailClient from './ProductDetailClient'
import { getSiteConfig, getCategories, getProductBySlug, getProductReviews, getRelatedProducts } from '@/lib/supabase/config'

// ISR — revalidate every 60s. generateStaticParams removed — pre-building all
// products at deploy time caused Vercel function timeouts (502) on large catalogues.
// ISR handles cold cache efficiently on first visit.
export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'
const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const [product, config] = await Promise.all([
      getProductBySlug(params.slug).catch(() => null),
      getSiteConfig().catch(() => ({} as any)),
    ])
    if (!product) return { title: 'Product Not Found' }

    const brandName = config.brand_name || BRAND_NAME
    const price = product.salePrice || product.originalPrice
    const primaryImage = product.images?.find((i: any) => i.isPrimary) || product.images?.[0]
    const imageUrl = primaryImage?.url || ''

    // Rich product description for SEO
    const descParts = [
      product.description || '',
      product.fabric ? `Made from ${product.fabric}.` : '',
      product.weaveType ? `${product.weaveType} weave.` : '',
      product.originRegion ? `From ${product.originRegion}.` : '',
      product.occasion?.length ? `Perfect for ${product.occasion.slice(0, 3).join(', ')}.` : '',
      `Price: ₹${price.toLocaleString('en-IN')}.`,
      'Free shipping available. Easy returns.',
    ].filter(Boolean).join(' ')

    const keywords = [
      product.name,
      product.fabric && `${product.fabric} saree`,
      product.weaveType && `${product.weaveType} saree`,
      product.originRegion && `${product.originRegion} saree`,
      ...(product.occasion || []).map((o: string) => `${o.toLowerCase()} saree`),
      'buy saree online',
      'Indian saree',
      brandName,
    ].filter(Boolean) as string[]

    return {
      title: `${product.name} — Buy Online at ₹${price.toLocaleString('en-IN')}`,
      description: descParts.slice(0, 160),
      keywords,
      alternates: { canonical: `${SITE_URL}/product/${params.slug}` },
      openGraph: {
        type: 'website',
        title: `${product.name} | ${brandName}`,
        description: descParts.slice(0, 160),
        url: `${SITE_URL}/product/${params.slug}`,
        siteName: brandName,
        images: [{
          url: imageUrl,
          width: 800,
          height: 1067,
          alt: product.name,
        }],
        locale: 'en_IN',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | ${brandName}`,
        description: descParts.slice(0, 160),
        images: [imageUrl],
      },
    }
  } catch {
    return { title: `${process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'} — Premium Silk Sarees` }
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [config, categories, product, user] = await Promise.all([
    getSiteConfig().catch(() => ({} as any)),
    getCategories().catch(() => []),
    getProductBySlug(params.slug).catch(() => null),
    Promise.resolve(null), // user loaded client-side
  ])
  if (!product) notFound()

  const [reviews, related] = await Promise.all([
    getProductReviews(product.id).catch(() => []),
    getRelatedProducts(product.categorySlug, params.slug).catch(() => []),
  ])

  const price = product.salePrice || product.originalPrice
  const primaryImage = product.images?.find((i: any) => i.isPrimary) || product.images?.[0]
  const inStock = (product.variants || []).some((v: any) => v.stock > 0)

  // Product Schema.org structured data
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: product.images?.map((i: any) => i.url) || [],
    sku: product.variants?.[0]?.sku || product.slug,
    brand: {
      '@type': 'Brand',
      name: config.brand_name || BRAND_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${params.slug}`,
      priceCurrency: 'INR',
      price: price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: config.brand_name || BRAND_NAME,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: price >= 1999 ? 0 : 99,
          currency: 'INR',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 5, unitCode: 'DAY' },
        },
      },
    },
    ...(reviews.length > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating || 4.5,
        reviewCount: product.reviewCount || reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
      review: reviews.slice(0, 5).map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.userFullName || 'Customer' },
        datePublished: r.createdAt?.split('T')[0],
        reviewBody: r.comment || '',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
      })),
    } : {}),
    ...(product.fabric ? {
      material: product.fabric,
    } : {}),
    ...(product.originRegion ? {
      countryOfOrigin: {
        '@type': 'Country',
        name: 'India',
      },
    } : {}),
  }

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}/product/${params.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Navbar categories={categories} config={config} user={user} />
      <ProductDetailClient product={product} reviews={reviews} relatedProducts={related} config={config} userId={user?.id} />
      <Footer config={config} categories={categories} />
      <WhatsAppButton number={config.whatsapp_number || ''} />
    </>
  )
}
