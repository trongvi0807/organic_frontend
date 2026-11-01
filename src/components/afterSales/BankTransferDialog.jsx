import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { returnExecutionService as service } from '@/services/afterSalesService';
import { keyedOperation } from '@/lib/afterSales';
import { REFUND_BANKS } from '@/lib/customerOrders';
import { bankAccountErrors, bankAccountPayload, transferPayload } from '@/lib/returnExecution';
import { currency, errorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { SupportError } from './SupportUI';

export function BankTransferDialog({ data, target, confirm = false, onClose, onSaved }) {
  const [values, setValues] = useState(() => ({
    recipientName: target?.recipientName || '', bankAccountNumber: target?.bankAccountNumber || '',
    bankName: target?.bankName || '', bankBranch: target?.bankBranch || '', recipientPhone: target?.recipientPhone || '',
    referenceCode: '', note: '', confirmed: false,
  }));
  const [touched, setTouched] = useState({}), [busy, setBusy] = useState(false), [attempted, setAttempted] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), key = useRef(keyedOperation()), pending = useRef(null);
  const errors = bankAccountErrors(values), amount = target?.amount ?? data.remainingRefundAmount;
  const change = (name, value) => { setValues((old) => ({ ...old, [name]: value })); setTouched((old) => ({ ...old, [name]: true })); };
  const field = (name, label, maxLength, inputMode) => <Field label={label} error={touched[name] ? errors[name] : ''}><Input autoComplete="off" value={values[name]} maxLength={maxLength} inputMode={inputMode} onChange={(e) => change(name, e.target.value)} onBlur={() => setTouched((old) => ({ ...old, [name]: true }))} /></Field>;
  async function submit(event) {
    event.preventDefault(); if (lock.current) return;
    setError(''); setTouched(Object.fromEntries(Object.keys(values).map((name) => [name, true])));
    let body, operationKey;
    try { body = pending.current || (confirm ? transferPayload(values, data, target) : bankAccountPayload(values, data)); operationKey = key.current.prepare(body); }
    catch (err) { setError(err.message); return; }
    lock.current = true; pending.current = body; setBusy(true); setAttempted(true);
    try {
      const result = confirm ? await service.confirmTransfer(data.requestId, target.id, body, operationKey) : await service.bankAccount(data.requestId, body, operationKey);
      toast.success(confirm ? 'Đã ghi nhận chuyển khoản hoàn tiền.' : 'Đã lưu tài khoản nhận tiền. Chưa ghi nhận chuyển tiền.', { position: 'top-left' });
      onSaved(result);
    } catch (err) {
      setError(errorMessage(err));
      const status = err.response?.status;
      if (status >= 400 && status < 500 && ![408, 429].includes(status)) { pending.current = null; key.current.clear(); setAttempted(false); }
    } finally { lock.current = false; setBusy(false); }
  }
  const knownBank = REFUND_BANKS.includes(values.bankName), [customBank, setCustomBank] = useState(!!values.bankName && !knownBank);
  return <Modal open title={confirm ? 'Xác nhận đã chuyển khoản hoàn tiền' : 'Tài khoản nhận hoàn tiền'} className="support-form-dialog !max-w-[640px]" description={confirm ? 'Chuyển khoản bên ngoài hệ thống và kiểm tra chứng từ trước khi xác nhận.' : 'Nhập thông tin đã trao đổi và xác nhận với khách hàng.'} onOpenChange={(open) => { if (!open && !lock.current) onClose(); }}>
    <form noValidate onSubmit={submit} className="support-form">
      <div className="rounded-xl bg-emerald-50 p-4 text-sm">Số tiền hoàn theo phương án: <strong>{currency(amount)}</strong></div>
      <fieldset disabled={busy || attempted} className="support-fields">
        {confirm ? <>
          <dl className="grid gap-3 rounded-xl border border-line p-4 text-sm"><div><dt>Chủ tài khoản</dt><dd className="font-semibold">{target.recipientName}</dd></div><div><dt>Ngân hàng</dt><dd className="font-semibold">{target.bankName}</dd></div><div><dt>Số tài khoản</dt><dd className="break-all font-semibold tabular-nums">{target.bankAccountNumber}</dd></div></dl>
          <Field label="Mã giao dịch chuyển khoản *" error={touched.referenceCode && !values.referenceCode.trim() ? 'Vui lòng nhập mã giao dịch trên chứng từ chuyển khoản.' : ''}><Input value={values.referenceCode} maxLength={200} autoComplete="off" onChange={(e) => change('referenceCode', e.target.value)} /></Field>
          <Field label="Ghi chú (không bắt buộc)"><Textarea value={values.note} rows={4} maxLength={3000} onChange={(e) => change('note', e.target.value)} /></Field>
          <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1 shrink-0 accent-emerald-700" checked={values.confirmed} onChange={(e) => change('confirmed', e.target.checked)} /><span>Tôi đã chuyển đúng {currency(amount)} vào tài khoản trên và đã kiểm tra chứng từ.</span></label>
        </> : <>
          {field('recipientName', 'Tên chủ tài khoản *', 100)}
          <Field label="Ngân hàng *" error={touched.bankName ? errors.bankName : ''}><Select aria-label="Ngân hàng nhận tiền" value={customBank ? 'Khác' : values.bankName} onChange={(e) => { const other = e.target.value === 'Khác'; setCustomBank(other); change('bankName', other ? '' : e.target.value); }}><option value="">Gõ để tìm ngân hàng…</option>{REFUND_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}</Select></Field>
          {customBank && field('bankName', 'Tên ngân hàng khác *', 200)}
          {field('bankAccountNumber', 'Số tài khoản *', 34, 'numeric')}
          <div className="grid gap-4 sm:grid-cols-2">{field('bankBranch', 'Chi nhánh (không bắt buộc)', 200)}{field('recipientPhone', 'Số điện thoại (không bắt buộc)', 20, 'tel')}</div>
          <p className="text-xs leading-6 text-stone-600">Lưu thông tin không thực hiện chuyển tiền. Sau khi xử lý xong hàng trả, nhân viên chuyển khoản và bấm “Xác nhận đã chuyển tiền”.</p>
        </>}
      </fieldset>
      <SupportError>{error}</SupportError>
      {attempted && !busy && <p className="text-xs leading-6 text-amber-900">Chưa rõ kết quả. Thử lại sẽ giữ nguyên yêu cầu; bạn cũng có thể đóng và kiểm tra tiến độ.</p>}
      <div className="support-form-actions"><Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : attempted ? 'Thử lại cùng yêu cầu' : confirm ? 'Xác nhận đã chuyển tiền' : 'Lưu tài khoản nhận tiền'}</Button></div>
    </form>
  </Modal>;
}
