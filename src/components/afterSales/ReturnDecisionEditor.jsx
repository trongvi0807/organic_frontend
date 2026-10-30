import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { currency, errorMessage } from '@/lib/utils';
import { decisionPayload, returnTypes, whole } from '@/lib/afterSales';
import { SupportError } from './SupportUI';

export function ReturnDecisionEditor({ detail, service, onSaved, onClose }) {
  const request = detail.request;
  const initialType = request.order.status === 'cancelled' ? 'refund' : request.requestType;
  const [values, setValues] = useState(() => Object.fromEntries(detail.items.map((line) => [line.id, {
    quantity: request.proposalVersion > 0 ? line.approvedQuantity : line.requestedQuantity,
    type: line.resolutionType || initialType, returnRequired: line.returnRequired,
    amount: request.proposalVersion > 0 && line.resolutionType !== 'exchange' ? line.approvedRefundAmount ?? '' : '',
  }])));
  const [note, setNote] = useState(detail.decisionNote || ''), [policy, setPolicy] = useState(detail.policyNote || '');
  const [preview, setPreview] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  const fingerprint = JSON.stringify([values, note, policy]);
  function patch(id, next) { setValues((old) => ({ ...old, [id]: { ...old[id], ...next } })); setPreview(null); }
  async function submit(approve = false) {
    if (lock.current) return; setError('');
    let payload;
    try { payload = decisionPayload(detail, values, note, policy); } catch (err) { setError(err.message); return; }
    if (approve && (!preview || preview.fingerprint !== fingerprint)) { setError('Vui lòng xem dự tính phương án trước khi duyệt.'); return; }
    lock.current = true; setBusy(true);
    try {
      if (approve) { const result = await service.approve(request.id, payload); toast.success('Đã duyệt phương án · Chờ khách xác nhận.', { position: 'top-left' }); onSaved(result); onClose(); }
      else setPreview({ data: await service.preview(request.id, payload), fingerprint });
    } catch (err) { setError(errorMessage(err)); setPreview(null); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Modal open title="Lập phương án hỗ trợ" description="Duyệt theo số lượng và số tiền thực trả của đơn gốc. Khách cần đồng ý trước khi thực hiện." className="!max-w-[950px]" onOpenChange={(open) => { if (!open && !lock.current) onClose(); }}><div className="space-y-5"><fieldset disabled={busy} className="space-y-4">{detail.items.map((line) => {
    const value = values[line.id], invalid = !whole(value.quantity, 0, line.requestedQuantity), amountInvalid = value.amount !== '' && !whole(value.amount, 0, 999999999999);
    return <section key={line.id} className="space-y-3 rounded-xl border border-line p-4"><h3 className="!font-sans !text-sm font-semibold text-primary">{line.productName}</h3><p className="text-xs text-stone-500">{line.variantName} · Yêu cầu {line.requestedQuantity} · Mức hoàn tối đa hiện tại {currency(line.maxRefundForRequestedQuantity)}</p>{line.policyReviewRequired && <p className="text-xs leading-6 text-amber-800">Cần xác minh chính sách: {line.policyAssessment || 'Vui lòng ghi căn cứ xét duyệt bên dưới.'}</p>}<div className="grid gap-3 sm:grid-cols-3"><Field label="Số lượng duyệt" error={invalid ? `Nhập số nguyên từ 0 đến ${line.requestedQuantity}.` : ''}><Input type="number" min="0" max={line.requestedQuantity} step="1" value={value.quantity} onChange={(e) => patch(line.id, { quantity: e.target.value })} /></Field><Field label="Phương án"><Select value={value.type} disabled={Number(value.quantity) === 0} onChange={(e) => patch(line.id, { type: e.target.value, amount: '' })}>{Object.entries(returnTypes).map(([key, label]) => <option key={key} value={key} disabled={request.order.status === 'cancelled' && key !== 'refund'}>{label}</option>)}</Select></Field>{value.type !== 'exchange' && <Field label="Tiền hoàn dự kiến (₫)" hint="Để trống để tính theo số thực trả." error={amountInvalid ? 'Nhập số tiền nguyên không âm.' : ''}><Input type="number" min="0" step="1" value={value.amount} disabled={Number(value.quantity) === 0} onChange={(e) => patch(line.id, { amount: e.target.value })} /></Field>}</div>{value.type === 'exchange' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value.returnRequired} onChange={(e) => patch(line.id, { returnRequired: e.target.checked })} />Cần thu hồi sản phẩm cũ</label>}</section>;
  })}<Field label="Nội dung phương án *"><Textarea value={note} maxLength={5000} onChange={(e) => { setNote(e.target.value); setPreview(null); }} /></Field><Field label="Căn cứ xét duyệt / ngoại lệ chính sách" hint="Bắt buộc nếu sản phẩm được duyệt cần xác minh chính sách."><Textarea value={policy} maxLength={5000} onChange={(e) => { setPolicy(e.target.value); setPreview(null); }} /></Field></fieldset>{preview?.fingerprint === fingerprint && <section className="rounded-xl bg-emerald-50 p-4"><h3 className="!font-sans !text-base font-semibold">Dự tính đã được kiểm tra</h3><p className="!mt-2 text-sm">Tổng tiền hoàn được đề xuất: <strong>{currency(preview.data.approvedRefundAmount)}</strong></p><p className="!mt-1 text-xs">{preview.data.returnRequired ? 'Cần nhận lại hàng theo phương án.' : 'Không yêu cầu thu hồi hàng.'}</p>{preview.data.items.map((line) => <p key={line.detailId} className="!mt-2 text-xs text-stone-600">{detail.items.find((item) => item.id === line.detailId)?.productName}: {line.approvedQuantity} · {currency(line.approvedRefundAmount)}</p>)}<p className="!mt-3 text-xs text-amber-800">Đây là phương án, chưa phải tiền đã chuyển hoàn.</p></section>}<SupportError>{error}</SupportError><div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button variant="outline" disabled={busy} onClick={() => submit()}>Kiểm tra phương án</Button><Button disabled={busy || !preview || preview.fingerprint !== fingerprint} onClick={() => submit(true)}>{busy ? 'Đang xử lý…' : 'Duyệt và gửi khách xác nhận'}</Button></div></div></Modal>;
}
