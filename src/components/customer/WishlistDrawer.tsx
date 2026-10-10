import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Product } from '../../types';
import { X, Heart, ShoppingBag, ArrowRight } from 'lucide-react';

export const WishlistDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { wishlistIds, toggleWishlist, addToCart } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    async function loadWishlistItems() {
      setIsLoading(true);
      try {
        const allProds = await api.getProducts();
        const matched = allProds.filter(p => wishlistIds.includes(p.id));
        setWishlistProducts(matched);
      } catch (err) {
        console.warn('Failed to load wishlist products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWishlistItems();
  }, [isOpen, wishlistIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-zinc-900 border-l border-zinc-200">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="text-lg font-bold text-zinc-900">Saved Wishlist</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md">
              {wishlistIds.length} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-zinc-400 text-xs">Loading saved items...</div>
          ) : wishlistProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
              <Heart className="w-12 h-12 stroke-[1.2] mb-3 text-zinc-300" />
              <p className="text-sm font-semibold text-zinc-700">Your wishlist is empty</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Tap the heart icon on any product to save it here for later.
              </p>
            </div>
          ) : (
            wishlistProducts.map(product => (
              <div
                key={product.id}
                className="flex gap-3.5 p-3 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors"
              >
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-18 h-18 object-cover rounded-lg border border-zinc-100 shrink-0"
                  />
                ) : (
                  <div className="w-18 h-18 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 text-xs shrink-0">
                    No image
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-900 truncate">{product.name}</h4>
                  <span className="text-xs font-bold text-zinc-900 font-mono block mt-1">
                    ₹{product.price}
                  </span>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        addToCart(product, 1);
                        toggleWishlist(product.id);
                      }}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      Move to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="px-2 py-1 text-zinc-400 hover:text-rose-600 text-[11px] rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
