import React, { useState } from 'react';
import { Store, Product, Category } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Heart,
  Search,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  Filter,
  Globe,
  Copy,
  Check,
  Link2,
} from 'lucide-react';

interface StorefrontProps {
  store: Store;
  products: Product[];
  categories: Category[];
  isEmbeddedPreview?: boolean;
}

export const StorefrontRenderer: React.FC<StorefrontProps> = ({
  store,
  products,
  categories,
  isEmbeddedPreview = false,
}) => {
  const { addToCart, toggleWishlist, isInWishlist } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Compute exact current web page URL for this shop
  const currentWebPageUrl =
    typeof window !== 'undefined'
      ? window.location.href.includes('#')
        ? window.location.href
        : `${window.location.origin}${window.location.pathname}#store-${store.slug}`
      : `http://localhost:3000/#store-${store.slug}`;

  function handleCopyWebUrl() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentWebPageUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  }

  const filteredProducts = products.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  function handleAddToCart(product: Product) {
    addToCart(product, 1, selectedVariant || undefined);
    setAddedNotice(`Added "${product.name}" to cart`);
    setTimeout(() => setAddedNotice(null), 2500);
  }

  // Theme-specific styling tokens
  const theme = store.themeId;

  // Modern Minimal theme classes
  const isMinimal = theme === 'modern-minimal';
  // Bold Commerce theme classes
  const isBold = theme === 'bold-commerce';
  // Elegant Boutique theme classes
  const isBoutique = theme === 'elegant-boutique';
  // Fresh Market theme classes
  const isFresh = theme === 'fresh-market';

  const themeFontClass =
    store.customFont === 'playfair'
      ? 'font-serif'
      : store.customFont === 'space-grotesk'
      ? 'font-mono'
      : 'font-sans';

  return (
    <div
      className={`min-h-screen text-zinc-900 ${themeFontClass} ${
        isBoutique ? 'bg-[#faf8f5]' : isFresh ? 'bg-[#f8faf8]' : isBold ? 'bg-zinc-50' : 'bg-white'
      }`}
    >
      {/* Toast Notice */}
      {addedNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-zinc-900 text-white text-xs font-medium rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{addedNotice}</span>
        </div>
      )}

      {/* Top Announcement Bar */}
      {store.announcement && (
        <div
          className={`py-2 px-4 text-center text-xs font-medium tracking-wide transition-colors ${
            isBold
              ? 'bg-amber-400 text-zinc-950 font-bold'
              : isBoutique
              ? 'bg-[#eadecc] text-[#4a3b2c]'
              : isFresh
              ? 'bg-emerald-700 text-white'
              : 'bg-zinc-900 text-white'
          }`}
        >
          {store.announcement}
        </div>
      )}

      {/* Store Header Navigation */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
          isBoutique
            ? 'bg-[#faf8f5]/90 border-[#e8e2d8]'
            : isFresh
            ? 'bg-white/90 border-emerald-100'
            : isBold
            ? 'bg-white/95 border-zinc-200'
            : 'bg-white/90 border-zinc-100'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {store.logo ? (
              <img
                src={store.logo}
                alt={store.name}
                className={`w-11 h-11 object-cover ${
                  isBoutique ? 'rounded-full border border-amber-900/20' : isFresh ? 'rounded-2xl' : 'rounded-lg'
                }`}
              />
            ) : (
              <div className="w-11 h-11 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-bold">
                {store.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-zinc-900 tracking-tight leading-none">
                  {store.name}
                </h1>
                {store.verificationStatus === 'VERIFIED' && (
                  <span title="Verified Business with verified trade identity">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{store.tagline}</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden sm:flex items-center flex-1 max-w-xs relative mx-4">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${store.name}...`}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border transition-all focus:outline-none ${
                isFresh
                  ? 'border-emerald-200 focus:ring-1 focus:ring-emerald-600 bg-emerald-50/30'
                  : 'border-zinc-200 focus:ring-1 focus:ring-zinc-900 bg-zinc-50/50'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 hidden md:inline">
              store/{store.slug}
            </span>
          </div>
        </div>
      </header>

      {/* Structured Shop Profile Section: Pic -> Name -> URL -> Details -> Location */}
      <section className="bg-white border-b border-zinc-200 py-6 px-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* 1. Profile Pic */}
            <div className="relative shrink-0">
              {store.logo ? (
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border-2 border-zinc-200 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-900 text-white rounded-2xl flex items-center justify-center text-3xl font-extrabold shadow-md">
                  {store.name.charAt(0)}
                </div>
              )}
              {store.verificationStatus === 'VERIFIED' && (
                <span className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md" title="Verified Business">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                </span>
              )}
            </div>

            <div className="space-y-2.5 max-w-2xl">
              {/* 2. Shop Name */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
                  {store.name}
                </h1>
                {store.verificationStatus === 'VERIFIED' && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Merchant
                  </span>
                )}
              </div>

              {/* 3. Shop Web Page URL */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 select-all max-w-full truncate shadow-2xs">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-zinc-500">Shop Page URL:</span>
                  <span className="font-bold truncate">{currentWebPageUrl}</span>
                </div>
                <button
                  onClick={handleCopyWebUrl}
                  className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-zinc-200 shadow-2xs"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                  {copiedUrl ? 'Copied Link!' : 'Copy URL'}
                </button>
              </div>

              {/* 4. Some Details (Tagline, Entity, Contact) */}
              <div className="space-y-1 text-xs text-zinc-600">
                <p className="font-medium text-zinc-800 italic text-sm">&ldquo;{store.tagline}&rdquo;</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                  <span><strong>Business Entity:</strong> {store.businessName} ({store.businessType})</span>
                  {store.contactPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-zinc-400" /> {store.contactPhone}
                    </span>
                  )}
                  {store.contactEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-zinc-400" /> {store.contactEmail}
                    </span>
                  )}
                </div>
              </div>

              {/* 5. Location (Physical Address & Google Maps link) */}
              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                {store.address && (
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-medium">{store.address}</span>
                  </div>
                )}
                {store.gmapsUrl && (
                  <a
                    href={store.gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    View Shop Location on Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Banner Image Section */}
      {store.banner && (
        <div className="relative h-48 sm:h-64 w-full overflow-hidden">
          <img
            src={store.banner}
            alt={store.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? isBold
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : isFresh
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : isBoutique
                  ? 'bg-[#78350f] text-white shadow-xs'
                  : 'bg-zinc-900 text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? isBold
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : isFresh
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : isBoutique
                      ? 'bg-[#78350f] text-white shadow-xs'
                      : 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl p-8">
            <ShoppingBag className="w-10 h-10 mx-auto text-zinc-300 stroke-[1.2] mb-2" />
            <p className="text-sm font-semibold text-zinc-700">No products match your selection</p>
            <p className="text-xs text-zinc-400 mt-1">Try clearing your search or switching categories.</p>
          </div>
        ) : (
          <div
            className={`grid gap-4 sm:gap-6 ${
              isBoutique
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : isFresh
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                : isBold
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {filteredProducts.map(product => {
              const inWishlist = isInWishlist(product.id);
              const discountPercent =
                product.compareAtPrice && product.compareAtPrice > product.price
                  ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                  : 0;

              return (
                <div
                  key={product.id}
                  className={`group relative flex flex-col overflow-hidden transition-all duration-200 ${
                    isBoutique
                      ? 'bg-white rounded-xl border border-[#ede5d8] hover:shadow-md'
                      : isFresh
                      ? 'bg-white rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-300'
                      : isBold
                      ? 'bg-white rounded-xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:-translate-y-0.5'
                      : 'bg-white rounded-xl border border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {/* Image container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                        <ShoppingBag className="w-8 h-8 opacity-40" />
                      </div>
                    )}

                    {/* Discount badge */}
                    {discountPercent > 0 && (
                      <span
                        className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isBold
                            ? 'bg-rose-600 text-white'
                            : isFresh
                            ? 'bg-emerald-600 text-white'
                            : isBoutique
                            ? 'bg-amber-900 text-white'
                            : 'bg-zinc-900 text-white'
                        }`}
                      >
                        {discountPercent}% OFF
                      </span>
                    )}

                    {/* Wishlist toggle button */}
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-zinc-600 shadow-xs transition-colors cursor-pointer"
                      title="Save to wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          inWishlist ? 'text-rose-500 fill-rose-500' : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      {product.categoryName || 'General'}
                    </span>
                    <h3
                      className={`text-sm font-semibold text-zinc-900 mt-1 line-clamp-1 ${
                        isBoutique ? 'font-serif' : ''
                      }`}
                    >
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 flex-1">
                      {product.description}
                    </p>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-sm sm:text-base font-bold font-mono text-zinc-900">
                        ₹{product.price}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-xs font-mono text-zinc-400 line-through">
                          ₹{product.compareAtPrice}
                        </span>
                      )}
                    </div>

                    {/* Stock status indicator */}
                    <div className="mt-2 text-[10px]">
                      {product.stock === 0 ? (
                        <span className="text-rose-600 font-bold">Out of Stock</span>
                      ) : product.stock <= 5 ? (
                        <span className="text-amber-700 font-medium">Only {product.stock} left in stock</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">In Stock ({product.stock} available)</span>
                      )}
                    </div>

                    {/* Add to Cart button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className={`mt-3 w-full py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        product.stock === 0
                          ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                          : isBold
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
                          : isFresh
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          : isBoutique
                          ? 'bg-[#78350f] hover:bg-[#60270a] text-white'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Store Footer */}
      <footer
        className={`mt-16 border-t ${
          isBoutique
            ? 'bg-[#f4efe6] border-[#e8e2d8] text-[#4a3b2c]'
            : isFresh
            ? 'bg-emerald-950 text-emerald-100 border-emerald-900'
            : isBold
            ? 'bg-zinc-900 text-zinc-200 border-zinc-800'
            : 'bg-zinc-50 text-zinc-600 border-zinc-200'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-bold">{store.businessName}</h4>
              {store.verificationStatus === 'VERIFIED' && (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <p className="text-zinc-500 max-w-sm">{store.tagline}</p>
            {store.verificationDetails?.gstin && (
              <p className="mt-2 font-mono text-[11px] text-zinc-500">
                GSTIN: {store.verificationDetails.gstin}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold mb-2">Contact & Storefront</h4>
            <div className="space-y-1.5 text-zinc-500">
              {store.contactPhone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {store.contactPhone}
                </p>
              )}
              {store.contactEmail && (
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {store.contactEmail}
                </p>
              )}
              {store.address && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-clamp-2">{store.address}</span>
                </p>
              )}
              {store.gmapsUrl && (
                <a
                  href={store.gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-[11px] font-medium transition-colors w-fit"
                >
                  <MapPin className="w-3 h-3" />
                  Google Maps Location <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-2">Powered by Launch-Your-Store</h4>
            <p className="text-zinc-500">
              No-code e-commerce platform built for independent artisans, craft studios, and small businesses.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <span>Theme: {store.themeId}</span>
              <span>·</span>
              <span>Font: {store.customFont}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
