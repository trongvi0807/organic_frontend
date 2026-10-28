import { Select } from '@/components/ui/field';
import { useState } from 'react';
import { MessageSquare, PenLine, ShieldCheck, Play, SlidersHorizontal } from 'lucide-react';
import { reviewService } from '@/services/client/reviewService';
import { useResource } from '@/hooks/useResource';
import { reviewDate, reviewMedia } from '@/lib/productDetail';
import { Button } from '@/components/ui/button';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { StarRating } from './StarRating';
import { MediaViewer } from './MediaViewer';
import { ReviewComposer } from './ReviewComposer';

export function ProductReviews({ product }) {
  const [rating, setRating] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(0);
  const [writing, setWriting] = useState(false);
  const [viewer, setViewer] = useState(null);
  const result = useResource(() => reviewService.list(product.id, { page, size: 6, sort, rating: rating ? Number(rating) : undefined }), [product.id, page, sort, rating]);
  const summary = result.data?.summary ?? product.reviewSummary ?? { totalReviews: 0, averageRating: null, distribution: [] };
  function filter(value) { setRating(value); setPage(0); }
  function published() { setRating(''); setSort('newest'); setPage(0); result.reload(); }
  return <section className="product-reviews" id="danh-gia" aria-label="Đánh giá sản phẩm">
    <div className="section-heading"><div><span className="eyebrow">LẮNG NGHE TRẢI NGHIỆM THỰC TẾ</span><h2>Khách hàng chia sẻ</h2></div><Button variant={writing ? 'outline' : 'default'} aria-expanded={writing} aria-controls="review-composer-panel" onClick={() => setWriting(!writing)}><PenLine size={16} />{writing ? 'Đóng phần viết đánh giá' : 'Viết đánh giá'}</Button></div>
    <div className="reviews-summary"><div className="rating-overview">{summary.totalReviews > 0 && summary.averageRating != null ? <><strong>{Number(summary.averageRating).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<small>/ 5</small></strong><StarRating value={Number(summary.averageRating)} size={19} /><p>{summary.totalReviews} lượt đánh giá</p></> : <><MessageSquare size={32} strokeWidth={1.2} /><strong className="no-rating-label">Chưa có đánh giá</strong><p>Những chia sẻ đầu tiên đang chờ bạn.</p></>}</div><div className="rating-distribution">{[5,4,3,2,1].map((value) => { const count = Number(summary.distribution?.find((item) => item.rating === value)?.count || 0); return <button key={value} aria-label={`Lọc đánh giá ${value} sao, ${count} lượt`} aria-pressed={rating === String(value)} onClick={() => filter(rating === String(value) ? '' : String(value))}><span>{value} <span aria-hidden="true">★</span></span><span className="rating-track"><i style={{ width: `${summary.totalReviews ? Math.min(100, count / summary.totalReviews * 100) : 0}%` }} /></span><span>{count}</span></button>; })}</div></div>
    {writing && <div id="review-composer-panel"><ReviewComposer product={product} onPublished={published} /></div>}
    <div className="reviews-toolbar"><div className="rating-filter-tabs" role="group" aria-label="Lọc đánh giá theo sao">{[['','Tất cả'],...['5','4','3','2','1'].map((value) => [value,`${value} sao`])].map(([value,label]) => <button key={value} aria-pressed={rating === value} className={rating === value ? 'active' : ''} onClick={() => filter(value)}>{label}</button>)}</div><label><SlidersHorizontal size={14} /><span className="sr-only">Sắp xếp đánh giá</span><Select aria-label="Sắp xếp đánh giá" value={sort} onChange={(event) => { setSort(event.target.value); setPage(0); }}><option value="newest">Mới nhất</option><option value="highest">Sao cao nhất</option><option value="lowest">Sao thấp nhất</option></Select></label></div>
    <ResourceState loading={result.loading} error={result.error} onRetry={result.reload} />
    {!result.loading && !result.error && (!result.data?.reviews.items.length ? <div className="reviews-empty"><MessageSquare size={26} strokeWidth={1.2} /><p>{rating ? `Chưa có đánh giá ${rating} sao.` : 'Chưa có đánh giá công khai cho sản phẩm này.'}</p>{rating && <button onClick={() => filter('')}>Xem tất cả đánh giá</button>}</div> : <div className="reviews-list">{result.data.reviews.items.map((review) => { const media = reviewMedia(review); return <article className="customer-review" key={review.id}><div className="review-avatar" aria-hidden="true">{(review.reviewerName || 'K').slice(0,1)}</div><div className="review-content"><div className="review-author"><strong>{review.reviewerName || 'Khách hàng'}</strong>{review.verifiedPurchase && <span><ShieldCheck size={13} />Đã mua hàng</span>}<time dateTime={review.createdAt}>{reviewDate(review.createdAt)}</time></div><StarRating value={review.rating} />{review.variantName && <p className="review-variant">Quy cách: {review.variantName}</p>}{review.title && <h3>{review.title}</h3>}{review.content && <p className="review-body">{review.content}</p>}{!!media.length && <div className="review-media-grid">{media.map((item,index) => <button key={item.id} aria-label={`Xem ${item.type === 'video' ? 'video' : 'ảnh'} đánh giá ${index + 1} của ${review.reviewerName || 'khách hàng'}`} onClick={() => setViewer({ media, index })}>{item.type === 'image' ? <img src={item.url} alt={item.alt} loading="lazy" /> : <><Play size={23} /><span>Video</span></>}</button>)}</div>}</div></article>; })}</div>)}
    {!!result.data?.reviews.totalElements && <Pagination page={page} size={6} totalPages={result.data.reviews.totalPages} totalElements={result.data.reviews.totalElements} onChange={setPage} />}
    {viewer && <MediaViewer items={viewer.media} initialIndex={viewer.index} title="Ảnh & video đánh giá" onClose={() => setViewer(null)} />}
  </section>;
}
