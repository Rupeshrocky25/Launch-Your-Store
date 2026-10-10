import React, { useState, useEffect } from 'react';
import { Store, Product, Category } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Store as StoreIcon,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  Heart,
  X,
  Sparkles,
  Package,
  Globe,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface MarketplaceProps {
  onSelectStore: (slug: string) => void;
}

export const CustomerMarketplace: React.FC<MarketplaceProps> = ({ onSelectStore }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useAuth();

  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [storesRes, prodsRes, catsRes] = await Promise.all([
          api.getPublishedStores(),
          api.getProducts(),
          api.getCategories(),
        ]);
        setStores(storesRes);
        setProducts(prodsRes);
        setCategories(catsRes);
      } catch (err) {
        console.error('Failed to load marketplace data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const storesMap = new Map<string, Store>(stores.map(s => [s.id, s]));

  const q = searchQuery.trim().toLowerCase();
  const isSearching = q.length > 0;

  // Products directly matching query text
  const productsDirectlyMatchingQuery = isSearching
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
      )
    : [];

  const storeIdsWithMatchingProducts = new Set(productsDirectlyMatchingQuery.map(p => p.storeId));

  // Stores directly matching query text
  const matchingStoreIds = new Set(
    stores
      .filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.businessName.toLowerCase().includes(q) ||
          s.businessType.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q)
      )
      .map(s => s.id)
  );

  // 1. Shops matching query directly OR shops that carry products matching the search query
  const matchingStores = isSearching
    ? stores.filter(
        s =>
          matchingStoreIds.has(s.id) ||
          storeIdsWithMatchingProducts.has(s.id)
      )
    : stores;

  // 2. Products matching query directly OR all products belonging to shops that match query
  const matchingProducts = products.filter(p => {
    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
    if (!isSearching) return matchesCat;

    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
      matchingStoreIds.has(p.storeId);

    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-16">
      {/* Marketplace Hero & Dual Search Bar */}
      <section className="bg-white border-b border-zinc-200 py-10 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Universal Shop & Product Search
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 max-w-2xl mx-auto">
            Discover Stores & Shop Products
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto">
            Search for a store to view all its products, or search for an item to find every shop offering it.
          </p>

          {/* Dual-Scope Search Input */}
          <div className="max-w-xl mx-auto relative pt-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-5.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search shops (e.g. Coffee Roasters) or products (e.g. Espresso Beans)..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-zinc-300 bg-white shadow-xs text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-5.5 text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {isSearching ? (
          /* ================= DUAL SEARCH RESULTS VIEW ================= */
          <div className="space-y-10">
            {/* Search Header Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div>
                <h2 className="text-xl font-extrabold text-zinc-950">
                  Search Results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Found {matchingStores.length} shop(s) and {matchingProducts.length} product(s)
                </p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>

            {/* 1. SHOP MATCHES SECTION */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <StoreIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-zinc-900">
                  Shops Matching &ldquo;{searchQuery}&rdquo; ({matchingStores.length})
                </h3>
              </div>

              {matchingStores.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-zinc-200 text-xs text-zinc-500 text-center">
                  No shops found matching &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="space-y-6">
                  {matchingStores.map(st => {
                    const shopProducts = products.filter(p => p.storeId === st.id);

                    return (
                      <div
                        key={st.id}
                        className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden"
                      >
                        {/* Shop Header Bar */}
                        <div className="p-5 bg-zinc-50/70 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {st.logo ? (
                              <img
                                src={st.logo}
                                alt={st.name}
                                className="w-12 h-12 rounded-xl object-cover border border-zinc-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-bold">
                                {st.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-zinc-900">{st.name}</h4>
                                {st.verificationStatus === 'VERIFIED' && (
                                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <Globe className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="font-semibold text-zinc-500">Shop URL:</span>
                                  <span>{typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#store-${st.slug}` : `http://localhost:3000/#store-${st.slug}`}</span>
                                </div>
                                {st.gmapsUrl && (
                                  <a
                                    href={st.gmapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 font-medium transition-colors"
                                  >
                                    <MapPin className="w-3 h-3 text-blue-600" />
                                    Google Maps <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => onSelectStore(st.slug)}
                            className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                          >
                            Visit {st.name} Storefront <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* All Products in this Shop - Horizontal Scroll Gallery */}
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                              Products Available in {st.name} ({shopProducts.length})
                            </span>
                            {shopProducts.length > 2 && (
                              <span className="text-[10px] text-emerald-700 font-medium animate-pulse">
                                Scroll sideways &rarr;
                              </span>
                            )}
                          </div>

                          {shopProducts.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">
                              This shop has not listed any products yet.
                            </p>
                          ) : (
                            <div className="overflow-x-auto flex gap-4 pb-3 scroll-smooth snap-x">
                              {shopProducts.map(p => {
                                const inWishlist = isInWishlist(p.id);
                                return (
                                  <div
                                    key={p.id}
                                    className="w-48 sm:w-56 shrink-0 snap-start bg-zinc-50 rounded-xl border border-zinc-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                                  >
                                    {/* Product Photo Compulsory */}
                                    <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                                      {p.images?.[0] ? (
                                        <img
                                          src={p.images[0]}
                                          alt={p.name}
                                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                                          <Package className="w-8 h-8 opacity-40" />
                                        </div>
                                      )}
                                      <button
                                        onClick={() => toggleWishlist(p.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-zinc-600 shadow-xs cursor-pointer"
                                      >
                                        <Heart
                                          className={`w-3.5 h-3.5 ${
                                            inWishlist ? 'text-rose-500 fill-rose-500' : 'text-zinc-600'
                                          }`}
                                        />
                                      </button>
                                    </div>
                                    {/* Product Title and Price Below Photo */}
                                    <div className="p-3 flex flex-col flex-1 justify-between">
                                      <div>
                                        <h5 className="text-xs font-semibold text-zinc-900 line-clamp-1">
                                          {p.name}
                                        </h5>
                                        {/* Price Below Photo */}
                                        <div className="mt-1 flex items-baseline justify-between">
                                          <span className="text-sm font-extrabold font-mono text-zinc-900">
                                            ₹{p.price}
                                          </span>
                                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                                            <span className="text-[10px] font-mono text-zinc-400 line-through">
                                              ₹{p.compareAtPrice}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => addToCart(p, 1)}
                                        disabled={p.stock === 0}
                                        className="mt-2.5 w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                                      >
                                        <ShoppingBag className="w-3.5 h-3.5" />
                                        {p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. PRODUCT MATCHES SECTION - Horizontal Scroll Gallery */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-zinc-900">
                    Products Matching &ldquo;{searchQuery}&rdquo; Across All Stores ({matchingProducts.length})
                  </h3>
                </div>
                {matchingProducts.length > 2 && (
                  <span className="text-[11px] text-zinc-500 font-medium">
                    Scroll sideways to view all photos &amp; prices &rarr;
                  </span>
                )}
              </div>

              {matchingProducts.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-zinc-200 text-xs text-zinc-500 text-center">
                  No products found matching &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="overflow-x-auto flex gap-4 pb-4 scroll-smooth snap-x">
                  {matchingProducts.map(p => {
                    const storeObj = storesMap.get(p.storeId);
                    const inWishlist = isInWishlist(p.id);

                    return (
                      <div
                        key={p.id}
                        className="w-52 sm:w-60 shrink-0 snap-start bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        {/* Product Photo */}
                        <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                              <Package className="w-8 h-8 opacity-40" />
                            </div>
                          )}
                          <button
                            onClick={() => toggleWishlist(p.id)}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full text-zinc-600 shadow-xs cursor-pointer transition-colors"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                inWishlist ? 'text-rose-500 fill-rose-500' : 'text-zinc-600'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Details & Price Directly Below Photo */}
                        <div className="p-3.5 flex flex-col flex-1 justify-between">
                          <div>
                            {/* Store badge */}
                            {storeObj && (
                              <button
                                onClick={() => onSelectStore(storeObj.slug)}
                                className="text-[10px] font-semibold text-emerald-700 hover:underline block truncate text-left mb-0.5 cursor-pointer"
                              >
                                Store: {storeObj.name}
                              </button>
                            )}

                            <h4 className="text-xs font-semibold text-zinc-900 line-clamp-1">{p.name}</h4>
                            <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                              {p.description}
                            </p>

                            {/* Stock Indicator */}
                            <div className="mt-1.5 text-[10px]">
                              {p.stock === 0 ? (
                                <span className="text-rose-600 font-bold">Out of Stock</span>
                              ) : (
                                <span className="text-emerald-700 font-medium">In Stock ({p.stock} available)</span>
                              )}
                            </div>

                            {/* Price directly below photo and details */}
                            <div className="mt-2 flex items-baseline justify-between border-t border-zinc-100 pt-2">
                              <span className="text-base font-extrabold font-mono text-zinc-900">₹{p.price}</span>
                              {p.compareAtPrice && p.compareAtPrice > p.price && (
                                <span className="text-[10px] font-mono text-zinc-400 line-through">
                                  ₹{p.compareAtPrice}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => addToCart(p, 1)}
                            disabled={p.stock === 0}
                            className="mt-3 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            {p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= DEFAULT MARKETPLACE HOME ================= */
          <div className="space-y-10">
            {/* Featured Storefronts */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <StoreIcon className="w-4 h-4 text-emerald-600" />
                  Active Storefronts ({stores.length})
                </h2>
              </div>

              {stores.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-dashed border-zinc-200 text-center">
                  <StoreIcon className="w-10 h-10 mx-auto text-zinc-300 mb-2 stroke-[1.2]" />
                  <p className="text-sm font-bold text-zinc-800">No stores created yet</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Shopkeepers can publish stores and list custom products with rates using their seller dashboard.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map(st => (
                    <div
                      key={st.id}
                      onClick={() => onSelectStore(st.slug)}
                      className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-2.5">
                          {st.logo ? (
                            <img
                              src={st.logo}
                              alt={st.name}
                              className="w-12 h-12 rounded-xl object-cover border border-zinc-100 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-bold">
                              {st.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-bold text-zinc-900 truncate">{st.name}</h3>
                              {st.verificationStatus === 'VERIFIED' && (
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 font-mono">/store/{st.slug}</span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-2">{st.tagline}</p>
                        <div className="mt-2 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#store-${st.slug}` : `http://localhost:3000/#store-${st.slug}`}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-medium capitalize">
                          Theme: {st.themeId.replace('-', ' ')}
                        </span>
                        <span className="text-zinc-900 font-semibold flex items-center gap-1 group">
                          Visit Store <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Product Catalog with Categories Filter */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Explore All Products ({matchingProducts.length})
                </h2>
              </div>

              {/* Categories Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-4">
                <button
                  onClick={() => setSelectedCat('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCat === 'all'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCat === c.id
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              {matchingProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-zinc-200 p-8">
                  <ShoppingBag className="w-10 h-10 mx-auto text-zinc-300 mb-2 stroke-[1.2]" />
                  <p className="text-sm font-semibold text-zinc-800">No products available in this category</p>
                  <p className="text-xs text-zinc-500 mt-1">Shopkeepers can add items with rates in their seller dashboard.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {matchingProducts.map(p => {
                    const storeObj = storesMap.get(p.storeId);
                    const inWishlist = isInWishlist(p.id);

                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                              <Package className="w-8 h-8 opacity-40" />
                            </div>
                          )}
                          <button
                            onClick={() => toggleWishlist(p.id)}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full text-zinc-600 shadow-xs cursor-pointer transition-colors"
                            title="Wishlist"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                inWishlist ? 'text-rose-500 fill-rose-500' : 'text-zinc-600'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="p-3.5 flex flex-col flex-1">
                          {storeObj && (
                            <button
                              onClick={() => onSelectStore(storeObj.slug)}
                              className="text-[10px] font-semibold text-emerald-700 hover:underline block truncate text-left mb-0.5 cursor-pointer"
                            >
                              Store: {storeObj.name}
                            </button>
                          )}
                          <h4 className="text-xs font-semibold text-zinc-900 line-clamp-1">{p.name}</h4>
                          <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2 flex-1">
                            {p.description}
                          </p>

                          <div className="mt-2 text-[10px]">
                            {p.stock === 0 ? (
                              <span className="text-rose-600 font-bold">Out of Stock</span>
                            ) : (
                              <span className="text-emerald-700 font-medium">In Stock ({p.stock} available)</span>
                            )}
                          </div>

                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-sm font-bold font-mono text-zinc-900">₹{p.price}</span>
                            {p.compareAtPrice && p.compareAtPrice > p.price && (
                              <span className="text-[10px] font-mono text-zinc-400 line-through">
                                ₹{p.compareAtPrice}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => addToCart(p, 1)}
                              disabled={p.stock === 0}
                              className="flex-1 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              {p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
