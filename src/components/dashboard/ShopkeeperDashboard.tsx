import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ImageUploader } from '../common/ImageUploader';
import {
  Store,
  Product,
  Category,
  Order,
  OrderStatus,
  StoreAnalytics,
  StoreThemeId,
} from '../../types';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Palette,
  FileSpreadsheet,
  Settings,
  Bot,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  ExternalLink,
  Edit2,
  Trash2,
  Download,
  Upload,
  Send,
  ShieldCheck,
  Check,
  RefreshCw,
  Sparkles,
  DollarSign,
  User as UserIcon,
} from 'lucide-react';

interface DashboardProps {
  store: Store;
  onViewStorefront: (slug: string) => void;
}

export const ShopkeeperDashboard: React.FC<DashboardProps> = ({
  store: initialStore,
  onViewStorefront,
}) => {
  const { user, updateProfile } = useAuth();
  const [store, setStore] = useState<Store>(initialStore);
  const [sellerNameInput, setSellerNameInput] = useState(user?.name || '');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'customization' | 'categories' | 'import' | 'settings' | 'ai'
  >('overview');

  // Analytics State
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formComparePrice, setFormComparePrice] = useState('');
  const [formStock, setFormStock] = useState('20');
  const [formSku, setFormSku] = useState('');
  const [formCatId, setFormCatId] = useState('cat-fashion');
  const [formImage, setFormImage] = useState('');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatusNote, setNewStatusNote] = useState('');
  const [estimatedEta, setEstimatedEta] = useState('');

  // AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [aiConversation, setAiConversation] = useState<
    { role: 'user' | 'assistant'; text: string; evidence?: any; model?: string }[]
  >([
    {
      role: 'assistant',
      text: `Hello! I am your AI Business Analyst for **${store.name}**. I answer your business questions using verified database calculations. Ask me about your revenue, top selling items, order backlogs, or inventory warnings.`,
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [csvPreview, setCsvPreview] = useState<any | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Customization Form State
  const [custTheme, setCustTheme] = useState<StoreThemeId>(store.themeId);
  const [custFont, setCustFont] = useState(store.customFont);
  const [custLogo, setCustLogo] = useState(store.logo);
  const [custBanner, setCustBanner] = useState(store.banner);
  const [custAnnouncement, setCustAnnouncement] = useState(store.announcement);
  const [custTagline, setCustTagline] = useState(store.tagline);
  const [custGmapsUrl, setCustGmapsUrl] = useState(store.gmapsUrl || '');
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [customizationSavedNotice, setCustomizationSavedNotice] = useState(false);

  // Settings & Verification State
  const [gstinInput, setGstinInput] = useState(store.verificationDetails?.gstin || '');
  const [udyamInput, setUdyamInput] = useState(store.verificationDetails?.udyam || '');
  const [docTypeInput, setDocTypeInput] = useState('GST Trade Certificate');
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  // Sync seller name with user session
  useEffect(() => {
    if (user?.name) setSellerNameInput(user.name);
  }, [user]);

  async function handleSaveSellerName() {
    if (!sellerNameInput.trim()) return;
    try {
      await updateProfile({ name: sellerNameInput.trim() });
      setVerificationNotice('Shopkeeper profile name updated successfully!');
      setTimeout(() => setVerificationNotice(null), 3500);
    } catch (e) {
      console.error(e);
    }
  }

  // Load Dashboard Data
  useEffect(() => {
    loadAllData();
  }, [store.id, analyticsDays]);

  async function loadAllData() {
    try {
      const [anRes, prRes, catRes, ordRes] = await Promise.all([
        api.getAnalytics(store.id, analyticsDays).catch(() => null),
        api.getProducts({ storeId: store.id }).catch(() => []),
        api.getCategories(store.id).catch(() => []),
        api.getOrders({ storeId: store.id }).catch(() => []),
      ]);
      if (anRes) setAnalytics(anRes);
      setProducts(prRes);
      setCategories(catRes);
      setOrders(ordRes);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }

  // Handle Product CRUD
  function openAddProductModal() {
    setEditingProduct(null);
    setFormName('');
    setFormDesc('');
    setFormPrice('');
    setFormComparePrice('');
    setFormStock('');
    setFormSku('');
    setFormCatId(categories[0]?.id || '');
    setFormImage('');
    setIsProductModalOpen(true);
  }

  function openEditProductModal(product: Product) {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDesc(product.description);
    setFormPrice(String(product.price));
    setFormComparePrice(product.compareAtPrice ? String(product.compareAtPrice) : '');
    setFormStock(String(product.stock));
    setFormSku(product.sku);
    setFormCatId(product.categoryId);
    setFormImage(product.images?.[0] || '');
    setIsProductModalOpen(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!formImage || !formImage.trim()) {
      alert('Product photo is compulsory. Please drag & drop or select an image file from your folder.');
      return;
    }

    try {
      const cat = categories.find(c => c.id === formCatId);
      const payload: Partial<Product> = {
        storeId: store.id,
        name: formName,
        description: formDesc,
        price: parseFloat(formPrice),
        compareAtPrice: formComparePrice ? parseFloat(formComparePrice) : undefined,
        stock: parseInt(formStock, 10),
        sku: formSku,
        categoryId: formCatId,
        categoryName: cat?.name || 'General',
        images: [formImage.trim()],
        isAvailable: true,
      };

      if (editingProduct) {
        const updated = await api.updateProduct(editingProduct.id, payload);
        setProducts(products.map(p => (p.id === updated.id ? updated : p)));
      } else {
        const created = await api.createProduct(payload);
        setProducts([created, ...products]);
      }
      setIsProductModalOpen(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  }

  // Handle Order Status Update
  async function handleUpdateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      const updated = await api.updateOrderStatus(orderId, status, newStatusNote || undefined, estimatedEta || undefined);
      setOrders(orders.map(o => (o.id === updated.id ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
        setEstimatedEta(updated.estimatedDeliveryDate || '');
      }
      setNewStatusNote('');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  }

  // Handle Store Customization Save
  async function handleSaveCustomization() {
    setIsSavingCustomization(true);
    try {
      const updated = await api.updateStore(store.id, {
        themeId: custTheme,
        customFont: custFont,
        logo: custLogo,
        banner: custBanner,
        announcement: custAnnouncement,
        tagline: custTagline,
        gmapsUrl: custGmapsUrl,
      });
      setStore(updated);
      setCustomizationSavedNotice(true);
      setTimeout(() => setCustomizationSavedNotice(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save theme customization');
    } finally {
      setIsSavingCustomization(false);
    }
  }

  // Handle Verification Submit
  async function handleSubmitVerification(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await api.submitVerification(store.id, {
        gstin: gstinInput,
        udyam: udyamInput,
        documentType: docTypeInput,
      });
      setStore(updated);
      setVerificationNotice('Verification documents submitted for review.');
      setTimeout(() => setVerificationNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    }
  }

  // Admin Simulation Toggle for Verification testing
  async function handleAdminToggleVerification(status: string) {
    try {
      const updated = await api.adminToggleVerification(store.id, status);
      setStore(updated);
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Handle AI Assistant Query
  async function handleSendAiQuery(queryText?: string) {
    const q = queryText || aiQuery;
    if (!q.trim()) return;

    const userMsg = { role: 'user' as const, text: q };
    setAiConversation(prev => [...prev, userMsg]);
    setAiQuery('');
    setIsAiLoading(true);

    try {
      const res = await api.askAiAssistant(store.id, q);
      setAiConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          evidence: res.factualEvidence,
          model: res.modelUsed,
        },
      ]);
    } catch (err: any) {
      setAiConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Error processing query: ${err.message}. Please try again.`,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  }

  // CSV Import handlers
  async function handleCsvPreview(text: string) {
    setCsvContent(text);
    if (!text.trim()) return;
    try {
      const res = await api.previewCsv(text, store.id);
      setCsvPreview(res);
    } catch (err: any) {
      console.error(err);
    }
  }

  async function handleExecuteCsvImport() {
    if (!csvContent.trim()) return;
    try {
      const res = await api.executeCsvImport(csvContent, store.id);
      setImportNotice(`Successfully imported ${res.importedCount} products into your catalog!`);
      setCsvContent('');
      setCsvPreview(null);
      loadAllData();
      setTimeout(() => setImportNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Import failed');
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesCat = productCatFilter === 'all' || p.categoryId === productCatFilter;
    const matchesSearch =
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredOrders = orders.filter(o => {
    return orderStatusFilter === 'all' || o.status === orderStatusFilter;
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row text-zinc-900">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-zinc-900 text-white flex flex-col shrink-0 border-r border-zinc-800">
        {/* Brand & Store header */}
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <div className="w-9 h-9 bg-zinc-700 rounded-lg flex items-center justify-center font-bold">
                {store.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{store.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-zinc-400 font-mono">/store/{store.slug}</span>
                {store.verificationStatus === 'VERIFIED' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={openAddProductModal}
              className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
            <button
              onClick={() => onViewStorefront(store.slug)}
              className="py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer border border-zinc-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Store
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview & Stats', icon: LayoutDashboard },
            { id: 'products', label: 'Products & Stock', icon: Package, badge: products.length },
            { id: 'orders', label: 'Orders & Tracking', icon: ShoppingBag, badge: orders.filter(o => o.status === 'PENDING').length },
            { id: 'customization', label: 'Storefront Themes', icon: Palette },
            { id: 'import', label: 'Bulk Import CSV', icon: FileSpreadsheet },
            { id: 'ai', label: 'AI Business Analyst', icon: Bot, highlight: true },
            { id: 'settings', label: 'Settings & Verification', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                } ${tab.highlight && !isActive ? 'text-emerald-400 font-semibold' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${tab.highlight && !isActive ? 'text-emerald-400' : ''}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                      isActive ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Verification Status Banner in Sidebar */}
        <div className="p-4 border-t border-zinc-800 text-xs">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
            Business Status
          </span>
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold ${
                store.verificationStatus === 'VERIFIED'
                  ? 'text-emerald-400'
                  : store.verificationStatus === 'PENDING_REVIEW'
                  ? 'text-amber-400'
                  : 'text-zinc-400'
              }`}
            >
              {store.verificationStatus.replace('_', ' ')}
            </span>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Manage
            </button>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-6xl">
            {/* Header with Date Range Filter & Add Product action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Store Overview</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Manage your store catalog, add products with rates, and track live analytics.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={openAddProductModal}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Product
                </button>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-zinc-200 text-xs">
                  {[
                    { label: '7 Days', days: 7 },
                    { label: '30 Days', days: 30 },
                    { label: '90 Days', days: 90 },
                    { label: 'All Time', days: 365 },
                  ].map(r => (
                    <button
                      key={r.days}
                      onClick={() => setAnalyticsDays(r.days)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        analyticsDays === r.days
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Banner if catalog has no products yet */}
            {products.length === 0 && (
              <div className="p-5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-emerald-950 text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-zinc-800">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Action Required
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">Your Store Catalog is Empty</h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Add your items with rates (prices) so customers can view and place orders on your storefront!
                  </p>
                </div>
                <button
                  onClick={openAddProductModal}
                  className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  Add Product Now
                </button>
              </div>
            )}

            {/* Stat Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Total Gross Revenue
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold font-mono text-zinc-900">
                    ₹{analytics?.totalRevenue?.toLocaleString('en-IN') || 0}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    Paid: ₹{analytics?.paidRevenue?.toLocaleString('en-IN') || 0}
                  </span>
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Total Orders Placed
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold font-mono text-zinc-900">
                    {analytics?.totalOrdersCount || 0}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    {analytics?.deliveredCount || 0} Delivered
                  </span>
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Average Order Value (AOV)
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold font-mono text-zinc-900">
                    ₹{analytics?.averageOrderValue?.toLocaleString('en-IN') || 0}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">Per checkout</span>
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Low-Stock Items
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-extrabold font-mono ${
                      (analytics?.lowStockProducts?.length || 0) > 0 ? 'text-amber-600' : 'text-zinc-900'
                    }`}
                  >
                    {analytics?.lowStockProducts?.length || 0}
                  </span>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs text-zinc-500 hover:text-zinc-900 underline"
                  >
                    Review stock
                  </button>
                </div>
              </div>
            </div>

            {/* Low-stock warnings banner if any */}
            {analytics?.lowStockProducts && analytics.lowStockProducts.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Inventory Restock Warning:</span>
                    <span className="ml-1 text-amber-800">
                      {analytics.lowStockProducts.map(p => `${p.name} (${p.stock} units)`).join(', ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shrink-0 cursor-pointer"
                >
                  Restock Now
                </button>
              </div>
            )}

            {/* Split layout: Best Sellers & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Best-selling products */}
              <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900">Top-Selling Products</h3>
                  <span className="text-xs text-zinc-400">Past {analyticsDays} days</span>
                </div>

                {analytics?.topSellingProducts && analytics.topSellingProducts.length > 0 ? (
                  <div className="divide-y divide-zinc-100 text-xs">
                    {analytics.topSellingProducts.map((p, idx) => (
                      <div key={p.productId} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-5 font-mono text-zinc-400 font-bold">{idx + 1}.</span>
                          <span className="font-medium text-zinc-900">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-zinc-900 font-mono">₹{p.revenue}</span>
                          <span className="text-[11px] text-zinc-400 block">{p.quantity} sold</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 py-6 text-center">No sales recorded in this period yet.</p>
                )}
              </div>

              {/* Recent Orders */}
              <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900">Recent Customer Orders</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-zinc-600 hover:text-zinc-900 underline"
                  >
                    View All
                  </button>
                </div>

                <div className="divide-y divide-zinc-100 text-xs">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-900">{o.id}</span>
                          <span className="text-zinc-500">{o.customerName}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} · {o.items.length} items
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="font-mono font-semibold text-zinc-900">₹{o.total}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-6 max-w-6xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Catalog & Inventory</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Manage product variants, pricing, discounts, and real-time stock levels.
                </p>
              </div>

              <button
                onClick={openAddProductModal}
                className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search products by name or SKU..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <select
                value={productCatFilter}
                onChange={e => setProductCatFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg border border-zinc-100 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 text-xs shrink-0">
                                <Package className="w-4 h-4 opacity-40" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-zinc-900 line-clamp-1">{product.name}</p>
                              {product.variants && product.variants.length > 0 && (
                                <p className="text-[10px] text-zinc-400">
                                  {product.variants[0].options.length} variants
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{product.sku}</td>
                        <td className="py-3 px-4 text-zinc-600">{product.categoryName}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-zinc-900">₹{product.price}</span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-[10px] font-mono text-zinc-400 line-through ml-1.5">
                              ₹{product.compareAtPrice}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono font-bold ${
                              product.stock <= 5
                                ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md'
                                : product.stock <= 10
                                ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md'
                                : 'text-zinc-800'
                            }`}
                          >
                            {product.stock} units
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditProductModal(product)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add / Edit Product Modal */}
            {isProductModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden text-zinc-900 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <h3 className="text-base font-bold text-zinc-900">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    <button
                      onClick={() => setIsProductModalOpen(false)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">Product Title</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={formDesc}
                        onChange={e => setFormDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-zinc-700 mb-1">Selling Price (₹)</label>
                        <input
                          type="number"
                          required
                          value={formPrice}
                          onChange={e => setFormPrice(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-zinc-700 mb-1">Compare-At Price (₹)</label>
                        <input
                          type="number"
                          value={formComparePrice}
                          onChange={e => setFormComparePrice(e.target.value)}
                          placeholder="Original MRP"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium text-zinc-700 mb-1">Stock Qty</label>
                        <input
                          type="number"
                          required
                          value={formStock}
                          onChange={e => setFormStock(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-zinc-700 mb-1">SKU Code</label>
                        <input
                          type="text"
                          required
                          value={formSku}
                          onChange={e => setFormSku(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-zinc-700 mb-1">Category</label>
                        <select
                          value={formCatId}
                          onChange={e => setFormCatId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <ImageUploader
                      value={formImage}
                      onChange={setFormImage}
                      label="Product Photo"
                      required
                      helperText="Product photo is compulsory. Drag & drop image file or select from folder."
                    />

                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => setIsProductModalOpen(false)}
                        className="px-4 py-2 border border-zinc-300 rounded-lg text-zinc-700 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium cursor-pointer"
                      >
                        {editingProduct ? 'Save Changes' : 'Create Product'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6 max-w-6xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Orders & Fulfillment</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Update customer status in real-time. Cancelling orders safely restores inventory.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-zinc-200 text-xs">
                {['all', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer uppercase text-[10px] ${
                      orderStatusFilter === st
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">{order.id}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-zinc-900">{order.customerName}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">{order.customerPhone}</p>
                      </td>
                      <td className="py-3 px-4">{order.items.length} items</td>
                      <td className="py-3 px-4 font-mono font-bold">₹{order.total}</td>
                      <td className="py-3 px-4 text-[11px] text-zinc-600">
                        {order.paymentMethod} ({order.paymentStatus})
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : order.status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setEstimatedEta(order.estimatedDeliveryDate || '');
                          }}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          Manage Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Management Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden text-zinc-900 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div>
                      <span className="text-xs font-mono font-bold">{selectedOrder.id}</span>
                      <h3 className="text-base font-bold text-zinc-900">Manage Fulfillment</h3>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Status updater buttons */}
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-2">Update Order Status:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(st => (
                          <button
                            key={st}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                            className={`p-2 rounded-lg text-xs font-semibold text-center border cursor-pointer ${
                              selectedOrder.status === st
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">Estimated Delivery Arrival</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={estimatedEta}
                          onChange={e => setEstimatedEta(e.target.value)}
                          placeholder="e.g. Delivery by Today by 8:00 PM or Delivery by 15th Oct"
                          className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setEstimatedEta('Delivery by Today by 8:00 PM')}
                          className="px-2.5 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700 cursor-pointer"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => setEstimatedEta('Delivery by Tomorrow by 6:00 PM')}
                          className="px-2.5 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700 cursor-pointer"
                        >
                          Tomorrow
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">Status Note (Customer visible)</label>
                      <input
                        type="text"
                        value={newStatusNote}
                        onChange={e => setNewStatusNote(e.target.value)}
                        placeholder="e.g. Dispatched with BlueDart tracking BLR-9821..."
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs"
                      />
                    </div>

                    {/* Items */}
                    <div className="p-3 bg-zinc-50 rounded-xl space-y-2 border border-zinc-200">
                      <div className="flex justify-between items-center pb-1 border-b border-zinc-200 text-[11px]">
                        <span className="font-semibold text-zinc-900">Estimated Delivery Arrival:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {selectedOrder.estimatedDeliveryDate || 'Delivery by Today by 8:00 PM'}
                        </span>
                      </div>
                      <p className="font-semibold text-zinc-900">Order Items:</p>
                      {selectedOrder.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-zinc-600 text-[11px]">
                          <span>{it.name} (x{it.quantity})</span>
                          <span className="font-mono">₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                      <div className="border-t border-zinc-200 pt-1.5 flex justify-between font-bold text-zinc-900">
                        <span>Total</span>
                        <span className="font-mono">₹{selectedOrder.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STOREFRONT THEMES & CUSTOMIZATION */}
        {activeTab === 'customization' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Storefront Themes & Branding</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Choose from four distinct commercial themes. All changes persist across user devices.
                </p>
              </div>
              <button
                onClick={handleSaveCustomization}
                disabled={isSavingCustomization}
                className="py-2.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isSavingCustomization ? 'Saving...' : 'Save Theme & Publish'}
              </button>
            </div>

            {customizationSavedNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Theme changes saved! Live storefront updated.</span>
              </div>
            )}

            {/* 4 Themes */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Select Active Theme</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: 'modern-minimal' as StoreThemeId,
                    name: 'Modern Minimal',
                    desc: 'Clean stark monochrome spacing, sleek modern typography.',
                    palette: 'Black & White Neutral',
                  },
                  {
                    id: 'bold-commerce' as StoreThemeId,
                    name: 'Bold Commerce',
                    desc: 'High-contrast accents, prominent promo cards, high conversion layout.',
                    palette: 'High-Contrast Accent',
                  },
                  {
                    id: 'elegant-boutique' as StoreThemeId,
                    name: 'Elegant Boutique',
                    desc: 'Warm cream tones, serif playfair typography, luxury artisanal styling.',
                    palette: 'Warm Cream & Amber',
                  },
                  {
                    id: 'fresh-market' as StoreThemeId,
                    name: 'Fresh Market',
                    desc: 'Vibrant organic emerald greens, friendly rounded cards, farm-fresh feel.',
                    palette: 'Emerald & Earth Green',
                  },
                ].map(th => {
                  const isSel = custTheme === th.id;
                  return (
                    <div
                      key={th.id}
                      onClick={() => setCustTheme(th.id)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSel ? 'border-zinc-900 ring-2 ring-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-zinc-900">{th.name}</span>
                        {isSel && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-xs text-zinc-500">{th.desc}</p>
                      <span className="text-[10px] text-zinc-400 font-mono mt-2 block">{th.palette}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Typography & Content */}
            <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-sm text-zinc-900">Store Content & Announcement</h3>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Announcement Bar Text</label>
                <input
                  type="text"
                  value={custAnnouncement}
                  onChange={e => setCustAnnouncement(e.target.value)}
                  placeholder="e.g. Free shipping on all orders over ₹999..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Store Tagline / Bio</label>
                <input
                  type="text"
                  value={custTagline}
                  onChange={e => setCustTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUploader
                  value={custLogo}
                  onChange={setCustLogo}
                  label="Shop Photo / Profile Logo"
                  required
                  helperText="Shop photo is compulsory. Drag & drop image file or select from folder."
                />
                <ImageUploader
                  value={custBanner}
                  onChange={setCustBanner}
                  label="Storefront Hero Banner Photo"
                  aspectRatio="banner"
                  helperText="Drag & drop banner image or select from folder."
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Shop Location (Google Maps Share Link URL)
                </label>
                <input
                  type="url"
                  value={custGmapsUrl}
                  onChange={e => setCustGmapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Provide your shop location on Google Maps so customers can easily locate your store.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BULK IMPORT CSV */}
        {activeTab === 'import' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Bulk Product Import</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Download the standardized CSV template, preview column mapping, and review row-by-row validation errors.
              </p>
            </div>

            {importNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{importNotice}</span>
              </div>
            )}

            <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div>
                  <span className="font-semibold text-zinc-900 block">Download Template</span>
                  <span className="text-zinc-500">Includes sample rows and headers for immediate editing</span>
                </div>
                <button
                  onClick={async () => {
                    const csv = await api.getCsvTemplate();
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'product-template.csv';
                    a.click();
                  }}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </button>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Paste CSV Content Below</label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={e => handleCsvPreview(e.target.value)}
                  placeholder="name,sku,category,price,compareAtPrice,stock,description,imageUrl..."
                  className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              {csvPreview && (
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-900">Validation Breakdown</span>
                    <div className="flex gap-3 font-mono">
                      <span>Total: {csvPreview.totalRows}</span>
                      <span className="text-emerald-700">Valid: {csvPreview.validRowsCount}</span>
                      <span className="text-rose-700">Errors: {csvPreview.invalidRowsCount}</span>
                    </div>
                  </div>

                  {csvPreview.errors && csvPreview.errors.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                      <p className="font-semibold text-[11px]">Row-Level Errors Detected:</p>
                      {csvPreview.errors.map((err: any, idx: number) => (
                        <p key={idx} className="text-[11px]">
                          • Row {err.rowNumber} [{err.field}]: {err.message}
                        </p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleExecuteCsvImport}
                    disabled={csvPreview.validRowsCount === 0}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    Import {csvPreview.validRowsCount} Valid Products Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AI BUSINESS ANALYST */}
        {activeTab === 'ai' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">AI Store Business Analyst</h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Powered by Gemini on server. Answers are strictly calculated from your real store data with proof metrics.
              </p>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'What are my top 5 selling products this month?',
                'Which products are low on stock?',
                'What was my revenue breakdown over the past 30 days?',
                'How many orders are awaiting shipment?',
                'Which products have not sold recently?',
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSendAiQuery(prompt)}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-lg transition-colors cursor-pointer text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>

            {/* Conversation Window */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5 flex flex-col h-[520px]">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {aiConversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-zinc-900 text-white font-medium rounded-br-xs'
                          : 'bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.model && (
                      <span className="text-[10px] text-zinc-400 mt-1 ml-1 font-mono">
                        Source: Verified DB Metrics ({msg.model})
                      </span>
                    )}
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 p-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Calculating database analytics...
                  </div>
                )}
              </div>

              {/* Input Box */}
              <div className="pt-4 border-t border-zinc-100 flex gap-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendAiQuery()}
                  placeholder="Ask a question about your revenue, sales, or inventory..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-zinc-50/50"
                />
                <button
                  onClick={() => handleSendAiQuery()}
                  disabled={isAiLoading || !aiQuery.trim()}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS & VERIFICATION */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Settings & Business Verification</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage business registration credentials, GSTIN, Udyam MSME, and storefront status.
              </p>
            </div>

            {verificationNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{verificationNotice}</span>
              </div>
            )}

            {/* Shopkeeper Space Profile Card */}
            <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs space-y-4 text-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Shopkeeper Space Profile</h3>
                  <p className="text-[11px] text-zinc-500">Your registered user name in this store management space.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Registered Shopkeeper Name <span className="text-rose-600 font-bold">* Compulsory</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sellerNameInput}
                    onChange={e => setSellerNameInput(e.target.value)}
                    placeholder="Enter your shopkeeper name"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Registered Phone</label>
                  <input
                    type="text"
                    disabled
                    value={user?.phone || 'No phone set'}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 font-mono text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveSellerName}
                className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium cursor-pointer shadow-xs transition-colors"
              >
                Update Shopkeeper Name
              </button>
            </div>

            {/* Verification Status Card */}
            <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    Current Verification Level
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-bold text-zinc-900">
                      {store.verificationStatus.replace('_', ' ')}
                    </span>
                    {store.verificationStatus === 'VERIFIED' && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                        Verified Merchant
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin simulation buttons for hackathon evaluator */}
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block mb-1">
                    Evaluator Verification Simulator:
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAdminToggleVerification('VERIFIED')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Approve (Verify)
                    </button>
                    <button
                      onClick={() => handleAdminToggleVerification('REJECTED')}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAdminToggleVerification('PENDING_REVIEW')}
                      className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded text-[10px] font-bold cursor-pointer"
                    >
                      Pending
                    </button>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitVerification} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={gstinInput}
                      onChange={e => setGstinInput(e.target.value.toUpperCase())}
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">Udyam Registration</label>
                    <input
                      type="text"
                      value={udyamInput}
                      onChange={e => setUdyamInput(e.target.value.toUpperCase())}
                      placeholder="e.g. UDYAM-KR-03-0012345"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium cursor-pointer"
                >
                  Submit Business Documents for Review
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
