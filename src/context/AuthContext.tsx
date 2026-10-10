import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Store, CartItem, Product, UserRole } from '../types';
import { api, setApiUserId } from '../services/api';

interface AuthContextType {
  user: User | null;
  store: Store | null;
  isLoading: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  setStore: (store: Store | null) => void;
  setUser: (user: User | null) => void;
  loginWithPhoneOtp: (phone: string, code: string, name?: string) => Promise<User>;
  loginDirect: (phone: string, role: UserRole, name?: string) => Promise<User>;
  quickLoginAs: (type: 'seller' | 'customer') => Promise<void>;
  upgradeToShopkeeper: () => Promise<void>;
  logout: () => void;
  refreshUserAndStore: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<User>;
  
  // Cart & Wishlist
  cartItems: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (product: Product, quantity?: number, variantLabel?: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number, variantLabel?: string) => Promise<void>;
  removeFromCart: (productId: string, variantLabel?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  
  wishlistIds: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;

  // UI Modals
  isAuthModalOpen: boolean;
  openAuthModal: (intendedRole?: UserRole) => void;
  closeAuthModal: () => void;
  intendedRole: UserRole;

  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<UserRole>('CUSTOMER');

  // Cart & Wishlist state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [intendedRole, setIntendedRole] = useState<UserRole>('CUSTOMER');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Load session on startup
  useEffect(() => {
    async function initSession() {
      try {
        const res = await api.getMe();
        if (res.user) {
          setUser(res.user);
          setActiveRole(res.user.role);
          if (res.store) setStore(res.store);
          
          // Load cart & wishlist
          loadCartAndWishlist();
        }
      } catch (e) {
        // Unauthenticated or expired session
        setApiUserId(null);
      } finally {
        setIsLoading(false);
      }
    }
    initSession();
  }, []);

  async function loadCartAndWishlist() {
    try {
      const [cartRes, wishlistRes] = await Promise.all([
        api.getCart().catch(() => ({ items: [] })),
        api.getWishlist().catch(() => []),
      ]);
      if (cartRes?.items) setCartItems(cartRes.items);
      if (Array.isArray(wishlistRes)) setWishlistIds(wishlistRes);
    } catch (err) {
      console.warn('Failed to load cart/wishlist', err);
    }
  }

  async function loginDirect(phone: string, role: UserRole, name?: string): Promise<User> {
    const res = await api.loginDirect(phone, role === 'SHOPKEEPER' ? 'SHOPKEEPER' : 'CUSTOMER', name);
    setUser(res.user);
    setActiveRole(res.user.role);
    if (res.store) setStore(res.store);
    await loadCartAndWishlist();
    setIsAuthModalOpen(false);
    return res.user;
  }

  async function loginWithPhoneOtp(phone: string, code: string, name?: string): Promise<User> {
    const res = await api.verifyOtp(phone, code, name);
    setUser(res.user);
    setActiveRole(res.user.role);
    if (res.store) setStore(res.store);
    await loadCartAndWishlist();
    setIsAuthModalOpen(false);
    return res.user;
  }

  async function quickLoginAs(type: 'seller' | 'customer') {
    setIsLoading(true);
    try {
      if (type === 'seller') {
        const res = await api.verifyOtp('+91 98765 43210', '123456', 'Vikram Sethi');
        setUser(res.user);
        setActiveRole('SHOPKEEPER');
        if (res.store) setStore(res.store);
      } else {
        const res = await api.verifyOtp('+91 91234 56789', '123456', 'Rahul Sharma');
        setUser(res.user);
        setActiveRole('CUSTOMER');
        setStore(null);
      }
      await loadCartAndWishlist();
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function upgradeToShopkeeper() {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.switchRole(user.id, 'SHOPKEEPER');
      setUser(res.user);
      setActiveRole('SHOPKEEPER');
      if (res.store) setStore(res.store);
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setStore(null);
    setCartItems([]);
    setWishlistIds([]);
    setApiUserId(null);
    setActiveRole('CUSTOMER');
  }

  async function refreshUserAndStore() {
    try {
      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
        if (res.store) setStore(res.store);
      }
    } catch (err) {
      console.warn('Failed to refresh user/store', err);
    }
  }

  async function updateProfile(data: { name?: string; email?: string }): Promise<User> {
    const updated = await api.updateProfile(data);
    setUser(updated);
    return updated;
  }

  function openAuthModal(role: UserRole = 'CUSTOMER') {
    setIntendedRole(role);
    setIsAuthModalOpen(true);
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false);
  }

  // Cart operations
  async function addToCart(product: Product, quantity = 1, variantLabel?: string) {
    if (!user) {
      openAuthModal('CUSTOMER');
      return;
    }
    const existingIndex = cartItems.findIndex(
      item => item.productId === product.id && item.variantLabel === variantLabel
    );

    let newItems: CartItem[];
    if (existingIndex > -1) {
      newItems = cartItems.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      newItems = [
        ...cartItems,
        {
          productId: product.id,
          storeId: product.storeId,
          variantLabel,
          quantity,
          price: product.price,
          product,
        },
      ];
    }
    setCartItems(newItems);
    try {
      await api.updateCart(newItems);
    } catch (err) {
      console.error('Failed to sync cart to server:', err);
    }
  }

  async function updateCartQuantity(productId: string, quantity: number, variantLabel?: string) {
    if (quantity <= 0) {
      await removeFromCart(productId, variantLabel);
      return;
    }
    const newItems = cartItems.map(item => {
      if (item.productId === productId && item.variantLabel === variantLabel) {
        return { ...item, quantity };
      }
      return item;
    });
    setCartItems(newItems);
    try {
      await api.updateCart(newItems);
    } catch (err) {
      console.error('Failed to sync cart update:', err);
    }
  }

  async function removeFromCart(productId: string, variantLabel?: string) {
    const newItems = cartItems.filter(
      item => !(item.productId === productId && item.variantLabel === variantLabel)
    );
    setCartItems(newItems);
    try {
      await api.updateCart(newItems);
    } catch (err) {
      console.error('Failed to sync cart removal:', err);
    }
  }

  async function clearCart() {
    setCartItems([]);
    try {
      await api.clearCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  }

  // Wishlist operations
  async function toggleWishlist(productId: string) {
    if (!user) {
      openAuthModal('CUSTOMER');
      return;
    }
    try {
      const updated = await api.toggleWishlist(productId);
      setWishlistIds(updated);
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    }
  }

  function isInWishlist(productId: string) {
    return wishlistIds.includes(productId);
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        isLoading,
        activeRole,
        setActiveRole,
        setStore,
        setUser,
        loginWithPhoneOtp,
        loginDirect,
        quickLoginAs,
        upgradeToShopkeeper,
        logout,
        refreshUserAndStore,
        updateProfile,
        cartItems,
        cartCount,
        cartSubtotal,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        intendedRole,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
