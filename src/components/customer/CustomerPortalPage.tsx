import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CustomerMarketplace } from '../marketplace/CustomerMarketplace';
import { CustomerOrders } from './CustomerOrders';
import {
  ShoppingBag,
  Package,
  Heart,
  User as UserIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Store as StoreIcon,
} from 'lucide-react';

interface CustomerPortalProps {
  onSelectStore: (slug: string) => void;
  onNavigateToShopkeeper?: () => void;
}

export const CustomerPortalPage: React.FC<CustomerPortalProps> = ({
  onSelectStore,
  onNavigateToShopkeeper,
}) => {
  const { user, wishlistIds, cartCount, openAuthModal, upgradeToShopkeeper, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'orders' | 'profile'>('marketplace');

  // Address state
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user?.name) setFullName(user.name);
    if (user?.phone) setPhone(user.phone);
    if (user?.email) setEmail(user.email);
  }, [user]);

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim()) {
      try {
        await updateProfile({ name: fullName.trim(), email: email.trim() });
      } catch (err) {
        console.error(err);
      }
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Customer Header Sub-Bar */}
      <div className="bg-white border-b border-zinc-200 py-3 px-4 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900">Customer Shopping Portal</h1>
              <p className="text-[11px] text-zinc-500">Discover local stores, manage orders, and track deliveries</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'marketplace'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <StoreIcon className="w-3.5 h-3.5" />
              Marketplace
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              My Orders & History
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              Account Profile
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab View */}
      <div className="flex-1">
        {activeTab === 'marketplace' && (
          <CustomerMarketplace onSelectStore={onSelectStore} />
        )}

        {activeTab === 'orders' && <CustomerOrders />}

        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Personal Account & Address Book</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Manage your default delivery address and personal customer information.
              </p>
            </div>

            {/* Profile Overview Card */}
            <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-lg font-bold">
                  {user?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">{user?.name || 'Customer Account'}</h3>
                  <p className="text-zinc-500 font-mono">{user?.phone || 'No phone set'}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[10px]">
                    Role: {user?.role || 'CUSTOMER'}
                  </span>
                </div>
              </div>

              {/* Upgrade option to become a seller */}
              <button
                onClick={() => {
                  if (onNavigateToShopkeeper) onNavigateToShopkeeper();
                  else upgradeToShopkeeper();
                }}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Want to sell? Open a Store
              </button>
            </div>

            {/* Saved Address Book */}
            <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-xs text-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">Default Shipping Address</h3>
              </div>

              {isSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs">
                  Address details updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveAddress} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 font-mono focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-zinc-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">PIN / Postal Code</label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={e => setPincode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 font-mono focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium cursor-pointer"
                >
                  Save Address Book
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
