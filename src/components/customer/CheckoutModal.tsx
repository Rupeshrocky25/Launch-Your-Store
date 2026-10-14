import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Order } from '../../types';
import { X, CheckCircle2, Shield, ArrowRight, AlertCircle, Truck } from 'lucide-react';

export const CheckoutModal: React.FC<{ onOrderComplete?: (order: Order) => void }> = ({ onOrderComplete }) => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cartItems,
    cartSubtotal,
    user,
    clearCart,
    updateProfile,
  } = useAuth();

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'DEMO_UPI' | 'COD' | 'DEMO_CARD'>('DEMO_UPI');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (!isCheckoutOpen) return null;

  // Server-side calculation mirror for preview
  const estimatedTax = Math.round(cartSubtotal * 0.05 * 100) / 100;
  const shippingFee = cartSubtotal >= 999 ? 0 : 60;
  const estimatedTotal = Math.round((cartSubtotal + estimatedTax + shippingFee) * 100) / 100;

  // Group cart items by storeId
  const primaryStoreId = cartItems[0]?.storeId || '';

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!cartItems.length) return;
    setIsLoading(true);
    setError(null);

    try {
      const orderPayload = {
        storeId: primaryStoreId,
        customerId: user?.id || `user-anon-${Date.now()}`,
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email,
        shippingAddress: {
          fullName,
          phone,
          street,
          city,
          state,
          postalCode,
          country: 'India',
        },
        items: cartItems.map(item => ({
          productId: item.productId,
          variantLabel: item.variantLabel,
          quantity: item.quantity,
        })),
        paymentMethod,
      };

      const newOrder = await api.createOrder(orderPayload);
      setCompletedOrder(newOrder);
      if (user && fullName.trim() && fullName.trim() !== user.name) {
        try {
          await updateProfile({ name: fullName.trim() });
        } catch (e) {
          console.warn('Profile name sync on checkout:', e);
        }
      }
      await clearCart();
      if (onOrderComplete) onOrderComplete(newOrder);
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please review stock or details.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setIsCheckoutOpen(false);
    setCompletedOrder(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden text-zinc-900 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">
              Encrypted Checkout
            </span>
            <h3 className="text-lg font-bold text-zinc-900">
              {completedOrder ? 'Order Confirmed!' : 'Delivery & Payment Details'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {completedOrder ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-zinc-900">Thank you for your order!</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Order Number: <strong className="text-zinc-900 font-mono text-sm">{completedOrder.id}</strong>
                </p>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl text-left text-xs space-y-2 border border-zinc-200">
                <div className="flex justify-between text-zinc-600">
                  <span>Recipient:</span>
                  <strong className="text-zinc-900">{completedOrder.customerName}</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping Address:</span>
                  <span className="text-zinc-900 text-right truncate max-w-xs">{completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.city}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Items:</span>
                  <strong className="text-zinc-900">{completedOrder.items.length} items</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Estimated Arrival:</span>
                  <strong className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {completedOrder.estimatedDeliveryDate || 'Delivery by Today by 8:00 PM'}
                  </strong>
                </div>
                <div className="flex justify-between text-zinc-600 font-bold border-t border-zinc-200 pt-2 text-sm">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-700 font-mono">₹{completedOrder.total}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 text-left">
                <Truck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>The shopkeeper has been notified and stock is atomically reserved. Tracking timeline is live.</span>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              {/* Shipping Address */}
              <div>
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">
                  1. Shipping Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:ring-1 focus:ring-zinc-900 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">PIN / Postal Code</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:ring-1 focus:ring-zinc-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 pt-2 border-t border-zinc-100">
                  2. Payment Method
                </h4>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <label
                    className={`p-2 sm:p-3 rounded-xl border text-[11px] sm:text-xs cursor-pointer flex flex-col justify-between transition-all ${
                      paymentMethod === 'DEMO_UPI'
                        ? 'border-zinc-900 bg-zinc-50 font-semibold ring-1 ring-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'DEMO_UPI'}
                      onChange={() => setPaymentMethod('DEMO_UPI')}
                      className="sr-only"
                    />
                    <span>Demo UPI</span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-500 font-normal">GPay/UPI</span>
                  </label>

                  <label
                    className={`p-2 sm:p-3 rounded-xl border text-[11px] sm:text-xs cursor-pointer flex flex-col justify-between transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-zinc-900 bg-zinc-50 font-semibold ring-1 ring-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="sr-only"
                    />
                    <span>Cash/COD</span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-500 font-normal">Pay at door</span>
                  </label>

                  <label
                    className={`p-2 sm:p-3 rounded-xl border text-[11px] sm:text-xs cursor-pointer flex flex-col justify-between transition-all ${
                      paymentMethod === 'DEMO_CARD'
                        ? 'border-zinc-900 bg-zinc-50 font-semibold ring-1 ring-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'DEMO_CARD'}
                      onChange={() => setPaymentMethod('DEMO_CARD')}
                      className="sr-only"
                    />
                    <span>Demo Card</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Visa / Master</span>
                  </label>
                </div>
              </div>

              {/* Order Summary breakdown */}
              <div className="p-3.5 bg-zinc-50 rounded-xl text-xs space-y-1.5 border border-zinc-200">
                <div className="flex justify-between text-zinc-600">
                  <span>Cart Items ({cartItems.length})</span>
                  <span className="font-mono">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>GST Tax (5%)</span>
                  <span className="font-mono">₹{estimatedTax}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Express Shipping</span>
                  <span className="font-mono">
                    {shippingFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-900 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 my-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Estimated Arrival:
                  </span>
                  <strong className="text-emerald-950 font-bold">
                    {new Date().getHours() < 14 ? 'Delivery by Today by 8:00 PM' : 'Delivery by Tomorrow by 6:00 PM'}
                  </strong>
                </div>
                <div className="flex justify-between text-zinc-900 font-bold border-t border-zinc-200 pt-2 text-sm">
                  <span>Final Total</span>
                  <span className="text-zinc-900 font-mono text-base">₹{estimatedTotal}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Processing Order...' : `Confirm & Place Order (₹${estimatedTotal})`}
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-zinc-400 text-center flex items-center justify-center gap-1">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                Server-side stock check active. No payment required in test mode.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
