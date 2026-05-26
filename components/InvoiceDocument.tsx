// @ts-nocheck
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 10, padding: 40, color: '#1A1A1A', backgroundColor: '#FFFFFF' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#8B1A2B', borderBottomStyle: 'solid' },
  brandBlock:  { flexDirection: 'column' },
  brandName:   { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#8B1A2B', marginBottom: 2 },
  brandSub:    { fontSize: 9, color: '#9A8A7A', letterSpacing: 2, textTransform: 'uppercase' },
  invoiceTitle:{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#8B1A2B', textAlign: 'right' },
  invoiceNum:  { fontSize: 10, color: '#5A4A3A', textAlign: 'right', marginTop: 2 },
  invoiceDate: { fontSize: 9, color: '#9A8A7A', textAlign: 'right' },
  twoCol:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 20 },
  colBox:      { flex: 1, backgroundColor: '#FDFAF7', padding: 14, borderRadius: 4 },
  colTitle:    { fontSize: 8, color: '#9A8A7A', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontFamily: 'Helvetica-Bold' },
  colText:     { fontSize: 9.5, color: '#1A1A1A', lineHeight: 1.6 },
  colMuted:    { fontSize: 9, color: '#5A4A3A', lineHeight: 1.6 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#8B1A2B', padding: '8 12', borderRadius: 2, marginBottom: 1 },
  tableHeaderText: { color: '#FFFFFF', fontSize: 8.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow:    { flexDirection: 'row', padding: '8 12', borderBottomWidth: 1, borderBottomColor: '#F0EAE2', borderBottomStyle: 'solid' },
  tableRowAlt: { flexDirection: 'row', padding: '8 12', backgroundColor: '#FDFAF7', borderBottomWidth: 1, borderBottomColor: '#F0EAE2', borderBottomStyle: 'solid' },
  tableText:   { fontSize: 9.5, color: '#1A1A1A' },
  tableMuted:  { fontSize: 9, color: '#5A4A3A' },
  colProduct:  { flex: 3 },
  colQty:      { flex: 1, textAlign: 'center' },
  colPrice:    { flex: 1.5, textAlign: 'right' },
  colTotal:    { flex: 1.5, textAlign: 'right' },
  summaryBox:  { marginTop: 16, alignItems: 'flex-end' },
  summaryInner:{ width: 220, backgroundColor: '#FDFAF7', padding: 14, borderRadius: 4 },
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  summaryLabel:{ fontSize: 9.5, color: '#5A4A3A' },
  summaryVal:  { fontSize: 9.5, color: '#1A1A1A' },
  summaryTotal:{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginTop: 4, borderTopWidth: 1.5, borderTopColor: '#8B1A2B', borderTopStyle: 'solid' },
  totalLabel:  { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#8B1A2B' },
  totalVal:    { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#8B1A2B' },
  badge:       { backgroundColor: '#EAF6ED', padding: '3 8', borderRadius: 99, alignSelf: 'flex-start', marginTop: 4 },
  badgeText:   { fontSize: 8, color: '#15803D', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  footer:      { marginTop: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E8DDD4', borderTopStyle: 'solid', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:  { fontSize: 8, color: '#9A8A7A' },
  thankYou:    { fontSize: 11, color: '#8B1A2B', fontFamily: 'Helvetica-Bold' },
  gstinBadge:  { backgroundColor: '#FFF7ED', padding: '4 10', borderRadius: 3, marginTop: 8 },
  gstinText:   { fontSize: 8, color: '#92400E', fontFamily: 'Helvetica-Bold' },
})

function fmt(n: number) { return `\u20B9${Number(n).toLocaleString('en-IN')}` }

export default function InvoiceDocument({ order, items, brandName, brandEmail, storeGstin, storeAddress, logoUrl }: any) {
  const addr = order.address_snapshot || order.shipping_address || {}
  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const orderNum  = String(order.id).slice(0, 8).toUpperCase()
  const isPaid    = order.payment_method !== 'cod'

  return (
    <Document title={`Invoice #${orderNum}`} author={brandName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>{brandName}</Text>
            <Text style={styles.brandSub}>Silks & Sarees</Text>
            {storeAddress ? <Text style={{ fontSize: 8, color: '#9A8A7A', marginTop: 4, maxWidth: 200 }}>{storeAddress}</Text> : null}
            {brandEmail ? <Text style={{ fontSize: 8, color: '#9A8A7A', marginTop: 2 }}>{brandEmail}</Text> : null}
            {storeGstin ? (
              <View style={styles.gstinBadge}><Text style={styles.gstinText}>Store GSTIN: {storeGstin}</Text></View>
            ) : null}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNum}>#{orderNum}</Text>
            <Text style={styles.invoiceDate}>{orderDate}</Text>
            {isPaid && <View style={[styles.badge, { marginLeft: 'auto' }]}><Text style={styles.badgeText}>PAID</Text></View>}
          </View>
        </View>

        {/* Billing + Shipping */}
        <View style={styles.twoCol}>
          <View style={styles.colBox}>
            <Text style={styles.colTitle}>Billed To</Text>
            <Text style={styles.colText}>{addr.full_name || ''}</Text>
            <Text style={styles.colMuted}>{addr.phone || ''}</Text>
            {order.gstin ? <Text style={[styles.colMuted, { marginTop: 4, fontFamily: 'Helvetica-Bold' }]}>GSTIN: {order.gstin}</Text> : null}
          </View>
          <View style={styles.colBox}>
            <Text style={styles.colTitle}>Delivered To</Text>
            <Text style={styles.colText}>{addr.full_name || ''}</Text>
            <Text style={styles.colMuted}>{addr.address_line1 || ''}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</Text>
            <Text style={styles.colMuted}>{addr.city || ''}, {addr.state || ''} – {addr.pincode || ''}</Text>
          </View>
          <View style={styles.colBox}>
            <Text style={styles.colTitle}>Payment Details</Text>
            <Text style={styles.colText}>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</Text>
            <Text style={styles.colMuted}>Status: {order.payment_status || (order.payment_method === 'cod' ? 'Pending' : 'Paid')}</Text>
            {order.razorpay_payment_id ? <Text style={styles.colMuted}>Ref: {order.razorpay_payment_id}</Text> : null}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colProduct]}>Product</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
        </View>
        {(items || []).map((item: any, idx: number) => (
          <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <View style={styles.colProduct}>
              <Text style={styles.tableText}>{item.product_name}</Text>
              <Text style={styles.tableMuted}>{item.colour}</Text>
            </View>
            <Text style={[styles.tableText, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.tableText, styles.colPrice]}>{fmt(item.sale_price || item.original_price || 0)}</Text>
            <Text style={[styles.tableText, styles.colTotal]}>{fmt(item.total || (item.sale_price || item.original_price || 0) * item.quantity)}</Text>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryInner}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryVal}>{fmt(order.subtotal || 0)}</Text>
            </View>
            {Number(order.shipping_charge) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryVal}>{fmt(order.shipping_charge)}</Text>
              </View>
            )}
            {Number(order.shipping_charge) === 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={[styles.summaryVal, { color: '#15803D' }]}>FREE</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST ({order.gst_rate || 5}%)</Text>
              <Text style={styles.summaryVal}>{fmt(order.total_gst || order.gst_amount || 0)}</Text>
            </View>
            {Number(order.coupon_discount) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#15803D' }]}>Coupon ({order.coupon_code})</Text>
                <Text style={[styles.summaryVal, { color: '#15803D' }]}>-{fmt(order.coupon_discount)}</Text>
              </View>
            )}
            <View style={styles.summaryTotal}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>{fmt(order.total_amount || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>This is a computer-generated invoice. No signature required.</Text>
            {storeGstin && <Text style={[styles.footerText, { marginTop: 2 }]}>GSTIN: {storeGstin}</Text>}
          </View>
          <Text style={styles.thankYou}>Thank you for shopping with us ♥</Text>
        </View>
      </Page>
    </Document>
  )
}
