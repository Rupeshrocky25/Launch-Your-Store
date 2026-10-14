import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Heart,
  Store,
  LogOut,
  User as UserIcon,
  Package,
  Layers,
  ArrowRightLeft,
  Sparkles,
  Menu,
  X,
  Monitor,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'marketplace' | 'storefront' | 'onboarding' | 'dashboard' | 'orders';
  onNavigate: (view: 'landing' | 'marketplace' | 'storefront' | 'onboarding' | 'dashboard' | 'orders') => void;
  activeStoreSlug?: string;
  viewMode?: 'desktop' | 'mobile';
  onToggleViewMode?: (mode: 'desktop' | 'mobile') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  activeStoreSlug,
  viewMode = 'desktop',
  onToggleViewMode,
}) => {
  const {
    user,
    store,
    activeRole,
    logout,
    openAuthModal,
    cartCount,
    setIsCartOpen,
  } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleMobileNav(view: 'landing' | 'marketplace' | 'storefront' | 'onboarding' | 'dashboard' | 'orders') {
    setIsMobileMenuOpen(false);
    onNavigate(view);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 text-zinc-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => handleMobileNav('landing')}
              className="flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer group shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                LYS
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-950 block leading-tight truncate">
                  Launch-Your-Store
                </span>
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium tracking-wide uppercase block">
                  No-Code E-Commerce
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4 lg:ml-6 text-xs font-medium text-zinc-600">
              <button
                onClick={() => onNavigate('marketplace')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  currentView === 'marketplace' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'hover:text-zinc-900'
                }`}
              >
                Marketplace
              </button>

              {user?.role === 'SHOPKEEPER' && store && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    currentView === 'dashboard' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'hover:text-zinc-900'
                  }`}
                >
                  Seller Dashboard
                </button>
              )}

              {user && (
                <button
                  onClick={() => onNavigate('orders')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    currentView === 'orders' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'hover:text-zinc-900'
                  }`}
                >
                  My Orders
                </button>
              )}
            </nav>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* View Mode Toggle (Desktop / Mobile) */}
            {onToggleViewMode && (
              <div className="hidden sm:flex items-center bg-zinc-100 p-0.5 rounded-xl border border-zinc-200 text-xs">
                <button
                  onClick={() => onToggleViewMode('desktop')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    viewMode === 'desktop'
                      ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                  title="Switch to Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Desktop</span>
                </button>
                <button
                  onClick={() => onToggleViewMode('mobile')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    viewMode === 'mobile'
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                  title="Switch to Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Mobile</span>
                </button>
              </div>
            )}

            {/* Orders Shortcut (Desktop) */}
            <button
              onClick={() => onNavigate('orders')}
              className="hidden md:flex p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors relative cursor-pointer"
              title="Orders & History"
            >
              <Package className="w-4 h-4" />
            </button>

            {/* Shopping Cart Drawer Toggle */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">Cart</span>
              {cartCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-emerald-500 text-zinc-950 font-mono text-[10px] font-bold rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth State (Desktop) */}
            {user ? (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-zinc-200 text-xs">
                <div className="text-right">
                  <span className="font-bold text-zinc-900 block truncate max-w-[110px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 capitalize">
                    {user.role.toLowerCase()}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-zinc-200">
                <button
                  onClick={() => openAuthModal('CUSTOMER')}
                  className="px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('SHOPKEEPER')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  Start Store
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Hamburger Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-zinc-200 px-4 py-4 space-y-3 shadow-lg animate-fadeIn">
            {/* User Greeting (if logged in) */}
            {user && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-zinc-900 block">{user.name}</span>
                  <span className="text-[11px] text-zinc-500 font-mono capitalize">{user.role.toLowerCase()} • {user.phone}</span>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium border border-rose-200 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-1 text-sm font-medium">
              <button
                onClick={() => handleMobileNav('landing')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'landing' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span>🏠 Home</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                onClick={() => handleMobileNav('marketplace')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'marketplace' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span>🛒 Browse Marketplace</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              {user?.role === 'SHOPKEEPER' && store && (
                <button
                  onClick={() => handleMobileNav('dashboard')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                    currentView === 'dashboard' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <span>📊 Seller Dashboard ({store.name})</span>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              )}

              <button
                onClick={() => handleMobileNav('orders')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  currentView === 'orders' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span>📦 My Orders & Tracking</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Device Switcher in Mobile Drawer */}
            {onToggleViewMode && (
              <div className="pt-2 border-t border-zinc-100">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Display Mode Switcher
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onToggleViewMode('desktop');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      viewMode === 'desktop'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Desktop View</span>
                  </button>
                  <button
                    onClick={() => {
                      onToggleViewMode('mobile');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      viewMode === 'mobile'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile View</span>
                  </button>
                </div>
              </div>
            )}

            {/* Auth Actions if not logged in */}
            {!user && (
              <div className="pt-2 border-t border-zinc-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('CUSTOMER');
                  }}
                  className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold rounded-xl text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('SHOPKEEPER');
                  }}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl text-center shadow-xs"
                >
                  Start Free Store
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};

{/* Mobile Bottom Navigation Bar for quick thumb navigation on mobile phones */}
export const MobileBottomNav: React.FC<{
  currentView: 'landing' | 'marketplace' | 'storefront' | 'onboarding' | 'dashboard' | 'orders';
  onNavigate: (view: 'landing' | 'marketplace' | 'storefront' | 'onboarding' | 'dashboard' | 'orders') => void;
}> = ({ currentView, onNavigate }) => {
  const { user, store, cartCount, setIsCartOpen, openAuthModal } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 py-1.5 px-2 flex items-center justify-around text-zinc-500 shadow-lg md:hidden">
      <button
        onClick={() => onNavigate('landing')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          currentView === 'landing' ? 'text-zinc-950 font-bold' : 'hover:text-zinc-900'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => onNavigate('marketplace')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          currentView === 'marketplace' ? 'text-zinc-950 font-bold' : 'hover:text-zinc-900'
        }`}
      >
        <Store className="w-4 h-4" />
        <span className="text-[10px]">Market</span>
      </button>

      {user?.role === 'SHOPKEEPER' && store ? (
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            currentView === 'dashboard' ? 'text-emerald-700 font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px]">Dashboard</span>
        </button>
      ) : (
        <button
          onClick={() => {
            if (user?.role === 'SHOPKEEPER') onNavigate('onboarding');
            else openAuthModal('SHOPKEEPER');
          }}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          <Store className="w-4 h-4" />
          <span className="text-[10px] font-semibold">Start Store</span>
        </button>
      )}

      <button
        onClick={() => onNavigate('orders')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          currentView === 'orders' ? 'text-zinc-950 font-bold' : 'hover:text-zinc-900'
        }`}
      >
        <Package className="w-4 h-4" />
        <span className="text-[10px]">Orders</span>
      </button>

      <button
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-zinc-900 hover:text-zinc-950 transition-colors cursor-pointer relative"
      >
        <div className="relative">
          <ShoppingBag className="w-4 h-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-emerald-500 text-zinc-950 font-mono text-[9px] font-bold rounded-full">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold">Cart</span>
      </button>
    </nav>
  );
};
