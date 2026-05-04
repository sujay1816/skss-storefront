import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getSiteConfig, getCategories } from '@/lib/supabase/config'
export default async function WishlistLayout({ children }: { children: React.ReactNode }) {
  const [config, categories] = await Promise.all([getSiteConfig(), getCategories()])
  return (<><Navbar categories={categories} config={config} />{children}<Footer config={config} categories={categories} /></>)
}
