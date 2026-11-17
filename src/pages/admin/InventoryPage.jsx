import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Boxes, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { can } from '@/lib/permissions';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { inventoryService } from '@/services/admin/procurementService';
import { ReorderExportDialog } from '@/components/procurement/ReorderExportDialog';
import { ExpiryBadge, ExpiryPolicyDialog, ExpiryWarnings } from '@/components/procurement/InventoryExpiry';
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
import { purchaseQuantity } from '@/lib/purchaseDocuments';
import { expiryFilters, remainingDaysText } from '@/lib/inventoryExpiry';

const quantity = value => value == null ? '—' : purchaseQuantity(value);

export default function InventoryPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const variantId = params.get('variantId') || '', expiryStatus = params.get('expiryStatus') || '';
  const [reordering, setReordering] = useState(false), [policy, setPolicy] = useState(null);
  const [search, setSearch] = useState(''), term = useDebouncedValue(search);
  const [lowStock, setLowStock] = useState(''), [page, setPage] = useState(0), [batchPage, setBatchPage] = useState(0);
  const [batchExpiry, setBatchExpiry] = useState(expiryStatus);
  const [threshold, setThreshold] = useState(null), [value, setValue] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [batchId, setBatchId] = useState(null);
  const stock = useResource(() => inventoryService.list({ page, size: 10, search: term || undefined,
    lowStock: lowStock === '' ? undefined : lowStock === 'true', expiryStatus: expiryStatus || undefined }), [page, term, lowStock, expiryStatus]);
  const selected = useResource(() => variantId ? inventoryService.get(variantId) : null, [variantId]);
  const batches = useResource(() => variantId ? inventoryService.batches({ page: batchPage, size: 10, variantId,
    expiryStatus: batchExpiry || undefined }) : null, [batchPage, variantId, batchExpiry]);
  const detail = useResource(() => batchId ? inventoryService.batch(batchId) : null, [batchId]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      stock.reload({ background: true }); selected.reload({ background: true });
      batches.reload({ background: true }); detail.reload({ background: true });
    };
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh); window.addEventListener('moc:inventory-updated', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('moc:inventory-updated', refresh); };
  }, [stock.reload, selected.reload, batches.reload, detail.reload]);

  function choose(id, filter = expiryStatus) {
    setBatchPage(0); setBatchExpiry(filter);
    setParams(old => { const next = new URLSearchParams(old); if (id) next.set('variantId', id); else next.delete('variantId'); return next; });
  }
  function filterExpiry(filter) {
    setPage(0);
    setParams(old => { const next = new URLSearchParams(old); next.delete('variantId'); if (filter) next.set('expiryStatus', filter); else next.delete('expiryStatus'); return next; });
  }
  function policySaved() {
    setPolicy(null); stock.reload(); selected.reload(); batches.reload(); detail.reload();
  }
  async function saveThreshold(event) {
    event.preventDefault(); const number = Number(value);
    if (value === '' || !Number.isSafeInteger(number) || number < 0 || number > 99999999999) {
      setError('Số lượng cảnh báo phải là số nguyên không âm, tối đa 11 chữ số.'); return;
    }
    setBusy(true); setError('');
    try { await inventoryService.threshold(threshold.variant.id, number); setThreshold(null); stock.reload(); selected.reload(); toast.success('Đã cập nhật số lượng cảnh báo.'); }
    catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
  }

  return <>
    <WorkflowHeader title="Tồn kho & lô hàng" description="Theo dõi lượng hàng, hạn dùng và những lô cần xử lý." step={4}>
      {can(user, 'reorder.write') && <Button onClick={() => setReordering(true)}>Lập danh sách mua hàng</Button>}
      {can(user, 'liquidation.read') && <Link className="button inline-flex rounded-xl border border-line bg-white px-5 py-3 text-sm" to="/admin/liquidations">Thanh lý & xử lý hàng</Link>}
    </WorkflowHeader>
    <ReorderExportDialog open={reordering} onClose={() => setReordering(false)} />
    <Notice>Hạn gần nhất lấy từ các lô còn lượng có thể bán. Cảnh báo tính trên hàng thực tế còn trong kho; hàng hết hạn và hàng đang cách ly không được bán. Lượng cận hạn đã bao gồm lượng cần xem xét thanh lý.</Notice>
    <div className="!mb-4 flex flex-wrap gap-2" aria-label="Lọc nhanh hạn sử dụng">{expiryFilters.map(([key, label]) =>
      <Button key={key} size="sm" variant={expiryStatus === key ? 'default' : 'outline'} aria-pressed={expiryStatus === key} onClick={() => filterExpiry(key)}>{label}</Button>)}</div>
    <section className="admin-table-panel">
      <div className="table-panel-heading"><h2 className="flex items-center gap-2"><Boxes size={18} />Số lượng & hạn dùng sản phẩm</h2><Refresh resource={stock} /></div>
      <div className="table-filters"><label className="search-field"><Search size={16} /><input aria-label="Tìm sản phẩm trong kho" value={search} maxLength={150} placeholder="Tên sản phẩm, mã hoặc quy cách…" onChange={e => { setSearch(e.target.value); setPage(0); }} /></label>
        <Select aria-label="Lọc số lượng tồn" value={lowStock} onChange={e => { setLowStock(e.target.value); setPage(0); }}><option value="">Tất cả mức tồn</option><option value="true">Cần nhập thêm</option><option value="false">Trên ngưỡng</option></Select>
      </div>
      <ResourceState loading={stock.loading} error={stock.error} empty={stock.data?.items.length === 0} onRetry={stock.reload} />
      {stock.refreshError && <p role="status" className="p-4 text-sm text-amber-800">Chưa cập nhật được dữ liệu mới. <button type="button" className="underline" onClick={stock.reload}>Thử lại</button></p>}
      {!stock.loading && !stock.error && !!stock.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr>
        <th>STT</th><th>Sản phẩm / Quy cách</th><th className="numeric">Tồn thực tế</th><th className="numeric">Giữ cho đơn / thanh lý</th><th className="numeric">Đang cách ly</th><th className="numeric">Có thể bán</th><th>Hạn gần nhất còn bán được</th><th>Cảnh báo hạn dùng</th><th>Mức tồn</th><th>Thao tác</th>
      </tr></thead><tbody>{stock.data.items.map((item, index) => <tr key={item.variant.id}>
        <td>{page * 10 + index + 1}</td><td><strong>{item.variant.productName}</strong><small className="block">{item.variant.variantName} · {productMeasure(item.variant)}</small><small className="block text-stone-500">{item.variant.sku}</small></td>
        <td className="numeric">{quantity(item.expiry?.onHand)}</td><td className="numeric">{quantity(item.expiry?.reserved)}</td><td className="numeric">{quantity(item.expiry?.quarantined)}</td><td className="numeric font-semibold">{quantity(item.availableQuantity)}</td>
        <td className="min-w-40">{item.expiry?.nearestExpiryDate ? <><strong>{dateText(item.expiry.nearestExpiryDate)}</strong><small className="block">{remainingDaysText(item.expiry.daysRemaining)}</small></> : <span className="text-xs text-stone-500">{Number(item.availableQuantity) > 0 ? 'Chưa đủ thông tin hạn dùng' : 'Chưa có lô còn hạn để bán'}</span>}</td>
        <td><ExpiryWarnings summary={item.expiry} onOpen={status => choose(item.variant.id, status)} /></td>
        <td><span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs ${item.lowStock ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>{item.lowStock ? 'Cần nhập thêm' : 'Đủ hàng'}</span><small className="block">Ngưỡng: {quantity(item.reorderLevel)}</small></td>
        <td><div className="flex min-w-36 flex-col items-start gap-2"><Button size="sm" variant="ghost" onClick={() => choose(item.variant.id)}>Xem lô</Button>
          {can(user, 'inventory.write') && <><Button size="sm" variant="outline" onClick={() => setPolicy(item)}>Cảnh báo hạn dùng</Button><Button size="sm" variant="ghost" onClick={() => { setThreshold(item); setValue(String(item.reorderLevel)); setError(''); }}>Ngưỡng nhập thêm</Button></>}
        </div></td>
      </tr>)}</tbody></table></div>}
      <Pagination page={page} size={10} totalPages={stock.data?.totalPages || 0} totalElements={stock.data?.totalElements || 0} onChange={setPage} />
    </section>
    <Link className="!mt-4 inline-flex text-sm underline underline-offset-4" to="/admin/business-forms?form=stocktake">Biểu mẫu thẻ kho / kiểm kê / xử lý hàng</Link>

    <Modal open={!!variantId} onOpenChange={open => { if (!open) choose(''); }} title="Lô hàng của sản phẩm" description={selected.data ? `${selected.data.variant.productName} · ${selected.data.variant.variantName}` : 'Đối chiếu hạn sử dụng và số lượng từng lô.'} className="!max-w-[1280px]">
      <ResourceState loading={selected.loading} error={selected.error} onRetry={selected.reload} />
      <div className="!mb-4 flex flex-wrap items-center justify-between gap-4"><Select aria-label="Lọc hạn dùng lô" className="!w-auto" value={batchExpiry} onChange={e => { setBatchExpiry(e.target.value); setBatchPage(0); }}>{expiryFilters.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select><Refresh resource={batches} /></div>
      <ResourceState loading={batches.loading} error={batches.error} empty={batches.data?.items.length === 0} onRetry={batches.reload} />
      {!batches.loading && !batches.error && !!batches.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>Mã lô</th><th>Ngày sản xuất</th><th>Hạn dùng</th><th>Tình trạng hạn dùng</th><th className="numeric">Trong kho</th><th className="numeric">Giữ cho đơn / thanh lý</th><th className="numeric">Cách ly</th><th className="numeric">Có thể bán</th><th>Thao tác</th></tr></thead><tbody>{batches.data.items.map(batch => <tr key={batch.id}>
        <td><strong>{batch.lotCode || batch.batchCode}</strong>{batch.lotCode && <small className="block text-stone-500">Lô NCC: {batch.batchCode}</small>}</td><td>{batch.manufactureDate ? dateText(batch.manufactureDate) : 'Chưa có'}</td>
        <td className={batch.expired ? 'text-red-700' : ''}>{batch.expiryDate ? dateText(batch.expiryDate) : 'Chưa có'}</td><td><ExpiryBadge assessment={batch.expiry?.assessment} /></td>
        <td className="numeric">{quantity(batch.quantityOnHand)}</td><td className="numeric">{quantity(batch.expiry?.reservedQuantity ?? batch.quantityReserved)}</td><td className="numeric">{quantity(batch.expiry?.quarantinedQuantity)}</td><td className="numeric">{quantity(batch.availableQuantity)}</td>
        <td><Button variant="ghost" size="sm" onClick={() => setBatchId(batch.id)}>Chi tiết / Xử lý</Button></td>
      </tr>)}</tbody></table></div>}
      <Pagination page={batchPage} size={10} totalPages={batches.data?.totalPages || 0} totalElements={batches.data?.totalElements || 0} onChange={setBatchPage} />
    </Modal>
    {policy && <ExpiryPolicyDialog item={policy} onClose={() => setPolicy(null)} onSaved={policySaved} />}
    <Modal open={!!threshold} onOpenChange={open => { if (!open && !busy) setThreshold(null); }} title="Số lượng cảnh báo nhập thêm" description={threshold?.variant.productName}>
      <AdminForm onSubmit={saveThreshold}><Field label="Số lượng cảnh báo"><Input required type="number" min="0" max="99999999999" step="1" value={value} disabled={busy} onChange={e => setValue(e.target.value)} /></Field><p className="text-xs leading-6 text-stone-500">Đây là ngưỡng nhắc nhập hàng, không thay đổi số lượng thực tế trong kho.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={() => setThreshold(null)}>Đóng</Button><Button type="submit" disabled={busy}>Lưu ngưỡng nhập thêm</Button></div></AdminForm>
    </Modal>
    <Modal open={!!batchId} onOpenChange={open => { if (!open) setBatchId(null); }} title="Thông tin lô hàng"><DetailState resource={detail}>{detail.data && <>
      <div className="!mb-5"><ExpiryBadge assessment={detail.data.expiry?.assessment} /></div>
      <DocumentMeta entries={[["Mã lô nội bộ", detail.data.lotCode || detail.data.batchCode], ["Mã lô nhà cung cấp", detail.data.batchCode], ['Sản phẩm', detail.data.variant.productName], ['Đơn vị tính', detail.data.variant.variantName], ['Trọng lượng', productMeasure(detail.data.variant)], ['Nguồn gốc', detail.data.originDescription], ['Ngày sản xuất', detail.data.manufactureDate ? dateText(detail.data.manufactureDate) : 'Chưa có'], ['Hạn sử dụng', detail.data.expiryDate ? dateText(detail.data.expiryDate) : 'Chưa có'], ['Tồn thực tế', quantity(detail.data.quantityOnHand)], ['Giữ cho đơn / thanh lý', quantity(detail.data.expiry?.reservedQuantity ?? detail.data.quantityReserved)], ['Đang cách ly', quantity(detail.data.expiry?.quarantinedQuantity)], ['Có thể bán', quantity(detail.data.availableQuantity)]]} />
      <div className="!mt-5 flex flex-wrap gap-3"><Link className="button inline-flex rounded-xl border border-line px-5 py-3 text-sm" to={`/admin/business-forms?form=stock_card&sourceId=${encodeURIComponent(detail.data.id)}`}>In biểu mẫu của lô này</Link>
        {can(user, 'liquidation.write') && Number(detail.data.expiry?.processableQuantity) > 0 && <>
          {!detail.data.expired && can(user, 'promotion.write') && <Link className="button inline-flex rounded-xl border border-line px-5 py-3 text-sm" to={`/admin/promotions?expiryBatch=${encodeURIComponent(detail.data.id)}`}>Tạo ưu đãi theo hạn dùng</Link>}
          {!detail.data.expired && ['clearance', 'near_expiry', 'today'].includes(detail.data.expiry?.assessment.status) && <Link className="button inline-flex rounded-xl border border-line px-5 py-3 text-sm" to={`/admin/liquidations?new=sale&batchId=${encodeURIComponent(detail.data.id)}`}>Xem xét bán thanh lý</Link>}
          <Link className="button inline-flex rounded-xl border border-line px-5 py-3 text-sm" to={`/admin/liquidations?new=dispose&batchId=${encodeURIComponent(detail.data.id)}&reasonType=${detail.data.expired ? 'expired' : 'damaged'}`}>Xử lý hàng hỏng / hết hạn</Link>
        </>}
      </div>
      {Number(detail.data.expiry?.quarantinedQuantity) > 0 && <p className="!mt-4 text-sm text-amber-900">Lô có hàng đang cách ly. Kiểm tra phiếu xử lý hiện có trước khi lập thêm.</p>}
    </>}</DetailState></Modal>
  </>;

}
