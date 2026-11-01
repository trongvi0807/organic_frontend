import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, TrendingDown } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResource } from '@/hooks/useResource';
import { reviewManagementService } from '@/services/admin/reviewManagementService';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { Field, Input, Select } from '@/components/ui/field';
import { AdminDateInput, AdminForm } from '@/components/admin/AdminForm';
import { ReviewProductTable } from '@/components/admin/reviews/ReviewProductTable';
import { ProductReviewDetail } from '@/components/admin/reviews/ProductReviewDetail';

export default function ReviewManagementPage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('product');
  const [search, setSearch] = useState(''), [sort, setSort] = useState('negative'), [minimum, setMinimum] = useState('1'), [from, setFrom] = useState(''), [to, setTo] = useState(''), [page, setPage] = useState(0);
  const keyword = useDebouncedValue(search);
  const invalid = from && to && from > to ? 'Ngày bắt đầu không được sau ngày kết thúc.' : !/^\d+$/.test(minimum) || !Number.isSafeInteger(Number(minimum)) || Number(minimum) < 1 ? 'Số đánh giá tối thiểu phải là số nguyên từ 1 trở lên.' : '';
  const list = useResource(() => selected || invalid ? null : reviewManagementService.products({ search: keyword, sort, minReviews: Number(minimum), from: from || undefined, to: to || undefined, page, size: 10 }), [selected, keyword, sort, minimum, from, to, page, invalid]);
  const change = (setter) => (event) => { setter(event.target.value); setPage(0); };
  function select(id) { setParams((old) => { const next = new URLSearchParams(old); if (id) next.set('product', id); else next.delete('product'); return next; }); }
  return <div className="space-y-6">
    <div className="admin-page-heading"><div><span className="eyebrow">LẮNG NGHE KHÁCH HÀNG</span><h1>Đánh giá sản phẩm</h1><p>Theo dõi trải nghiệm mua hàng và tìm những sản phẩm cần cải thiện.</p></div><MessageSquare className="text-emerald-800" size={30} /></div>
    <section className="rounded-2xl border border-emerald-900/10 bg-[#F7FAF5] p-5">
      <div className="flex items-start gap-3"><TrendingDown size={21} className="mt-1 shrink-0 text-emerald-800" /><p className="text-sm leading-6 text-stone-600">Tiêu cực: 1–2 sao · Trung lập: 3 sao · Tích cực: 4–5 sao. Đối chiếu cả số lượng và tỷ lệ tiêu cực; sản phẩm có ít đánh giá chưa đủ phản ánh xu hướng.</p></div>
      <AdminForm onSubmit={(event) => event.preventDefault()} className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Đánh giá từ ngày"><AdminDateInput value={from} onChange={change(setFrom)} /></Field><Field label="Đến ngày"><AdminDateInput value={to} min={from || undefined} onChange={change(setTo)} /></Field></AdminForm>
    </section>
    {invalid && <p role="alert" className="form-error">{invalid}</p>}
    {selected ? !invalid && <ProductReviewDetail key={`${selected}:${from}:${to}`} id={selected} from={from} to={to} onBack={() => select(null)} /> : <>
      <section className="admin-table-panel !p-5"><div className="grid gap-4 md:grid-cols-3">
        <Field label="Tìm sản phẩm"><Input value={search} maxLength={200} placeholder="Tên hoặc mã sản phẩm…" onChange={change(setSearch)} /></Field>
        <Field label="Xếp hạng"><Select value={sort} onChange={change(setSort)}><option value="negative">Nhiều đánh giá tiêu cực nhất</option><option value="negative-rate">Tỷ lệ tiêu cực cao nhất</option><option value="lowest">Điểm trung bình thấp nhất</option><option value="most">Nhiều đánh giá nhất</option></Select></Field>
        <Field label="Số đánh giá tối thiểu"><Input type="number" min="1" step="1" value={minimum} onChange={change(setMinimum)} /></Field>
      </div></section>
      {!invalid && <section className="admin-table-panel"><ResourceState loading={list.loading} error={list.error} empty={!list.data?.items.length} onRetry={list.reload} />{!list.loading && !list.error && <><ReviewProductTable products={list.data?.items || []} onOpen={select} /><Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} /></>}</section>}
    </>}
  </div>;
}
