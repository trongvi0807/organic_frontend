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
  const price = data?.minPrice ?? data?.variants?.find((variant) => variant.status === 'active')?.sellingPrice ?? product.minPrice;
  return <Modal open onOpenChange={(value) => { if (!value) onClose(); }} title="Chi tiết sản phẩm" description="Một lựa chọn tươi lành cho bạn." className="detail-modal">
    <ResourceState loading={loading} error={error} onRetry={reload} />
    {!loading && !error && data && <div className="detail-grid"><img src={data.imageUrl || data.images?.[0]?.imageUrl || '/images/vegetables.jpg'} alt={data.productName} /><div><span className="eyebrow"><Leaf size={14} />{data.categoryName}</span><h2>{data.productName}</h2><p className="detail-price">{currency(price)}</p><p>{data.description || 'Sản phẩm được chọn lọc cho lối sống lành mạnh của bạn.'}</p><p className="detail-claim"><Check size={16} />{data.organicClaimStatus === 'verified' ? 'Thông tin hữu cơ đã được xác minh' : 'Thông tin hữu cơ đang được xác minh'}</p><p className="muted">{data.stock == null ? 'API hiện chưa cung cấp số lượng tồn kho.' : `Tồn kho: ${data.stock} · ${data.unit}`}</p><Button className="w-full mt-5" disabled={data.stock === 0 || price == null} onClick={() => addToCart({ ...data, minPrice: price, imageUrl: data.imageUrl || data.images?.[0]?.imageUrl })}><ShoppingBag size={17} />{data.stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}</Button></div></div>}
  </Modal>;
}
