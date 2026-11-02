import { useId, useState } from 'react';
import { Search } from 'lucide-react';
import { matchesSearch } from '@/lib/adminFormat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';

const PRODUCT_LIMIT = 500;

export function PromotionProductPicker({ products, selectedIds, onChange }) {
  const searchId = useId();
  const [query, setQuery] = useState(''), [error, setError] = useState('');
  const selected = new Set(selectedIds);
  const visible = products.filter((product) => matchesSearch(`${product.productName} ${product.productCode || ''}`, query));
  const knownIds = new Set(products.map((product) => product.id));
  const unavailable = selectedIds.filter((id) => !knownIds.has(id));
  const allSelected = products.length > 0 && products.every((product) => selected.has(product.id));

  function update(ids) {
    if (ids.length > PRODUCT_LIMIT) { setError(`Một chương trình chọn tối đa ${PRODUCT_LIMIT} sản phẩm. Vui lòng chia thành nhiều chương trình.`); return; }
    setError(''); onChange(ids);
  }

  function toggle(id) {
    update(selected.has(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);
  }

  return <fieldset className="min-w-0 rounded-xl border border-line p-4">
    <legend className="px-2 text-sm font-medium">Sản phẩm áp dụng</legend>
    <label htmlFor={searchId} className="!mb-2 block text-xs text-stone-500">Tìm sản phẩm</label>
    <div className="relative">
      <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
      <Input id={searchId} type="search" className="!pl-10" autoComplete="off" placeholder="Nhập tên hoặc mã sản phẩm…" value={query} onChange={(event) => setQuery(event.target.value)} />
    </div>
    <div className="!my-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={!products.length || allSelected} onClick={() => update([...new Set([...selectedIds, ...products.map((product) => product.id)])])}>Chọn tất cả ({products.length})</Button>
        <Button size="sm" variant="ghost" disabled={!selectedIds.length} onClick={() => update([])}>Bỏ chọn tất cả</Button>
      </div>
      <span role="status" className="text-xs font-medium text-primary">Đã chọn {selectedIds.length} sản phẩm</span>
    </div>
    {error && <p role="alert" className="!mb-3 text-xs leading-6 text-red-700">{error}</p>}
    {!!query.trim() && <p className="!mb-2 text-xs text-stone-500">Tìm thấy {visible.length} sản phẩm. Nút chọn tất cả áp dụng cho toàn bộ danh sách.</p>}
    <div className="max-h-64 space-y-1 overflow-y-auto overscroll-contain rounded-lg border border-line bg-white p-2">
      {visible.map((product) => <label key={product.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-3 text-sm hover:bg-sage">
        <input type="checkbox" className="!mt-1 shrink-0 accent-primary" checked={selected.has(product.id)} onChange={() => toggle(product.id)} />
        <span className="min-w-0 break-words">{product.productName}</span>
      </label>)}
      {!visible.length && <p className="p-3 text-sm text-stone-500">{query.trim() ? 'Không tìm thấy sản phẩm phù hợp.' : 'Chưa có sản phẩm để chọn.'}</p>}
    </div>
    {!!unavailable.length && <div className="!mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-800">
      <p>Có {unavailable.length} sản phẩm đã chọn không còn trong danh sách hiện tại.</p>
      <Button size="sm" variant="ghost" onClick={() => update(selectedIds.filter((id) => knownIds.has(id)))}>Bỏ chọn các sản phẩm này</Button>
    </div>}
    <p className="!mt-3 text-xs leading-6 text-stone-500">Ưu đãi áp dụng cho các sản phẩm được chọn. Gõ tìm kiếm không làm mất lựa chọn trước đó.</p>
  </fieldset>;
}
