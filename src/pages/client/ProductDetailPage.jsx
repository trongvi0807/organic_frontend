import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ChevronRight, Heart, Leaf, MapPin, Minus, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
import { catalogService } from '@/services/client/catalogService';
import { useResource } from '@/hooks/useResource';
import { useShop } from '@/contexts/ShopContext';
import { currency } from '@/lib/utils';
import { dateText, normalizeHomeProduct } from '@/lib/apiData';
import { productImages, safeMediaUrl, sellableVariants, variantDisplayName } from '@/lib/productDetail';
import { ResourceState } from '@/components/common/ResourceState';
import { Reveal } from '@/components/common/Reveal';
import { Button } from '@/components/ui/button';
import { ProductGallery } from '@/components/products/ProductGallery';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductReviews } from '@/components/products/ProductReviews';
import { StarRating } from '@/components/products/StarRating';
import { useProductAvailability } from '@/hooks/useProductAvailability';
import { availableVariantQuantity } from '@/lib/productAvailability';
import { storeCategoryLabel, storeCategoryPath } from '@/lib/storeCategoryTree';

export default function ProductDetailPage() {
  const { slug, productId } = useParams();
  return <ProductResource key={productId || slug} productId={productId} slug={slug} />;
}

function ProductResource({ productId, slug }) {
  const result = useResource(() => productId ? catalogService.product(productId) : catalogService.productBySlug(slug), [productId, slug]);
  if (result.loading) return <div className="container product-detail-page"><ResourceState loading /></div>;
  if (result.error || !result.data) return <div className="container product-detail-page product-detail-error"><span className="eyebrow">THÔNG TIN SẢN PHẨM</span><h1>Sản phẩm chưa thể hiển thị</h1><ResourceState error={result.error || 'Sản phẩm không tồn tại hoặc đã ngừng bán.'} onRetry={result.reload} /><Link className="text-link" to="/san-pham"><ArrowLeft size={16} />Về danh sách sản phẩm</Link></div>;
  return <ProductScreen product={result.data} />;
}

function ProductScreen({ product }) {
  const { addToCart, favorites, toggleFavorite } = useShop();
  const variants = sellableVariants(product);
  const [variantId, setVariantId] = useState(variants.find((item) => item.id === product.defaultVariantId)?.id || variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const variant = variants.find((item) => item.id === variantId);
  const availability = useProductAvailability(product, variant?.id);
  const categories = useResource(() => catalogService.categoryTree(), []);
  const categoryPath = storeCategoryPath(categories.data || [], product.categoryId, product.categoryName);
  const images = productImages(product);
  const related = (product.relatedProducts || []).filter((item) => item.id !== product.id).map(normalizeHomeProduct);
  const favorite = favorites.includes(product.id);
  const availableQuantity = availability.quantity;
  const maxQuantity = Math.max(1, Math.min(999, availableQuantity ?? 999));
  const canAdd = !!variant && product.canAddToCart !== false && availableQuantity !== 0;
  const price = variant?.sellingPrice ?? product.minPrice;
  const compare = variant?.compareAtPrice > price ? variant.compareAtPrice : null;
  const certificates = (product.certifications || []).filter((item) => item.currentlyValid === true);
  const reviewSummary = product.reviewSummary;
  useEffect(() => { document.title = `${product.productName} | Mộc Organic`; }, [product.productName]);
  useEffect(() => { if (availableQuantity > 0) setQuantity((value) => value === '' ? '' : Math.min(Number(value) || 1, maxQuantity)); }, [availableQuantity, maxQuantity]);
  async function add() {
    if (!canAdd || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) return;
    const added = await addToCart({ ...product, stock: availableQuantity, variantId: variant.id, defaultVariantId: variant.id, minPrice: price, unit: variantDisplayName(variant), imageUrl: images[0]?.url }, quantity);
    if (added) availability.reload();
  }
  return <div className="product-detail-page">
    <div className="container"><nav className="product-breadcrumbs" aria-label="Đường dẫn sản phẩm"><Link to="/">Trang chủ</Link><ChevronRight size={13} />{categoryPath.map((item) => <span key={item.id} className="inline-flex items-center gap-2"><Link to={`/san-pham?category=${encodeURIComponent(item.id || '')}`}>{item.name}</Link><ChevronRight size={13} /></span>)}<span aria-current="page">{product.productName}</span></nav>
      <div className="product-detail-hero"><ProductGallery images={images} name={product.productName} /><div className="product-purchase-panel">
        <div className="product-detail-kicker"><span className="eyebrow">{storeCategoryLabel(categories.data || [], product.categoryId, product.categoryName)}</span>{product.organicVerified === true && <a href="#chung-nhan" className="detail-organic-badge"><Leaf size={13} />Xem chứng nhận hợp lệ</a>}</div>
        <h1>{product.productName}</h1><p className="product-code">Mã sản phẩm: {product.productCode}{product.brandName ? ` · ${product.brandName}` : ''}</p>
        <a className="product-rating-link" href="#danh-gia">{reviewSummary?.totalReviews > 0 ? <><StarRating value={Number(reviewSummary.averageRating)} /><span>{Number(reviewSummary.averageRating).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} · {reviewSummary.totalReviews} lượt đánh giá</span></> : <><StarRating /><span>Chưa có đánh giá · Viết chia sẻ đầu tiên</span></>}</a>
        <div className="product-detail-pricing"><strong>{currency(price)}</strong>{compare && <del>{currency(compare)}</del>}{variant && <span>/ {variantDisplayName(variant)}</span>}</div>
        {product.origin && <p className="product-origin-line"><MapPin size={16} />{[product.origin.originName, product.origin.region, product.origin.country].filter(Boolean).join(' · ')}</p>}
        <fieldset className="variant-picker"><legend>Chọn quy cách</legend><div>{variants.map((item) => <label key={item.id} className={variantId === item.id ? 'selected' : ''}><input type="radio" name="product-variant" value={item.id} checked={variantId === item.id} onChange={() => { setVariantId(item.id); setQuantity(1); }} /><span>{variantDisplayName(item)}</span><small>{currency(item.sellingPrice)}</small>{availableVariantQuantity(availability.quantities, item.id) != null && <small className="!text-stone-600">{availableVariantQuantity(availability.quantities, item.id) === 0 ? 'Tạm hết hàng' : `Còn ${availableVariantQuantity(availability.quantities, item.id).toLocaleString('vi-VN')}`}</small>}</label>)}</div>{!variants.length && <p className="form-note">Chưa có quy cách hợp lệ để thêm vào giỏ.</p>}</fieldset>
        <div className="product-quantity-row"><label htmlFor="product-quantity">Số lượng</label><div className="product-quantity-control"><button aria-label="Giảm số lượng" disabled={quantity <= 1 || !canAdd} onClick={() => setQuantity((value) => Math.max(1, (Number(value) || 1) - 1))}><Minus size={16} /></button><input id="product-quantity" type="number" inputMode="numeric" min={1} max={maxQuantity} step={1} value={quantity} disabled={!canAdd} onChange={(event) => setQuantity(event.target.value === '' ? '' : Number(event.target.value))} onBlur={() => setQuantity((value) => Math.min(maxQuantity, Math.max(1, Math.floor(Number(value) || 1))))} /><button aria-label="Tăng số lượng" disabled={quantity >= maxQuantity || !canAdd} onClick={() => setQuantity((value) => Math.min(maxQuantity, (Number(value) || 1) + 1))}><Plus size={16} /></button></div><span role="status" className="!text-sm !text-[#1B4D2E]">{availableQuantity === 0 ? 'Tạm hết hàng ở quy cách này' : availableQuantity == null ? availability.loading ? 'Đang kiểm tra số lượng hiện có…' : 'Chưa kiểm tra được số lượng hiện có' : <>Số lượng có thể mua: <strong>{availableQuantity.toLocaleString('vi-VN')}</strong> · {variantDisplayName(variant)}</>}</span></div>
        <div className="product-purchase-actions"><Button disabled={!canAdd || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity} onClick={add}><ShoppingBag size={18} />{availableQuantity === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}{canAdd && Number.isInteger(quantity) && quantity > 0 && <span>{currency(Number(price) * quantity)}</span>}</Button><button className={`detail-favorite ${favorite ? 'selected' : ''}`} aria-pressed={favorite} aria-label={favorite ? 'Bỏ yêu thích sản phẩm' : 'Yêu thích sản phẩm'} onClick={() => toggleFavorite(product.id)}><Heart size={20} fill={favorite ? 'currentColor' : 'none'} /></button></div>
        <p className="product-purchase-note">Thêm vào giỏ chưa giữ hàng. Tồn khả dụng được kiểm tra lại khi thanh toán.</p><div className="product-detail-assurance"><Leaf size={19} strokeWidth={1.3} /><p>Tìm hiểu kỹ trước khi lựa chọn.<span>Xem xuất xứ, quy cách và chứng nhận được cửa hàng công bố bên dưới.</span></p></div>
      </div></div>
      <nav className="product-detail-tabs" aria-label="Nội dung chi tiết"><a href="#thong-tin">Thông tin sản phẩm</a><a href="#chung-nhan">Chứng nhận</a><a href="#danh-gia">Đánh giá{reviewSummary?.totalReviews ? ` (${reviewSummary.totalReviews})` : ''}</a>{!!related.length && <a href="#lien-quan">Có thể bạn cũng thích</a>}</nav>
      <section className="product-information" id="thong-tin"><div><span className="eyebrow">HIỂU HƠN VỀ LỰA CHỌN CỦA BẠN</span><h2>Thông tin sản phẩm</h2><p className="product-description">{product.description || 'Cửa hàng chưa bổ sung mô tả cho sản phẩm này.'}</p><dl className="product-facts"><div><dt>Danh mục</dt><dd>{storeCategoryLabel(categories.data || [], product.categoryId, product.categoryName)}</dd></div>{product.brandName && <div><dt>Thương hiệu</dt><dd>{product.brandName}</dd></div>}{variant && <div><dt>Quy cách đang chọn</dt><dd>{variantDisplayName(variant)}{variant.sku ? ` · SKU ${variant.sku}` : ''}</dd></div>}</dl></div><div className="product-provenance scroll-mt-32" id="chung-nhan"><h3><MapPin size={18} />Nguồn gốc & chứng nhận</h3>{product.origin ? <><strong>{product.origin.originName}</strong><p>{[product.origin.region, product.origin.country].filter(Boolean).join(', ')}</p>{product.origin.producerName && <p>{product.origin.producerName}</p>}{product.origin.description && <p>{product.origin.description}</p>}</> : <p>Chưa có thông tin xuất xứ được công bố.</p>}{certificates.length > 0 ? <div className="product-certificates">{certificates.map((item) => <article key={item.id}><ShieldCheck size={19} /><div><strong>{item.certificateName}</strong><span>{item.certificateNumber} · {item.issuingOrganization}</span><small>{dateText(item.issuedAt)} → {item.expiresAt ? dateText(item.expiresAt) : 'Không đặt ngày hết hạn'}</small>{safeMediaUrl(item.documentUrl) && <a href={safeMediaUrl(item.documentUrl)} target="_blank" rel="noopener noreferrer">Xem tài liệu chứng nhận <ArrowUpRight size={13} /></a>}</div></article>)}</div> : <p className="provenance-footnote">Chưa có tài liệu chứng nhận hợp lệ được công bố.</p>}</div></section>
      <ProductReviews product={product} />
    </div>
    {!!related.length && <Reveal as="section" className="product-related" id="lien-quan"><div className="container"><div className="section-heading"><div><span className="eyebrow">THÊM MỘT CHÚT TƯƠI LÀNH</span><h2>Có thể bạn cũng thích</h2><p>Những lựa chọn khác trong cùng danh mục.</p></div><Link className="text-link" to={`/san-pham?category=${encodeURIComponent(product.categoryId || '')}`}>Khám phá danh mục <ArrowUpRight size={16} /></Link></div><div className="product-grid">{related.map((item,index) => <ProductCard key={item.id} product={item} index={index} categories={categories.data || []} />)}</div></div></Reveal>}
  </div>;
}
