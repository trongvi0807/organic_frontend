import { Heart, Plus, Leaf } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';
import { currency, cn } from '@/lib/utils';
import { DEMO_MODE } from '@/services/api';
import { Reveal } from '@/components/common/Reveal';

export function ProductCard({ product, onView, index = 0 }) {
  const { favorites, toggleFavorite, addToCart } = useShop();
  const favorite = favorites.includes(product.id);
  const organicVerified = product.organicVerified === true || (DEMO_MODE && product.organicClaimStatus === 'verified');
  return <Reveal as="article" className="product-card" delay={(index % 4) * 45}>
    <div className="product-image">
      <button className="product-image-link" onClick={() => onView(product)} aria-label={`Xem ${product.productName}`}><img src={product.imageUrl || '/images/vegetables.jpg'} alt={product.productName} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/vegetables.jpg'; }} /></button>
      {product.badge && <span className={cn('product-badge', product.badge.startsWith('-') && 'badge-sale')}>{product.badge}</span>}
      <button className={cn('favorite-button', favorite && 'is-favorite')} aria-label={`${favorite ? 'Bỏ yêu thích' : 'Yêu thích'} ${product.productName}`} aria-pressed={favorite} onClick={() => toggleFavorite(product.id)}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button>
      {organicVerified && <span className="organic-label"><Leaf size={11} />Có chứng nhận hợp lệ</span>}
    </div>
    <div className="product-info"><p className="product-category">{product.categoryName}</p><h3><button className="product-title" onClick={() => onView(product)}>{product.productName}</button></h3><div className="product-meta"><span>{product.unit || 'Theo quy cách'}</span><span className={cn('stock', product.stock === 0 && 'stock-out', product.stock == null && 'stock-unknown')}>{product.stock != null && <i />}{product.stock === 0 ? 'Hết hàng' : product.stock == null ? 'Xem chi tiết' : 'Còn hàng'}</span></div><div className="price-row"><div><strong>{currency(product.minPrice)}</strong>{product.compareAtPrice && <del>{currency(product.compareAtPrice)}</del>}</div><button className="add-button" disabled={product.stock === 0 || product.minPrice == null} onClick={() => addToCart(product)} aria-label={`Thêm ${product.productName} vào giỏ`}><Plus size={19} /></button></div></div>
  </Reveal>;
}
