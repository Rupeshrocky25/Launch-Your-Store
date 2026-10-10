import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ImageUploader } from '../common/ImageUploader';
import { Store, StoreThemeId, Category } from '../../types';
import {
  Store as StoreIcon,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Upload,
  Download,
  AlertCircle,
  Eye,
  ExternalLink,
  ShieldCheck,
  Layers,
  Palette,
  FileSpreadsheet,
  Package,
} from 'lucide-react';

const PREDEFINED_CATEGORIES = [
  { id: 'cat-fashion', name: 'Apparel & Fashion' },
  { id: 'cat-grocery', name: 'Organic & Grocery' },
  { id: 'cat-artisan', name: 'Artisan & Handcrafts' },
  { id: 'cat-home', name: 'Home & Living' },
  { id: 'cat-beauty', name: 'Wellness & Beauty' },
  { id: 'cat-electronics', name: 'Tech & Electronics' },
  { id: 'cat-bakery', name: 'Bakery & Sweets' },
];

const THEME_OPTIONS: { id: StoreThemeId; title: string; desc: string; previewBg: string; tag: string }[] = [
  {
    id: 'modern-minimal',
    title: 'Modern Minimal',
    desc: 'Clean monochrome spacing, sleek modern typography, refined negative space.',
    previewBg: 'bg-white border-zinc-200 text-zinc-900',
    tag: 'Fashion & Tech',
  },
  {
    id: 'bold-commerce',
    title: 'Bold Commerce',
    desc: 'High-contrast accents, prominent promo cards, high conversion layout.',
    previewBg: 'bg-amber-50 border-amber-300 text-zinc-900',
    tag: 'Retail & Electronics',
  },
  {
    id: 'elegant-boutique',
    title: 'Elegant Boutique',
    desc: 'Warm cream tones, serif playfair typography, luxury artisanal styling.',
    previewBg: 'bg-[#faf8f5] border-[#ede5d8] text-[#3e3227]',
    tag: 'Artisans & Jewelry',
  },
  {
    id: 'fresh-market',
    title: 'Fresh Market',
    desc: 'Vibrant organic emerald greens, friendly rounded cards, farm-fresh feel.',
    previewBg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    tag: 'Grocery & Organic',
  },
];

export const OnboardingWizard: React.FC<{
  onComplete: (store: Store) => void;
  onCancel?: () => void;
}> = ({ onComplete, onCancel }) => {
  const { user, setStore, updateProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business Details
  const [ownerName, setOwnerName] = useState(user?.name || '');
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Sole Proprietorship');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gmapsUrl, setGmapsUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [gstin, setGstin] = useState('');
  const [udyam, setUdyam] = useState('');

  // Step 2: Categories
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [customCatInput, setCustomCatInput] = useState('');
  const [customCategories, setCustomCategories] = useState<{ id: string; name: string }[]>([]);

  // Step 3: Products Setup
  const [productSetupMode, setProductSetupMode] = useState<'sample' | 'csv' | 'empty'>('empty');
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<any | null>(null);

  // Step 4: Theme & Styling
  const [selectedTheme, setSelectedTheme] = useState<StoreThemeId>('modern-minimal');
  const [selectedFont, setSelectedFont] = useState<'inter' | 'playfair' | 'plus-jakarta' | 'space-grotesk'>('inter');

  // Step 5: Published Store State
  const [createdStore, setCreatedStore] = useState<Store | null>(null);

  // Auto-generate slug from store name
  function handleStoreNameChange(name: string) {
    setStoreName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setStoreSlug(slug);
  }

  function toggleCategory(catId: string) {
    if (selectedCatIds.includes(catId)) {
      if (selectedCatIds.length <= 1) {
        setError('Please keep at least one category selected.');
        return;
      }
      setSelectedCatIds(selectedCatIds.filter(id => id !== catId));
    } else {
      setSelectedCatIds([...selectedCatIds, catId]);
      setError(null);
    }
  }

  function handleAddCustomCategory() {
    if (!customCatInput.trim()) return;
    const catName = customCatInput.trim();
    const id = `cat-custom-${Date.now()}`;
    setCustomCategories([...customCategories, { id, name: catName }]);
    setSelectedCatIds([...selectedCatIds, id]);
    setCustomCatInput('');
  }

  async function handleDownloadCsvTemplate() {
    try {
      const csv = await api.getCsvTemplate();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'store-products-template.csv';
      a.click();
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePreviewCsv(content: string) {
    setCsvText(content);
    if (!content.trim()) return;
    try {
      const preview = await api.previewCsv(content, 'temp-store');
      setCsvPreview(preview);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handlePublishStore() {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create the store
      const storePayload = {
        name: storeName,
        slug: storeSlug,
        businessName,
        businessType,
        contactPhone,
        contactEmail,
        address,
        gmapsUrl,
        logo: logoUrl,
        banner: bannerUrl,
        tagline,
        themeId: selectedTheme,
        customFont: selectedFont,
        verificationDetails: gstin ? { gstin, udyam, submittedAt: new Date().toISOString() } : undefined,
      };

      const newStore = await api.createStore(storePayload);

      // Update shopkeeper profile name to match input given while registering
      if (ownerName.trim()) {
        try {
          await updateProfile({ name: ownerName.trim() });
        } catch (e) {
          console.warn('Profile name sync:', e);
        }
      }

      // 2. Add custom categories if any
      for (const customCat of customCategories) {
        if (selectedCatIds.includes(customCat.id)) {
          await api.addCategory(customCat.name, newStore.id);
        }
      }

      // 3. Populate products if CSV provided
      if (productSetupMode === 'csv' && csvText) {
        await api.executeCsvImport(csvText, newStore.id);
      } else if (productSetupMode === 'sample') {
        await api.importSampleProducts(newStore.id, selectedCatIds);
      }

      setCreatedStore(newStore);
      setStore(newStore);
      setCurrentStep(5);
    } catch (err: any) {
      setError(err.message || 'Failed to create and publish store.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-zinc-900">
      {/* Wizard Header Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
          <span className="font-semibold text-zinc-900 text-sm">
            Launch-Your-Store Onboarding Wizard
          </span>
          <span>Step {currentStep} of 5</span>
        </div>

        {/* Stepper bar */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { num: 1, label: 'Business' },
            { num: 2, label: 'Categories' },
            { num: 3, label: 'Products' },
            { num: 4, label: 'Design' },
            { num: 5, label: 'Publish' },
          ].map(s => {
            const isDone = s.num < currentStep;
            const isCurrent = s.num === currentStep;

            return (
              <div key={s.num} className="flex flex-col gap-1.5">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isDone
                      ? 'bg-emerald-600'
                      : isCurrent
                      ? 'bg-zinc-900'
                      : 'bg-zinc-200'
                  }`}
                />
                <span
                  className={`text-[11px] font-medium hidden sm:block ${
                    isCurrent ? 'text-zinc-900 font-bold' : 'text-zinc-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: BUSINESS DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900">Step 1: Business & Store Details</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Tell us about your company and claim your unique storefront web address.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium text-zinc-700 mb-1">
                  Shopkeeper / Owner Full Name <span className="text-rose-600 font-bold">* Compulsory</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Your registered name as the shopkeeper of this space will be saved exactly as entered here.
                </p>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Store Name (Customer Facing)</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={e => handleStoreNameChange(e.target.value)}
                  placeholder="e.g. Heritage Teas"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Storefront URL Slug</label>
                <div className="flex items-center rounded-xl border border-zinc-300 overflow-hidden bg-zinc-50 focus-within:ring-1 focus-within:ring-zinc-900">
                  <span className="px-2.5 text-zinc-400 text-xs font-mono">/store/</span>
                  <input
                    type="text"
                    required
                    value={storeSlug}
                    onChange={e => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 px-2 py-2 bg-transparent text-xs font-mono font-semibold text-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Registered Business Entity Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Entity Type</label>
                <select
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900 bg-white"
                >
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="Private Limited">Private Limited Company</option>
                  <option value="Handloom Collective">Handloom Artisan Collective</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-zinc-700 mb-1">Store Tagline / Bio</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUploader
                  value={logoUrl}
                  onChange={setLogoUrl}
                  label="Shop Photo / Logo"
                  required
                  helperText="Shop photo is compulsory. Drag & drop image file or select from folder."
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUploader
                  value={bannerUrl}
                  onChange={setBannerUrl}
                  label="Storefront Hero Banner (Optional)"
                  aspectRatio="banner"
                  helperText="Optional storefront header banner. Drag & drop image file or select from folder."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-zinc-700 mb-1">Operating Business Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-zinc-700 mb-1">
                  Shop Location (Google Maps Share Link URL)
                </label>
                <input
                  type="url"
                  value={gmapsUrl}
                  onChange={e => setGmapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=... or https://goo.gl/maps/..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 font-mono focus:ring-1 focus:ring-zinc-900 text-xs"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Provide your shop location on Google Maps so customers can locate your physical store.
                </p>
              </div>

              {/* Optional verification identifiers */}
              <div>
                <label className="block font-medium text-zinc-700 mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={e => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Udyam MSME Registration (Optional)</label>
                <input
                  type="text"
                  value={udyam}
                  onChange={e => setUdyam(e.target.value.toUpperCase())}
                  placeholder="e.g. UDYAM-KR-03-0012345"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-100">
              <button
                onClick={() => {
                  if (!ownerName.trim()) {
                    setError('Please provide your full owner name. It is compulsory.');
                    return;
                  }
                  if (!storeName || !storeSlug || !logoUrl || !logoUrl.trim()) {
                    setError('Please provide store name, slug, and a compulsory shop photo.');
                    return;
                  }
                  if (ownerName.trim() && ownerName.trim() !== user?.name) {
                    updateProfile({ name: ownerName.trim() }).catch(console.error);
                  }
                  setError(null);
                  setCurrentStep(2);
                }}
                className="py-2.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Next: Select Categories
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORIES */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900">Step 2: Categories Setup</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Select your product lines and add any custom categories needed for your catalog.
              </p>
            </div>

            {/* Predefined Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PREDEFINED_CATEGORIES.map(cat => {
                const isSelected = selectedCatIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-50 text-zinc-900 ring-1 ring-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 bg-white'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom categories */}
            {customCategories.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-700">Custom Categories Added:</h4>
                <div className="flex flex-wrap gap-2">
                  {customCategories.map(cat => (
                    <span
                      key={cat.id}
                      className="px-3 py-1 bg-zinc-100 border border-zinc-200 rounded-lg text-xs text-zinc-800 flex items-center gap-1.5"
                    >
                      {cat.name}
                      <button
                        onClick={() => {
                          setCustomCategories(customCategories.filter(c => c.id !== cat.id));
                          setSelectedCatIds(selectedCatIds.filter(id => id !== cat.id));
                        }}
                        className="text-zinc-400 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add Custom Category Input */}
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 flex gap-2">
              <input
                type="text"
                value={customCatInput}
                onChange={e => setCustomCatInput(e.target.value)}
                placeholder="Add custom category name (e.g. Clay Ceramics)..."
                className="flex-1 px-3 py-2 bg-white rounded-lg border border-zinc-300 text-xs focus:ring-1 focus:ring-zinc-900"
              />
              <button
                type="button"
                onClick={handleAddCustomCategory}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Add Category
              </button>
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-100">
              <button
                onClick={() => setCurrentStep(1)}
                className="py-2.5 px-4 text-zinc-600 hover:text-zinc-900 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="py-2.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Next: Product Setup
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PRODUCTS SETUP */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900">Step 3: Initial Product Setup</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Choose how you want to seed your initial product catalog.
              </p>
            </div>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setProductSetupMode('empty')}
                className={`p-4 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  productSetupMode === 'empty'
                    ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <Package className="w-5 h-5 text-zinc-900 mb-2" />
                <h4 className="font-bold text-zinc-900">Clean Slate (Empty Catalog)</h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Start fresh with 0 products. Add your real products using drag &amp; drop photos later.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setProductSetupMode('csv')}
                className={`p-4 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  productSetupMode === 'csv'
                    ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-blue-600 mb-2" />
                <h4 className="font-bold text-zinc-900">Upload CSV Spreadsheet</h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Import your inventory using our standardized CSV template with error detection.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setProductSetupMode('sample')}
                className={`p-4 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  productSetupMode === 'sample'
                    ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <Sparkles className="w-5 h-5 text-emerald-600 mb-2" />
                <h4 className="font-bold text-zinc-900">1-Click Demo Samples</h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Optionally seed catalog with sample products for testing your storefront.
                </p>
              </button>
            </div>

            {productSetupMode === 'empty' && (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-zinc-900">Clean Slate Confirmed</p>
                <p className="text-[11px] text-zinc-500">
                  No sample products will be added. You can create your products directly in the Seller Dashboard with custom photos and prices.
                </p>
              </div>
            )}

            {productSetupMode === 'sample' && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-2">
                <p className="font-semibold text-emerald-950">
                  Ready to import realistic products for:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCatIds.map(catId => {
                    const match = PREDEFINED_CATEGORIES.find(c => c.id === catId);
                    return (
                      <span key={catId} className="px-2 py-0.5 bg-white border border-emerald-200 text-emerald-800 rounded-md text-[11px] font-medium">
                        {match?.name || catId}
                      </span>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-500">
                  You can edit, add, or delete any product later from your Shopkeeper Dashboard.
                </p>
              </div>
            )}

            {productSetupMode === 'csv' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                  <div>
                    <span className="font-semibold text-zinc-900 block">Download Official CSV Template</span>
                    <span className="text-[11px] text-zinc-500">Headers: name, sku, category, price, stock, description, imageUrl</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Paste CSV Data or Upload
                  </label>
                  <textarea
                    rows={4}
                    value={csvText}
                    onChange={e => handlePreviewCsv(e.target.value)}
                    placeholder="name,sku,category,price,compareAtPrice,stock,description,imageUrl&#10;Organic Green Tea,TEA-01,Grocery,350,400,20,Pure loose leaf,https://..."
                    className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                {csvPreview && (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span>Total Rows: {csvPreview.totalRows}</span>
                      <span className="text-emerald-700">Valid: {csvPreview.validRowsCount}</span>
                      <span className="text-rose-700">Errors: {csvPreview.invalidRowsCount}</span>
                    </div>
                    {csvPreview.errors?.length > 0 && (
                      <div className="mt-2 text-rose-700 space-y-1 text-[11px]">
                        {csvPreview.errors.map((err: any, i: number) => (
                          <p key={i}>• Row {err.rowNumber}: {err.message}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-zinc-100">
              <button
                onClick={() => setCurrentStep(2)}
                className="py-2.5 px-4 text-zinc-600 hover:text-zinc-900 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="py-2.5 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Next: Store Design
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: STORE DESIGN */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900">Step 4: Choose Storefront Theme</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Select from four distinct layouts crafted for distinct shopping experiences.
              </p>
            </div>

            {/* 4 Themes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEME_OPTIONS.map(theme => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-zinc-900 ring-2 ring-zinc-900 shadow-sm'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        {theme.tag}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Selected
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900">{theme.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{theme.desc}</p>

                    <div className={`mt-3 p-3 rounded-lg border text-xs ${theme.previewBg}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">{storeName}</span>
                        <span className="text-[10px] opacity-75">Cart (0)</span>
                      </div>
                      <div className="text-[10px] opacity-70">Catalog Preview · Handcrafted</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Font selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-2">
                Brand Typography Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'inter', label: 'Inter Sans', sub: 'Clean Modern' },
                  { id: 'playfair', label: 'Playfair Serif', sub: 'Luxury Boutique' },
                  { id: 'plus-jakarta', label: 'Plus Jakarta', sub: 'Warm Friendly' },
                  { id: 'space-grotesk', label: 'Space Grotesk', sub: 'Tech Contemporary' },
                ].map(font => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setSelectedFont(font.id as any)}
                    className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      selectedFont === font.id
                        ? 'border-zinc-900 bg-zinc-50 font-bold'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <span className="block text-xs">{font.label}</span>
                    <span className="text-[10px] text-zinc-400">{font.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-100">
              <button
                onClick={() => setCurrentStep(3)}
                className="py-2.5 px-4 text-zinc-600 hover:text-zinc-900 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handlePublishStore}
                disabled={isLoading}
                className="py-3 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating Store & Catalog...' : 'Publish Store Now'}
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: CELEBRATION & LIVE STOREFRONT URL */}
        {currentStep === 5 && createdStore && (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Store Live & Published!
              </span>
              <h3 className="text-2xl font-extrabold text-zinc-900 mt-1">
                Congratulations, {createdStore.name} is Ready!
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Your catalog is live, inventory reservation is enabled, and your storefront is accessible worldwide.
              </p>
            </div>

            {/* Unique Storefront URL card */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 max-w-md mx-auto text-left">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-1">
                Your Unique Storefront Address:
              </span>
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-zinc-300 font-mono text-xs">
                <span className="font-semibold text-zinc-900 truncate">
                  /store/{createdStore.slug}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={() => onComplete(createdStore)}
                className="flex-1 py-3 px-5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                Enter Shopkeeper Dashboard
              </button>
              <a
                href={`#store-${createdStore.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onComplete(createdStore);
                }}
                className="py-3 px-5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Live Storefront
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
