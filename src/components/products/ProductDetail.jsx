import { Leaf, ShoppingBag, Check } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useResource } from '@/hooks/useResource';
import { catalogService } from '@/services/client/catalogService';
import { currency } from '@/lib/utils';
import { ResourceState } from '@/components/common/ResourceState';
import { useShop } from '@/contexts/ShopContext';

export function ProductDetail({ product, onClose }) {
  const { data, loading, error, reload } = useResource(() => catalogService.product(product.id), [product.id]);
  const { addToCart } = useShop();
  const validVariants = data?.variants?.filter((variant) => variant.status === 'active' && Number(variant.sellingPrice) > 0 && Number(variant.netQuantity) > 0).sort((a,b) => a.sellingPrice - b.sellingPrice) || [];
  const price = validVariants[0]?.sellingPrice ?? data?.minPrice ?? product.minPrice;
  return <Modal open onOpenChange={(value) => { if (!value) onClose(); }} title="Chi tiết sản phẩm" description="Một lựa chọn tươi lành cho bạn." className="detail-modal">
    <ResourceState loading={loading} error={error} onRetry={reload} />
    {!loading && !error && data && <div className="detail-grid"><img src={data.imageUrl || data.images?.[0]?.imageUrl || '/images/vegetables.jpg'} alt={data.productName} /><div><span className="eyebrow"><Leaf size={14} />{data.categoryName}</span><h2>{data.productName}</h2><p className="detail-price">{currency(price)}</p><p>{data.description || 'Thông tin sản phẩm từ cửa hàng.'}</p>{product.organicVerified === true && <p className="detail-claim"><Check size={16} />Có chứng nhận hợp lệ theo dữ liệu trang chủ.</p>}{product.originName && <p>Xuất xứ: {product.originName}{product.country ? ` · ${product.country}` : ''}</p>}<p className="muted">{data.stock == null ? 'Chưa có thông tin số lượng tồn kho.' : `Tồn kho: ${data.stock} · ${data.unit}`}</p><Button className="w-full mt-5" disabled={data.stock === 0 || price == null} onClick={() => addToCart({ ...data, minPrice: price, imageUrl: data.imageUrl || data.images?.[0]?.imageUrl })}><ShoppingBag size={17} />{data.stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}</Button></div></div>}
  </Modal>;
}
