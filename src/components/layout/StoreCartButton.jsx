import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';

export function StoreCartButton({ onClick }) {
  const { cart, cartAdded } = useShop(), count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [highlight, setHighlight] = useState(false);
  useEffect(() => {
    if (!cartAdded) { setHighlight(false); return; }
    setHighlight(true); const timer = setTimeout(() => setHighlight(false), 2200); return () => clearTimeout(timer);
  }, [cartAdded]);
  return <div className="relative"><button type="button" className={`icon-button cart-toggle store-cart-toggle ${highlight ? 'cart-just-added' : ''}`} onClick={onClick} aria-label={`Giỏ hàng, ${count} sản phẩm`}><ShoppingBag key={cartAdded?.sequence || 'initial'} size={21} /><span key={`badge-${cartAdded?.sequence || 'initial'}`} className="store-cart-count" aria-hidden="true">{count > 99 ? '99+' : count}</span></button><span className="sr-only" role="status">{highlight ? `Đã thêm ${cartAdded?.productName} vào giỏ hàng. Hiện có ${count} sản phẩm.` : ''}</span></div>;
}
