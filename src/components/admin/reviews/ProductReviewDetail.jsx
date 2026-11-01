import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { reviewManagementService } from '@/services/admin/reviewManagementService';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { Field, Input, Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/products/StarRating';
import { ReviewAttachments } from '@/components/products/ReviewAttachments';
import { adminDate } from '@/lib/adminFormat';
import { ReviewMetrics, reviewSentiment } from './ReviewMetrics';

export function ProductReviewDetail({ id, from, to, onBack }) {
  const [search, setSearch] = useState(''), [rating, setRating] = useState(''), [sentiment, setSentiment] = useState('all'), [sort, setSort] = useState('newest'), [page, setPage] = useState(0);
  const keyword = useDebouncedValue(search);
  const product = useResource(() => reviewManagementService.product(id, { from: from || undefined, to: to || undefined }), [id, from, to]);
  const list = useResource(() => reviewManagementService.reviews(id, { search: keyword, rating: rating || undefined, sentiment, sort, from: from || undefined, to: to || undefined, page, size: 10 }), [id, keyword, rating, sentiment, sort, from, to, page]);
  const change = (setter) => (event) => { setter(event.target.value); setPage(0); };
  function refresh() { product.reload(); list.reload(); }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button variant="outline" onClick={onBack}><ArrowLeft size={16} />Danh sách sản phẩm</Button><Button variant="outline" onClick={refresh}>Tải lại</Button></div>
    <ResourceState loading={product.loading} error={product.error} onRetry={product.reload} />
    {!product.loading && !product.error && product.data && <><div><p className="text-xs text-stone-500">{product.data.productCode}</p><h2 className="!mt-2 !text-2xl">{product.data.productName}</h2></div><ReviewMetrics product={product.data} /></>}
    <section className="admin-table-panel !p-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Tìm trong đánh giá"><Input value={search} maxLength={200} placeholder="Nội dung, khách hàng, mã đơn…" onChange={change(setSearch)} /></Field>
        <Field label="Số sao"><Select value={rating} onChange={change(setRating)}><option value="">Tất cả số sao</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}</Select></Field>
        <Field label="Nhóm đánh giá"><Select value={sentiment} onChange={change(setSentiment)}><option value="all">Tất cả</option><option value="negative">Tiêu cực · 1–2 sao</option><option value="neutral">Trung lập · 3 sao</option><option value="positive">Tích cực · 4–5 sao</option></Select></Field>
        <Field label="Sắp xếp"><Select value={sort} onChange={change(setSort)}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="lowest">Sao thấp nhất</option><option value="highest">Sao cao nhất</option></Select></Field>
      </div>
    </section>
    <ResourceState loading={list.loading} error={list.error} empty={!list.data?.items.length} onRetry={list.reload} />
    {!list.loading && !list.error && <div className="space-y-4">{list.data?.items.map((review) => {
      const group = reviewSentiment(review.rating);
      return <article key={review.id} className="rounded-2xl border border-emerald-900/10 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><strong>{review.customerName || 'Khách hàng'}</strong><p className="!mt-1 text-xs text-stone-500">{review.orderCode ? `Đơn ${review.orderCode} · ` : ''}{adminDate(review.createdAt, true)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${group.color}`}>{group.label}</span></div>
        <div className="my-4"><StarRating value={review.rating} /></div>
        <h3 className="!text-base !font-semibold">{review.title}</h3><p className="!my-4 whitespace-pre-wrap break-words text-sm leading-7 text-stone-600">{review.content}</p>
        {!review.published && <p className="!mb-4 text-xs text-amber-800">Đánh giá hiện không công khai do trạng thái đơn hàng.</p>}
        <ReviewAttachments review={review} />
      </article>;
    })}</div>}
    {!list.loading && !list.error && <Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} />}
  </div>;
}
