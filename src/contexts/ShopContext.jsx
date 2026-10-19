import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { readStorage, writeStorage } from '@/lib/storage';

const ShopContext = createContext(null);
export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() => readStorage('moc.cart', []));
  const [favorites, setFavorites] = useState(() => readStorage('moc.favorites', []));
  useEffect(() => writeStorage('moc.cart', cart), [cart]);
  useEffect(() => writeStorage('moc.favorites', favorites), [favorites]);
  function addToCart(product) {
    if (product.stock === 0 || product.minPrice == null) return;
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) return items.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock ?? 99) } : item);
      return [...items, { ...product, quantity: 1 }];
    });
    toast.success(`Đã thêm ${product.productName} vào giỏ`);
  }
  function updateQuantity(id, amount) {
    setCart((items) => items.map((item) => item.id === id ? { ...item, quantity: Math.min(item.quantity + amount, item.stock ?? 99) } : item).filter((item) => item.quantity > 0));
  }
  function toggleFavorite(id) { setFavorites((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); }
  return <ShopContext.Provider value={{ cart, favorites, addToCart, updateQuantity, toggleFavorite, removeFromCart: (id) => setCart((items) => items.filter((item) => item.id !== id)) }}>{children}</ShopContext.Provider>;
}
export const useShop = () => useContext(ShopContext);
