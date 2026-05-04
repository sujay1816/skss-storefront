import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import { getSiteConfig, getCategories } from '@/lib/supabase/config'
export default async function CartLayout({ children }: { children: React.ReactNode }) {
  const [config, categories] = await Promise.all([getSiteConfig(), getCategories()])
  return (<><Navbar categories={categories} config={config} />{children}<Footer config={config} categories={categories} /><WhatsAppButton number={config.whatsapp_number} /></>)
}
