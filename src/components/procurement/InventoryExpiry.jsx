import { useState } from 'react';
import { toast } from 'sonner';
import { inventoryService } from '@/services/admin/procurementService';
import { expiryLabels, expiryPolicyGroups, expiryPolicyPayload, remainingDaysText } from '@/lib/inventoryExpiry';
import { purchaseQuantity } from '@/lib/purchaseDocuments';
import { errorMessage } from '@/lib/utils';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { AdminForm } from '@/components/admin/AdminForm';

export function ExpiryBadge({ assessment }) {
  if (!assessment) return <span className="text-xs text-stone-500">Chưa xác định</span>;
  const { status, daysRemaining, warningDays, clearanceDays, policySource } = assessment;
  const color = ['expired', 'today', 'stopped'].includes(status) ? 'bg-red-50 text-red-800'
    : ['near_expiry', 'clearance'].includes(status) ? 'bg-amber-50 text-amber-900' : 'bg-stone-100 text-stone-600';
  return <div className="min-w-40 space-y-1">
    <span className={`inline-block rounded-full px-3 py-1 text-xs ${color}`}>{expiryLabels[status] || 'Chưa xác định'}</span>
    <small className="block">{remainingDaysText(daysRemaining)}</small>
    {warningDays != null ? <small className="block text-stone-500">Cận hạn ≤ {warningDays} ngày · Xem xét thanh lý ≤ {clearanceDays} ngày{policySource === 'product' ? ' · Đặt riêng' : ''}</small>
      : <small className="block text-stone-500">Cần bổ sung ngày sản xuất hoặc đặt ngưỡng cho sản phẩm.</small>}
  </div>;
}

export function ExpiryWarnings({ summary, onOpen }) {
  if (!summary) return <span>—</span>;
  const entries = [
    ['expired', summary.expiredQuantity, 'hết hạn', 'text-red-800 bg-red-50'],
    ['stopped', summary.stoppedQuantity, 'đã ngừng nhận đơn', 'text-red-800 bg-red-50'],
    ['clearance', summary.clearanceQuantity, 'cần xem xét thanh lý', 'text-orange-900 bg-orange-50'],
    ['near_expiry', summary.nearExpiryQuantity, 'cận hạn', 'text-amber-900 bg-amber-50'],
    ['unknown', summary.unknownQuantity, 'thiếu thông tin', 'text-stone-700 bg-stone-100'],
  ].filter(([, quantity]) => Number(quantity) > 0);
  return entries.length ? <div className="flex min-w-44 flex-col items-start gap-2">{entries.map(([status, quantity, label, color]) =>
    <button key={status} type="button" className={`rounded-lg px-3 py-1.5 text-left text-xs underline-offset-2 hover:underline ${color}`}
      onClick={() => onOpen(status)}>{purchaseQuantity(quantity)} {label}</button>)}</div> : <span className="text-xs text-stone-500">Chưa có cảnh báo hạn dùng</span>;
}

export function ExpiryPolicyDialog({ item, onClose, onSaved }) {
  const [custom, setCustom] = useState(item.expiry?.warningDays != null);
  const [warning, setWarning] = useState(item.expiry?.warningDays == null ? '' : String(item.expiry.warningDays));
  const [clearance, setClearance] = useState(item.expiry?.clearanceDays == null ? '' : String(item.expiry.clearanceDays));
  const [policyGroup, setPolicyGroup] = useState(item.expiry?.policyGroup || '');
  const [hours, setHours] = useState(item.expiry?.minimumRemainingHours == null ? '' : String(item.expiry.minimumRemainingHours));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function save(event) {
    event.preventDefault(); if (busy) return; setError('');
    try {
      const payload = expiryPolicyPayload(custom, warning, clearance, { policyGroup, minimumRemainingHours: hours });
      setBusy(true); await inventoryService.expiryPolicy(item.variant.productId, payload);
      toast.success('Đã lưu ngưỡng cảnh báo hạn dùng.'); onSaved();
    } catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
  }
  return <Modal open title="Cảnh báo hạn dùng" description={`${item.variant.productName} · Áp dụng cho mọi quy cách của sản phẩm.`} onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <AdminForm onSubmit={save}><fieldset disabled={busy} className="space-y-5">
      <Field label="Nhóm chính sách bảo quản"><Select value={policyGroup} onChange={e => setPolicyGroup(e.target.value)}>{expiryPolicyGroups.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Field>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={custom} onChange={e => setCustom(e.target.checked)} />Đặt ngưỡng riêng cho sản phẩm này</label>
      {custom ? <div className="form-grid">
        <Field label="Cảnh báo khi còn không quá … ngày"><Input aria-label="Số ngày cảnh báo cận hạn" type="number" required min="0" max="3650" step="1" value={warning} onChange={e => setWarning(e.target.value)} /></Field>
        <Field label="Xem xét thanh lý khi còn không quá … ngày"><Input aria-label="Số ngày đề xuất thanh lý" type="number" required min="0" max={warning || '3650'} step="1" value={clearance} onChange={e => setClearance(e.target.value)} /></Field>
      </div> : <div className="rounded-xl bg-stone-50 p-4 text-sm leading-7">
        <p className="font-medium">Mặc định theo thời hạn bảo quản của từng lô</p>
        <p>Đến 7 ngày: cận hạn khi còn 2 ngày, xem xét thanh lý khi còn 1 ngày.</p>
        <p>Từ 8 đến 30 ngày: cận hạn khi còn 7 ngày, xem xét thanh lý khi còn 3 ngày.</p>
        <p>Trên 30 ngày: cận hạn khi còn 30 ngày, xem xét thanh lý khi còn 15 ngày.</p>
        <p className="!mt-2 text-stone-500">Thời hạn bảo quản tính từ ngày sản xuất đến hạn sử dụng đã ghi trên lô. Thiếu thông tin thì không tự suy đoán.</p>
      </div>}
      <Field label="Ngừng nhận đơn trước hạn sử dụng … giờ" hint="Ví dụ: 24 giờ là 1 ngày. Để trống để dùng mức mặc định của nhóm hàng."><Input aria-label="Số giờ ngừng nhận đơn trước hạn sử dụng" type="number" min="0" max="87600" step="1" value={hours} placeholder="Tự động theo nhóm hàng" onChange={e => setHours(e.target.value)} /></Field>
      <div className="rounded-xl bg-sage p-4 text-sm leading-6"><strong>Ba bước xử lý hàng</strong><p>Cận hạn: kiểm tra lô và chất lượng.</p><p>Đến ngưỡng thanh lý: lập ưu đãi hoặc phiếu xử lý để duyệt.</p><p>Qua giờ ngừng bán: không nhận đơn mới. Hàng hết hạn không được bán thanh lý; cần lập phiếu tiêu hủy.</p></div>
      <p className="text-sm leading-6 text-stone-500">Ngưỡng chỉ nhắc nhân viên kiểm tra hàng. Không thay đổi hạn sử dụng, giá bán hoặc tự động lập phiếu thanh lý.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu ngưỡng cảnh báo'}</Button></div>
    </fieldset></AdminForm>
  </Modal>;
}
