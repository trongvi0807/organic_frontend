import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { returnWarehouseService as service } from '@/services/afterSalesService';
import { adminDate } from '@/lib/adminFormat';
import { errorMessage } from '@/lib/utils';
import { keyedOperation, whole } from '@/lib/afterSales';
import { disposalGroups, warehouseChoicePayload } from '@/lib/returnWarehouseChoices';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { SupportError } from './SupportUI';
import { WarehouseConditionPicker } from './WarehouseConditionPicker';

export const warehouseActionLabels = {
  receive: 'Nhận hàng thu hồi', 'identify-batch': 'Đối chiếu lô gốc', inspect: 'Kiểm tra tình trạng hàng',
  reinspect: 'Sửa kết quả kiểm tra', restock: 'Nhập lại kho', dispose: 'Xác nhận đã loại bỏ',
};
const descriptions = {
  receive: 'Ghi nhận đúng số hàng đã nhận lại từ khách.',
  'identify-batch': 'Chọn đúng lô đã giao cho khách. Hệ thống tự lưu lịch sử đối chiếu.',
  inspect: 'Chọn tình trạng theo kết quả kiểm tra thực tế.',
  reinspect: 'Chọn lại kết quả đúng cho số hàng đã kiểm tra và còn chờ xử lý.',
  restock: 'Xác nhận số hàng tốt đã được nhập lại vào lô gốc để tiếp tục bán.',
  dispose: 'Chỉ xác nhận sau khi đã loại bỏ thực tế. Hệ thống sẽ lưu người thực hiện và số lượng.',
};

export function WarehouseOperationDialog({ operation, detail, onClose }) {
  const { action, item } = operation;
  const lines = detail.items.filter((entry) => entry.returnRequired && entry.remainingToReceive > 0);
  const [lineId, setLineId] = useState(operation.line?.returnRequestDetailId || lines[0]?.returnRequestDetailId || '');
  const line = operation.line || lines.find((entry) => entry.returnRequestDetailId === lineId);
  const groups = disposalGroups(item);
  const [values, setValues] = useState(() => ({
    note: '', quantity: action === 'receive' ? line?.remainingToReceive || 1 : 1,
    allocation: item?.originalOrderDetailBatchId || '', condition: '', damagedQuantity: '',
    disposalGroup: groups[0]?.value || '', partial: false,
  }));
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [attempted, setAttempted] = useState(false);
  const lock = useRef(false), op = useRef(keyedOperation()), pendingBody = useRef(null);
  const isQuality = action === 'inspect' || action === 'reinspect';
  const qualityTotal = action === 'inspect' ? item?.uninspectedQuantity : Number(item?.passedHeldQuantity || 0) + Number(item?.failedHeldQuantity || 0);
  let planned, planningError = '';
  try { planned = warehouseChoicePayload(action, values, item, line); } catch (err) { planningError = err.message; }
  const amount = planned ? action === 'dispose' ? planned.passedQuantity + planned.failedQuantity : planned.quantity : null;
  function change(field, value) { setValues((old) => ({ ...old, [field]: value })); setError(''); }

  async function submit(event) {
    event.preventDefault(); if (lock.current) return;
    setError(''); let body, key;
    try { body = pendingBody.current || warehouseChoicePayload(action, values, item, line); key = op.current.prepare(body); }
    catch (err) { setError(err.message); return; }
    pendingBody.current = body; lock.current = true; setBusy(true); setAttempted(true);
    try {
      if (action === 'receive') await service.receive(detail.request.requestId, body, key);
      else await service.action(item.id, action, body, key);
      toast.success(action === 'restock' ? 'Đã nhập lại hàng tốt vào kho.' : action === 'dispose' ? 'Đã ghi nhận số hàng đã loại bỏ.' : action === 'reinspect' ? 'Đã sửa kết quả kiểm tra.' : 'Đã ghi nhận thao tác kho.', { position: 'top-left' });
      onClose();
    } catch (err) {
      const status = err.response?.status;
      if (status >= 400 && status < 500 && ![408, 429].includes(status)) {
        pendingBody.current = null; op.current.clear(); setAttempted(false);
        setError(`${errorMessage(err)} Nếu tiến độ đã thay đổi, hãy đóng và mở lại để xem số lượng mới nhất.`);
      } else setError(`${errorMessage(err)} Thử lại sẽ giữ nguyên yêu cầu để tránh ghi nhận hai lần.`);
    } finally { lock.current = false; setBusy(false); }
  }
  const confirmLabel = action === 'dispose' && amount ? `Xác nhận đã loại bỏ ${amount} sản phẩm`
    : action === 'restock' && amount ? `Nhập lại kho ${amount} sản phẩm`
      : action === 'reinspect' ? 'Lưu kết quả đúng' : action === 'inspect' ? 'Lưu kết quả kiểm tra' : 'Xác nhận';

  return <Modal open title={warehouseActionLabels[action]} description={descriptions[action]} className="support-form-dialog !max-w-[640px]" onOpenChange={(open) => { if (!open && !lock.current) onClose(); }}>
    <form onSubmit={submit} noValidate className="support-form">
      <fieldset disabled={busy || attempted} className="support-fields">
        {item && <div className="rounded-xl bg-[#F7FAF5] p-4"><strong className="text-sm text-primary">{item.productName}</strong><p className="!mt-1 text-xs text-stone-600">{item.variantName}{item.batchCode ? ` · Lô ${item.batchCode}` : ''}</p>
          {isQuality && <p className="!mt-2 text-sm">{action === 'inspect' ? 'Cần kiểm tra' : 'Có thể sửa kết quả'}: <strong>{qualityTotal} sản phẩm</strong></p>}
          {action === 'reinspect' && <p className="!mt-1 text-xs leading-6">Đang lưu: {item.passedHeldQuantity} hàng tốt, {item.failedHeldQuantity} hàng hỏng / không thể bán lại.{item.restockedQuantity + item.disposedQuantity > 0 && ' Chỉ sửa phần còn chờ xử lý.'}</p>}
        </div>}
        {action === 'receive' && <>
          <Field label="Sản phẩm cần nhận"><Select value={lineId} onChange={(e) => {
            const selected = lines.find((entry) => entry.returnRequestDetailId === e.target.value);
            setLineId(e.target.value); setValues((old) => ({ ...old, allocation: '', quantity: selected?.remainingToReceive || 1 }));
          }}>{lines.map((entry) => <option value={entry.returnRequestDetailId} key={entry.returnRequestDetailId}>{entry.productName} · {entry.variantName} · Còn nhận {entry.remainingToReceive}</option>)}</Select></Field>
          <Field label="Số lượng đã nhận lại từ khách" error={!whole(values.quantity, 1, line?.remainingToReceive || 0) ? `Nhập từ 1 đến ${line?.remainingToReceive || 0} sản phẩm theo số thực nhận.` : ''}><Input type="number" min={1} max={line?.remainingToReceive} step={1} value={values.quantity} onChange={(e) => change('quantity', e.target.value)} /></Field>
        </>}
        {['receive', 'identify-batch'].includes(action) && <Field label={action === 'receive' ? 'Lô đã giao (nếu xác định được)' : 'Chọn lô đã giao cho khách'}><Select value={values.allocation} onChange={(e) => change('allocation', e.target.value)}><option value="">{action === 'receive' ? 'Chưa xác định được lô' : 'Chọn lô gốc'}</option>{line?.originalAllocations.map((allocation) => <option value={allocation.id} key={allocation.id}>{allocation.batchCode} · HSD {adminDate(allocation.expiryDate)}</option>)}</Select></Field>}
        {isQuality && <WarehouseConditionPicker total={qualityTotal} value={values.condition} damagedQuantity={values.damagedQuantity} onChange={(condition) => change('condition', condition)} onDamagedChange={(value) => change('damagedQuantity', value)} correction={action === 'reinspect'} />}
        {action === 'dispose' && <>
          {groups.length > 1 && <fieldset className="space-y-3"><legend className="mb-2 text-sm font-semibold text-primary">Bạn đã loại bỏ nhóm hàng nào?</legend>{groups.map((group) => <label key={group.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${values.disposalGroup === group.value ? 'border-emerald-600 bg-emerald-50' : 'border-line'}`}><input type="radio" name="disposal-group" className="mt-1 accent-emerald-700" value={group.value} checked={values.disposalGroup === group.value} onChange={() => { setValues((old) => ({ ...old, disposalGroup: group.value, partial: false, quantity: 1 })); setError(''); }} /><span className="text-sm">{group.label}<strong className="ml-2">({group.total} sản phẩm)</strong></span></label>)}</fieldset>}
          {groups.length === 1 && <p className="text-sm leading-6">{values.partial ? 'Có' : 'Bạn xác nhận đã loại bỏ'} <strong>{groups[0].total} sản phẩm</strong> thuộc nhóm <strong>{groups[0].label.toLowerCase()}</strong>{values.partial ? ' còn chờ xử lý.' : '?'}</p>}
          {groups.length === 0 && <SupportError>Không còn hàng chờ loại bỏ. Hãy đóng và cập nhật tiến độ.</SupportError>}
          {values.disposalGroup === 'good' && <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">Đây là hàng đã được kiểm tra tốt. Nếu còn đủ điều kiện bán lại, chọn “Nhập lại kho” tại danh sách sản phẩm.</p>}
          {groups.find((group) => group.value === values.disposalGroup)?.total > 1 && values.disposalGroup !== 'all' && <PartialQuantity values={values} onChange={change} max={groups.find((group) => group.value === values.disposalGroup).total} action="dispose" />}
          {planned && <p role="status" className="rounded-xl bg-stone-50 p-3 text-sm leading-6">Sẽ ghi nhận đã loại bỏ <strong>{amount} sản phẩm</strong>{planned.passedQuantity > 0 && planned.failedQuantity > 0 ? ` (${planned.passedQuantity} hàng tốt và ${planned.failedQuantity} hàng hỏng)` : ''}.</p>}
        </>}
        {action === 'restock' && <>
          <p className="text-sm leading-6">Có <strong>{item.passedHeldQuantity} sản phẩm còn tốt</strong> của <strong>{item.productName}</strong> đủ điều kiện nhập lại kho.</p>
          {item.passedHeldQuantity > 1 && <PartialQuantity values={values} onChange={change} max={item.passedHeldQuantity} action="restock" />}
          {planned && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Số lượng có thể bán sẽ tăng thêm <strong>{amount} sản phẩm</strong> sau khi xác nhận.</p>}
        </>}
        {action === 'receive' && <Field label="Ghi chú nhận hàng *"><Textarea value={values.note} maxLength={3000} required onChange={(e) => change('note', e.target.value)} /></Field>}
      </fieldset>
      {action === 'reinspect' && values.condition && planningError && <p role="status" className="text-sm leading-6 text-stone-600">{planningError}</p>}
      {!isQuality && values.partial && planningError && <SupportError>{planningError}</SupportError>}
      <SupportError>{error}</SupportError>
      {attempted && !busy && <p className="text-xs leading-6 text-amber-900">Chưa rõ kết quả. Bạn có thể thử lại cùng yêu cầu hoặc đóng và kiểm tra tiến độ trước khi thao tác tiếp.</p>}
      <div className="support-form-actions"><Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" disabled={busy || (!planned && !attempted && action !== 'receive')}>{busy ? 'Đang ghi nhận…' : attempted ? 'Thử lại cùng yêu cầu' : confirmLabel}</Button></div>
    </form>
  </Modal>;
}

function PartialQuantity({ values, onChange, max, action }) {
  return <div className="space-y-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={values.partial} onChange={(e) => onChange('partial', e.target.checked)} className="accent-emerald-700" />{action === 'dispose' ? 'Chỉ loại bỏ một phần số hàng này' : 'Chỉ nhập lại một phần số hàng này'}</label>
    {values.partial && <Field label={action === 'dispose' ? 'Số sản phẩm đã loại bỏ' : 'Số sản phẩm nhập lại'} error={!whole(values.quantity, 1, max) ? `Nhập số nguyên từ 1 đến ${max}.` : ''}><Input type="number" min={1} max={max} step={1} value={values.quantity} onChange={(e) => onChange('quantity', e.target.value)} /></Field>}
  </div>;
}
