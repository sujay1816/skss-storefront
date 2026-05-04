import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star, Shield, Truck, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import ProductCard from '@/components/product/ProductCard'
import { getSiteConfig, getCategories, getProducts, getBanners } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import HomepageClient from './HomepageClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [config, categories, featured, bestsellers, newArrivals, banners] = await Promise.all([
    getSiteConfig(),
    getCategories(),
    getProducts({ featured: true, limit: 4 }),
    getProducts({ bestseller: true, limit: 4 }),
    getProducts({ limit: 4 }),
    getBanners(),
  ])

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Navbar categories={categories} config={config} />
      <HomepageClient config={config} categories={categories} featured={featured} bestsellers={bestsellers} newArrivals={newArrivals} banners={banners} userId={user?.id} />
      <Footer config={config} categories={categories} />
      <WhatsAppButton number={config.whatsapp_number} message={config.brand_tagline} />
    </>
  )
}
