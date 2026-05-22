export interface ProductVariant { id:string; colour:string; colourHex:string; stock:number; sku:string; imageUrl?:string|null; }
export interface ProductImage { id:string; url:string; publicId:string; altText:string; isPrimary:boolean; order:number; }
export interface Product {
  id:string; name:string; slug:string; description:string; fabric:string; weaveType:string; originRegion:string;
  occasion:string[]; careInstructions:string; blouseIncluded:boolean; length:number; weightGrams:number;
  category:string; categorySlug:string; categoryName:string;
  originalPrice:number; salePrice:number|null; discountPercent:number|null;
  saleStartDate:string|null; saleEndDate:string|null; gstRate:number;
  images:ProductImage[]; variants:ProductVariant[]; totalStock:number; isOutOfStock:boolean;
  isNew:boolean; isFeatured:boolean; isBestseller:boolean; customFields:Record<string,string>;
  averageRating:number; reviewCount:number; createdAt:string; updatedAt:string;
  videoUrl:string|null;
}
export interface CartItem {
  productId:string; productName:string; productSlug:string; productImage:string;
  colour:string; colourHex:string; originalPrice:number; salePrice:number|null;
  quantity:number; stock:number; gstRate:number;
}
export type OrderStatus='confirmed'|'shipped'|'delivered'|'cancelled'|'return_requested'|'return_approved'|'return_rejected'|'refunded';
export type PaymentMethod='cod'|'upi'|'razorpay';
export type PaymentStatus='pending'|'paid'|'failed'|'refunded';
export interface OrderItem { id:string; productId:string; productName:string; productImage:string; colour:string; quantity:number; originalPrice:number; salePrice:number|null; gstRate:number; gstAmount:number; total:number; }
export interface Order {
  id:string; orderNumber:string; userId:string; addressSnapshot:Address; paymentMethod:PaymentMethod;
  paymentStatus:PaymentStatus; razorpayOrderId:string|null; razorpayPaymentId:string|null;
  couponCode:string|null; couponDiscount:number; subtotal:number; shippingCharge:number;
  totalGst:number; totalAmount:number; status:OrderStatus; shiprocketOrderId:string|null;
  trackingId:string|null; courierName:string|null; estimatedDelivery:string|null;
  returnReason:string|null; returnImageUrl:string|null; notes:string|null; createdAt:string; updatedAt:string; items?:OrderItem[];
}
export interface Address { id:string; userId:string; fullName:string; phone:string; addressLine1:string; addressLine2:string; city:string; state:string; pincode:string; isDefault:boolean; }
export type UserRole='customer'|'staff'|'manager'|'superadmin';
export interface UserProfile { id:string; email:string; fullName:string; phone:string|null; avatarUrl:string|null; role:UserRole; isBlocked:boolean; whatsappOptedIn:boolean; createdAt:string; }
export interface Review { id:string; productId:string; userId:string; userFullName:string; userAvatarUrl:string|null; rating:number; comment:string; isVerifiedPurchase:boolean; createdAt:string; }
export type CouponType='percentage'|'flat'|'free_shipping';
export interface Coupon { id:string; code:string; type:CouponType; value:number; minOrderValue:number; maxUsageCount:number; usageCount:number; perUserLimit:number; expiryDate:string|null; isActive:boolean; }
export interface BannerSlide {
  mediaType?: 'image' | 'video';
  imageUrl?: string;
  imageFocus?: string;
  videoUrl?: string;
  heading?: string;
  headingItalic?: string;
  subheading?: string;
  badgeText?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryUrl?: string;
  slideDuration?: number;  // seconds — how long to show this slide (image slides only; video plays to end)
}
export interface Banner {
  id:string;
  imageUrl:string;
  imageFocus:string;
  heading:string;
  headingItalic:string;
  subheading:string|null;
  badgeText:string;
  ctaLabel:string;
  ctaUrl:string;
  ctaSecondaryLabel:string;
  ctaSecondaryUrl:string;
  overlayStyle:string;
  textColor:string;
  isActive:boolean;
  order:number;
  videoUrl:string|null;
  videoUrls:string[];
  slides:BannerSlide[];
}
export interface Category { id:string; name:string; slug:string; description:string; imageUrl:string; isActive:boolean; displayOrder:number; }
export interface SiteConfig { brand_name:string; brand_tagline:string; brand_subtitle:string; whatsapp_number:string; support_email:string; business_email:string; free_shipping_above:string; default_shipping_charge:string; estimated_delivery_days:string; return_window_days:string; default_gst_rate:string; cod_enabled:string; upi_enabled:string; instagram_url:string; facebook_url:string; youtube_url:string; gstin:string; business_address:string; new_arrivals_days:string; low_stock_threshold:string; [key:string]:string; }
