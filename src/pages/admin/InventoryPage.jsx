import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { inventoryService } from '@/services/admin/procurementService';
import { WorkflowHeader, Notice, Refresh, DocumentMeta, DetailState } from '@/components/procurement/ProcurementUI';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { dateText } from '@/lib/apiData';
import { errorMessage } from '@/lib/utils';

export default function InventoryPage() {
  const [params, setParams] = useSearchParams();
  const variantId = params.get('variantId') || '';
  const [search, setSearch] = useState(''), term = useDebouncedValue(search);
  const [lowStock, setLowStock] = useState(''), [page, setPage] = useState(0), [batchPage, setBatchPage] = useState(0), [expired, setExpired] = useState('');
  const [threshold, setThreshold] = useState(null), [value, setValue] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [batchId, setBatchId] = useState(null);
  const stock = useResource(() => inventoryService.list({ page, size: 10, search: term || undefined, lowStock: lowStock === '' ? undefined : lowStock === 'true' }), [page, term, lowStock]);
  const selected = useResource(() => variantId ? inventoryService.get(variantId) : Promise.resolve(null), [variantId]);
  const batches = useResource(() => inventoryService.batches({ page: batchPage, size: 10, variantId: variantId || undefined, expired: expired === '' ? undefined : expired === 'true' }), [batchPage, variantId, expired]);
  const detail = useResource(() => batchId ? inventoryService.batch(batchId) : Promise.resolve(null), [batchId]);
  function choose(id) { setBatchPage(0); setParams(id ? { variantId: id } : {}); }
  async function save(event) {
    event.preventDefault(); const number = Number(value);
    if (value === '' || !Number.isSafeInteger(number) || number < 0 || number > 99999999999) { setError('Ngưỡng phải là số gói/hộp nguyên không âm, tối đa 11 chữ số.'); return; }
    setBusy(true); setError('');
    try { await inventoryService.threshold(threshold.variant.id, number); setThreshold(null); stock.reload(); selected.reload(); toast.success('Đã cập nhật ngưỡng cảnh báo.'); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <>
    <WorkflowHeader title="Tồn kho & lô hàng" description="Nắm rõ lượng có thể bán và hạn dùng của từng lô." step={4} />
    <Notice>Tồn có thể bán = số lượng trong lô đã nhập, chưa hết hạn, trừ lượng đã giữ chỗ. Cảnh báo khi tồn ≤ ngưỡng nhập lại. Đơn vị là gói/hộp.</Notice>
    <section className="admin-table-panel !mb-6"><div className="table-panel-heading"><h2 className="flex items-center gap-2"><Boxes size={18} />Tồn theo biến thể</h2><Refresh resource={stock} /></div><div className="table-filters"><label className="search-field"><Search size={16} /><input aria-label="Tìm tồn kho" value={search} maxLength={150} placeholder="Tên sản phẩm, SKU…" onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></label><Select aria-label="Lọc mức tồn" value={lowStock} onChange={(e) => { setLowStock(e.target.value); setPage(0); }}><option value="">Tất cả mức tồn</option><option value="true">Cần nhập thêm</option><option value="false">Trên ngưỡng</option></Select></div>
      <ResourceState loading={stock.loading} error={stock.error} empty={stock.data?.items.length === 0} onRetry={stock.reload} />
      {!stock.loading && !stock.error && !!stock.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>Sản phẩm / quy cách</th><th>Có thể bán</th><th>Ngưỡng nhập</th><th>Tình trạng</th><th>Thao tác</th></tr></thead><tbody>{stock.data.items.map((item) => <tr key={item.variant.id}><td><strong className="block">{item.variant.productName}</strong><small>{item.variant.variantName} · {item.variant.sku}</small></td><td className="font-semibold">{item.availableQuantity}</td><td>{item.reorderLevel}</td><td><span className={`rounded-full px-3 py-1 text-xs ${item.lowStock ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>{item.lowStock ? 'Cần nhập thêm' : 'Trên ngưỡng'}</span></td><td><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => choose(item.variant.id)}>Xem lô</Button><Button size="sm" variant="outline" onClick={() => { setThreshold(item); setValue(String(item.reorderLevel)); setError(''); }}><SlidersHorizontal size={14} />Đặt ngưỡng</Button></div></td></tr>)}</tbody></table></div>}
      <Pagination page={page} size={10} totalPages={stock.data?.totalPages || 0} totalElements={stock.data?.totalElements || 0} onChange={setPage} />
    </section>
    <section className="admin-table-panel" id="batches"><div className="table-panel-heading"><h2>Lô đã nhập kho</h2><Refresh resource={batches} /></div>
      <div className="table-filters"><Select aria-label="Lọc hạn dùng lô" value={expired} onChange={(e) => { setExpired(e.target.value); setBatchPage(0); }}><option value="">Tất cả hạn dùng</option><option value="false">Chưa hết hạn</option><option value="true">Đã hết hạn</option></Select>{variantId && <Button size="sm" variant="ghost" onClick={() => choose('')}>Bỏ lọc biến thể</Button>}</div>
      {variantId && <div className="px-5 pb-4 text-sm"><ResourceState loading={selected.loading} error={selected.error} onRetry={selected.reload} />{!selected.loading && !selected.error && selected.data && <p>Đang xem: <strong>{selected.data.variant.productName} · {selected.data.variant.variantName}</strong> · Có thể bán: {selected.data.availableQuantity}</p>}</div>}
      <ResourceState loading={batches.loading} error={batches.error} empty={batches.data?.items.length === 0} onRetry={batches.reload} />
      {!batches.loading && !batches.error && !!batches.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>Mã lô / sản phẩm</th><th>Hạn dùng</th><th>Trong kho</th><th>Giữ chỗ</th><th>Có thể bán</th><th>Chi tiết</th></tr></thead><tbody>{batches.data.items.map((batch) => <tr key={batch.id}><td><strong className="block">{batch.batchCode}</strong><small>{batch.variant.productName} · {batch.variant.variantName}</small></td><td><span className={batch.expired ? 'text-red-700' : ''}>{dateText(batch.expiryDate)}</span>{batch.expired && <small className="block text-red-700">Đã hết hạn</small>}</td><td>{batch.quantityOnHand}</td><td>{batch.quantityReserved}</td><td>{batch.availableQuantity}</td><td><Button variant="ghost" size="sm" onClick={() => setBatchId(batch.id)}>Xem lô</Button></td></tr>)}</tbody></table></div>}
      <Pagination page={batchPage} size={10} totalPages={batches.data?.totalPages || 0} totalElements={batches.data?.totalElements || 0} onChange={setBatchPage} />
    </section>
    <Modal open={!!threshold} onOpenChange={(open) => { if (!open && !busy) setThreshold(null); }} title="Đặt ngưỡng nhập lại" description={threshold ? `${threshold.variant.productName} · ${threshold.variant.variantName}` : undefined}><form onSubmit={save}><Field label="Ngưỡng cảnh báo (gói/hộp)"><Input type="number" required min="0" max="99999999999" step="1" value={value} onChange={(e) => setValue(e.target.value)} disabled={busy} /></Field><p className="!mt-3 text-sm text-stone-500">Ngưỡng 0 vẫn cảnh báo khi hết hàng.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={() => setThreshold(null)}>Đóng</Button><Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu ngưỡng'}</Button></div></form></Modal>
    <Modal open={!!batchId} onOpenChange={(open) => { if (!open) setBatchId(null); }} title="Thông tin lô hàng"><DetailState resource={detail}>{detail.data && <DocumentMeta entries={[["Mã lô", detail.data.batchCode], ['Sản phẩm', detail.data.variant.productName], ['Quy cách / SKU', `${detail.data.variant.variantName} · ${detail.data.variant.sku}`], ['Nguồn gốc', detail.data.originDescription], ['Ngày sản xuất', detail.data.manufactureDate && dateText(detail.data.manufactureDate)], ['Hạn sử dụng', dateText(detail.data.expiryDate)], ['Trong kho / giữ chỗ', `${detail.data.quantityOnHand} / ${detail.data.quantityReserved}`], ['Có thể bán', String(detail.data.availableQuantity)]]} />}</DetailState></Modal>
  </>;
}


