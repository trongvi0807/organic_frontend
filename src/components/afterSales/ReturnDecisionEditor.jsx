import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { currency, errorMessage } from '@/lib/utils';
import { decisionPayload, returnTypes, whole } from '@/lib/afterSales';
import { EvidenceList, SupportError } from './SupportUI';

export function ReturnDecisionEditor({ detail, service, onSaved, onClose, canApprove = true }) {
  const request = detail.request;
  const initialType = request.order.status === 'cancelled' ? 'refund' : request.requestType;
  const [values, setValues] = useState(() => Object.fromEntries(detail.items.map((line) => [line.id, {
    quantity: detail.draft?.decision.items.find(item => item.detailId === line.id)?.approvedQuantity ?? (request.proposalVersion > 0 ? line.approvedQuantity : line.requestedQuantity),
    type: detail.draft?.decision.items.find(item => item.detailId === line.id)?.resolutionType || line.resolutionType || initialType, returnRequired: detail.draft?.decision.items.find(item => item.detailId === line.id)?.returnRequired ?? line.returnRequired,
  }])));
  const [policy, setPolicy] = useState(detail.draft?.decision.policyNote || detail.policyNote || '');
  const [preview, setPreview] = useState(null), [calculating, setCalculating] = useState(true);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [calculationAttempt, setCalculationAttempt] = useState(0);
  const lock = useRef(false), sequence = useRef(0);
  // Policy justification does not change the monetary calculation.
  const fingerprint = JSON.stringify(values);
  const current = preview?.fingerprint === fingerprint ? preview.data : null;
  const policyRequired = detail.items.some((line) => line.policyReviewRequired && Number(values[line.id].quantity) > 0);
  const policyError = policyRequired && !policy.trim() ? 'Vui lòng ghi căn cứ xét duyệt cho sản phẩm cần xác minh.' : '';

  useEffect(() => {
    const revision = ++sequence.current;
    let active = true, payload;
    setCalculating(true); setPreview(null); setError('');
    try { payload = decisionPayload(detail, values, '', '', { preview: true }); }
    catch (err) { setError(err.message); setCalculating(false); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await service.preview(request.id, payload);
        if (active && revision === sequence.current) setPreview({ data, fingerprint });
      } catch (err) {
        if (active && revision === sequence.current) { setPreview(null); setError(errorMessage(err)); }
      } finally { if (active && revision === sequence.current) setCalculating(false); }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [detail, service, request.id, fingerprint, calculationAttempt]);

  function patch(id, next) {
    sequence.current++;
    setValues((old) => ({ ...old, [id]: { ...old[id], ...next } }));
    setPreview(null); setCalculating(true);
  }
  async function approve() {
    if (lock.current || calculating || !current) return;
    let payload;
    try { payload = decisionPayload(detail, values, current.generatedNote, policy); }
    catch (err) { setError(err.message); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await (canApprove ? service.approve : service.saveProposal)(request.id, payload);
      toast.success(canApprove ? 'Đã duyệt phương án · Chờ khách xác nhận.' : 'Đã gửi phương án để cửa hàng trưởng duyệt.', { position: 'top-left' });
      onSaved(result); onClose();
    } catch (err) { setError(errorMessage(err)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Modal open title="Lập phương án hỗ trợ" description="Tiền hoàn và nội dung tự cập nhật theo phương án, số lượng và tiền hàng thực trả." className="support-form-dialog !max-w-[950px]" onOpenChange={(open) => { if (!open && !lock.current) onClose(); }}>
    <div className="support-form">
      {!!detail.evidence?.length && <section className="space-y-3"><h3 className="!font-sans !text-sm font-semibold">Ảnh minh chứng của khách hàng</h3><EvidenceList items={detail.evidence} /></section>}
      <fieldset disabled={busy} className="support-fields">
        {detail.items.map((line) => {
          const value = values[line.id], calculated = current?.items.find((item) => item.detailId === line.id);
          const invalid = !whole(value.quantity, 0, line.requestedQuantity);
          return <section key={line.id} className="space-y-3 rounded-xl border border-line p-4">
            <h3 className="!font-sans !text-sm font-semibold text-primary">{line.productName}</h3>
            <p className="text-xs text-stone-500">{line.variantName} · Yêu cầu {line.requestedQuantity}</p>
            {line.policyReviewRequired && <p className="text-xs leading-6 text-amber-800">Cần xác minh chính sách: {line.policyAssessment || 'Vui lòng ghi căn cứ xét duyệt bên dưới.'}</p>}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Số lượng duyệt" error={invalid ? `Nhập số nguyên từ 0 đến ${line.requestedQuantity}.` : ''}><Input type="number" min="0" max={line.requestedQuantity} step="1" value={value.quantity} onChange={(e) => patch(line.id, { quantity: e.target.value })} /></Field>
              <Field label="Phương án"><Select value={value.type} disabled={Number(value.quantity) === 0} onChange={(e) => patch(line.id, { type: e.target.value })}>{Object.entries(returnTypes).map(([key, label]) => <option key={key} value={key} disabled={request.order.status === 'cancelled' && key !== 'refund'}>{label}</option>)}</Select></Field>
              {value.type !== 'exchange' && <Field label="Tiền hoàn tự động" hint="Theo tiền hàng thực trả sau giảm giá."><Input readOnly aria-live="polite" value={calculated ? currency(calculated.approvedRefundAmount) : calculating ? 'Đang tính…' : 'Chưa tính được'} /></Field>}
            </div>
            {value.type === 'exchange' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value.returnRequired} onChange={(e) => patch(line.id, { returnRequired: e.target.checked })} />Cần thu hồi sản phẩm cũ</label>}
          </section>;
        })}
        <Field label="Nội dung phương án tự động"><Textarea readOnly rows={7} aria-live="polite" value={current?.generatedNote || (calculating ? 'Đang cập nhật nội dung phương án…' : 'Vui lòng kiểm tra các thông tin phía trên.')} /></Field>
        {policyRequired && <Field label="Căn cứ xét duyệt / ngoại lệ chính sách *" error={policyError} hint="Ghi lý do chấp thuận khi sản phẩm cần xác minh chính sách."><Textarea value={policy} maxLength={5000} onChange={(e) => setPolicy(e.target.value)} /></Field>}
      </fieldset>
      {current && <section className="rounded-xl bg-emerald-50 p-4" aria-live="polite"><p className="text-sm">Tổng tiền hoàn: <strong>{currency(current.approvedRefundAmount)}</strong></p><p className="!mt-2 text-xs leading-6">{current.returnRequired ? 'Cần nhận và xử lý xong hàng thu hồi.' : 'Không yêu cầu thu hồi hàng.'} Khách cần đồng ý phương án trước khi thực hiện. Nhân viên trao đổi tài khoản nhận tiền với khách, chuyển khoản và xác nhận kết quả kèm mã giao dịch.</p></section>}
      <SupportError>{error}</SupportError>
      {error && !current && !calculating && <Button variant="outline" disabled={busy} onClick={() => setCalculationAttempt((old) => old + 1)}>Tính lại phương án</Button>}
      <div className="support-form-actions"><Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button disabled={busy || calculating || !current || !!policyError} onClick={approve}>{busy ? 'Đang xử lý…' : calculating ? 'Đang tính phương án…' : canApprove ? 'Duyệt và gửi khách xác nhận' : 'Gửi cửa hàng trưởng duyệt'}</Button></div>
    </div>
  </Modal>;
}
