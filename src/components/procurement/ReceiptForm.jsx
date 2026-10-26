import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { useResource } from '@/hooks/useResource';
import { allPages, today } from '@/lib/apiData';
import { currency, errorMessage } from '@/lib/utils';
import { receiptLines, receiptPayload } from '@/lib/procurement';
import { goodsReceiptService, purchaseOrderService } from '@/services/admin/procurementService';
import { Notice } from './ProcurementUI';

export function ReceiptForm({ receipt, initialOrderId = '', onClose, onSaved }) {
  const [orderId, setOrderId] = useState(receipt?.purchaseOrderId || initialOrderId);
  const [values, setValues] = useState({ purchaseOrderId: '', note: receipt?.note || '', items: [] });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const orders = useResource(() => allPages(purchaseOrderService.list, { status: 'approved' }), []);
  const order = useResource(() => orderId ? purchaseOrderService.get(orderId) : Promise.resolve(null), [orderId]);
  useEffect(() => {
    if (order.data?.id === orderId && !order.loading && !order.error) setValues((old) => ({ ...old, purchaseOrderId: orderId, items: receiptLines(order.data, receipt) }));
  }, [orderId, order.data, order.loading, order.error, receipt]);
  const editableOrder = order.data?.status === 'approved' && (!order.data.goodsReceiptId || order.data.goodsReceiptId === receipt?.id);
  const ready = orderId && !order.loading && !order.error && editableOrder && values.purchaseOrderId === orderId;
  function line(index, key, value) { setValues((old) => ({ ...old, items: old.items.map((item, i) => i === index ? { ...item, [key]: value } : item) })); }
  async function save(event) {
    event.preventDefault(); setError('');
    try { const payload = receiptPayload(values); setBusy(true); await goodsReceiptService.save(receipt?.id, payload); toast.success('Đã lưu bản nháp. Gửi duyệt để đề nghị nhập kho.'); onSaved(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <Modal open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={receipt ? `Sửa ${receipt.receiptCode}` : 'Lập phiếu nhập'} description="Đối chiếu đủ từng dòng của đơn đặt mua trước khi gửi duyệt." className="procurement-modal !max-w-[1000px]">
    <Notice>Lưu nháp chưa cộng tồn kho. Chỉ số lượng đạt chất lượng được nhập kho sau khi Admin duyệt.</Notice>
    <form onSubmit={save}><fieldset disabled={busy} className="min-w-0 space-y-5">
      <Field label="Đơn đặt mua đã duyệt"><Select required value={orderId} disabled={!!receipt || orders.loading} onChange={(e) => { setOrderId(e.target.value); setValues((old) => ({ ...old, purchaseOrderId: '', items: [] })); }}><option value="">Chọn đơn chưa có phiếu nhập</option>{(orders.data || []).filter((o) => !o.goodsReceiptId || o.id === receipt?.purchaseOrderId).map((o) => <option key={o.id} value={o.id}>{o.orderCode} · {o.supplier.supplierName}</option>)}{orderId && !(orders.data || []).some((o) => o.id === orderId) && <option value={orderId}>{receipt?.purchaseOrderCode || orderId}</option>}</Select></Field>
      <ResourceState loading={orders.loading || (!!orderId && order.loading)} error={orders.error || order.error} onRetry={() => { orders.reload(); order.reload(); }} />
      {orderId && !order.loading && !order.error && order.data && !editableOrder && <p role="alert" className="form-error">Đơn cần ở trạng thái đã duyệt và chưa có phiếu nhập khác. Vui lòng chọn lại đơn hoặc tải lại danh sách.</p>}
      {ready && values.items.map((item, index) => {
        const missing = Number(item.quantityOrdered) - Number(item.quantityReceived || 0) - Number(item.quantityRejected || 0);
        return <section key={item.purchaseOrderDetailId} className="space-y-4 rounded-2xl border border-[#e5e8df] p-5">
          <div><h3 className="!text-base !font-semibold">{item.variant.productName} · {item.variant.variantName}</h3><p className="!mt-1 text-xs text-stone-500">{item.variant.sku} · Đã đặt: {item.quantityOrdered} gói/hộp · Giá mua: {currency(item.unitPrice)}</p></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Field label={`Số đạt dòng ${index + 1}`}><Input type="number" required min="0" max={item.quantityOrdered} step="1" value={item.quantityReceived} onChange={(e) => line(index, 'quantityReceived', e.target.value)} /></Field><Field label={`Số bị loại dòng ${index + 1}`}><Input type="number" required min="0" max={item.quantityOrdered} step="1" value={item.quantityRejected} onChange={(e) => line(index, 'quantityRejected', e.target.value)} /></Field><div className="rounded-xl bg-stone-50 p-3 text-sm"><span className="text-stone-500">Số thiếu</span><strong className={`block !mt-2 ${missing < 0 ? 'text-red-700' : ''}`}>{missing} gói/hộp</strong></div></div>
          {Number(item.quantityReceived) < Number(item.quantityOrdered) && <Field label={`Lý do chênh lệch dòng ${index + 1} (bắt buộc)`}><Textarea required maxLength={1000} placeholder="Hàng hỏng, thiếu… và nội dung đã thống nhất với nhà cung cấp" value={item.discrepancyReason} onChange={(e) => line(index, 'discrepancyReason', e.target.value)} /></Field>}
          {Number(item.quantityReceived) > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label={`Mã lô dòng ${index + 1}`}><Input required maxLength={100} value={item.batchCode} onChange={(e) => line(index, 'batchCode', e.target.value)} /></Field><Field label={`Hạn dùng dòng ${index + 1}`}><Input required type="date" min={today()} value={item.expiryDate} onChange={(e) => line(index, 'expiryDate', e.target.value)} /></Field><Field label={`Ngày sản xuất dòng ${index + 1}`}><Input type="date" max={today()} value={item.manufactureDate} onChange={(e) => line(index, 'manufactureDate', e.target.value)} /></Field><Field label={`Nguồn gốc dòng ${index + 1}`}><Input maxLength={500} value={item.originDescription} onChange={(e) => line(index, 'originDescription', e.target.value)} /></Field></div>}
        </section>;
      })}
      <Field label="Ghi chú phiếu"><Textarea maxLength={5000} value={values.note} onChange={(e) => setValues((old) => ({ ...old, note: e.target.value }))} /></Field>
      {error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" onClick={onClose}>Đóng</Button><Button type="submit" disabled={!ready}>{busy ? 'Đang lưu…' : 'Lưu phiếu nháp'}</Button></div>
    </fieldset></form>
  </Modal>;
}
