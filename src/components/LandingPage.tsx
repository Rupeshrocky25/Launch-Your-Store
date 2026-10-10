import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Store,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Palette,
  FileSpreadsheet,
} from 'lucide-react';

interface LandingProps {
  onContinueAsCustomer: () => void;
  onContinueAsShopkeeper: () => void;
}

export const LandingPage: React.FC<LandingProps> = ({
  onContinueAsCustomer,
  onContinueAsShopkeeper,
}) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between">
      {/* Top Banner Ticker */}
      <div className="bg-zinc-950 text-white text-xs py-2 px-4 text-center font-medium tracking-wide">
        <span>🚀 <strong>Launch-Your-Store Platform</strong> · No-Code Multi-Tenant Storefront Builder with Real-Data AI Intelligence</span>
      </div>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-20 flex-1 flex flex-col items-center justify-center text-center">
        {/* Brand Kicker */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-xs font-semibold text-zinc-800 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Complete E-Commerce Platform for Small Businesses</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-950 max-w-3xl leading-[1.1]">
          Launch your online store in minutes. Sell to the world.
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 max-w-xl mt-4 leading-relaxed">
          The all-in-one no-code platform for small businesses. Publish custom storefronts, manage products, track orders, and get real-time business insights with Gemini AI.
        </p>

        {/* DUAL ROLE SELECTION CARDS */}
        {user?.role === 'CUSTOMER' ? (
          <div className="mt-10 w-full max-w-md text-left">
            <div
              onClick={onContinueAsCustomer}
              className="p-6 bg-white rounded-3xl border-2 border-zinc-900 hover:border-zinc-950 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Customer Account
                </span>
                <h3 className="text-xl font-bold text-zinc-950 mt-1">
                  Welcome back, {user.name}!
                </h3>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  Browse marketplace stores, view catalog items with rates, and manage your orders.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">
                <span>Continue Shopping & Track Orders</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl text-left">
            {/* Card 1: Continue as Customer */}
            <div
              onClick={onContinueAsCustomer}
              className="p-6 bg-white rounded-3xl border-2 border-zinc-200 hover:border-zinc-900 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Shopper Journey
                </span>
                <h3 className="text-xl font-bold text-zinc-950 mt-1">
                  Continue as Customer
                </h3>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  Browse verified local brands, explore unique artisanal storefronts, add items to cart, and track order deliveries in real-time.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Continue as Shopkeeper */}
            <div
              onClick={onContinueAsShopkeeper}
              className="p-6 bg-zinc-950 text-white rounded-3xl border-2 border-zinc-900 shadow-md hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Store className="w-6 h-6 stroke-[1.8]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Merchant Journey
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Continue as Shopkeeper
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Set up your online store, select from 4 distinctive themes, import products via CSV or 1-click samples, and unlock AI store analytics.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span>Create & Manage Store</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl text-left text-xs">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
            <Palette className="w-5 h-5 text-zinc-900 mb-2" />
            <h4 className="font-bold text-zinc-900">4 Commercial Themes</h4>
            <p className="text-zinc-500 text-[11px] mt-1">
              Modern Minimal, Bold Commerce, Elegant Boutique, and Fresh Market.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
            <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
            <h4 className="font-bold text-zinc-900">Gemini AI Analyst</h4>
            <p className="text-zinc-500 text-[11px] mt-1">
              Ask questions about sales & inventory. Strictly real, evidence-backed metrics.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 mb-2" />
            <h4 className="font-bold text-zinc-900">CSV & 1-Click Import</h4>
            <p className="text-zinc-500 text-[11px] mt-1">
              Column mapping, row-by-row error detection, and realistic sample catalogs.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
            <ShieldCheck className="w-5 h-5 text-indigo-600 mb-2" />
            <h4 className="font-bold text-zinc-900">Multi-Tenant Isolation</h4>
            <p className="text-zinc-500 text-[11px] mt-1">
              Secure role separation, atomic stock decrements, and independent customer data.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 px-4 text-center text-xs text-zinc-500">
        <p>Launch-Your-Store — Production No-Code Multi-Tenant E-Commerce Builder</p>
      </footer>
    </div>
  );
};
