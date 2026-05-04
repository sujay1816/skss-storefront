import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getSiteConfig, getCategories } from '@/lib/supabase/config'
import Image from 'next/image'

export default async function AboutPage() {
  const [config, categories] = await Promise.all([getSiteConfig(), getCategories()])
  return (
    <>
      <Navbar categories={categories} config={config} />
      <div className="page-container py-16 max-w-3xl">
        <h1 className="section-heading mb-8">Our Story</h1>
        <div className="flex justify-center mb-10">
          <Image src="/images/logo.png" alt="Sai Krishna Silks" width={120} height={120} className="object-contain" />
        </div>
        <div className="prose prose-sm max-w-none space-y-5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <p>Sai Krishna Silks and Sarees was born from a deep love for India's rich textile heritage. We believe every woman deserves to wear a saree that tells a story — one woven with tradition, patience, and artistry.</p>
          <p>Our collection brings together the finest handpicked sarees from the legendary weaving clusters of India: the golden Kanjivaram silks of Tamil Nadu, the regal Banarasi brocades of Varanasi, the delicate Chanderi weaves of Madhya Pradesh, and many more.</p>
          <p>Each saree in our collection undergoes a rigorous quality check. We work directly with master weavers, ensuring authenticity, fair trade practices, and the preservation of traditional weaving art forms that have been passed down through generations.</p>
          <p>Our promise to you is simple: <strong>Pure Silk. Timeless Tradition. Royal Elegance.</strong> Every time.</p>
        </div>
      </div>
      <Footer config={config} categories={categories} />
    </>
  )
}
