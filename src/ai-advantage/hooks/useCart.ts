import { useState, useEffect, useCallback } from 'react';
import { Product, CartItem } from '../types';

const STORAGE_KEY = 'ai_advantage_cart_v1';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage quota error
    }
  }, [items]);

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalINR = items.reduce(
    (sum, item) => sum + item.product.priceINR * item.quantity,
    0
  );

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    totalINR,
    totalCount,
    isOpen,
    setIsOpen,
    addToCart,
    removeFromCart,
    clearCart,
  };
}
