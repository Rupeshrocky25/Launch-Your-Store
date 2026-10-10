export type UserRole = 'CUSTOMER' | 'SHOPKEEPER' | 'ADMIN';

export type StoreThemeId = 'modern-minimal' | 'bold-commerce' | 'elegant-boutique' | 'fresh-market';

export type VerificationStatus = 'PHONE_VERIFIED' | 'SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  createdAt: string;
}

export interface StoreColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  businessName: string;
  businessType: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  gmapsUrl?: string;
  logo: string;
  banner: string;
  tagline: string;
  themeId: StoreThemeId;
  customColors: StoreColors;
  customFont: 'inter' | 'playfair' | 'plus-jakarta' | 'space-grotesk';
  announcement: string;
  isPublished: boolean;
  verificationStatus: VerificationStatus;
  verificationDetails?: {
    gstin?: string;
    udyam?: string;
    documentType?: string;
    documentUrl?: string;
    submittedAt?: string;
    reviewedAt?: string;
    reviewNotes?: string;
  };
  createdAt: string;
}

export interface Category {
  id: string;
  storeId?: string | null;
  name: string;
  slug: string;
  icon?: string;
  isCustom?: boolean;
}

export interface ProductVariant {
  name: string;
  options: {
    label: string;
    price: number;
    stock: number;
  }[];
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  images: string[];
  variants?: ProductVariant[];
  isFeatured?: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  storeId: string;
  variantLabel?: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  variantLabel?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  storeId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  paymentMethod: 'COD' | 'DEMO_UPI' | 'DEMO_CARD';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  estimatedDeliveryDate?: string;
  createdAt: string;
}

export interface StoreAnalytics {
  periodDays: number;
  cutoffDate: string;
  totalRevenue: number;
  paidRevenue: number;
  totalOrdersCount: number;
  deliveredCount: number;
  pendingCount: number;
  cancelledCount: number;
  averageOrderValue: number;
  topSellingProducts: {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  lowStockProducts: {
    id: string;
    name: string;
    stock: number;
    sku: string;
  }[];
  slowMovingProducts: {
    id: string;
    name: string;
    stock: number;
    price: number;
  }[];
  totalProductCount: number;
}
