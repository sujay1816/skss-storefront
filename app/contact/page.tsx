import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ContactClient from './ContactClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['brand_name'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })
  const brandName = cfg.brand_name || 'Sai Krishna Silks & Sarees'

  return {
    title: 'Contact Us',
    description: `Get in touch with us for any queries about our sarees, orders or returns. We are here to help.`,
    alternates: { canonical: `${SITE_URL}/contact` },
    openGraph: {
      title: `Contact Us | ${brandName}`,
      description: `Get in touch with us for any queries about our sarees, orders or returns. We are here to help.`,
      type: 'website',
      url: `${SITE_URL}/contact`,
    },
  }
}

export default async function ContactPage() {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['brand_name', 'whatsapp_number', 'support_email', 'business_address', 'contact_hours', 'contact_map_url'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })
  // Local Business Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: cfg.brand_name || 'Sai Krishna Silks & Sarees',
    description: 'Premium silk sarees — Kanjivaram, Banarasi, Chanderi and more',
    url: SITE_URL,
    telephone: cfg.whatsapp_number || '',
    email: cfg.support_email || '',
    address: cfg.business_address ? {
      '@type': 'PostalAddress',
      streetAddress: cfg.business_address,
      addressCountry: 'IN',
    } : undefined,
    openingHours: cfg.contact_hours || 'Mo-Sa 10:00-19:00',
    priceRange: '₹₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, Credit Card, UPI, Net Banking',
    areaServed: 'India',
  }

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <ContactClient cfg={cfg} />
    </>
  )
}
