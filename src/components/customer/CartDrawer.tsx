import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    cartCount,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    setIsCheckoutOpen,
  } = useAuth();

  if (!isCartOpen) return null;

  const freeShippingThreshold = 999;
  const progressToFreeShipping = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-zinc-900 border-l border-zinc-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-zinc-900" />
            <h2 className="text-lg font-bold text-zinc-900">Your Shopping Cart</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md">
              {cartCount} items
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping progress bar */}
        <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100 text-xs">
          {remainingForFreeShipping > 0 ? (
            <p className="text-zinc-600">
              Add <strong className="text-zinc-900 font-semibold">₹{remainingForFreeShipping}</strong> more to qualify for <strong>FREE Delivery</strong>
            </p>
          ) : (
            <p className="text-emerald-700 font-semibold">
              🎉 Congratulations! You have unlocked FREE Express Delivery!
            </p>
          )}
          <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                remainingForFreeShipping === 0 ? 'bg-emerald-600' : 'bg-zinc-900'
              }`}
              style={{ width: `${progressToFreeShipping}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
              <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-3 text-zinc-300" />
              <p className="text-sm font-semibold text-zinc-700">Your cart is currently empty</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Browse our curated storefronts and add your favorite handcrafted goods.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div
                key={`${item.productId}-${item.variantLabel || 'default'}-${idx}`}
                className="flex gap-3.5 p-3 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors"
              >
                {item.product?.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-18 h-18 object-cover rounded-lg border border-zinc-100 shrink-0"
                  />
                ) : (
                  <div className="w-18 h-18 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 text-xs shrink-0">
                    No image
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-900 truncate">
                    {item.product?.name || 'Handcrafted Product'}
                  </h4>
                  {item.variantLabel && (
                    <span className="text-[11px] text-zinc-500 block truncate">
                      Option: {item.variantLabel}
                    </span>
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-900 font-mono">
                      ₹{item.price}
                    </span>
                    <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50">
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.variantLabel)}
                        className="p-1 hover:bg-zinc-200 text-zinc-600 rounded-l-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-medium font-mono text-zinc-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.variantLabel)}
                        className="p-1 hover:bg-zinc-200 text-zinc-600 rounded-r-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId, item.variantLabel)}
                  className="text-zinc-300 hover:text-rose-600 p-1 self-start transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-bold text-zinc-900 font-mono text-base">₹{cartSubtotal}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-zinc-500">
              <span>Estimated GST (5%) & Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              Proceed to Secure Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
