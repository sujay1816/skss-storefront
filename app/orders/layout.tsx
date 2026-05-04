import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import { getSiteConfig, getCategories } from '@/lib/supabase/config'
export default async function OrdersLayout({ children }: { children: React.ReactNode }) {
  const [config, categories] = await Promise.all([getSiteConfig(), getCategories()])
  return (<><Navbar categories={categories} config={config} /><Suspense fallback={<div className="page-container py-20 text-center text-sm">Loading...</div>}>{children}</Suspense><Footer config={config} categories={categories} /><WhatsAppButton number={config.whatsapp_number} /></>)
}
