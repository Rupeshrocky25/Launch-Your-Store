import React from 'react';
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
} from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'marketplace' | 'storefront' | 'onboarding' | 'dashboard' | 'orders';
  onNavigate: (view: 'landing' | 'marketplace' | 'storefront' | 'onboarding' | 'dashboard' | 'orders') => void;
  activeStoreSlug?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, activeStoreSlug }) => {
  const {
    user,
    store,
    activeRole,
    logout,
    openAuthModal,
    cartCount,
    wishlistIds,
    setIsCartOpen,
    upgradeToShopkeeper,
  } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 text-zinc-900">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
              LYS
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-zinc-950 block leading-tight">
                Launch-Your-Store
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase block">
                No-Code E-Commerce
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-6 text-xs font-medium text-zinc-600">
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

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wishlist Button */}
          <button
            onClick={() => onNavigate('orders')}
            className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors relative cursor-pointer"
            title="Orders & Wishlist"
          >
            <Package className="w-4 h-4" />
          </button>

          {/* Shopping Cart Drawer Toggle */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-zinc-950 font-mono text-[10px] font-bold rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 text-xs">
              <div className="text-right hidden sm:block">
                <span className="font-bold text-zinc-900 block truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-zinc-400 capitalize">
                  {user.role.toLowerCase()}
                </span>
              </div>

              {/* Customer view: Clean profile view without Shopkeeper option */}

              <button
                onClick={logout}
                className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <button
                onClick={() => openAuthModal('CUSTOMER')}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('SHOPKEEPER')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Start Free Store
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
