import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: 'CUSTOMER' | 'SHOPKEEPER' | 'ADMIN';
  createdAt: string;
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
  themeId: 'modern-minimal' | 'bold-commerce' | 'elegant-boutique' | 'fresh-market';
  customColors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
  customFont: 'inter' | 'playfair' | 'plus-jakarta' | 'space-grotesk';
  announcement: string;
  isPublished: boolean;
  verificationStatus: 'PHONE_VERIFIED' | 'SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
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
  storeId?: string | null; // null = global
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
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  storeId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  statusHistory: OrderStatusHistory[];
  paymentMethod: 'COD' | 'DEMO_UPI' | 'DEMO_CARD';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  estimatedDeliveryDate?: string;
  createdAt: string;
}

export interface OtpSession {
  id: string;
  phone: string;
  code: string;
  role: 'CUSTOMER' | 'SHOPKEEPER';
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

export interface DatabaseSchema {
  users: User[];
  stores: Store[];
  categories: Category[];
  products: Product[];
  carts: Cart[];
  orders: Order[];
  wishlists: { userId: string; productIds: string[] }[];
  otpSessions: OtpSession[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'store_db.json');

// Initial seed data with high-quality small business products
const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-fashion', storeId: null, name: 'Apparel & Fashion', slug: 'apparel-fashion', icon: 'Shirt' },
  { id: 'cat-artisan', storeId: null, name: 'Artisan & Handcrafts', slug: 'artisan-handcrafts', icon: 'Sparkles' },
  { id: 'cat-grocery', storeId: null, name: 'Organic & Grocery', slug: 'organic-grocery', icon: 'Apple' },
  { id: 'cat-home', storeId: null, name: 'Home & Living', slug: 'home-living', icon: 'Home' },
  { id: 'cat-beauty', storeId: null, name: 'Wellness & Beauty', slug: 'wellness-beauty', icon: 'Heart' },
  { id: 'cat-electronics', storeId: null, name: 'Tech & Electronics', slug: 'tech-electronics', icon: 'Cpu' },
  { id: 'cat-bakery', storeId: null, name: 'Bakery & Sweets', slug: 'bakery-sweets', icon: 'Coffee' },
];

const INITIAL_STORES: Store[] = [];
const INITIAL_USERS: User[] = [];
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_ORDERS: Order[] = [];

class DatabaseEngine {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('[DB] Error loading database file, initializing defaults:', e);
    }

    const initial: DatabaseSchema = {
      users: [],
      stores: [],
      categories: INITIAL_CATEGORIES,
      products: [],
      carts: [],
      orders: [],
      wishlists: [],
      otpSessions: [],
    };
    this.saveData(initial);
    return initial;
  }

  resetToCleanSlate(): DatabaseSchema {
    this.data = {
      users: [],
      stores: [],
      categories: INITIAL_CATEGORIES,
      products: [],
      carts: [],
      orders: [],
      wishlists: [],
      otpSessions: [],
    };
    this.saveData();
    return this.data;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed to save database file:', e);
    }
  }

  // Users
  getUserByPhone(phone: string): User | undefined {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    return this.data.users.find(u => u.phone.replace(/\s+/g, '') === cleanPhone);
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user: Omit<User, 'id' | 'createdAt'> & { id?: string }): User {
    const newUser: User = {
      ...user,
      id: user.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  updateUserRole(userId: string, newRole: 'CUSTOMER' | 'SHOPKEEPER'): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    user.role = newRole;
    this.saveData();
    return user;
  }

  updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.saveData();
    return user;
  }

  // OTP Sessions
  createOtpSession(phone: string, role: 'CUSTOMER' | 'SHOPKEEPER'): OtpSession {
    // Generate a secure random 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min validity
    const session: OtpSession = {
      id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phone,
      code,
      role,
      expiresAt,
      attempts: 0,
      verified: false,
    };
    // Clean old sessions for this phone
    this.data.otpSessions = this.data.otpSessions.filter(s => s.phone !== phone);
    this.data.otpSessions.push(session);
    this.saveData();
    return session;
  }

  verifyOtp(phone: string, inputCode: string): { success: boolean; error?: string; session?: OtpSession } {
    const cleanPhone = phone.replace(/\s+/g, '');

    const session = this.data.otpSessions.find(s => s.phone.replace(/\s+/g, '') === cleanPhone);
    if (!session) {
      return { success: false, error: 'No active OTP session found for this phone number. Please request a new OTP.' };
    }
    if (Date.now() > session.expiresAt) {
      return { success: false, error: 'OTP has expired (5-minute limit). Please click "Resend OTP".' };
    }
    if (session.attempts >= 5) {
      return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
    }
    session.attempts += 1;
    if (session.code !== inputCode.trim()) {
      this.saveData();
      return { success: false, error: `Invalid 6-digit OTP code. ${5 - session.attempts} attempt(s) remaining.` };
    }
    session.verified = true;
    this.saveData();
    return { success: true, session };
  }

  // Stores
  getStoreBySlug(slug: string): Store | undefined {
    return this.data.stores.find(s => s.slug.toLowerCase() === slug.toLowerCase());
  }

  getStoreById(id: string): Store | undefined {
    return this.data.stores.find(s => s.id === id);
  }

  getStoresByOwner(ownerId: string): Store[] {
    return this.data.stores.filter(s => s.ownerId === ownerId);
  }

  getAllPublishedStores(): Store[] {
    return this.data.stores.filter(s => s.isPublished);
  }

  createStore(storeData: Omit<Store, 'id' | 'createdAt'>): Store {
    const newStore: Store = {
      ...storeData,
      id: `store-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.stores.push(newStore);
    this.saveData();
    return newStore;
  }

  updateStore(id: string, updates: Partial<Store>): Store | undefined {
    const index = this.data.stores.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    this.data.stores[index] = { ...this.data.stores[index], ...updates };
    this.saveData();
    return this.data.stores[index];
  }

  // Categories
  getCategories(storeId?: string): Category[] {
    return this.data.categories.filter(c => c.storeId === null || c.storeId === undefined || c.storeId === storeId);
  }

  addCategory(name: string, storeId?: string): Category {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      storeId: storeId || null,
      name,
      slug,
      icon: 'Tag',
      isCustom: true,
    };
    this.data.categories.push(newCat);
    this.saveData();
    return newCat;
  }

  // Products
  getProducts(filters?: { storeId?: string; categoryId?: string; search?: string; isAvailable?: boolean }): Product[] {
    let prods = [...this.data.products];
    if (filters?.storeId) {
      prods = prods.filter(p => p.storeId === filters.storeId);
    }
    if (filters?.categoryId) {
      prods = prods.filter(p => p.categoryId === filters.categoryId);
    }
    if (filters?.isAvailable !== undefined) {
      prods = prods.filter(p => p.isAvailable === filters.isAvailable);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return prods;
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  createProduct(productData: Omit<Product, 'id' | 'createdAt'>): Product {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.products.push(newProduct);
    this.saveData();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    this.data.products[index] = { ...this.data.products[index], ...updates };
    this.saveData();
    return this.data.products[index];
  }

  deleteProduct(id: string): boolean {
    const prevLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Cart
  getCart(userId: string): Cart {
    let cart = this.data.carts.find(c => c.userId === userId);
    if (!cart) {
      cart = {
        id: `cart-${userId}`,
        userId,
        items: [],
        updatedAt: new Date().toISOString(),
      };
      this.data.carts.push(cart);
      this.saveData();
    }
    return cart;
  }

  updateCart(userId: string, items: CartItem[]): Cart {
    let cart = this.getCart(userId);
    cart.items = items;
    cart.updatedAt = new Date().toISOString();
    this.saveData();
    return cart;
  }

  clearCart(userId: string): void {
    const cart = this.getCart(userId);
    cart.items = [];
    cart.updatedAt = new Date().toISOString();
    this.saveData();
  }

  // Wishlist
  getWishlist(userId: string): string[] {
    const entry = this.data.wishlists.find(w => w.userId === userId);
    return entry ? entry.productIds : [];
  }

  toggleWishlist(userId: string, productId: string): string[] {
    let entry = this.data.wishlists.find(w => w.userId === userId);
    if (!entry) {
      entry = { userId, productIds: [productId] };
      this.data.wishlists.push(entry);
    } else {
      if (entry.productIds.includes(productId)) {
        entry.productIds = entry.productIds.filter(id => id !== productId);
      } else {
        entry.productIds.push(productId);
      }
    }
    this.saveData();
    return entry.productIds;
  }

  // Orders & Inventory Integrity
  createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'statusHistory'>): { order: Order; error?: string } {
    // Server-side inventory and pricing validation
    for (const item of orderData.items) {
      const prod = this.getProductById(item.productId);
      if (!prod) {
        return { order: null as any, error: `Product "${item.name}" not found.` };
      }
      if (!prod.isAvailable) {
        return { order: null as any, error: `Product "${prod.name}" is no longer available.` };
      }
      if (prod.stock < item.quantity) {
        return { order: null as any, error: `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}.` };
      }
    }

    // Atomic stock decrement
    for (const item of orderData.items) {
      const prod = this.getProductById(item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        if (prod.stock === 0) {
          prod.isAvailable = false;
        }
      }
    }

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const estDelivery = orderData.estimatedDeliveryDate || (new Date().getHours() < 14 ? 'Delivery by Today by 8:00 PM' : 'Delivery by Tomorrow by 6:00 PM');
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      estimatedDeliveryDate: estDelivery,
      statusHistory: [
        {
          status: orderData.status,
          timestamp: nowIso,
          note: `Order placed via ${orderData.paymentMethod}. Total: ₹${orderData.total}. Estimated arrival: ${estDelivery}`,
        },
      ],
      createdAt: nowIso,
    };

    this.data.orders.unshift(newOrder);
    this.saveData();
    return { order: newOrder };
  }

  updateOrderStatus(orderId: string, newStatus: Order['status'], note?: string, estimatedDeliveryDate?: string): Order | undefined {
    const order = this.data.orders.find(o => o.id === orderId);
    if (!order) return undefined;

    const prevStatus = order.status;
    if (prevStatus === newStatus && !estimatedDeliveryDate && !note) return order;

    // If transitioning to CANCELLED, safely restore inventory
    if (newStatus === 'CANCELLED' && prevStatus !== 'CANCELLED') {
      for (const item of order.items) {
        const prod = this.getProductById(item.productId);
        if (prod) {
          prod.stock += item.quantity;
          if (prod.stock > 0) {
            prod.isAvailable = true;
          }
        }
      }
    }

    if (estimatedDeliveryDate) {
      order.estimatedDeliveryDate = estimatedDeliveryDate;
    } else if (newStatus === 'PROCESSING' || newStatus === 'SHIPPED') {
      const now = new Date();
      order.estimatedDeliveryDate = now.getHours() < 14
        ? 'Delivery by Today by 8:00 PM'
        : 'Delivery by Tomorrow by 6:00 PM';
    }

    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || (newStatus === 'PROCESSING'
        ? `Order picked and packed. Estimated arrival: ${order.estimatedDeliveryDate}`
        : newStatus === 'SHIPPED'
        ? `Order picked up and out for delivery. Estimated arrival: ${order.estimatedDeliveryDate}`
        : `Status updated from ${prevStatus} to ${newStatus}.`),
    });

    if (newStatus === 'CANCELLED') {
      order.paymentStatus = 'REFUNDED';
    }

    this.saveData();
    return order;
  }

  getOrders(filters?: { storeId?: string; customerId?: string }): Order[] {
    let orders = [...this.data.orders];
    if (filters?.storeId) {
      orders = orders.filter(o => o.storeId === filters.storeId);
    }
    if (filters?.customerId) {
      orders = orders.filter(o => o.customerId === filters.customerId);
    }
    return orders;
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  // Analytics Engine
  getStoreAnalytics(storeId: string, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const storeOrders = this.data.orders.filter(
      o => o.storeId === storeId && new Date(o.createdAt) >= cutoffDate
    );

    const validOrders = storeOrders.filter(o => o.status !== 'CANCELLED');
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
    const paidRevenue = validOrders.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.total, 0);
    const totalOrdersCount = storeOrders.length;
    const deliveredCount = storeOrders.filter(o => o.status === 'DELIVERED').length;
    const pendingCount = storeOrders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;
    const cancelledCount = storeOrders.filter(o => o.status === 'CANCELLED').length;

    // Top selling products
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of validOrders) {
      for (const item of order.items) {
        const existing = productSalesMap.get(item.productId) || { name: item.name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        productSalesMap.set(item.productId, existing);
      }
    }

    const topSellingProducts = Array.from(productSalesMap.entries())
      .map(([id, stats]) => ({ productId: id, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Low stock items (stock <= 10)
    const storeProducts = this.data.products.filter(p => p.storeId === storeId);
    const lowStockProducts = storeProducts
      .filter(p => p.stock <= 10)
      .map(p => ({ id: p.id, name: p.name, stock: p.stock, sku: p.sku }));

    // Slow moving / zero sales in this period
    const soldProductIds = new Set(productSalesMap.keys());
    const slowMovingProducts = storeProducts
      .filter(p => !soldProductIds.has(p.id))
      .map(p => ({ id: p.id, name: p.name, stock: p.stock, price: p.price }));

    return {
      periodDays: days,
      cutoffDate: cutoffDate.toISOString(),
      totalRevenue,
      paidRevenue,
      totalOrdersCount,
      deliveredCount,
      pendingCount,
      cancelledCount,
      averageOrderValue: validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0,
      topSellingProducts,
      lowStockProducts,
      slowMovingProducts,
      totalProductCount: storeProducts.length,
    };
  }
}

export const db = new DatabaseEngine();
