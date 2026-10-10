import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    intendedRole,
    loginDirect,
  } = useAuth();

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const fullPhone = `${countryCode} ${phoneNumber.trim()}`;

  async function handleDirectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name. It is compulsory.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
      setError('Please enter a valid phone number.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await loginDirect(fullPhone, intendedRole, name.trim());
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden text-zinc-900">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">
              {intendedRole === 'SHOPKEEPER' ? 'Shopkeeper Portal' : 'Customer Account'}
            </span>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5">
              {intendedRole === 'SHOPKEEPER' ? 'Register / Sign In as Shopkeeper' : 'Register / Sign In as Customer'}
            </h3>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleDirectSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                {intendedRole === 'SHOPKEEPER' ? 'Shopkeeper / Seller Full Name' : 'Customer Full Name'}{' '}
                <span className="text-rose-600 font-bold">* Compulsory</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={intendedRole === 'SHOPKEEPER' ? 'Enter your shopkeeper/seller name' : 'Enter your customer name'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Your name in this space will be set exactly as entered here.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-zinc-300 text-sm bg-zinc-50 font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="+91">🇮🇳 +91 (IN)</option>
                  <option value="+1">🇺🇸 +1 (US)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+971">🇦🇪 +971 (UAE)</option>
                  <option value="+65">🇸🇬 +65 (SG)</option>
                </select>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="98765 43210"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 font-mono"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Instant sign-in: Automatically creates your account with a unique User ID.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In / Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
