import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, PackageCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { returnExecutionService as service, returnService } from '@/services/afterSalesService';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh, publishPaymentUpdate } from '@/hooks/useOrderRefresh';
import { currency, errorMessage } from '@/lib/utils';
import { adminDate } from '@/lib/adminFormat';
import { keyedOperation, whole } from '@/lib/afterSales';
import { createShipmentCode } from '@/lib/shipmentCodes';
import { executionPayload, executionTitles, refundMethods, refundStates, replacementStates, shipmentNext, shipmentStates } from '@/lib/returnExecution';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { SupportBadge, SupportError } from './SupportUI';

export function ReturnExecutionPanel({ id, management = false, onChanged, onBusyChange, revision = 0, order }) {
  const state = useResource(() => returnService(management).execution(id), [id, management, revision]);
  const [operation, setOperation] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), data = state.data;
  useOrderRefresh(state.reload, { enabled: !operation && !busy, interval: 15000 });
  useEffect(() => { onBusyChange?.(!!operation || busy); return () => onBusyChange?.(false); }, [operation, busy, onBusyChange]);
  function changed(result) { state.setData(result); state.reload({ background: true }); onChanged?.(); publishPaymentUpdate(); }
  async function sync(refund) {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try {
      const result = await service.sync(id, refund.id); changed(result);
      const current = result.refunds.find((item) => item.id === refund.id);
      if (current?.status === 'succeeded') toast.success('VNPay đã xác nhận hoàn tiền thành công.', { position: 'top-left' });
      else toast.info(refundStates[current?.status] || 'Khoản hoàn đang được xác minh.', { position: 'top-left' });
    } catch (err) { setError(errorMessage(err)); state.reload({ background: true }); }
    finally { lock.current = false; setBusy(false); }
  }
  const start = (action, target) => { if (!busy) setOperation({ action, target }); };
  return <section className="space-y-4 rounded-2xl border border-emerald-100 bg-[#F7FAF5] p-4 sm:p-5">
    <h3 className="flex items-center gap-2 !font-sans !text-base font-semibold text-primary"><PackageCheck size={19} />Thực hiện hoàn tiền & giao hàng đổi</h3>
    <ResourceState loading={state.loading} error={state.error} onRetry={state.reload} />
    <SupportError>{error || state.refreshError}</SupportError>
    {data && !state.error && <>
      <div className="grid gap-3 sm:grid-cols-3">{[['Được duyệt hoàn', data.approvedRefundAmount], ['Đã hoàn thực tế', data.refundedAmount], ['Đang xử lý / đối soát', data.pendingRefundAmount]].map(([label, value]) => <div className="rounded-xl bg-white p-3" key={label}><p className="text-xs text-stone-500">{label}</p><strong className="!mt-2 block text-base text-primary">{currency(value)}</strong></div>)}</div>
      {data.blockers.length > 0 && <ul className="list-disc space-y-1 pl-5 text-xs leading-6 text-amber-900">{data.blockers.map((text) => <li key={text}>{text}</li>)}</ul>}
      {data.refunds.map((refund) => <article key={refund.id} className="space-y-2 rounded-xl border border-line bg-white p-4">
        <div className="flex flex-wrap justify-between gap-3"><strong className="text-sm">{refund.refundCode} · {currency(refund.amount)}</strong><SupportBadge labels={refundStates} value={refund.status} /></div>
        <p className="text-xs text-stone-500">{refundMethods[refund.method]} · {adminDate(refund.processedAt || refund.createdAt, true)}</p>
        {refund.recipientName && <p className="text-xs">{refund.recipientName} · {refund.bankName} · {refund.maskedAccountNumber}</p>}
        {refund.referenceCode && <p className="break-all text-xs">Mã đối chiếu: {refund.referenceCode}</p>}
        {refund.failureReason && <p className="text-xs leading-6 text-amber-900">{refund.failureReason}</p>}
        {management && <div className="flex flex-wrap gap-2">{refund.canSync && <Button size="sm" variant="outline" disabled={busy} onClick={() => sync(refund)}>Kiểm tra tại VNPay</Button>}{refund.canReconcile && <Button size="sm" variant="outline" disabled={busy} onClick={() => start('reconcile', refund)}>Đối chiếu kết quả thực tế</Button>}</div>}
      </article>)}
      {data.replacementOrder && <article className="space-y-3 rounded-xl border border-line bg-white p-4"><div className="flex flex-wrap justify-between gap-3"><strong className="flex items-center gap-2 text-sm"><Truck size={18} />Đơn đổi {data.replacementOrder.orderCode}</strong><SupportBadge labels={replacementStates} value={data.replacementOrder.status} /></div>
        <p className="text-xs leading-6">{data.replacementOrder.receiverName} · {data.replacementOrder.receiverPhone}<br />{data.replacementOrder.shippingAddress}</p>
        <ul className="space-y-2 text-xs">{data.replacementOrder.pricing.items.map((item, index) => <li key={`${item.sku}-${index}`}>{item.productName} · {item.variantName} · Số lượng {item.quantity}</li>)}</ul>
        <p className="text-xs text-stone-500">Hàng đổi theo phương án đã duyệt · Không thu thêm tiền.</p>
        {data.replacementOrder.shipments.map((shipment) => <div className="space-y-2 border-t border-line pt-3" key={shipment.id}><div className="flex flex-wrap justify-between gap-2"><p className="text-xs">{shipment.carrier} · {shipment.trackingCode || 'Chưa có mã vận đơn'}</p><SupportBadge labels={shipmentStates} value={shipment.status} /></div>{shipment.driverName && <p className="text-xs">Người giao: {shipment.driverName} · {shipment.driverPhone}</p>}{shipment.failureReason && <p className="text-xs text-red-700">{shipment.failureReason}</p>}{management && data.actions.canUpdateShipment && shipmentNext[shipment.status]?.length > 0 && <Button size="sm" variant="outline" disabled={busy} onClick={() => start('shipmentStatus', shipment)}>Cập nhật chuyến giao</Button>}</div>)}
        <Link className="inline-block text-xs font-medium text-primary underline" to={management ? `/admin/sales-orders?orderId=${encodeURIComponent(data.replacementOrder.id)}` : `/don-hang/${encodeURIComponent(data.replacementOrder.id)}`}>Xem đơn giao hàng đổi</Link>
      </article>}
      {management && <div className="flex flex-wrap gap-2">{[['canRefund', 'refund', <Banknote size={16} />], ['canCreateReplacement', 'replacement'], ['canPrepareReplacement', 'prepare'], ['canBookShipment', 'book'], ['canComplete', 'complete']].map(([flag, action, icon]) => data.actions[flag] && <Button key={action} size="sm" disabled={busy} onClick={() => start(action)}>{icon}{executionTitles[action]}</Button>)}</div>}
      {data.completedAt && <p className="text-sm font-medium text-primary">Hồ sơ đã hoàn tất lúc {adminDate(data.completedAt, true)}.</p>}
    </>}
    {operation && data && <ExecutionDialog key={`${operation.action}-${operation.target?.id || ''}`} operation={operation} data={data} order={order} onClose={() => setOperation(null)} onSaved={(result) => { changed(result); setOperation(null); }} />}
  </section>;
}

function ExecutionDialog({ operation: { action, target }, data, order, onClose, onSaved }) {
  const online = data.payments.filter((item) => item.canRefundToOriginal), refund = action === 'reconcile' ? target : null, shipment = action === 'shipmentStatus' ? target : null;
  const [values, setValues] = useState(() => ({ note: '', amount: refund?.amount ?? data.remainingRefundAmount, refundMethod: online.length ? 'original_payment' : 'bank_transfer', paymentId: online[0]?.id || '', confirmed: false, referenceCode: '', recipientName: (data.recipient || order)?.receiverName || '', bankName: '', bankAccountNumber: '', bankBranch: '', recipientPhone: '', outcome: 'succeeded', evidenceSource: 'merchant_portal', receiverName: (data.recipient || order)?.receiverName || '', receiverPhone: (data.recipient || order)?.receiverPhone || '', shippingAddress: (data.recipient || order)?.shippingAddress || '', carrier: '', trackingCode: action === 'book' ? createShipmentCode(data.replacementOrder?.shipments || []) : '', driverName: '', driverPhone: '', shippingCost: 0, shipmentStatus: shipmentNext[shipment?.status]?.[0] || '' }));
  const [busy, setBusy] = useState(false), [attempted, setAttempted] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), operationKey = useRef(keyedOperation()), pendingBody = useRef(null);
  const change = (field, value) => setValues((old) => ({ ...old, [field]: value }));
  const text = (field, label, max = 100, type = 'text') => <Field label={label}><Input type={type} value={values[field]} maxLength={max} onChange={(e) => change(field, e.target.value)} /></Field>;
  async function submit(event) {
    event.preventDefault(); if (lock.current) return; setError(''); let body, key;
    try { body = pendingBody.current || executionPayload(action, values, data, refund, shipment); key = operationKey.current.prepare(body); } catch (err) { setError(err.message); return; }
    pendingBody.current = body; lock.current = true; setBusy(true); setAttempted(true);
    try {
      const args = action === 'reconcile' || action === 'shipmentStatus' ? [data.requestId, target.id, body, key] : [data.requestId, body, key];
      const result = await service[action](...args);
      if (action === 'refund' && result.refunds.at(-1)?.status !== 'succeeded') toast.info('Đã ghi nhận yêu cầu hoàn tiền · Chờ xác minh kết quả.', { position: 'top-left' });
      else toast.success(action === 'refund' ? 'Đã ghi nhận hoàn tiền thành công.' : 'Đã cập nhật hồ sơ.', { position: 'top-left' });
      onSaved(result);
    } catch (err) {
      setError(errorMessage(err));
      // A definite validation rejection permits correction; network/5xx retries must keep their original command and key.
      if (err.response?.status >= 400 && err.response.status < 500 && ![408, 429].includes(err.response.status)) { pendingBody.current = null; operationKey.current.clear(); setAttempted(false); }
    } finally { lock.current = false; setBusy(false); }
  }
  const manual = action === 'refund' && values.refundMethod !== 'original_payment';
  return <Modal open title={executionTitles[action]} onOpenChange={(open) => { if (!open && !lock.current) onClose(); }}><form onSubmit={submit} noValidate className="space-y-4"><fieldset disabled={busy || attempted} className="space-y-4">
    {action === 'refund' && <><Field label="Cách hoàn tiền *"><Select value={values.refundMethod} onChange={(e) => { change('refundMethod', e.target.value); change('confirmed', false); }}>{Object.entries(refundMethods).map(([key, label]) => <option key={key} value={key} disabled={key === 'original_payment' && !online.length}>{label}</option>)}</Select></Field>
      <Field label="Số tiền hoàn (₫) *" hint={`Còn được hoàn ${currency(data.remainingRefundAmount)}`} error={!whole(values.amount, 1, data.remainingRefundAmount) ? 'Nhập số nguyên dương, không vượt phần được duyệt còn lại.' : ''}><Input type="number" min={1} step={1} max={data.remainingRefundAmount} value={values.amount} onChange={(e) => change('amount', e.target.value)} /></Field>
      {values.refundMethod === 'original_payment' && <><Field label="Giao dịch VNPay đã thu tiền *"><Select value={values.paymentId} onChange={(e) => change('paymentId', e.target.value)}>{online.map((payment, index) => <option key={payment.id} value={payment.id}>VNPay · {currency(payment.amount)} · Giao dịch {index + 1}</option>)}</Select></Field><p className="text-xs leading-6 text-amber-900">Xác nhận sẽ gửi lệnh hoàn tiền về VNPay. Chỉ ghi nhận đã hoàn khi có kết quả xác minh. Không gửi lại nếu giao dịch đang cần đối soát.</p></>}
      {manual && <><p className="text-xs leading-6 text-amber-900">Hãy thực hiện hoàn tiền trước, sau đó ghi nhận chứng từ tại đây.</p>{text('referenceCode', 'Mã biên nhận / chuyển khoản *', 200)}{values.refundMethod === 'bank_transfer' && <><div className="grid gap-3 sm:grid-cols-2">{text('recipientName', 'Tên chủ tài khoản *')}{text('bankName', 'Ngân hàng *', 200)}</div>{text('bankAccountNumber', 'Số tài khoản *', 34)}<div className="grid gap-3 sm:grid-cols-2">{text('bankBranch', 'Chi nhánh', 200)}{text('recipientPhone', 'Điện thoại nhận hoàn tiền', 20, 'tel')}</div></>}<label className="flex items-start gap-2 text-sm leading-6"><input type="checkbox" checked={values.confirmed} onChange={(e) => change('confirmed', e.target.checked)} className="!mt-1" />Tôi xác nhận đã hoàn tiền thực tế và đã kiểm tra chứng từ.</label></>}
    </>}
    {action === 'reconcile' && <><p className="text-xs leading-6 text-amber-900">Chỉ xác nhận theo giao dịch hoàn tiền riêng đã đối chiếu thực tế. Ghi nhận sai kết quả có thể dẫn đến hoàn tiền hai lần.</p><Field label="Kết quả thực tế *"><Select value={values.outcome} onChange={(e) => change('outcome', e.target.value)}><option value="succeeded">Đã hoàn tiền thành công</option><option value="failed">VNPay xác nhận không hoàn tiền</option></Select></Field><Field label="Căn cứ đối chiếu *"><Select value={values.evidenceSource} onChange={(e) => change('evidenceSource', e.target.value)}><option value="merchant_portal">Cổng quản lý VNPay</option><option value="bank_statement">Sao kê ngân hàng</option></Select></Field><Field label="Số tiền đã đối chiếu (₫) *"><Input type="number" min={1} step={1} value={values.amount} onChange={(e) => change('amount', e.target.value)} /></Field>{text('referenceCode', 'Mã giao dịch hoàn tiền đã đối chiếu *', 200)}<label className="flex items-start gap-2 text-sm leading-6"><input type="checkbox" checked={values.confirmed} onChange={(e) => change('confirmed', e.target.checked)} className="!mt-1" />Tôi đã kiểm tra đúng giao dịch và số tiền.</label></>}
    {action === 'replacement' && <><p className="text-xs leading-6 text-stone-500">Sản phẩm và số lượng lấy theo phương án khách đã đồng ý. Cửa hàng sẽ giữ hàng đủ hạn sử dụng để giao đổi.</p>{text('receiverName', 'Người nhận hàng đổi *')}{text('receiverPhone', 'Số điện thoại *', 20, 'tel')}{text('shippingAddress', 'Địa chỉ nhận hàng đổi *', 500)}</>}
    {action === 'book' && <>{text('carrier', 'Đơn vị giao hàng *')}{text('trackingCode', 'Mã vận chuyển tự động *')}<div className="grid gap-3 sm:grid-cols-2">{text('driverName', 'Người giao hàng')}{text('driverPhone', 'Số điện thoại người giao', 20, 'tel')}</div><Field label="Chi phí vận chuyển cửa hàng chi trả (₫)"><Input type="number" min={0} step={1} value={values.shippingCost} onChange={(e) => change('shippingCost', e.target.value)} /></Field></>}
    {action === 'shipmentStatus' && <Field label="Trạng thái chuyến giao *"><Select value={values.shipmentStatus} onChange={(e) => change('shipmentStatus', e.target.value)}>{shipmentNext[shipment.status].map((value) => <option key={value} value={value}>{shipmentStates[value]}</option>)}</Select></Field>}
    {action === 'complete' && <p className="text-sm leading-7">Xác nhận đã thực hiện đủ tiền hoàn, hàng đổi và xử lý hàng thu hồi theo phương án. Hồ sơ sau khi hoàn tất sẽ lưu vào lịch sử.</p>}
    <Field label="Ghi chú / căn cứ thực hiện *"><Textarea value={values.note} required maxLength={action === 'book' || action === 'shipmentStatus' ? 1000 : 3000} onChange={(e) => change('note', e.target.value)} /></Field>
  </fieldset><SupportError>{error}</SupportError>{attempted && !busy && <p className="text-xs leading-6 text-amber-900">Kết quả chưa rõ. Nút gửi lại giữ nguyên nội dung và mã thao tác để tránh thực hiện trùng; bạn cũng có thể đóng và đối chiếu tiến độ.</p>}<div className="flex justify-end gap-3"><Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : attempted ? 'Gửi lại cùng thao tác' : 'Xác nhận'}</Button></div></form></Modal>;
}
