export default function ShippingPage() {
  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="section-heading mb-8">Shipping Policy</h1>
      <div className="space-y-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <div><h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Free Shipping</h3><p>Orders above Rs.1,999 qualify for free standard shipping across India.</p></div>
        <div><h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Standard Delivery</h3><p>5-7 business days after dispatch. You'll receive a WhatsApp message with tracking details once your order is shipped.</p></div>
        <div><h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Order Processing</h3><p>Orders are processed within 24-48 hours of payment confirmation. Orders placed on Sundays and public holidays are processed the next working day.</p></div>
        <div><h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Packaging</h3><p>All sarees are carefully folded, wrapped in tissue, and packed in our signature branded packaging to preserve the fabric during transit.</p></div>
      </div>
    </div>
  )
}
