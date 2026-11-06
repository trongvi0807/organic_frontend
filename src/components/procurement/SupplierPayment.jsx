import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { purchaseOrderService } from '@/services/admin/procurementService';
import { can } from '@/lib/permissions';
import { adminDate } from '@/lib/adminFormat';
import { errorMessage } from '@/lib/utils';

export const supplierPaymentLabel = (status) => status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
export function SupplierPayment({ order, user, onChanged }) {
  const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const paid = order.supplierPaymentStatus === 'paid';
  const editable = can(user, 'purchase.payment') && (paid || ['approved', 'partially_received', 'received', 'closed'].includes(order.status));
  async function save() {
    if (busy) return;
    setBusy(true); setError('');
    try { await purchaseOrderService.payment(order.id, paid ? 'unpaid' : 'paid'); setConfirm(false); onChanged(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <section className="!my-5 rounded-xl border border-line bg-stone-50 p-4 space-y-3" aria-label="Thanh toán nhà cung cấp">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><strong>Thanh toán nhà cung cấp: {supplierPaymentLabel(order.supplierPaymentStatus)}</strong>{paid && order.supplierPaidAt && <p className="text-xs !mt-1">Ghi nhận lúc {adminDate(order.supplierPaidAt, true)}</p>}</div>
      {editable && !confirm && <Button variant="outline" onClick={() => setConfirm(true)}>{paid ? 'Chuyển về chưa thanh toán' : 'Ghi nhận đã thanh toán'}</Button>}</div>
    {confirm && <div className="space-y-3"><p className="text-sm">Xác nhận {order.orderCode} {paid ? 'chưa thanh toán' : 'đã thanh toán'} cho {order.supplier?.supplierName}? Thao tác chỉ cập nhật trạng thái ghi nhận của đơn mua.</p>
      {error && <p role="alert" className="form-error">{error}</p>}<div className="flex gap-3"><Button variant="outline" disabled={busy} onClick={() => setConfirm(false)}>Quay lại</Button><Button disabled={busy} onClick={save}>{busy ? 'Đang cập nhật…' : 'Xác nhận cập nhật'}</Button></div></div>}
  </section>;
}
