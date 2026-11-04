import { useEffect, useRef, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '@/services/api';
import { supplierService } from '@/services/admin/managementService';
import { allPages } from '@/lib/apiData';
import { useResource } from '@/hooks/useResource';
import { productMeasure } from '@/lib/adminFormat';
import { adminDate } from '@/lib/adminFormat';
import { currency, errorMessage } from '@/lib/utils';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { SearchSelect } from '@/components/admin/SearchSelect';
import { AdminForm } from '@/components/admin/AdminForm';
import { ResourceState } from '@/components/common/ResourceState';

export function ReorderExportDialog({ open, onClose }) {
  return <Modal open={open} onOpenChange={value => { if (!value) onClose(); }} title="Lập danh sách mua hàng" description="Chọn một nhà cung cấp, đối chiếu các mặt hàng đã từng nhận rồi xuất Excel đơn mua." className="!max-w-[1150px]">{open && <ReorderEditor onClose={onClose} />}</Modal>;
}
function ReorderEditor({ onClose }) {
  const [supplierId, setSupplier] = useState(''), [lowStock, setLowStock] = useState(true), [search, setSearch] = useState(''), [selection, setSelection] = useState({}), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  const suppliers = useResource(() => allPages(supplierService.list, { status: 'active' }), []);
  const source = useResource(async () => supplierId ? unwrap(await api.get('/inventory/reorder', { params: { supplierId, lowStock } })) : [], [supplierId, lowStock]);
  useEffect(() => { setSelection({}); setError(''); }, [supplierId, lowStock]);
  const rows = source.data || [], term = search.trim().toLocaleLowerCase('vi');
  const visible = rows.filter(row => `${row.productName} ${row.sku} ${row.variantName}`.toLocaleLowerCase('vi').includes(term));
  const chosen = rows.filter(row => selection[row.variantId]?.selected);
  function select(row, selected) { setSelection(old => ({ ...old, [row.variantId]: { quantity: row.suggestedQuantity, unitPrice: row.lastPurchasePrice, ...old[row.variantId], selected } })); }
  function value(row, key) { return selection[row.variantId]?.[key] ?? (key === 'quantity' ? row.suggestedQuantity : row.lastPurchasePrice); }
  function update(row, key, value) { setSelection(old => ({ ...old, [row.variantId]: { quantity: row.suggestedQuantity, unitPrice: row.lastPurchasePrice, ...old[row.variantId], [key]: value } })); }
  async function exportFile(event) {
    event.preventDefault(); if (lock.current) return;
    if (!chosen.length || chosen.length > 100) { setError('Chọn từ 1 đến 100 sản phẩm để xuất đơn mua.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const items = chosen.map(row => ({ variantId: row.variantId, quantity: Number(value(row, 'quantity')), unitPrice: Number(value(row, 'unitPrice')) }));
      if (items.some(row => !Number.isSafeInteger(row.quantity) || row.quantity < 1 || row.quantity > 99999999999 || !Number.isFinite(row.unitPrice) || row.unitPrice <= 0 || row.unitPrice >= 1e12)) throw new Error('Số lượng phải là số nguyên từ 1; giá nhập phải lớn hơn 0.');
      const response = await api.post('/inventory/reorder/export', { supplierId, items }, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data), link = document.createElement('a');
      const supplier = suppliers.data?.find(row => row.id === supplierId);
      link.href = url; link.download = `Don-mua-${supplier?.supplierCode || 'NCC'}.xlsx`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Đã xuất Excel. Bạn có thể dùng file này tại Lập đơn mua > Nhập từ Excel.');
    } catch (failure) { if (failure.response?.data instanceof Blob) { try { const body = JSON.parse(await failure.response.data.text()); setError(body.message || 'Chưa xuất được file. Vui lòng thử lại.'); } catch { setError('Chưa xuất được file. Vui lòng thử lại.'); } } else setError(errorMessage(failure)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <AdminForm onSubmit={exportFile}><fieldset disabled={busy} className="min-w-0 space-y-5">
    <ResourceState loading={suppliers.loading} error={suppliers.error} onRetry={suppliers.reload} />
    <Field label="Nhà cung cấp *"><SearchSelect required value={supplierId} onChange={setSupplier} options={(suppliers.data || []).filter(row => row.status === 'active').map(row => ({ value: row.id, label: `${row.supplierCode} · ${row.supplierName}` }))} /></Field>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!lowStock} onChange={event => setLowStock(!event.target.checked)} />Xem tất cả sản phẩm đã từng mua (kể cả đang đủ mức mục tiêu)</label>
    {supplierId && <><ResourceState loading={source.loading} error={source.error} empty={!source.loading && !rows.length} onRetry={source.reload} /><div className="flex flex-wrap items-center justify-between gap-3"><label className="search-field"><Search size={16} /><input placeholder="Tìm theo tên hoặc mã sản phẩm…" aria-label="Tìm hàng đặt mua" maxLength={150} value={search} onChange={event => setSearch(event.target.value)} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!visible.length} checked={!!visible.length && visible.every(row => selection[row.variantId]?.selected)} onChange={event => { visible.forEach(row => select(row, event.target.checked)); }} />Chọn các kết quả đang hiển thị</label></div>
      <p className="text-xs leading-6 text-stone-500">Số lượng gợi ý bù nhu cầu 14 ngày theo sức bán của 30 ngày gần nhất, cộng ngưỡng tồn và trừ hàng đang đặt đã duyệt. Kiểm tra hạn dùng, nhu cầu thực tế và báo giá trước khi xuất file.</p>
      {!source.loading && !source.error && !!visible.length && <div className="table-scroll max-h-[45vh] overflow-y-auto"><table className="data-table"><thead><tr><th>Chọn</th><th>Sản phẩm / quy cách</th><th className="numeric">Còn có thể bán</th><th>Cơ sở đề xuất</th><th>Lần nhập gần nhất</th><th className="numeric">Giá nhập gần nhất</th><th className="numeric">Số lượng muốn mua</th><th className="numeric">Giá nhập dự kiến</th></tr></thead><tbody>{visible.map(row => <tr key={row.variantId}><td><input type="checkbox" aria-label={`Chọn ${row.productName}`} checked={!!selection[row.variantId]?.selected} onChange={event => select(row, event.target.checked)} /></td><td><strong>{row.productName}</strong><small className="block">{row.variantName} · {productMeasure(row)} · {row.sku}</small></td><td className="numeric">{row.availableQuantity}</td><td className="min-w-64"><span className="block text-xs">Đã bán {row.soldInWindow ?? 0} trong {row.windowDays ?? 30} ngày · Đang đặt {row.incomingQuantity ?? 0}</span><span className="block text-xs">{row.daysOfCover != null ? `Tồn đủ khoảng ${row.daysOfCover} ngày` : 'Chưa đủ dữ liệu tốc độ bán'}</span><span className="block text-xs text-stone-500">{row.suggestionReason}</span></td><td>{adminDate(row.lastReceivedAt)}</td><td className="numeric">{currency(row.lastPurchasePrice)}</td><td><Input aria-label={`Số lượng ${row.productName}`} className="!min-w-28 text-right" disabled={!selection[row.variantId]?.selected} type="number" required min="1" max="99999999999" step="1" value={value(row, 'quantity')} onChange={event => update(row, 'quantity', event.target.value)} /></td><td><Input aria-label={`Giá nhập ${row.productName}`} className="!min-w-36 text-right" disabled={!selection[row.variantId]?.selected} type="number" required min="0.01" max="999999999999.99" step="0.01" value={value(row, 'unitPrice')} onChange={event => update(row, 'unitPrice', event.target.value)} /></td></tr>)}</tbody></table></div>}
    </>}
    {error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><span className="mr-auto text-sm text-stone-500">Đã chọn {chosen.length} sản phẩm</span><Button variant="outline" onClick={onClose}>Đóng</Button><Button type="submit" disabled={!chosen.length || busy}><Download size={16} />{busy ? 'Đang xuất…' : 'Xuất Excel đơn mua'}</Button></div>
  </fieldset></AdminForm>;
}
