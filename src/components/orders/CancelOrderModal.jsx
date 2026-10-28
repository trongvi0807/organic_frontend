import { useId, useRef, useState } from 'react';
import { AlertCircle, Landmark, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SearchSelect } from '@/components/admin/SearchSelect';
import { CANCEL_REASONS, REFUND_BANKS, cancellationEligibility, cancellationPayload, validateCancellation, customerOrderError } from '@/lib/customerOrders';
import { customerOrderService } from '@/services/client/customerOrderService';

export function CancelOrderModal({ order, demo = false, onClose, onCancelled, onRefresh }) {
  const prefix = useId(), lock = useRef(false);
  const [values, setValues] = useState({ reason: '', otherReason: '', accountHolder: '', accountNumber: '', bank: '', otherBank: '', branch: '', phone: order.receiverPhone || '' });
  const [touched, setTouched] = useState({}), [submitted, setSubmitted] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const eligibility = cancellationEligibility(order, demo), errors = validateCancellation(values, eligibility.paid);
  const update = (name, value) => { setValues((old) => ({ ...old, [name]: value })); setTouched((old) => ({ ...old, [name]: true })); setError(''); };
  const message = (name) => (submitted || touched[name]) && errors[name];
  const field = (name, label, props = {}) => <label className="field" htmlFor={`${prefix}-${name}`}><span>{label} <span aria-hidden="true">*</span></span><input {...props} id={`${prefix}-${name}`} className="input" value={values[name]} required disabled={busy} maxLength={props.maxLength || 120} aria-invalid={!!message(name)} aria-describedby={message(name) ? `${prefix}-${name}-error` : undefined} onBlur={() => setTouched((old) => ({ ...old, [name]: true }))} onChange={(event) => update(name, event.target.value)} />{message(name) && <small id={`${prefix}-${name}-error`} role="status" className="!text-red-700">{message(name)}</small>}</label>;
  async function submit(event) {
    event.preventDefault(); if (lock.current || !eligibility.allowed) return;
    setSubmitted(true);
    if (Object.keys(errors).length) { event.currentTarget.querySelector('[aria-invalid="true"]')?.focus(); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await customerOrderService.cancel(order, cancellationPayload(values, eligibility.paid), demo);
      if (result?.status !== 'cancelled') throw new Error('Yêu cầu chưa xác nhận hủy thành công. Vui lòng kiểm tra lại trạng thái đơn hàng.');
      onCancelled(result); onClose();
      if (!demo) window.dispatchEvent(new Event('moc:order-updated'));
      toast.success(eligibility.paid ? 'Đã hủy đơn mô phỏng · Chờ hoàn tiền. Dự kiến xử lý 3–7 ngày làm việc (mô phỏng).' : 'Đã hủy đơn hàng thành công.', { position: 'top-left' });
    } catch (err) { setError(customerOrderError(err)); onRefresh?.(); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Modal open onOpenChange={(open) => { if (!open && !lock.current) onClose(); }} title="Hủy đơn hàng" description={`Xác nhận hủy đơn ${order.orderCode ? `#${order.orderCode}` : '(chưa có mã)'}. Đơn đã bàn giao vận chuyển sẽ không thể tự hủy.`} className="!max-w-[700px]">
    <form onSubmit={submit} noValidate className="space-y-5 customer-order-dialog">
      {!eligibility.visible && <p role="alert" className="order-warning">Đơn đã thay đổi và không còn đủ điều kiện tự hủy. Hãy đóng cửa sổ và kiểm tra lại trạng thái.</p>}
      {eligibility.limitation && <div className="order-warning" role="status"><AlertCircle size={20} /><p>{eligibility.limitation} <a className="underline" href="tel:0344855913">Gọi 0344 855 913</a>.</p></div>}
      <fieldset disabled={busy}><legend className="!mb-3 text-sm font-semibold">Vì sao bạn muốn hủy đơn? <span className="text-red-700">*</span></legend><div className="space-y-2">{CANCEL_REASONS.map(([key, label]) => <label key={key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-6 transition-colors ${values.reason === key ? 'border-[#8CAC86] bg-[#F7FAF5]' : 'border-stone-200 hover:bg-stone-50'}`}><input className="!mt-1 accent-[#1B4D2E]" type="radio" name={`${prefix}-reason`} value={key} checked={values.reason === key} onChange={() => { update('reason', key); if (key === 'other') setTouched((old) => ({ ...old, otherReason: true })); }} />{label}</label>)}</div>{message('reason') && <p role="status" className="!mt-2 text-xs text-red-700">{message('reason')}</p>}</fieldset>
      {values.reason === 'other' && <label className="field" htmlFor={`${prefix}-otherReason`}><span>Lý do cụ thể *</span><textarea id={`${prefix}-otherReason`} className="input min-h-24" maxLength={1000} required disabled={busy} value={values.otherReason} aria-invalid={!!message('otherReason')} aria-describedby={`${prefix}-otherReason-error`} onChange={(event) => update('otherReason', event.target.value)} placeholder="Bạn chia sẻ thêm để cửa hàng hỗ trợ tốt hơn nhé…" />{message('otherReason') && <small id={`${prefix}-otherReason-error`} role="status" className="!text-red-700">{message('otherReason')}</small>}</label>}
      {eligibility.paid && demo && <section className="rounded-2xl border border-emerald-100 bg-[#F7FAF5] p-4 sm:p-5"><h3 className="!mb-2 flex items-center gap-2 text-base font-semibold"><Landmark size={18} />Thông tin nhận hoàn tiền</h3><p className="!mb-4 text-xs leading-6 text-stone-600">Mô phỏng thời gian xử lý: 3–7 ngày làm việc sau khi được tiếp nhận. Chỉ nhập thông tin giả khi kiểm thử. Không có giao dịch hoàn tiền thực tế.</p><div className="grid gap-4 sm:grid-cols-2">{field('accountHolder', 'Tên chủ tài khoản', { autoComplete: 'off' })}{field('accountNumber', 'Số tài khoản', { inputMode: 'numeric', maxLength: 30, autoComplete: 'off' })}<div className="field"><label htmlFor={`${prefix}-bank`}>Ngân hàng *</label><SearchSelect id={`${prefix}-bank`} aria-label="Ngân hàng" value={values.bank} options={REFUND_BANKS.map((bank) => ({ value: bank, label: bank }))} onChange={(bank) => update('bank', bank)} disabled={busy} required aria-invalid={!!message('bank')} placeholder="Gõ để tìm ngân hàng…" />{message('bank') && <small role="status" className="!text-red-700">{message('bank')}</small>}</div>{values.bank === 'Khác' && field('otherBank', 'Tên ngân hàng khác')}{field('branch', 'Chi nhánh')}{field('phone', 'Số điện thoại', { type: 'tel', autoComplete: 'off' })}</div><p className="!mt-4 flex items-start gap-2 text-xs leading-5 text-stone-500"><ShieldCheck size={17} className="shrink-0" />Thông tin tài khoản nhập thử không được lưu vào trình duyệt.</p></section>}
      {!demo && eligibility.allowed && <p className="text-xs leading-6 text-stone-500">Thao tác hiện ghi nhận hủy đơn; lý do chi tiết chưa được lưu cùng đơn. Nếu cần cửa hàng xử lý thêm, vui lòng gọi hotline.</p>}
      {error && <p className="order-warning !border-red-200 !bg-red-50 !text-red-800" role="alert">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-5"><Button disabled={busy} variant="outline" onClick={onClose}>Giữ lại đơn hàng</Button><Button type="submit" variant="danger" disabled={busy || !eligibility.allowed}>{busy ? 'Đang gửi yêu cầu…' : 'Xác nhận hủy đơn'}</Button></div>
    </form>
  </Modal>;
}
