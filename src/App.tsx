import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, MobileBottomNav } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CustomerMarketplace } from './components/marketplace/CustomerMarketplace';
import { StorefrontRenderer } from './components/storefront/StorefrontRenderer';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { ShopkeeperDashboard } from './components/dashboard/ShopkeeperDashboard';
import { CustomerOrders } from './components/customer/CustomerOrders';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { DeviceViewSwitcher } from './components/common/DeviceViewSwitcher';
import { api } from './services/api';
import { Store, Product, Category } from './types';
import { Monitor, Smartphone, Wifi, BatteryMedium, Signal } from 'lucide-react';

type AppView = 'landing' | 'marketplace' | 'storefront' | 'onboarding' | 'dashboard' | 'orders';

const MainApp: React.FC = () => {
  const { user, store, openAuthModal, setStore } = useAuth();

  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeStoreSlug, setActiveStoreSlug] = useState<string>('');
  const [loadedStorefrontData, setLoadedStorefrontData] = useState<{
    store: Store;
    products: Product[];
    categories: Category[];
  } | null>(null);
  const [isStorefrontLoading, setIsStorefrontLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Parse hash routing on mount and change
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('store-')) {
        const slug = hash.replace('store-', '');
        setActiveStoreSlug(slug);
        setCurrentView('storefront');
        loadStorefront(slug);
      } else if (hash === 'marketplace') {
        setCurrentView('marketplace');
      } else if (hash === 'dashboard') {
        setCurrentView('dashboard');
      } else if (hash === 'orders') {
        setCurrentView('orders');
      } else if (hash === 'onboarding') {
        setCurrentView('onboarding');
      }
    }

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  async function loadStorefront(slug: string) {
    setIsStorefrontLoading(true);
    try {
      const data = await api.getStoreBySlug(slug);
      setLoadedStorefrontData(data);
    } catch (err) {
      console.error('Failed to load storefront slug:', slug, err);
    } finally {
      setIsStorefrontLoading(false);
    }
  }

  function handleNavigate(view: AppView, slug?: string) {
    setCurrentView(view);
    if (view === 'storefront' && slug) {
      setActiveStoreSlug(slug);
      window.location.hash = `store-${slug}`;
      loadStorefront(slug);
    } else {
      window.location.hash = view === 'landing' ? '' : view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleContinueAsCustomer() {
    handleNavigate('marketplace');
  }

  function handleContinueAsShopkeeper() {
    if (!user) {
      openAuthModal('SHOPKEEPER');
    } else if (user.role === 'SHOPKEEPER') {
      if (store) {
        handleNavigate('dashboard');
      } else {
        handleNavigate('onboarding');
      }
    } else {
      // User is logged in as Customer
      openAuthModal('SHOPKEEPER');
    }
  }

  // The actual application page content
  const appContent = (
    <div className="min-h-full bg-white text-zinc-900 font-sans antialiased flex flex-col pb-16 md:pb-0">
      {/* Universal Top Header */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        activeStoreSlug={activeStoreSlug}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* Main View Switcher */}
      <div className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onContinueAsCustomer={handleContinueAsCustomer}
            onContinueAsShopkeeper={handleContinueAsShopkeeper}
          />
        )}

        {currentView === 'marketplace' && (
          <CustomerMarketplace
            onSelectStore={slug => handleNavigate('storefront', slug)}
          />
        )}

        {currentView === 'storefront' && (
          <div>
            {isStorefrontLoading ? (
              <div className="py-24 text-center text-xs text-zinc-400">Loading storefront...</div>
            ) : loadedStorefrontData ? (
              <StorefrontRenderer
                store={loadedStorefrontData.store}
                products={loadedStorefrontData.products}
                categories={loadedStorefrontData.categories}
              />
            ) : (
              <div className="py-24 text-center text-xs text-zinc-500">
                Storefront not found. Return to{' '}
                <button
                  onClick={() => handleNavigate('marketplace')}
                  className="text-zinc-900 font-semibold underline"
                >
                  Marketplace
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'onboarding' && (
          <OnboardingWizard
            onComplete={newStore => {
              setStore(newStore);
              handleNavigate('dashboard');
            }}
            onCancel={() => handleNavigate('landing')}
          />
        )}

        {currentView === 'dashboard' && (
          <div>
            {store ? (
              <ShopkeeperDashboard
                store={store}
                onViewStorefront={slug => handleNavigate('storefront', slug)}
              />
            ) : (
              <div className="max-w-md mx-auto py-20 px-4 text-center">
                <h3 className="text-lg font-bold text-zinc-900">No active store found</h3>
                <p className="text-xs text-zinc-500 mt-1 mb-4">
                  Create your store in less than 3 minutes using our onboarding wizard.
                </p>
                <button
                  onClick={() => handleNavigate('onboarding')}
                  className="py-2.5 px-5 bg-zinc-900 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Launch Store Onboarding
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'orders' && <CustomerOrders />}
      </div>

      {/* Mobile Bottom Navigation Bar (Active on mobile view) */}
      <MobileBottomNav currentView={currentView} onNavigate={handleNavigate} />

      {/* Global Modals */}
      <AuthModal />
      <CartDrawer />
      <CheckoutModal
        onOrderComplete={order => {
          handleNavigate('orders');
        }}
      />
    </div>
  );

  return (
    <>
      {/* Floating Device View Switcher Toggle */}
      <DeviceViewSwitcher viewMode={viewMode} onToggleViewMode={setViewMode} />

      {viewMode === 'desktop' ? (
        // Standard Desktop View (Responsive at any viewport)
        <div className="min-h-screen bg-white">
          {appContent}
        </div>
      ) : (
        // Realistic Mobile Phone Simulation Frame
        <div className="min-h-screen bg-zinc-950 py-8 px-2 sm:px-4 flex flex-col items-center justify-start overflow-x-hidden">
          {/* Top Preview Helper Bar */}
          <div className="mb-6 flex items-center justify-between gap-4 w-full max-w-[420px] px-2 text-white">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-zinc-300">
                Mobile View (390px)
              </span>
            </div>
            <button
              onClick={() => setViewMode('desktop')}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700 shadow-sm"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Desktop</span>
            </button>
          </div>

          {/* Smartphone Frame Container */}
          <div className="w-full max-w-[400px] bg-white rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border-[10px] border-zinc-900 overflow-hidden relative flex flex-col min-h-[820px] transition-all">
            {/* Phone Status Bar */}
            <div className="bg-zinc-950 text-white px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-semibold select-none shrink-0">
              <span>9:41</span>
              {/* Dynamic Island Pill */}
              <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto" />
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <BatteryMedium className="w-3.5 h-3.5 text-zinc-300" />
              </div>
            </div>

            {/* Scrollable Phone Screen Content */}
            <div className="flex-1 overflow-y-auto max-h-[760px] relative">
              {appContent}
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="bg-white py-1.5 flex justify-center shrink-0 border-t border-zinc-100">
              <div className="w-28 h-1 bg-zinc-900/40 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
