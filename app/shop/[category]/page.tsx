import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import BackToTop from '@/components/layout/BackToTop'
import ShopContent from '../ShopContent'
import { createClient } from '@/lib/supabase/server'
import type { Product, ProductVariant, ProductImage } from '@/types'

// Force dynamic — skip static generation entirely for category pages.
// generateStaticParams + parallel DB queries caused Vercel 502 timeouts.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'
const DEFAULT_FABRICS = ['Silk','Cotton','Georgette','Chiffon','Linen','Organza','Net','Crepe','Tussar','Chanderi']

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  try {
    const supabase = createClient()
    const { data: cat } = await supabase
      .from('categories').select('name, image_url').eq('slug', params.category).single()
    if (!cat) return { title: 'Shop Sarees' }
    const { data: cfg } = await supabase
      .from('site_config').select('value').eq('key', 'brand_name').single()
    const brandName = cfg?.value || process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'
    const title = `${cat.name} Sarees — Buy Online`
    const desc = `Shop authentic ${cat.name} sarees at ${brandName}. Free shipping above ₹2,500. Easy returns.`
    return {
      title,
      description: desc,
      alternates: { canonical: `${SITE_URL}/shop/${params.category}` },
      openGraph: {
        title: `${title} | ${brandName}`, description: desc,
        type: 'website', url: `${SITE_URL}/shop/${params.category}`,
        images: [{ url: cat.image_url || '', width: 800, height: 600 }],
      },
    }
  } catch { return { title: 'Shop Sarees' } }
}

function mapProduct(r: any): Product {
  const variants: ProductVariant[] = (r.product_variants || []).map((v: any) => ({
    id: v.id, colour: v.colour, colourHex: v.colour_hex, stock: v.stock, sku: v.sku || '',
  }))
  const images: ProductImage[] = (r.product_images || [])
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((i: any) => ({ id: i.id, url: i.url, publicId: i.public_id || '', altText: i.alt_text || '', isPrimary: i.is_primary, order: i.order_index }))
  const totalStock = variants.reduce((s, v) => s + v.stock, 0)
  return {
    id: r.id, name: r.name, slug: r.slug, description: r.description || '',
    fabric: r.fabric || '', weaveType: r.weave_type || '', originRegion: r.origin_region || '',
    occasion: r.occasion || [], careInstructions: r.care_instructions || 'Dry clean only',
    blouseIncluded: r.blouse_included || false, length: r.length || 5.5, weightGrams: r.weight_grams || 0,
    category: r.categories?.slug || '', categorySlug: r.categories?.slug || '', categoryName: r.categories?.name || '',
    originalPrice: r.original_price, salePrice: r.sale_price || null,
    discountPercent: r.discount_percent || null, saleStartDate: r.sale_start_date || null, saleEndDate: r.sale_end_date || null,
    gstRate: r.gst_rate || 5, images, variants, totalStock, isOutOfStock: totalStock === 0,
    isNew: new Date(r.created_at) > new Date(Date.now() - 30 * 86400000),
    isFeatured: r.is_featured || false, isBestseller: r.is_bestseller || false,
    customFields: r.custom_fields || {}, averageRating: r.average_rating || 0, reviewCount: r.review_count || 0,
    createdAt: r.created_at, updatedAt: r.updated_at, videoUrl: r.video_url || null,
  }
}

export default async function CategoryPage({ params, searchParams }: { params: { category: string }; searchParams: any }) {
  const supabase = createClient()

  // Step 1 — get category (validates it exists)
  const { data: cat, error: catError } = await supabase
    .from('categories').select('id, name, slug, image_url')
    .eq('slug', params.category).eq('is_active', true).single()
  if (catError || !cat) notFound()

  // Step 2 — parallel: config + all categories + fabrics + products (using category_id directly)
  const PAGE_SIZE = 16
  const currentPage = Math.max(1, parseInt(searchParams?.page || '1', 10))
  const offset = (currentPage - 1) * PAGE_SIZE
  const sortBy = searchParams?.sort || 'newest'

  const PRODUCT_SELECT = `*, categories(slug, name), product_images(id,url,public_id,alt_text,is_primary,order_index), product_variants(id,colour,colour_hex,stock,sku)`

  let productQuery = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .eq('category_id', cat.id)   // use id directly — no extra category lookup

  if (searchParams?.fabrics) productQuery = productQuery.in('fabric', String(searchParams.fabrics).split(','))
  if (searchParams?.priceMin) productQuery = productQuery.gte('original_price', Number(searchParams.priceMin))
  if (searchParams?.priceMax) productQuery = productQuery.lte('original_price', Number(searchParams.priceMax))

  switch (sortBy) {
    case 'price_asc':  productQuery = productQuery.order('original_price', { ascending: true });  break
    case 'price_desc': productQuery = productQuery.order('original_price', { ascending: false }); break
    case 'rating':     productQuery = productQuery.order('average_rating', { ascending: false });  break
    default:           productQuery = productQuery.order('created_at', { ascending: false });      break
  }
  productQuery = productQuery.range(offset, offset + PAGE_SIZE - 1)

  const [configResult, categoriesResult, fabricsResult, productsResult] = await Promise.all([
    supabase.from('site_config').select('key, value'),
    supabase.from('categories').select('id,name,slug,description,image_url,is_active,display_order').eq('is_active', true).order('display_order'),
    supabase.from('site_config').select('value').eq('key', 'fabric_types').maybeSingle(),
    productQuery,
  ])

  const config: Record<string, string> = {}
  configResult.data?.forEach((r: any) => { config[r.key] = r.value })

  const categories = (categoriesResult.data || []).map((r: any) => ({
    id: r.id, name: r.name, slug: r.slug, description: r.description || '',
    imageUrl: r.image_url || '', isActive: r.is_active, displayOrder: r.display_order,
  }))

  let fabrics = DEFAULT_FABRICS
  try { if (fabricsResult.data?.value) fabrics = JSON.parse(fabricsResult.data.value) } catch {}

  const products = (productsResult.data || []).map(mapProduct)
  const totalProducts = productsResult.count ?? 0
  const brandName = config.brand_name || process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'

  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: cat.name, item: `${SITE_URL}/shop/${params.category}` },
    ],
  }

  const itemListSchema = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: `${cat.name} Sarees`, url: `${SITE_URL}/shop/${params.category}`,
    numberOfItems: totalProducts,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/product/${p.slug}`, name: p.name,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <Navbar categories={categories} config={config as any} user={null} />
      <ShopContent
        products={products}
        categories={categories}
        config={config as any}
        userId={undefined}
        initialCategory={params.category}
        fabrics={fabrics}
        totalProducts={totalProducts}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        initialFilters={{
          fabrics: searchParams?.fabrics ? String(searchParams.fabrics).split(',') : [],
          occasions: searchParams?.occasions ? String(searchParams.occasions).split(',') : [],
          priceMin: searchParams?.priceMin || '',
          priceMax: searchParams?.priceMax || '',
          onlyNew: false,
          sortBy: sortBy,
        }}
      />
      <Footer config={config as any} categories={categories} />
      <WhatsAppButton number={config.whatsapp_number || ''} />
      <BackToTop />
    </>
  )
}
