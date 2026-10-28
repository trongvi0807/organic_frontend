import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Boxes, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { inventoryService } from '@/services/admin/procurementService';
import { WorkflowHeader, Notice, Refresh, DocumentMeta, DetailState } from '@/components/procurement/ProcurementUI';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { AdminForm } from '@/components/admin/AdminForm';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { dateText } from '@/lib/apiData';
import { productMeasure } from '@/lib/adminFormat';
import { errorMessage } from '@/lib/utils';

export default function InventoryPage() {
  const [params, setParams] = useSearchParams(), variantId = params.get('variantId') || '';
  const [search, setSearch] = useState(''), term = useDebouncedValue(search);
  const [lowStock, setLowStock] = useState(''), [page, setPage] = useState(0), [batchPage, setBatchPage] = useState(0), [expired, setExpired] = useState('');
  const [threshold, setThreshold] = useState(null), [value, setValue] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [batchId, setBatchId] = useState(null);
  const stock = useResource(() => inventoryService.list({ page, size: 10, search: term || undefined, lowStock: lowStock === '' ? undefined : lowStock === 'true' }), [page, term, lowStock]);
  const selected = useResource(() => variantId ? inventoryService.get(variantId) : Promise.resolve(null), [variantId]);
  const batches = useResource(() => variantId ? inventoryService.batches({ page: batchPage, size: 10, variantId, expired: expired === '' ? undefined : expired === 'true' }) : Promise.resolve(null), [batchPage, variantId, expired]);
  const detail = useResource(() => batchId ? inventoryService.batch(batchId) : Promise.resolve(null), [batchId]);
  function choose(id) { setBatchPage(0); setParams(id ? { variantId: id } : {}); }
  async function save(event) {
    event.preventDefault(); const number = Number(value);
    if (value === '' || !Number.isSafeInteger(number) || number < 0 || number > 99999999999) { setError('Số lượng cảnh báo phải là số nguyên không âm, tối đa 11 chữ số.'); return; }
    setBusy(true); setError('');
    try { await inventoryService.threshold(threshold.variant.id, number); setThreshold(null); stock.reload(); selected.reload(); toast.success('Đã cập nhật số lượng cảnh báo.'); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <>
    <WorkflowHeader title="Tồn kho & lô hàng" description="Một bảng sản phẩm thống nhất; chọn Xem lô để đối chiếu từng lần nhập." step={4} />
    <Notice>Số lượng có thể bán = hàng đã nhập, còn hạn, trừ lượng giữ chỗ. Thay đổi số lượng thực tế qua phiếu nhập; nút Số lượng chỉ cấu hình mức cảnh báo nhập thêm.</Notice>
    <div className="!mb-4"><Link className="button inline-flex items-center rounded-xl border border-line bg-white px-5 py-3 text-sm" to="/admin/business-forms?form=stocktake">Biểu mẫu thẻ kho / kiểm kê / xử lý hàng</Link></div><section className="admin-table-panel"><div className="table-panel-heading"><h2 className="flex items-center gap-2"><Boxes size={18} />Số lượng sản phẩm</h2><Refresh resource={stock} /></div><div className="table-filters"><label className="search-field"><Search size={16} /><input aria-label="Tìm sản phẩm trong kho" list="inventory-search" value={search} maxLength={150} placeholder="Tên sản phẩm, đóng gói…" onChange={(e) => { setSearch(e.target.value); setPage(0); }} /><datalist id="inventory-search">{stock.data?.items.map((item) => <option key={item.variant.id} value={item.variant.productName} />)}</datalist></label><Select aria-label="Lọc số lượng tồn" value={lowStock} onChange={(e) => { setLowStock(e.target.value); setPage(0); }}><option value="">Tất cả mức tồn</option><option value="true">Cần nhập thêm</option><option value="false">Trên ngưỡng</option></Select></div>
      <ResourceState loading={stock.loading} error={stock.error} empty={stock.data?.items.length === 0} onRetry={stock.reload} />
      {!stock.loading && !stock.error && !!stock.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>STT</th><th>Sản phẩm</th><th>Đơn vị tính</th><th className="numeric">Trọng lượng</th><th className="numeric">Số lượng có thể bán</th><th className="numeric">Số lượng cảnh báo</th><th>Tình trạng</th><th>Thao tác</th></tr></thead><tbody>{stock.data.items.map((item, index) => <tr key={item.variant.id}><td>{page * 10 + index + 1}</td><td><strong>{item.variant.productName}</strong></td><td>{item.variant.variantName}</td><td className="numeric">{productMeasure(item.variant)}</td><td className="numeric font-semibold">{item.availableQuantity}</td><td className="numeric">{item.reorderLevel}</td><td><span className={`rounded-full px-3 py-1 text-xs ${item.lowStock ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>{item.lowStock ? 'Cần nhập thêm' : 'Đủ hàng'}</span></td><td><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => choose(item.variant.id)}>Xem lô</Button><Button size="sm" variant="outline" onClick={() => { setThreshold(item); setValue(String(item.reorderLevel)); setError(''); }}>Số lượng</Button></div></td></tr>)}</tbody></table></div>}
      <Pagination page={page} size={10} totalPages={stock.data?.totalPages || 0} totalElements={stock.data?.totalElements || 0} onChange={setPage} />
    </section>
    <Modal open={!!variantId} onOpenChange={(open) => { if (!open) choose(''); }} title="Lô hàng của sản phẩm" description={selected.data ? `${selected.data.variant.productName} · ${selected.data.variant.variantName}` : 'Đối chiếu hạn sử dụng và số lượng từng lô.'} className="!max-w-[1050px]">
      <ResourceState loading={selected.loading} error={selected.error} onRetry={selected.reload} /><div className="!mb-4 flex items-center justify-between gap-4"><Select aria-label="Lọc hạn dùng lô" className="!w-auto" value={expired} onChange={(e) => { setExpired(e.target.value); setBatchPage(0); }}><option value="">Tất cả hạn dùng</option><option value="false">Chưa hết hạn</option><option value="true">Đã hết hạn</option></Select><Refresh resource={batches} /></div>
      <ResourceState loading={batches.loading} error={batches.error} empty={batches.data?.items.length === 0} onRetry={batches.reload} />
      {!batches.loading && !batches.error && !!batches.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>STT</th><th>Mã lô</th><th>Ngày sản xuất</th><th>Hạn dùng</th><th className="numeric">Trong kho</th><th className="numeric">Giữ chỗ</th><th className="numeric">Có thể bán</th><th /></tr></thead><tbody>{batches.data.items.map((batch, index) => <tr key={batch.id}><td>{batchPage * 10 + index + 1}</td><td><strong>{batch.batchCode}</strong></td><td>{dateText(batch.manufactureDate)}</td><td className={batch.expired ? 'text-red-700' : ''}>{dateText(batch.expiryDate)}</td><td className="numeric">{batch.quantityOnHand}</td><td className="numeric">{batch.quantityReserved}</td><td className="numeric">{batch.availableQuantity}</td><td><Button variant="ghost" size="sm" onClick={() => setBatchId(batch.id)}>Chi tiết</Button></td></tr>)}</tbody></table></div>}
      <Pagination page={batchPage} size={10} totalPages={batches.data?.totalPages || 0} totalElements={batches.data?.totalElements || 0} onChange={setBatchPage} />
    </Modal>
    <Modal open={!!threshold} onOpenChange={(open) => { if (!open && !busy) setThreshold(null); }} title="Số lượng cảnh báo nhập thêm" description={threshold?.variant.productName}><AdminForm onSubmit={save}><Field label="Số lượng cảnh báo (gói / hộp)"><Input required type="number" min="0" max="99999999999" step="1" value={value} disabled={busy} onChange={(e) => setValue(e.target.value)} /></Field><p className="text-xs leading-6 text-stone-500">Đây là ngưỡng nhắc nhập hàng, không thay đổi số lượng thực tế trong kho.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={() => setThreshold(null)}>Đóng</Button><Button type="submit" disabled={busy}>Lưu số lượng cảnh báo</Button></div></AdminForm></Modal>
    <Modal open={!!batchId} onOpenChange={(open) => { if (!open) setBatchId(null); }} title="Thông tin lô hàng"><DetailState resource={detail}>{detail.data && <Link className="button mb-4 inline-flex items-center rounded-xl border border-line px-5 py-3 text-sm" to={`/admin/business-forms?form=stock_card&sourceId=${encodeURIComponent(detail.data.id)}`}>In biểu mẫu của lô này</Link>}{detail.data && <DocumentMeta entries={[["Mã lô", detail.data.batchCode], ['Sản phẩm', detail.data.variant.productName], ['Đơn vị tính', detail.data.variant.variantName], ['Trọng lượng', productMeasure(detail.data.variant)], ['Nguồn gốc', detail.data.originDescription], ['Ngày sản xuất', dateText(detail.data.manufactureDate)], ['Hạn sử dụng', dateText(detail.data.expiryDate)], ['Trong kho / giữ chỗ', `${detail.data.quantityOnHand} / ${detail.data.quantityReserved}`], ['Có thể bán', String(detail.data.availableQuantity)]]} />}</DetailState></Modal>
  </>;
}
