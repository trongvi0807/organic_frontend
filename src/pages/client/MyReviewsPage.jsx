import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useResource } from '@/hooks/useResource';
import { reviewService } from '@/services/client/reviewService';
import { productHref } from '@/lib/productDetail';
import { errorMessage } from '@/lib/utils';
import { CommerceHeader, commercePanel } from '@/components/checkout/OrderUI';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/products/StarRating';
import { ReviewAttachments } from '@/components/products/ReviewAttachments';

export default function MyReviewsPage() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'eligible' ? 'eligible' : 'mine');
  const [page, setPage] = useState(0);
  const [id, setId] = useState(null);
  const [remove, setRemove] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const list = useResource(() => (tab === 'mine' ? reviewService.mine : reviewService.eligibleItems)({ page, size: 10 }), [tab, page]);

  async function confirmDelete() {
    if (busy || !remove) return;
    setBusy(true);
    setError('');
    try {
      await reviewService.remove(remove.id);
      setRemove(null);
      setId(null);
      setPage(0);
      list.reload();
      toast.success('Đã xóa đánh giá thành công. Bạn có thể đánh giá lại sản phẩm.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return <div className="container py-10">
    <CommerceHeader title="Trải nghiệm của bạn" description="Xem đánh giá đã gửi và chia sẻ cảm nhận về sản phẩm đã nhận." />
    <div className="!mb-6 flex flex-wrap gap-3">{[['mine', 'Đánh giá của tôi'], ['eligible', 'Sản phẩm đã nhận']].map(([value, label]) => <Button key={value} variant={tab === value ? 'default' : 'outline'} onClick={() => { setTab(value); setPage(0); }}>{label}</Button>)}</div>
    <ResourceState loading={list.loading} error={list.error} empty={!list.data?.items.length} onRetry={list.reload} />
    {!list.loading && !list.error && <div className="space-y-4">{list.data?.items.map((item) => <CustomerReviewCard key={item.id || item.orderDetailId} item={item} submitted={tab === 'mine'} onView={() => setId(item.id)} onDelete={() => { setRemove(item); setError(''); }} />)}</div>}
    <Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} />
    {id && <ReviewDetail id={id} onClose={() => setId(null)} />}
    <Modal open={!!remove} onOpenChange={(open) => { if (!open && !busy) setRemove(null); }} title="Xóa đánh giá?" description="Đánh giá và ảnh/video sẽ bị xóa. Bạn chỉ có thể viết lại khi hệ thống xác nhận xóa thành công.">
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><Button variant="outline" disabled={busy} onClick={() => setRemove(null)}>Giữ lại</Button><Button disabled={busy} onClick={confirmDelete}>{busy ? 'Đang xóa…' : 'Xác nhận xóa'}</Button></div>
    </Modal>
  </div>;
}

function CustomerReviewCard({ item, submitted, onView, onDelete }) {
  return <article className={commercePanel}>
    <div className="flex flex-wrap justify-between gap-4">
      <div><h2 className="text-base font-semibold">{item.productName}</h2><p className="!mt-2 text-xs text-stone-500">{item.variantName}{item.orderCode ? ` · ${item.orderCode}` : ''}</p></div>
      {submitted && <span className="text-sm text-amber-700">{'★'.repeat(Number(item.rating))} · {item.published ? 'Đang công khai' : 'Không công khai'}</span>}
    </div>
    {submitted && <><h3 className="!mt-4 !text-sm !font-medium">{item.title}</h3><p className="!mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-stone-600">{item.content}</p></>}
    <div className="!mt-5 flex flex-wrap gap-3">
      {submitted ? <><Button size="sm" variant="outline" onClick={onView}>Xem đánh giá</Button><Button size="sm" variant="ghost" onClick={onDelete}>Xóa đánh giá</Button></>
        : Number(item.reviewCount || 0) > 0 ? <span className="text-sm text-stone-500">Bạn đã đánh giá sản phẩm này. Xóa đánh giá cũ để viết lại.</span>
          : <Link className="text-sm underline" to={`${productHref({ id: item.productId, slug: item.productSlug })}#danh-gia`}>Viết đánh giá sản phẩm →</Link>}
    </div>
  </article>;
}

function ReviewDetail({ id, onClose }) {
  const detail = useResource(() => reviewService.get(id), [id]);
  return <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title="Đánh giá của bạn" description="Đánh giá đã gửi được giữ nguyên nội dung. Bạn có thể xóa và viết lại nếu muốn." className="!max-w-[850px]">
    <ResourceState loading={detail.loading} error={detail.error} onRetry={detail.reload} />
    {!detail.loading && !detail.error && detail.data && <div className="space-y-5">
      <StarRating value={detail.data.rating} />
      <h3 className="!text-lg">{detail.data.title}</h3>
      <p className="whitespace-pre-wrap break-words text-sm leading-7">{detail.data.content}</p>
      <ReviewAttachments review={detail.data} />
    </div>}
  </Modal>;
}
