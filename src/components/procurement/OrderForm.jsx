import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { useResource } from '@/hooks/useResource';
import { allPages, today } from '@/lib/apiData';
import { currency, errorMessage } from '@/lib/utils';
import { orderPayload } from '@/lib/procurement';
import { supplierService } from '@/services/admin/managementService';
import { inventoryService, purchaseOrderService } from '@/services/admin/procurementService';
import { Notice } from './ProcurementUI';

export function OrderForm({ order, onClose, onSaved }) {
  const [values, setValues] = useState({ supplierId: order?.supplier?.id || '', expectedDeliveryDate: order?.expectedDeliveryDate || '', note: order?.note || '', items: order?.items.map((line) => ({ variantId: line.variant.id, quantity: line.quantityOrdered, unitPrice: line.unitPrice })) || [{ variantId: '', quantity: 1, unitPrice: '' }] });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const options = useResource(async () => {
    const [suppliers, stocks] = await Promise.all([allPages(supplierService.list, { status: 'active' }), allPages(inventoryService.list)]);
    return { suppliers, variants: stocks.map((s) => s.variant) };
  }, []);
  const field = (key, value) => setValues((old) => ({ ...old, [key]: value }));
  function line(index, key, value) { field('items', values.items.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  async function save(event) {
    event.preventDefault(); setError('');
    try { const payload = orderPayload(values); setBusy(true); await purchaseOrderService.save(order?.id, payload); toast.success('Đã lưu đơn chờ Admin duyệt.'); onSaved(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <Modal open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={order ? `Sửa ${order.orderCode}` : 'Lập đơn đặt mua'} description="Ghi nhận số lượng và giá mua đã thỏa thuận với nhà cung cấp." className="procurement-modal !max-w-[960px]">
    <ResourceState loading={options.loading} error={options.error} onRetry={options.reload} />
    {!options.loading && !options.error && <form onSubmit={save}><fieldset disabled={busy} className="min-w-0 space-y-5">
      {order && <Notice>Sửa đơn đã duyệt sẽ đưa đơn về chờ duyệt lại. Đơn đã có phiếu nhập không được sửa.</Notice>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Nhà cung cấp"><Select value={values.supplierId} required onChange={(e) => field('supplierId', e.target.value)}><option value="">Chọn nhà cung cấp đang hoạt động</option>{options.data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplierName} · {s.supplierCode}</option>)}</Select></Field><Field label="Ngày giao dự kiến (tùy chọn)"><Input type="date" min={today()} value={values.expectedDeliveryDate} onChange={(e) => field('expectedDeliveryDate', e.target.value)} /></Field></div>
      <p className="text-xs text-stone-500">Số lượng tính theo gói/hộp. Giá mua độc lập với giá bán.</p>
      {values.items.map((item, index) => <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-[#e5e8df] p-4 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
        <Field label={`Biến thể ${index + 1}`}><Select required value={item.variantId} onChange={(e) => line(index, 'variantId', e.target.value)}><option value="">Chọn sản phẩm / quy cách</option>{!options.data.variants.some((v) => v.id === item.variantId) && item.variantId && <option value={item.variantId} disabled>Biến thể ngừng hoạt động · chọn lại</option>}{options.data.variants.map((v) => <option key={v.id} value={v.id} disabled={values.items.some((l, i) => i !== index && l.variantId === v.id)}>{v.productName} · {v.variantName} · {v.sku}</option>)}</Select></Field>
        <Field label={`Số lượng ${index + 1}`}><Input required type="number" min="1" max="99999999999" step="1" value={item.quantity} onChange={(e) => line(index, 'quantity', e.target.value)} /></Field>
        <Field label={`Giá mua ${index + 1} (₫)`}><Input required type="number" min="0.01" max="999999999999.99" step="0.01" value={item.unitPrice} onChange={(e) => line(index, 'unitPrice', e.target.value)} /></Field>
        <Button type="button" variant="ghost" size="icon" className="sm:!mt-6" disabled={values.items.length === 1} aria-label={`Bỏ dòng ${index + 1}`} onClick={() => field('items', values.items.filter((_, i) => i !== index))}><Trash2 size={16} /></Button>
      </div>)}
      <Button type="button" variant="outline" size="sm" disabled={values.items.length >= 100} onClick={() => field('items', [...values.items, { variantId: '', quantity: 1, unitPrice: '' }])}><Plus size={15} />Thêm dòng</Button>
      <Field label="Ghi chú"><Textarea maxLength={5000} value={values.note} onChange={(e) => field('note', e.target.value)} /></Field>
      <div className="flex justify-between rounded-xl bg-[#eff3ea] p-4"><span>Tổng giá mua</span><strong>{currency(values.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0))}</strong></div>
      {error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" onClick={onClose}>Đóng</Button><Button type="submit">{busy ? 'Đang lưu…' : 'Lưu & chờ duyệt'}</Button></div>
    </fieldset></form>}
  </Modal>;
}
