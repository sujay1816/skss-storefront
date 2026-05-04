export default function PrivacyPage() {
  return (
    <div className="page-container py-16 max-w-3xl">
      <h1 className="section-heading mb-8">Privacy Policy</h1>
      <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p>Sai Krishna Silks and Sarees ("SKSS", "we", "us") is committed to protecting your privacy. This policy explains how we collect and use your information.</p>
        <div><h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Information We Collect</h3><p>Name, email, phone, delivery address, and payment information (processed securely by Razorpay — we do not store card details).</p></div>
        <div><h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>How We Use It</h3><p>To process orders, send shipping updates via WhatsApp/email, and improve our services. We never sell your data to third parties.</p></div>
        <div><h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>WhatsApp Communication</h3><p>If you opt in, we may send order updates via WhatsApp. You can opt out anytime from your Profile page.</p></div>
        <p>For any privacy concerns, email us at support@skss.in</p>
      </div>
    </div>
  )
}
