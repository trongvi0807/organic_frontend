import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useResource } from '@/hooks/useResource';
import { customerOrderService } from '@/services/client/customerOrderService';
import { customerOrderError } from '@/lib/customerOrders';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { ResourceState } from '@/components/common/ResourceState';

export function ReturnRequestModal({ order, demo, onClose, onChanged }) {
  const prefix = useId(), key = useRef(crypto.randomUUID()), lock = useRef(false);
  const eligible = useResource(() => customerOrderService.eligible(order, demo), [order.id, demo]);
  const [type, setType] = useState('return_refund'), [reason, setReason] = useState(''), [description, setDescription] = useState('');
  const [quantities, setQuantities] = useState({}), [busy, setBusy] = useState(false), [error, setError] = useState(''), [touched, setTouched] = useState(false);
  const items = eligible.data?.items || [], selected = items.filter((item) => Number(quantities[item.orderDetailId]) > 0);
  async function submit(event) {
    event.preventDefault(); if (lock.current) return; setTouched(true); setError('');
    if (!eligible.data?.canSubmit) return;
    if (!reason || !description.trim() || !selected.length) { setError('Vui lòng chọn lý do, nhập mô tả và chọn ít nhất một sản phẩm cần hỗ trợ.'); return; }
    if (items.some((item) => quantities[item.orderDetailId] !== undefined && (!Number.isInteger(Number(quantities[item.orderDetailId])) || Number(quantities[item.orderDetailId]) < 0 || Number(quantities[item.orderDetailId]) > item.availableQuantity))) { setError('Số lượng yêu cầu phải là số nguyên trong phạm vi còn được đổi trả.'); return; }
    lock.current = true; setBusy(true);
    try { await customerOrderService.requestReturn(order, { orderId: order.id, requestType: type, reason, description: description.trim(), items: selected.map((item) => ({ orderDetailId: item.orderDetailId, quantity: Number(quantities[item.orderDetailId]), reason })) }, key.current, demo); onChanged(); onClose(); toast.success(demo ? 'Đã gửi yêu cầu mô phỏng · Chờ cửa hàng xét duyệt.' : 'Đã gửi yêu cầu đổi trả · Chờ cửa hàng xét duyệt.', { position: 'top-left' }); }
    catch (err) { setError(customerOrderError(err)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Modal open onOpenChange={(open) => { if (!open && !lock.current) onClose(); }} title="Yêu cầu Đổi/Trả" description={`${order.orderCode ? `Đơn #${order.orderCode}` : 'Đơn chưa có mã'}. Yêu cầu sẽ được cửa hàng xét duyệt trước khi thực hiện đổi hàng hoặc hoàn tiền.`} className="!max-w-[700px]">
    <ResourceState loading={eligible.loading} error={eligible.error ? customerOrderError({ message: eligible.error }) : ''} onRetry={eligible.reload} />
    {!eligible.loading && !eligible.error && <form className="space-y-5 customer-order-dialog" onSubmit={submit} noValidate>{!eligible.data?.canSubmit ? <p className="order-warning" role="status">{eligible.data?.unavailableReason || 'Đơn chưa đủ điều kiện gửi yêu cầu đổi trả.'}</p> : <fieldset disabled={busy} className="space-y-4">
      <label className="field"><span>Hình thức hỗ trợ</span><Select value={type} onChange={(event) => setType(event.target.value)}><option value="return_refund">Trả hàng / Hoàn tiền</option><option value="exchange">Đổi sản phẩm</option><option value="refund">Hoàn tiền</option></Select></label>
      <label className="field"><span>Lý do *</span><Select value={reason} onChange={(event) => setReason(event.target.value)} aria-label="Lý do đổi trả"><option value="">Chọn lý do</option><option value="damaged">Sản phẩm hư hỏng</option><option value="expired">Sản phẩm hết hạn</option><option value="wrong_product">Giao sai sản phẩm</option><option value="missing_product">Giao thiếu sản phẩm</option><option value="quality_issue">Vấn đề chất lượng</option><option value="other">Lý do khác</option></Select></label>
      <label className="field"><span>Mô tả chi tiết *</span><textarea className="input min-h-24" value={description} maxLength={5000} onChange={(event) => { setDescription(event.target.value); setTouched(true); }} aria-invalid={touched && !description.trim()} />{touched && !description.trim() && <small role="status" className="!text-red-700">Vui lòng mô tả vấn đề cần hỗ trợ.</small>}</label>
      <div><h3 className="!mb-2 !font-sans !text-sm !font-medium">Chọn số lượng cần hỗ trợ</h3>{items.map((item, i) => { const amount = quantities[item.orderDetailId] ?? 0, invalid = !Number.isInteger(Number(amount)) || Number(amount) < 0 || Number(amount) > item.availableQuantity; return <div key={item.orderDetailId} className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 py-3"><label className="min-w-0 flex-1 text-sm leading-6" htmlFor={`${prefix}-${i}`}>{item.productName}<small className="block text-xs text-stone-500">{item.variantName} · Còn được yêu cầu: {item.availableQuantity}</small></label><input className="input !w-24 text-right" id={`${prefix}-${i}`} aria-label={`Số lượng đổi trả ${item.productName}`} type="number" step="1" min="0" max={item.availableQuantity} disabled={!item.availableQuantity} value={amount} aria-invalid={invalid} onChange={(event) => setQuantities((old) => ({ ...old, [item.orderDetailId]: event.target.value }))} />{invalid && <p role="status" className="w-full text-xs text-red-700">Số lượng phải là số nguyên từ 0 đến {item.availableQuantity}.</p>}</div>; })}</div>
    </fieldset>}{error && <p role="alert" className="order-warning !text-red-800">{error}</p>}<div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" disabled={busy || !eligible.data?.canSubmit}>{busy ? 'Đang gửi…' : 'Gửi yêu cầu xét duyệt'}</Button></div></form>}
  </Modal>;
}
