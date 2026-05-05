import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import { getSiteConfig, getCategories } from '@/lib/supabase/config'
import { getUser } from '@/lib/supabase/get-user'
import { Suspense } from 'react'
export default async function Layout({ children }: { children: React.ReactNode }) {
  const [config, categories, user] = await Promise.all([
    getSiteConfig().catch(() => ({} as any)),
    getCategories().catch(() => []),
    getUser().catch(() => null),
  ])
  return (
    <>
      <Navbar categories={categories} config={config} user={user} />
      <Suspense fallback={null}>{children}</Suspense>
      <Footer config={config} categories={categories} />
      <WhatsAppButton number={config.whatsapp_number || ''} />
    </>
  )
}
