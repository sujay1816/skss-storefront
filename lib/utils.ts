export function formatPrice(amount: number): string {
  return '₹' + Number(amount).toLocaleString('en-IN')
}

export function getEffectivePrice(product: { originalPrice: number; salePrice: number | null; saleStartDate: string | null; saleEndDate: string | null }): number {
  if (!product.salePrice) return product.originalPrice
  const now = new Date()
  if (product.saleStartDate && now < new Date(product.saleStartDate)) return product.originalPrice
  if (product.saleEndDate && now > new Date(product.saleEndDate)) return product.originalPrice
  return product.salePrice
}

export function getShippingCharge(subtotal: number, freeAbove: number, charge: number): number {
  return subtotal >= freeAbove ? 0 : charge
}

export function calculateGst(price: number, rate: number): number {
  return Math.round((price * rate) / 100)
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
]
