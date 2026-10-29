import { Leaf, ShoppingBag, Check } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useResource } from '@/hooks/useResource';
import { catalogService } from '@/services/client/catalogService';
import { currency } from '@/lib/utils';
import { ResourceState } from '@/components/common/ResourceState';
import { Link } from 'react-router-dom';
import { productHref, variantDisplayName } from '@/lib/productDetail';
import { useShop } from '@/contexts/ShopContext';
import { useProductAvailability } from '@/hooks/useProductAvailability';
import { storeCategoryLabel } from '@/lib/storeCategoryTree';

export function ProductDetail({ product, onClose }) {
  const { data, loading, error, reload } = useResource(() => catalogService.product(product.id), [product.id]);
  const { addToCart } = useShop();
  const validVariants = data?.variants?.filter((variant) => variant.status === 'active' && Number(variant.sellingPrice) > 0 && Number(variant.netQuantity) > 0).sort((a,b) => a.sellingPrice - b.sellingPrice) || [];
  const chosen = validVariants.find((v) => v.id === data?.defaultVariantId) || validVariants[0];
  const availability = useProductAvailability(data, chosen?.id);
  const categories = useResource(() => catalogService.categoryTree(), []);
  const availableQuantity = availability.quantity;
  const price = chosen?.sellingPrice ?? data?.minPrice ?? product.minPrice;
  return <Modal open onOpenChange={(value) => { if (!value) onClose(); }} title="Chi tiết sản phẩm" description="Một lựa chọn tươi lành cho bạn." className="detail-modal">
    <Link className="quick-view-detail-link" to={productHref(product)} onClick={onClose}>Xem đầy đủ ảnh, thông tin và đánh giá →</Link>
    <ResourceState loading={loading} error={error} onRetry={reload} />
    {!loading && !error && data && <div className="detail-grid"><img src={data.imageUrl || data.images?.[0]?.imageUrl || '/images/vegetables.jpg'} alt={data.productName} /><div><span className="eyebrow"><Leaf size={14} />{storeCategoryLabel(categories.data || [], data.categoryId, data.categoryName)}</span><h2>{data.productName}</h2><p className="detail-price">{currency(price)}</p><p>{data.description || 'Thông tin sản phẩm từ cửa hàng.'}</p>{product.organicVerified === true && <p className="detail-claim"><Check size={16} />Có chứng nhận hợp lệ theo dữ liệu trang chủ.</p>}{product.originName && <p>Xuất xứ: {product.originName}{product.country ? ` · ${product.country}` : ''}</p>}<p className="text-sm text-[#1B4D2E]" role="status">{availableQuantity == null ? availability.loading ? 'Đang kiểm tra số lượng hiện có…' : 'Chưa kiểm tra được số lượng hiện có.' : availableQuantity === 0 ? 'Tạm hết hàng ở quy cách này.' : <>Số lượng có thể mua: <strong>{availableQuantity.toLocaleString('vi-VN')}</strong> · {variantDisplayName(chosen)}</>}</p><Link to={`${productHref(product)}#chung-nhan`} className="text-xs text-primary underline" onClick={onClose}>Xem nguồn gốc & chứng nhận</Link><Button className="w-full mt-5" disabled={availableQuantity === 0 || !chosen || data.canAddToCart === false || price == null} onClick={async () => { const added = await addToCart({ ...data, stock: availableQuantity, unit: variantDisplayName(chosen), variantId: chosen?.id, defaultVariantId: chosen?.id, minPrice: price, imageUrl: data.imageUrl || data.images?.[0]?.imageUrl }); if (added) availability.reload(); }}><ShoppingBag size={17} />{availableQuantity === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}</Button></div></div>}
  </Modal>;
}
