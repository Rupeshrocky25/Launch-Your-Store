import {
  User,
  Store,
  Product,
  Category,
  Cart,
  CartItem,
  Order,
  OrderStatus,
  StoreAnalytics,
} from '../types';

let currentUserId: string | null = localStorage.getItem('lys_user_id') || null;

export function setApiUserId(id: string | null) {
  currentUserId = id;
  if (id) {
    localStorage.setItem('lys_user_id', id);
  } else {
    localStorage.removeItem('lys_user_id');
  }
}

export function getApiUserId() {
  return currentUserId;
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (currentUserId) {
    headers['x-user-id'] = currentUserId;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  async sendOtp(phone: string, role: 'CUSTOMER' | 'SHOPKEEPER') {
    return fetchJson<{
      success: boolean;
      phone: string;
      role: string;
      testCode: string;
      message: string;
    }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    });
  },

  async loginDirect(phone: string, role: 'CUSTOMER' | 'SHOPKEEPER', name?: string) {
    const res = await fetchJson<{
      success: boolean;
      user: User;
      store?: Store | null;
    }>('/api/auth/login-direct', {
      method: 'POST',
      body: JSON.stringify({ phone, role, name }),
    });
    setApiUserId(res.user.id);
    return res;
  },

  async verifyOtp(phone: string, code: string, name?: string) {
    const res = await fetchJson<{
      success: boolean;
      user: User;
      store?: Store | null;
    }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name }),
    });
    setApiUserId(res.user.id);
    return res;
  },

  async switchRole(userId: string, newRole: 'CUSTOMER' | 'SHOPKEEPER') {
    return fetchJson<{
      success: boolean;
      user: User;
      store?: Store | null;
    }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ userId, newRole }),
    });
  },

  async getMe() {
    return fetchJson<{ user: User; store?: Store | null }>('/api/auth/me');
  },

  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    const res = await fetchJson<{ success: boolean; user: User }>('/api/auth/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.user;
  },

  // Stores
  async getPublishedStores(): Promise<Store[]> {
    return fetchJson<Store[]>('/api/stores');
  },

  async getStoreBySlug(slug: string): Promise<{ store: Store; products: Product[]; categories: Category[] }> {
    return fetchJson<{ store: Store; products: Product[]; categories: Category[] }>(`/api/stores/${slug}`);
  },

  async createStore(payload: Partial<Store>): Promise<Store> {
    return fetchJson<Store>('/api/stores', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStore(storeId: string, payload: Partial<Store>): Promise<Store> {
    return fetchJson<Store>(`/api/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async submitVerification(storeId: string, details: { gstin?: string; udyam?: string; documentType?: string; documentUrl?: string }) {
    return fetchJson<Store>(`/api/stores/${storeId}/verify`, {
      method: 'POST',
      body: JSON.stringify(details),
    });
  },

  async adminToggleVerification(storeId: string, status: string, reviewNotes?: string) {
    return fetchJson<Store>(`/api/stores/${storeId}/admin-toggle-verify`, {
      method: 'POST',
      body: JSON.stringify({ status, reviewNotes }),
    });
  },

  // Categories
  async getCategories(storeId?: string): Promise<Category[]> {
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
    return fetchJson<Category[]>(`/api/categories${q}`);
  },

  async addCategory(name: string, storeId?: string): Promise<Category> {
    return fetchJson<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, storeId }),
    });
  },

  // Products
  async getProducts(params?: { storeId?: string; categoryId?: string; search?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set('storeId', params.storeId);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.search) query.set('search', params.search);
    const q = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<Product[]>(`/api/products${q}`);
  },

  async getProduct(id: string): Promise<Product> {
    return fetchJson<Product>(`/api/products/${id}`);
  },

  async createProduct(payload: Partial<Product>): Promise<Product> {
    return fetchJson<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
    return fetchJson<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },

  async importSampleProducts(storeId: string, categoryIds: string[]) {
    return fetchJson<{ success: boolean; count: number; products: Product[] }>('/api/products/sample-import', {
      method: 'POST',
      body: JSON.stringify({ storeId, categoryIds }),
    });
  },

  // CSV
  async getCsvTemplate(): Promise<string> {
    const res = await fetch('/api/import/template');
    return res.text();
  },

  async previewCsv(csvContent: string, storeId: string) {
    return fetchJson<any>('/api/import/preview', {
      method: 'POST',
      body: JSON.stringify({ csvContent, storeId }),
    });
  },

  async executeCsvImport(csvContent: string, storeId: string) {
    return fetchJson<any>('/api/import/execute', {
      method: 'POST',
      body: JSON.stringify({ csvContent, storeId }),
    });
  },

  // Cart
  async getCart(): Promise<Cart> {
    return fetchJson<Cart>('/api/cart');
  },

  async updateCart(items: CartItem[]): Promise<Cart> {
    return fetchJson<Cart>('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  async clearCart(): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>('/api/cart/clear', {
      method: 'POST',
    });
  },

  // Wishlist
  async getWishlist(): Promise<string[]> {
    return fetchJson<string[]>('/api/wishlist');
  },

  async toggleWishlist(productId: string): Promise<string[]> {
    return fetchJson<string[]>('/api/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  // Orders
  async getOrders(params?: { storeId?: string; customerId?: string }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.storeId) query.set('storeId', params.storeId);
    if (params?.customerId) query.set('customerId', params.customerId);
    const q = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<Order[]>(`/api/orders${q}`);
  },

  async getOrder(id: string): Promise<Order> {
    return fetchJson<Order>(`/api/orders/${id}`);
  },

  async createOrder(payload: any): Promise<Order> {
    return fetchJson<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, note?: string, estimatedDeliveryDate?: string): Promise<Order> {
    return fetchJson<Order>(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note, estimatedDeliveryDate }),
    });
  },

  // Analytics & AI Assistant
  async getAnalytics(storeId: string, days = 30): Promise<StoreAnalytics> {
    return fetchJson<StoreAnalytics>(`/api/analytics/${storeId}?days=${days}`);
  },

  async askAiAssistant(storeId: string, query: string) {
    return fetchJson<{
      answer: string;
      factualEvidence: any;
      modelUsed: string;
    }>('/api/ai/analytics', {
      method: 'POST',
      body: JSON.stringify({ storeId, query }),
    });
  },
};
