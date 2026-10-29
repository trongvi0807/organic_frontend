import { Heart, ShoppingBag, Check, LoaderCircle, Leaf, Eye } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '@/contexts/ShopContext';
import { currency, cn } from '@/lib/utils';
import { DEMO_MODE } from '@/services/api';
import { Reveal } from '@/components/common/Reveal';
import { productHref } from '@/lib/productDetail';
import { toast } from 'sonner';
import { useHome } from '@/contexts/HomeContext';
import { useProductAvailability } from '@/hooks/useProductAvailability';
import { storeCategoryLabel } from '@/lib/storeCategoryTree';
import { catalogService } from '@/services/client/catalogService';
import { useResource } from '@/hooks/useResource';

export function ProductCard({ product, onView, index = 0, categories }) {
  const { favorites, toggleFavorite, addToCart } = useShop();
  const home = useHome();
  const categoryTree = useResource(() => categories ? Promise.resolve(categories) : catalogService.categoryTree(), [categories]);
  const availability = useProductAvailability(product, product.defaultVariantId || product.variantId || (DEMO_MODE ? `${product.id}-default` : ''), { lazy: true });
  const stock = availability.quantity;
  const categoryLabel = storeCategoryLabel(categories || categoryTree.data || home?.data?.categories || [], product.categoryId, product.categoryName);
  const [adding, setAdding] = useState(false), [added, setAdded] = useState(false), locked = useRef(false), timer = useRef(null), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  async function add() {
    if (locked.current || stock === 0) return; locked.current = true; setAdding(true);
    try { const success = await addToCart({ ...product, stock }); if (success && mounted.current) { setAdded(true); availability.reload(); clearTimeout(timer.current); timer.current = setTimeout(() => setAdded(false), 2200); } }
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
    <div ref={availability.ref} className="product-info"><p className="product-category" title={categoryLabel}>{categoryLabel}</p><h3><Link className="product-title" to={productHref(product)}>{product.productName}</Link></h3><div className="product-meta !flex-wrap"><span>{product.unit || 'Theo quy cách'}</span><span className={cn('stock', stock === 0 && 'stock-out', stock == null && 'stock-unknown')} aria-label={stock == null ? 'Chưa xác định số lượng khả dụng' : `Có thể mua ${stock.toLocaleString('vi-VN')} sản phẩm ở quy cách ${product.unit || 'đang hiển thị'}`} title={stock == null ? 'Xem chi tiết để kiểm tra lại số lượng. Tồn kho được kiểm tra khi thanh toán.' : 'Số lượng khả dụng của quy cách đang hiển thị; thêm vào giỏ chưa giữ hàng.'}>{stock != null && <i />}{stock === 0 ? 'Hết hàng' : stock == null ? availability.loading ? 'Đang kiểm tra tồn…' : 'Chưa tải được số lượng' : `Còn ${stock.toLocaleString('vi-VN')}`}</span></div><div className="price-row"><div><strong>{currency(product.minPrice)}</strong>{product.compareAtPrice && <del>{currency(product.compareAtPrice)}</del>}</div><button type="button" className={`add-button product-add-cta ${added ? 'is-added' : ''}`} disabled={adding || stock === 0 || product.minPrice == null} onClick={add} aria-label={`Thêm ${product.productName} vào giỏ`} aria-busy={adding}>{adding ? <LoaderCircle size={17} className="animate-spin" /> : added ? <Check size={17} /> : <ShoppingBag size={17} />}<span>{adding ? 'Đang thêm…' : added ? 'Đã thêm vào giỏ' : stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ'}</span></button></div></div>
  </Reveal>;
}
