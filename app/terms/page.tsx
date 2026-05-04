export default function TermsPage() {
  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="section-heading mb-8">Terms of Service</h1>
      <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p>By using skss.in, you agree to these Terms of Service. Please read them carefully.</p>
        <div><h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Products</h3><p>All product images are representative. Slight colour variations may occur due to display settings. We strive to accurately represent every product.</p></div>
        <div><h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Pricing</h3><p>All prices are in Indian Rupees (INR) and inclusive of applicable GST. We reserve the right to change prices at any time.</p></div>
        <div><h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Orders</h3><p>An order confirmation does not guarantee product availability. In case of stock issues, we will contact you and offer a full refund.</p></div>
        <div><h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Governing Law</h3><p>These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana.</p></div>
        <p>For queries, contact us at support@skss.in</p>
      </div>
    </div>
  )
}
