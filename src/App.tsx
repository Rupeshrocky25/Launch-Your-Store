import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CustomerMarketplace } from './components/marketplace/CustomerMarketplace';
import { StorefrontRenderer } from './components/storefront/StorefrontRenderer';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { ShopkeeperDashboard } from './components/dashboard/ShopkeeperDashboard';
import { CustomerOrders } from './components/customer/CustomerOrders';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { api } from './services/api';
import { Store, Product, Category } from './types';

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

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased flex flex-col">
      {/* Universal Top Header */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        activeStoreSlug={activeStoreSlug}
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
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
