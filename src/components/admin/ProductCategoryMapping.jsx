import { useId, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceState } from '@/components/common/ResourceState';
import { matchesSearch } from '@/lib/adminFormat';
import { categoryAssignments, missingProductCategories } from '@/lib/productCategoryMapping';

// Keep choices in normal document flow: they remain visible inside the scrolling
// import dialog and do not depend on a floating menu or input blur handling.
function CategoryChoice({ group, categories, value, disabled, onChange }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const chosen = categories.find((category) => category.id === value);
  const matches = categories.filter((category) => matchesSearch(`${category.categoryName} ${category.categoryCode}`, query));
  return <div className="min-w-0 space-y-3 rounded-xl border border-line bg-white p-4">
    <div><h4 id={`${id}-title`} className="text-sm font-semibold text-primary">{group.productName || group.productCode || `Dòng ${group.rows[0]}`}</h4><p className="!mt-1 text-xs text-stone-500">Dòng Excel: {group.missingRows.join(', ')}</p></div>
    <div className="relative"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input className="input !pl-9" type="search" autoComplete="off" aria-label={`Tìm loại cho ${group.productName || group.productCode}`} placeholder="Gõ tên hoặc mã loại sản phẩm…" value={query} disabled={disabled} onChange={(event) => setQuery(event.target.value)} /></div>
    <div role="group" aria-labelledby={`${id}-title`} className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-line p-1">
      {matches.map((category) => <button key={category.id} type="button" disabled={disabled} aria-pressed={category.id === value} onClick={() => onChange(category.id)} className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${category.id === value ? 'border-primary/30 bg-sage font-semibold text-primary' : 'border-transparent text-stone-700 hover:bg-sage'}`}><span className="min-w-0 break-words">{category.categoryName}<small className="!ml-2 font-normal text-stone-500">{category.categoryCode}</small></span>{category.id === value && <Check size={17} className="shrink-0" aria-hidden="true" />}</button>)}
      {!matches.length && <p className="p-3 text-sm text-stone-500">{categories.length ? 'Không tìm thấy loại phù hợp. Thử tên hoặc mã khác.' : 'Chưa có loại sản phẩm để chọn.'}</p>}
    </div>
    <p role="status" className={`text-xs ${chosen ? 'text-primary' : 'text-amber-800'}`}>{chosen ? `Đã chọn: ${chosen.categoryName} · ${chosen.categoryCode}` : 'Chưa chọn loại — bấm một dòng trong danh sách trên.'}</p>
  </div>;
}

export function ProductCategoryMapping({ rows, resource, disabled, onApply }) {
  const groups = missingProductCategories(rows);
  const [selections, setSelections] = useState({}), [error, setError] = useState('');
  if (!groups.length) return null;
  const categories = resource?.data || [];
  const active = categories.filter((category) => category.status === 'active');
  const selected = (group) => selections[group.key] ?? (group.categoryIds.length === 1 ? group.categoryIds[0] : '');
  const selectedCount = groups.filter((group) => active.some((category) => category.id === selected(group))).length;
  const ready = selectedCount === groups.length;
  function apply() {
    setError('');
    try { onApply(categoryAssignments(rows, selections, categories)); }
    catch (err) { setError(err.message); }
  }
  return <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5" aria-label="Bổ sung loại sản phẩm còn thiếu">
    <div><h3 className="font-semibold text-primary">Chọn loại sản phẩm còn thiếu</h3><p className="!mt-2 text-sm leading-6 text-stone-600">Bước 1: Chọn loại cho từng sản phẩm. Bước 2: Bấm «Bổ sung loại & kiểm tra lại file». Các quy cách cùng sản phẩm dùng chung một loại. Lựa chọn được gửi trực tiếp cho backend, bạn không cần sửa file hay nhập ID.</p><p className="!mt-2 text-sm font-medium text-primary" role="status">Đã chọn {selectedCount}/{groups.length} sản phẩm</p><p className="!mt-1 text-xs leading-6 text-stone-500">Các lỗi bên dưới thuộc lần kiểm tra trước. Kết quả cập nhật sau bước 2; file gốc được giữ nguyên.</p></div>
    {!resource && <p role="alert" className="form-error">Chưa kết nối được danh sách loại sản phẩm. Hãy đóng và mở lại cửa sổ Nhập Excel.</p>}
    {resource?.error && <p className="text-sm text-amber-900">Không tải được danh sách loại sản phẩm nên chưa thể chọn. Kiểm tra thông báo bên dưới rồi bấm «Thử lại».</p>}
    <ResourceState loading={resource?.loading} error={resource?.error} onRetry={resource?.reload} />
    {!resource?.loading && !resource?.error && <>
      {!active.length && <p className="text-sm text-amber-900">Chưa có loại sản phẩm đang hoạt động. Hãy tạo loại sản phẩm trước, sau đó tải lại danh sách.</p>}
      <div className="grid gap-4 sm:grid-cols-2">{groups.map((group) => <CategoryChoice key={group.key} group={group} categories={active} value={selected(group)} disabled={disabled || !active.length} onChange={(value) => { setSelections((old) => ({ ...old, [group.key]: value })); setError(''); }} />)}</div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-stone-600">{ready ? 'Đã chọn đủ loại. Bấm nút bên cạnh để cập nhật file.' : `Còn ${groups.length - selectedCount} sản phẩm cần chọn loại.`}</span><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={disabled || !resource} onClick={resource?.reload}>Tải lại loại sản phẩm</Button><Button disabled={disabled || !ready} onClick={apply}>Bổ sung loại & kiểm tra lại file</Button></div></div>
    </>}
  </section>;
}
