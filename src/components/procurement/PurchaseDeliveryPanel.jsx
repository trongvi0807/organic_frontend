import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useResource } from '@/hooks/useResource';
import { allPages, dateText } from '@/lib/apiData';
import { currency, errorMessage } from '@/lib/utils';
import { canCreateReceipt, purchaseDelivery } from '@/lib/purchaseWorkflow';
import { goodsReceiptService, purchaseOrderService } from '@/services/admin/procurementService';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { AdminForm } from '@/components/admin/AdminForm';
import { Status } from './ProcurementUI';

export function PurchaseDeliveryPanel({ order, onChanged }) {
  const resource = useResource(() => allPages(goodsReceiptService.list, { purchaseOrderId: order.id }), [order.id]);
  const [close, setClose] = useState(false), [reason, setReason] = useState('supplier_cancelled'), [note, setNote] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const progress = purchaseDelivery(order, resource.data || []);
  const eligibleClose = ['approved', 'partially_received'].includes(order.status) && progress.remaining > 0;
  const canClose = eligibleClose && !resource.loading && !resource.error && !progress.pending.length && order.canClose !== false;
  async function confirmClose(event) {
    event.preventDefault();
    if (busy || !canClose) return;
    if (reason === 'other' && !note.trim()) { setError('Vui lòng nhập lý do đóng đơn cụ thể.'); return; }
    setBusy(true); setError('');
    try {
      await purchaseOrderService.close(order.id, { reasonCode: reason, note: note.trim() || null });
      toast.success('Đã đóng đơn mua. Phần hàng chưa nhận sẽ không nhập tiếp.');
      setClose(false); resource.reload(); onChanged?.();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  return <section className="!mt-6 space-y-4 rounded-2xl border border-line p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Các đợt giao hàng</h3><Button size="sm" variant="ghost" onClick={resource.reload}>Tải lại tiến độ</Button></div>
    <ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />
    {!resource.loading && !resource.error && <>
      <div className="document-info"><span>Đặt: <strong>{progress.ordered}</strong></span><span>Đã nhận đạt: <strong>{progress.received}</strong></span><span>Còn thiếu: <strong>{progress.remaining}</strong></span><span>Giá trị hàng đã duyệt nhập: <strong>{currency(progress.receivedValue)}</strong></span></div>
      {progress.received > 0 && progress.remaining > 0 && <p className="text-xs text-amber-800">Hàng đã giao một phần. Số còn thiếu chưa được cộng tồn kho.</p>}
      {!!progress.pending.length && <p className="text-xs text-stone-500">Có {progress.pending.length} phiếu chưa hoàn tất duyệt. Số lượng trên các phiếu này chưa tính vào hàng đã nhận.</p>}
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Sản phẩm</th><th className="numeric">Đặt</th><th className="numeric">Đã nhập đạt</th><th className="numeric">Đang chờ duyệt</th><th className="numeric">Còn phải nhận</th></tr></thead><tbody>{progress.lines.map((line) => <tr key={line.id}><td>{line.variant?.productName}<small className="block">{line.variant?.variantName}</small></td><td className="numeric">{line.ordered}</td><td className="numeric">{line.received}</td><td className="numeric">{line.awaiting}</td><td className="numeric">{line.remaining}</td></tr>)}</tbody></table></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Phiếu nhập</th><th>Ngày lập</th><th>Trạng thái</th><th className="numeric">Tiền hàng đạt</th></tr></thead><tbody>{(resource.data || []).map((receipt) => <tr key={receipt.id}><td><Link className="underline underline-offset-4" to={`/admin/goods-receipts?documentId=${encodeURIComponent(receipt.id)}`}>{receipt.receiptCode}</Link></td><td>{dateText(receipt.receiptDate)}</td><td><Status value={receipt.status} /></td><td className="numeric">{currency(receipt.acceptedTotalAmount)}</td></tr>)}</tbody></table>{!resource.data?.length && <p className="p-4 text-xs text-stone-500">Chưa có phiếu nhập cho đơn mua này.</p>}</div>
      <div className="flex flex-wrap gap-3">{canCreateReceipt(order) && <Link to={`/admin/goods-receipts?createFrom=${encodeURIComponent(order.id)}`} className="button rounded-xl bg-primary px-4 py-3 text-sm !text-white">{order.receiptCount || order.goodsReceiptId ? 'Tạo phiếu nhập đợt tiếp theo' : 'Tạo phiếu nhập đợt 1'}</Link>}
        {eligibleClose && <Button variant="outline" disabled={!canClose} onClick={() => { setError(''); setClose(true); }}>Đóng đơn mua hàng</Button>}</div>
      {eligibleClose && !!progress.pending.length && <p className="text-xs leading-6 text-amber-800">Hãy duyệt hoặc hủy các phiếu nháp, chờ duyệt và bị từ chối trước khi đóng đơn. Phiếu bị hủy không cộng tồn kho.</p>}
      {order.status === 'closed' && <div className="rounded-xl bg-stone-50 p-4 text-sm leading-7"><p>Đã đóng ngày {dateText(order.closedAt)} bởi {order.closedByEmployee?.fullName || '—'}.</p><p>Lý do: {({ supplier_cancelled: 'Nhà cung cấp hủy phần thiếu', no_longer_needed: 'Không còn nhu cầu nhận phần thiếu', other: 'Khác' })[order.closureReasonCode] || '—'}{order.closureNote ? ` · ${order.closureNote}` : ''}</p><p>Giá trị hàng đạt đã duyệt nhập: <strong>{currency(progress.receivedValue)}</strong>. Phần còn thiếu không nhập tiếp.</p></div>}
    </>}
    <Modal open={close} onOpenChange={(open) => { if (!busy) setClose(open); }} title="Đóng đơn mua hàng" description={`${order.orderCode} · Kết thúc nhận phần hàng còn thiếu.`}>
      <AdminForm onSubmit={confirmClose}><fieldset disabled={busy} className="space-y-4"><Field label="Lý do đóng đơn *"><Select required value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }}><option value="supplier_cancelled">Nhà cung cấp hủy phần thiếu</option><option value="no_longer_needed">Không còn nhu cầu nhận phần thiếu</option><option value="other">Khác</option></Select></Field><Field label={reason === 'other' ? 'Lý do cụ thể *' : 'Ghi chú (không bắt buộc)'} error={reason === 'other' && !note.trim() ? 'Vui lòng nhập lý do cụ thể.' : ''}><Textarea required={reason === 'other'} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} /></Field><p className="text-sm leading-7 text-stone-600">Còn {progress.remaining} gói/hộp chưa nhập đạt. Đóng đơn giữ nguyên tồn kho và giá trị hàng đã nhận {currency(progress.receivedValue)}. Sau khi đóng, đơn không thể tạo phiếu nhập tiếp.</p>{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" onClick={() => setClose(false)}>Quay lại</Button><Button type="submit" disabled={!canClose || (reason === 'other' && !note.trim())}>{busy ? 'Đang đóng…' : 'Xác nhận đóng đơn'}</Button></div></fieldset></AdminForm>
    </Modal>
  </section>;
}
