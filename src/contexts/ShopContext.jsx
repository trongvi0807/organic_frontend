import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { hasRole } from '@/lib/permissions';
import { DEMO_MODE, getSession } from '@/services/api';
import { createCartService } from '@/services/client/cartService';
import { catalogService } from '@/services/client/catalogService';
import { readStorage, writeStorage } from '@/lib/storage';
import { cartItemKey, changeCartQuantity, parseCartQuantity, quantityLimit, selectAllCartItems, selectCartItem } from '@/lib/cart';
import { cartFromServer } from '@/lib/checkout';
import { sellableVariants } from '@/lib/productDetail';
import { errorMessage } from '@/lib/utils';

const ShopContext = createContext(null);
export function ShopProvider({ children }) {
  const { user } = useAuth();
  const customer = hasRole(user, 'CUSTOMER');
  const allowed = !user || customer;
  const token = getSession()?.accessToken || '';
  const scope = `${user?.username || 'guest'}:${getSession()?.sessionId || token}`;
  const currentScope = useRef(scope); currentScope.current = scope;
  const [cart, setCart] = useState(() => DEMO_MODE ? readStorage('moc.cart', []) : []);
  const cartRef = useRef(cart); cartRef.current = cart;
  const [favorites, setFavorites] = useState(() => readStorage('moc.favorites', []));
  const [promoCode, setPromoCode] = useState('');
  const [rewardPoints, setRewardPoints] = useState(0);
  const [cartLoading, setLoading] = useState(!DEMO_MODE), [cartBusy, setBusy] = useState(false), [cartError, setError] = useState(''), [cartMeta, setMeta] = useState(null);
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);
  const remoteVersion = useRef(0);
  useEffect(() => { if (DEMO_MODE) writeStorage('moc.cart', cart); }, [cart]);
  useEffect(() => writeStorage('moc.favorites', favorites), [favorites]);
  const sameScope = () => currentScope.current === scope && `${getSession()?.user?.username || 'guest'}:${getSession()?.sessionId || getSession()?.accessToken || ''}` === scope;
  function accept(data) {
    if (!sameScope()) return;
    remoteVersion.current += 1; setMeta(data); const next = cartFromServer(data, cartRef.current); cartRef.current = next; setCart(next); setError('');
  }
  const refreshCart = useCallback(async () => {
    if (DEMO_MODE || !allowed) return;
    setLoading(true); setError('');
    const version = ++remoteVersion.current;
    try { const data = await createCartService(customer).get(); if (currentScope.current === scope && version === remoteVersion.current) { setMeta(data); const next = cartFromServer(data, cartRef.current); cartRef.current = next; setCart(next); } return data; }
    catch (err) { if (currentScope.current === scope && version === remoteVersion.current) setError(errorMessage(err)); throw err; }
    finally { if (currentScope.current === scope) setLoading(false); }
  }, [scope, customer, allowed]);
  useEffect(() => {
    if (DEMO_MODE) return;
    cartRef.current = []; pending.current = 0; setCart([]); setMeta(null); setPromoCode(''); setRewardPoints(0); setError(''); setBusy(false);
    if (allowed) refreshCart().catch(() => {}); else setLoading(false);
  }, [scope, allowed, refreshCart]);
  useEffect(() => {
    if (DEMO_MODE || !allowed) return;
    const focus = () => { if (document.visibilityState === 'visible') refreshCart().catch(() => {}); };
    window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus);
  }, [refreshCart, allowed]);
  function mutate(task, message) {
    if (!allowed) { toast.error('Giỏ hàng dành cho khách hàng. Vui lòng dùng tài khoản khách hoặc đăng xuất.'); return Promise.resolve(false); }
    remoteVersion.current += 1; pending.current += 1; setBusy(true);
    const run = queue.current.catch(() => {}).then(async () => {
      if (!sameScope()) return false;
      const service = createCartService(customer);
      try { const data = await task(service); accept(data); if (message && sameScope()) toast.success(message); return true; }
      catch (err) {
        if (!sameScope()) return false;
        setError(errorMessage(err)); toast.error(errorMessage(err));
        // A POST may already have reached Redis. Read back; never repeat additive writes.
        try { accept(await service.get()); } catch { /* Preserve error; do not replace a failed read with an empty cart. */ }
        return false;
      } finally { if (sameScope()) { pending.current -= 1; setBusy(pending.current > 0); } }
    });
    queue.current = run; return run;
  }
  function addToCart(product, quantity = 1) {
    if (!DEMO_MODE) return mutate(async (service) => {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new Error('Số lượng cần là số gói/hộp nguyên từ 1 đến 999.');
      let variantId = product.variantId || product.defaultVariantId;
      if (!variantId) {
        const detail = await catalogService.product(product.id);
        const variants = sellableVariants(detail);
        variantId = variants.find((v) => v.id === detail.defaultVariantId)?.id || variants[0]?.id;
      }
      if (!variantId) throw new Error('Sản phẩm chưa có quy cách đang bán. Vui lòng xem chi tiết.');
      if (!sameScope()) throw new Error('Phiên đã thay đổi. Vui lòng thử lại.');
      return service.add(variantId, quantity);
    }, `Đã thêm ${product.productName} vào giỏ`);
    if (product.stock === 0 || product.minPrice == null || !Number.isInteger(quantity) || quantity < 1) return false;
    const variantId = product.variantId || product.defaultVariantId, cartKey = variantId ? `${product.id}:${variantId}` : product.id;
    const maximum = Math.min(product.stock ?? 99, 99);
    setCart((items) => items.some((item) => cartItemKey(item) === cartKey) ? items.map((item) => cartItemKey(item) === cartKey ? { ...item, minPrice: product.minPrice, stock: product.stock, selected: true, quantity: Math.min(item.quantity + quantity, maximum) } : item) : [...items, { ...product, variantId, cartKey, selected: true, quantity: Math.min(quantity, maximum) }]);
    toast.success(`Đã thêm ${product.productName} vào giỏ`); return true;
  }
  function updateQuantity(key, amount) {
    if (DEMO_MODE) { setCart((items) => changeCartQuantity(items, key, amount)); return; }
    return mutate((service) => { const item = cartRef.current.find((line) => cartItemKey(line) === key); if (!item) throw new Error('Dòng giỏ hàng đã thay đổi.'); return service.quantity(item.variantId, item.quantity + amount); });
  }
  function removeFromCart(key) {
    if (DEMO_MODE) { setCart((items) => items.filter((item) => cartItemKey(item) !== key)); return; }
    return mutate((service) => { const item = cartRef.current.find((line) => cartItemKey(line) === key); if (!item) throw new Error('Dòng giỏ hàng đã thay đổi.'); return service.remove(item.variantId); });
  }
  function setQuantity(key, value) {
    const item = cartRef.current.find((line) => cartItemKey(line) === key);
    try {
      if (!item) throw new Error('Dòng giỏ hàng đã thay đổi.');
      const quantity = parseCartQuantity(value, quantityLimit(item));
      if (DEMO_MODE) { setCart((items) => items.map((line) => cartItemKey(line) === key ? { ...line, quantity } : line)); return true; }
      return mutate((service) => service.quantity(item.variantId, quantity));
    } catch (e) { toast.error(e.message, { position: 'top-left', id: 'cart-quantity' }); return false; }
  }
  function clearCart() {
    if (DEMO_MODE) { setCart([]); setPromoCode(''); setRewardPoints(0); return true; }
    return mutate((service) => service.clear(), 'Đã xóa toàn bộ giỏ hàng.').then((success) => { if (success) { setPromoCode(''); setRewardPoints(0); } return success; });
  }
  function removePurchased(items) {
    return mutate(async (service) => {
      let data = await service.get();
      for (const purchased of items) {
        const row = data.items.find((line) => line.variantId === purchased.variantId);
        // Keep changed quantities; never clear unrelated or newly edited lines.
        if (row?.quantity === purchased.quantity) data = await service.remove(row.variantId);
      }
      return data;
    });
  }
  function toggleFavorite(id) { setFavorites((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); }
  return <ShopContext.Provider value={{ cart, favorites, addToCart, updateQuantity, setQuantity, toggleFavorite, promoCode, setPromoCode, rewardPoints, setRewardPoints, clearCart, removeFromCart, refreshCart, removePurchased, cartLoading, cartBusy, cartError, cartMeta, cartAllowed: allowed,
    setItemSelected: (key, selected) => { const next = selectCartItem(cartRef.current, key, selected); cartRef.current = next; setCart(next); },
    setAllSelected: (selected) => { const next = selectAllCartItems(cartRef.current, selected); cartRef.current = next; setCart(next); },
  }}>{children}</ShopContext.Provider>;
}
export const useShop = () => useContext(ShopContext);
