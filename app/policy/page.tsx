export default function PolicyPage() {
  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="section-heading mb-8">Return &amp; Refund Policy</h1>
      <div className="space-y-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <div><h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Return Window</h3><p>We accept returns within 7 days of delivery for unused and damaged goods only.</p></div>
        <div><h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>How to Return</h3><p>Go to My Orders, select the order, click Request Return, and upload a clear photograph of the item. Our team will review within 2-3 business days.</p></div>
        <div><h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Refund Process</h3><p>Once your return is approved, the refund will be processed to your original payment method within 5-7 business days. COD orders will receive a bank transfer.</p></div>
        <div><h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Non-Returnable Items</h3><p>Items that have been used, washed, or are without original packaging are not eligible for return.</p></div>
      </div>
    </div>
  )
}
