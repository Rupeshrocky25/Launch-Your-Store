import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, User } from './src/server/db';
import { answerStoreQuery } from './src/server/ai-analytics';
import { SAMPLE_CATEGORY_PRODUCTS } from './src/server/sample-catalog';
import { generateCsvTemplate, parseAndValidateCsv } from './src/server/csv-import';
import { sendSmsOtp } from './src/server/sms';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp(options: { mountFrontend?: boolean; normalizeApiBase?: boolean } = {}) {
  const { mountFrontend = true, normalizeApiBase = false } = options;
  const app = express();

  // Bulletproof URL normalizer for Vercel serverless functions & local dev
  app.use((req, _res, next) => {
    try {
      const rawUrl = req.url || '';
      const [pathname, search] = rawUrl.split('?');
      const searchParams = new URLSearchParams(search || '');
      const route = searchParams.get('__route');

      if (route) {
        searchParams.delete('__route');
        const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
        const pathPart = cleanRoute.startsWith('api/') ? cleanRoute : `api/${cleanRoute}`;
        const remainingSearch = searchParams.toString();
        req.url = `/${pathPart}${remainingSearch ? `?${remainingSearch}` : ''}`;
      } else if (normalizeApiBase && !req.url.startsWith('/api')) {
        req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
      }
    } catch (e) {
      // Keep original req.url on fallback
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // Health check endpoint (does not leak secrets)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'Launch-Your-Store',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Admin endpoint: Reset database to 100% clean state (0 sample data)
  app.post('/api/admin/reset-clean', (req, res) => {
    const cleanData = db.resetToCleanSlate();
    return res.json({ success: true, message: 'Database reset to clean state.', data: cleanData });
  });

  // ---------------- AUTHENTICATION & PHONE OTP ----------------
  app.post('/api/auth/send-otp', async (req, res) => {
    const { phone, role } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Valid phone number is required.' });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const existingUser = db.getUserByPhone(cleanPhone);

    // Rule: One phone number maps to one user identity and primary role
    if (existingUser && existingUser.role !== role) {
      return res.status(409).json({
        roleMismatch: true,
        existingRole: existingUser.role,
        requestedRole: role,
        message: `This phone number is already registered as a ${existingUser.role}. Would you like to sign in as ${existingUser.role} or upgrade your account?`,
      });
    }

    const session = db.createOtpSession(cleanPhone, role || 'CUSTOMER');

    // Dispatch SMS via provider (Twilio, Fast2SMS, Webhook, or Console logger)
    const smsResult = await sendSmsOtp(cleanPhone, session.code);

    return res.json({
      success: true,
      message: smsResult.message,
      phone: cleanPhone,
      role: session.role,
      provider: smsResult.provider,
      expiresInSeconds: 300,
    });
  });

  // Direct Instant Login (No OTP verification required - creates unique User ID)
  app.post('/api/auth/login-direct', (req, res) => {
    const { phone, name, role } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Valid phone number is required.' });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    let user = db.getUserByPhone(cleanPhone);
    const inputName = typeof name === 'string' && name.trim() ? name.trim() : null;

    if (!user) {
      const targetRole = (role === 'SHOPKEEPER' ? 'SHOPKEEPER' : 'CUSTOMER') as 'SHOPKEEPER' | 'CUSTOMER';
      user = db.createUser({
        phone: cleanPhone,
        name: inputName || (targetRole === 'SHOPKEEPER' ? 'Store Owner' : 'Customer'),
        role: targetRole,
      });
      console.log(`[AUTH] Created new user with unique ID: ${user.id} (${cleanPhone}), name: ${user.name}`);
    } else {
      if (inputName) {
        user = db.updateUser(user.id, { name: inputName }) || user;
      }
      if (role && user.role !== role) {
        user = db.updateUserRole(user.id, role) || user;
      }
    }

    let store = null;
    if (user.role === 'SHOPKEEPER') {
      const stores = db.getStoresByOwner(user.id);
      store = stores.length > 0 ? stores[0] : null;
    }

    return res.json({
      success: true,
      user,
      store,
    });
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, name, role } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    let user = db.getUserByPhone(cleanPhone);
    const inputName = typeof name === 'string' && name.trim() ? name.trim() : null;

    if (!user) {
      const targetRole = (role === 'SHOPKEEPER' ? 'SHOPKEEPER' : 'CUSTOMER') as 'SHOPKEEPER' | 'CUSTOMER';
      user = db.createUser({
        phone: cleanPhone,
        name: inputName || (targetRole === 'SHOPKEEPER' ? 'Store Owner' : 'Customer'),
        role: targetRole,
      });
      console.log(`[AUTH] Created unique user ID: ${user.id} for ${cleanPhone}, name: ${user.name}`);
    } else {
      if (inputName) {
        user = db.updateUser(user.id, { name: inputName }) || user;
      }
      if (role && user.role !== role) {
        user = db.updateUserRole(user.id, role) || user;
      }
    }

    let store = null;
    if (user.role === 'SHOPKEEPER') {
      const stores = db.getStoresByOwner(user.id);
      store = stores.length > 0 ? stores[0] : null;
    }

    return res.json({
      success: true,
      user,
      store,
    });
  });

  app.post('/api/auth/profile', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const { name, email } = req.body;
    const updates: Partial<User> = {};
    if (typeof name === 'string' && name.trim()) {
      updates.name = name.trim();
    }
    if (typeof email === 'string') {
      updates.email = email.trim();
    }
    const updated = db.updateUser(userId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ success: true, user: updated });
  });

  app.post('/api/auth/switch-role', (req, res) => {
    const { userId, newRole } = req.body;
    if (!userId || !newRole) {
      return res.status(400).json({ error: 'User ID and target role are required.' });
    }
    const updatedUser = db.updateUserRole(userId, newRole);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let store = null;
    if (newRole === 'SHOPKEEPER') {
      const stores = db.getStoresByOwner(updatedUser.id);
      store = stores.length > 0 ? stores[0] : null;
    }

    return res.json({
      success: true,
      user: updatedUser,
      store,
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let store = null;
    if (user.role === 'SHOPKEEPER') {
      const stores = db.getStoresByOwner(user.id);
      store = stores.length > 0 ? stores[0] : null;
    }

    return res.json({ user, store });
  });

  // ---------------- STORES ----------------
  app.get('/api/stores', (req, res) => {
    const stores = db.getAllPublishedStores();
    return res.json(stores);
  });

  app.get('/api/stores/:slug', (req, res) => {
    const slug = req.params.slug;
    const store = db.getStoreBySlug(slug);
    if (!store) {
      return res.status(404).json({ error: `Store with slug "${slug}" not found.` });
    }
    const products = db.getProducts({ storeId: store.id, isAvailable: true });
    const categories = db.getCategories(store.id);
    return res.json({
      store,
      products,
      categories,
    });
  });

  app.post('/api/stores', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to create a store.' });
    }

    const {
      name,
      slug,
      businessName,
      businessType,
      contactPhone,
      contactEmail,
      address,
      gmapsUrl,
      logo,
      banner,
      tagline,
      themeId,
      customColors,
      customFont,
      announcement,
      verificationDetails,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Store name and unique store slug are required.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = db.getStoreBySlug(cleanSlug);
    if (existing) {
      return res.status(409).json({ error: `The store URL slug "${cleanSlug}" is already taken. Please choose another.` });
    }

    const newStore = db.createStore({
      ownerId: userId,
      name,
      slug: cleanSlug,
      businessName: businessName || name,
      businessType: businessType || 'Sole Proprietorship',
      contactPhone: contactPhone || '',
      contactEmail: contactEmail || '',
      address: address || '',
      gmapsUrl: gmapsUrl || '',
      logo: logo || '',
      banner: banner || '',
      tagline: tagline || '',
      themeId: themeId || 'modern-minimal',
      customColors: customColors || {
        primary: '#18181b',
        secondary: '#27272a',
        accent: '#0284c7',
        bg: '#ffffff',
        text: '#09090b',
      },
      customFont: customFont || 'inter',
      announcement: announcement || '',
      isPublished: true,
      verificationStatus: verificationDetails?.gstin ? 'SUBMITTED' : 'PHONE_VERIFIED',
      verificationDetails: verificationDetails || {},
    });

    return res.status(201).json(newStore);
  });

  app.put('/api/stores/:id', (req, res) => {
    const storeId = req.params.id;
    const userId = req.headers['x-user-id'] as string;
    const store = db.getStoreById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }
    // Verify multi-tenant ownership
    if (userId && store.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You do not own this store.' });
    }

    const updated = db.updateStore(storeId, req.body);
    return res.json(updated);
  });

  // Business verification submission & review
  app.post('/api/stores/:id/verify', (req, res) => {
    const storeId = req.params.id;
    const { gstin, udyam, documentType, documentUrl } = req.body;
    const store = db.getStoreById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    const updated = db.updateStore(storeId, {
      verificationStatus: 'PENDING_REVIEW',
      verificationDetails: {
        gstin,
        udyam,
        documentType: documentType || 'GST Certificate',
        documentUrl: documentUrl || 'https://storage.example.com/docs/cert-uploaded.pdf',
        submittedAt: new Date().toISOString(),
      },
    });
    return res.json(updated);
  });

  // Admin review simulation (supports VERIFIED, REJECTED with reason, RESUBMIT)
  app.post('/api/stores/:id/admin-toggle-verify', (req, res) => {
    const storeId = req.params.id;
    const { status, reviewNotes } = req.body;
    const store = db.getStoreById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    const updated = db.updateStore(storeId, {
      verificationStatus: status,
      verificationDetails: {
        ...store.verificationDetails,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reviewNotes || (status === 'VERIFIED' ? 'Verified after official state registry check.' : 'Rejected: Uploaded document blur or incomplete.'),
      },
    });
    return res.json(updated);
  });

  // ---------------- CATEGORIES ----------------
  app.get('/api/categories', (req, res) => {
    const storeId = req.query.storeId as string | undefined;
    const categories = db.getCategories(storeId);
    return res.json(categories);
  });

  app.post('/api/categories', (req, res) => {
    const { name, storeId } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Category name is required.' });
    }
    const cat = db.addCategory(name.trim(), storeId);
    return res.status(201).json(cat);
  });

  // ---------------- PRODUCTS ----------------
  app.get('/api/products', (req, res) => {
    const storeId = req.query.storeId as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const search = req.query.search as string | undefined;
    const products = db.getProducts({ storeId, categoryId, search });
    return res.json(products);
  });

  app.get('/api/products/:id', (req, res) => {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json(product);
  });

  app.post('/api/products', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const {
      storeId,
      name,
      description,
      categoryId,
      categoryName,
      price,
      compareAtPrice,
      stock,
      sku,
      images,
      variants,
      isFeatured,
    } = req.body;

    if (!storeId || !name || price === undefined) {
      return res.status(400).json({ error: 'storeId, name, and price are required.' });
    }

    const store = db.getStoreById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }
    if (userId && store.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: store mismatch.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const product = db.createProduct({
      storeId,
      name,
      slug: `${slug}-${Date.now().toString(36)}`,
      description: description || '',
      categoryId: categoryId || 'cat-fashion',
      categoryName: categoryName || 'General',
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      stock: Number(stock || 0),
      sku: sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
      images: Array.isArray(images) ? images : [],
      variants: variants || [],
      isFeatured: Boolean(isFeatured),
      isAvailable: true,
    });

    return res.status(201).json(product);
  });

  app.put('/api/products/:id', (req, res) => {
    const prodId = req.params.id;
    const userId = req.headers['x-user-id'] as string;
    const existing = db.getProductById(prodId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const store = db.getStoreById(existing.storeId);
    if (store && userId && store.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: store mismatch.' });
    }

    const updated = db.updateProduct(prodId, req.body);
    return res.json(updated);
  });

  app.delete('/api/products/:id', (req, res) => {
    const prodId = req.params.id;
    const userId = req.headers['x-user-id'] as string;
    const existing = db.getProductById(prodId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const store = db.getStoreById(existing.storeId);
    if (store && userId && store.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: store mismatch.' });
    }

    const ok = db.deleteProduct(prodId);
    return res.json({ success: ok });
  });

  // Bulk one-click sample product import for onboarding
  app.post('/api/products/sample-import', (req, res) => {
    const { storeId, categoryIds } = req.body;
    if (!storeId || !Array.isArray(categoryIds)) {
      return res.status(400).json({ error: 'storeId and categoryIds array are required.' });
    }

    const importedProducts = [];
    for (const catId of categoryIds) {
      const samples = SAMPLE_CATEGORY_PRODUCTS[catId] || [];
      for (const sample of samples) {
        const prod = db.createProduct({
          ...sample,
          storeId,
        });
        importedProducts.push(prod);
      }
    }

    return res.json({
      success: true,
      count: importedProducts.length,
      products: importedProducts,
    });
  });

  // ---------------- CSV IMPORT ----------------
  app.get('/api/import/template', (req, res) => {
    const csvContent = generateCsvTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="store-products-template.csv"');
    return res.send(csvContent);
  });

  app.post('/api/import/preview', (req, res) => {
    const { csvContent, storeId } = req.body;
    if (!csvContent || !storeId) {
      return res.status(400).json({ error: 'csvContent and storeId are required.' });
    }
    const preview = parseAndValidateCsv(csvContent, storeId);
    return res.json(preview);
  });

  app.post('/api/import/execute', (req, res) => {
    const { csvContent, storeId } = req.body;
    if (!csvContent || !storeId) {
      return res.status(400).json({ error: 'csvContent and storeId are required.' });
    }
    const preview = parseAndValidateCsv(csvContent, storeId);
    const createdProds = [];
    for (const item of preview.validProducts) {
      const prod = db.createProduct(item);
      createdProds.push(prod);
    }
    return res.json({
      success: true,
      totalRows: preview.totalRows,
      importedCount: createdProds.length,
      invalidCount: preview.invalidRowsCount,
      errors: preview.errors,
      products: createdProds,
    });
  });

  // ---------------- CART & WISHLIST ----------------
  app.get('/api/cart', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const cart = db.getCart(userId);
    return res.json(cart);
  });

  app.post('/api/cart', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const { items } = req.body;
    const cart = db.updateCart(userId, items || []);
    return res.json(cart);
  });

  app.post('/api/cart/clear', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    db.clearCart(userId);
    return res.json({ success: true });
  });

  app.get('/api/wishlist', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const items = db.getWishlist(userId);
    return res.json(items);
  });

  app.post('/api/wishlist/toggle', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const { productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'userId and productId required.' });
    const updated = db.toggleWishlist(userId, productId);
    return res.json(updated);
  });

  // ---------------- ORDERS ----------------
  app.get('/api/orders', (req, res) => {
    const storeId = req.query.storeId as string | undefined;
    const customerId = req.query.customerId as string | undefined;
    const orders = db.getOrders({ storeId, customerId });
    return res.json(orders);
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    return res.json(order);
  });

  app.post('/api/orders', (req, res) => {
    const {
      storeId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items,
      paymentMethod,
    } = req.body;

    if (!storeId || !customerId || !items || !items.length || !shippingAddress) {
      return res.status(400).json({ error: 'Incomplete order payload.' });
    }

    // Calculate totals strictly on the server to prevent client manipulation
    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const prod = db.getProductById(item.productId);
      if (!prod) {
        return res.status(400).json({ error: `Product with ID ${item.productId} not found.` });
      }
      const itemPrice = prod.price;
      calculatedSubtotal += itemPrice * item.quantity;
      verifiedItems.push({
        productId: prod.id,
        name: prod.name,
        variantLabel: item.variantLabel,
        price: itemPrice,
        quantity: item.quantity,
        image: prod.images?.[0] || '',
      });
    }

    const tax = Math.round(calculatedSubtotal * 0.05 * 100) / 100; // 5% GST
    const shipping = calculatedSubtotal >= 999 ? 0 : 60;
    const total = Math.round((calculatedSubtotal + tax + shipping) * 100) / 100;

    const result = db.createOrder({
      storeId,
      customerId,
      customerName: customerName || 'Shopper',
      customerPhone: customerPhone || '+91 99999 99999',
      customerEmail: customerEmail || 'customer@example.com',
      shippingAddress,
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      tax,
      shipping,
      total,
      status: 'PENDING',
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Clear cart on successful order
    db.clearCart(customerId);

    return res.status(201).json(result.order);
  });

  app.put('/api/orders/:id/status', (req, res) => {
    const orderId = req.params.id;
    const { status, note, estimatedDeliveryDate } = req.body;
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid order status. Allowed: ${validStatuses.join(', ')}` });
    }

    const updated = db.updateOrderStatus(orderId, status, note, estimatedDeliveryDate);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.json(updated);
  });

  // ---------------- AI ANALYTICS & STORE INTELLIGENCE ----------------
  app.post('/api/ai/analytics', async (req, res) => {
    const { storeId, query } = req.body;
    if (!storeId || !query) {
      return res.status(400).json({ error: 'storeId and query string are required.' });
    }
    try {
      const response = await answerStoreQuery(storeId, query);
      return res.json(response);
    } catch (err: any) {
      console.error('[AI Analytics Error]', err);
      return res.status(500).json({ error: err.message || 'Failed to process AI store query.' });
    }
  });

  app.get('/api/analytics/:storeId', (req, res) => {
    const storeId = req.params.storeId;
    const days = parseInt(req.query.days as string, 10) || 30;
    const analytics = db.getStoreAnalytics(storeId, days);
    return res.json(analytics);
  });

  if (mountFrontend) {
    // In production or development: setup Vite or static file serving
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      });
    } else {
      // Mount Vite middlewares in development
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);

      app.use('*', async (req, res, next) => {
        if (req.originalUrl.startsWith('/api')) {
          return next();
        }
        try {
          const fs = await import('fs/promises');
          const indexPath = path.resolve(__dirname, 'index.html');
          let template = await fs.readFile(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          next(e);
        }
      });
    }
  }

  return app;
}

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const app = await createApp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Launch-Your-Store] Server running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('[Launch-Your-Store] Fatal server start failure:', err);
    process.exit(1);
  });
}
