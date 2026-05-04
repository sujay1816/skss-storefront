export default function FaqPage() {
  const faqs = [
    { q: 'How long does delivery take?', a: 'Standard delivery takes 5-7 business days. Express delivery (2-3 days) is available at checkout for select pincodes.' },
    { q: 'Can I return my saree?', a: 'Yes! We accept returns within 7 days for unused and damaged goods only. Please raise a return request from your Orders page with a photograph.' },
    { q: 'Are your sarees authentic?', a: 'Absolutely. Every saree is handpicked and verified for authenticity. We work directly with master weavers across India.' },
    { q: 'What payment methods do you accept?', a: 'We accept UPI, Credit/Debit Cards via Razorpay, and Cash on Delivery (COD).' },
    { q: 'How do I care for my silk saree?', a: 'Dry clean only. Store in a cool, dry place wrapped in muslin cloth. Avoid direct sunlight for extended periods.' },
    { q: 'Do you ship internationally?', a: 'Currently we ship within India only. International shipping is coming soon!' },
  ]
  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="section-heading mb-8">Frequently Asked Questions</h1>
      <div className="space-y-6">
        {faqs.map((f, i) => (
          <div key={i} className="border-b pb-6" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-medium mb-2 text-base" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{f.q}</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
