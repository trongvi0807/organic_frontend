import { Heart, ShoppingBag, Check, LoaderCircle, Leaf, Eye } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '@/contexts/ShopContext';
import { currency, cn } from '@/lib/utils';
import { DEMO_MODE } from '@/services/api';
import { Reveal } from '@/components/common/Reveal';
import { productHref } from '@/lib/productDetail';
import { toast } from 'sonner';

export function ProductCard({ product, onView, index = 0 }) {
  const { favorites, toggleFavorite, addToCart } = useShop();
  const [adding, setAdding] = useState(false), [added, setAdded] = useState(false), locked = useRef(false), timer = useRef(null), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  async function add() {
    if (locked.current) return; locked.current = true; setAdding(true);
    try { const success = await addToCart(product); if (success && mounted.current) { setAdded(true); clearTimeout(timer.current); timer.current = setTimeout(() => setAdded(false), 2200); } }
    catch { toast.error('Chưa thêm được sản phẩm vào giỏ. Vui lòng thử lại.'); }
    finally { locked.current = false; if (mounted.current) setAdding(false); }
  }
  const favorite = favorites.includes(product.id);
  const organicVerified = product.organicVerified === true || (DEMO_MODE && product.organicClaimStatus === 'verified');
  const currentPrice = Number(product.minPrice), originalPrice = Number(product.compareAtPrice);
  const discount = Number.isFinite(currentPrice) && Number.isFinite(originalPrice) && currentPrice > 0 && originalPrice > currentPrice ? Math.floor((originalPrice - currentPrice) / originalPrice * 100) : 0;
  const badge = discount > 0 ? `-${discount}%` : product.badge;
  return <Reveal as="article" className="product-card" delay={(index % 4) * 45}>
    <div className="product-image">
      <Link className="product-image-link" to={productHref(product)} aria-label={`Xem ${product.productName}`}><img src={product.imageUrl || '/images/vegetables.jpg'} alt={product.productName} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/vegetables.jpg'; }} /></Link>
      {badge && <span className={cn('product-badge', badge.startsWith('-') && 'badge-sale')}>{badge}</span>}
      <button className={cn('favorite-button', favorite && 'is-favorite')} aria-label={`${favorite ? 'Bỏ yêu thích' : 'Yêu thích'} ${product.productName}`} aria-pressed={favorite} onClick={() => toggleFavorite(product.id)}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button>
      {organicVerified && <Link to={`${productHref(product)}#chung-nhan`} className="organic-label" aria-label={`Xem chứng nhận của ${product.productName}`}><Leaf size={11} />Có chứng nhận hợp lệ</Link>}
      {onView && <button className="quick-view-button" aria-label={`Xem nhanh ${product.productName}`} onClick={() => onView(product)}><Eye size={16} /></button>}
    </div>
    <div className="product-info"><p className="product-category">{product.categoryName}</p><h3><Link className="product-title" to={productHref(product)}>{product.productName}</Link></h3><div className="product-meta"><span>{product.unit || 'Theo quy cách'}</span><span className={cn('stock', product.stock === 0 && 'stock-out', product.stock == null && 'stock-unknown')}>{product.stock != null && <i />}{product.stock === 0 ? 'Hết hàng' : product.stock == null ? 'Xem chi tiết' : 'Còn hàng'}</span></div><div className="price-row"><div><strong>{currency(product.minPrice)}</strong>{product.compareAtPrice && <del>{currency(product.compareAtPrice)}</del>}</div><button type="button" className={`add-button product-add-cta ${added ? 'is-added' : ''}`} disabled={adding || product.stock === 0 || product.minPrice == null} onClick={add} aria-label={`Thêm ${product.productName} vào giỏ`} aria-busy={adding}>{adding ? <LoaderCircle size={17} className="animate-spin" /> : added ? <Check size={17} /> : <ShoppingBag size={17} />}<span>{adding ? 'Đang thêm…' : added ? 'Đã thêm vào giỏ' : product.stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ'}</span></button></div></div>
  </Reveal>;
}
