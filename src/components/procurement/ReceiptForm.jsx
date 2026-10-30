import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDateInput, AdminForm } from '@/components/admin/AdminForm';
import { ExcelImportPanel } from '@/components/admin/ExcelImportPanel';
import { ImportMethodSwitch } from '@/components/admin/ImportMethodSwitch';
import { SearchSelect } from '@/components/admin/SearchSelect';
import { adminDate, productMeasure } from '@/lib/adminFormat';
import { receiptLineErrors } from '@/lib/productRules';
import { receiptCandidates } from '@/lib/purchaseWorkflow';
import { fillReceiptBatchCodes } from '@/lib/receiptBatchCodes';
import { applyReceiptOrigins, changeReceiptLine } from '@/lib/receiptDefaults';
import { loadReceiptOrigins } from '@/services/admin/receiptDefaultsService';
import { useResource } from '@/hooks/useResource';
import { allPages, today } from '@/lib/apiData';
import { currency, errorMessage } from '@/lib/utils';
import { receiptLines, receiptPayload } from '@/lib/procurement';
import { goodsReceiptService, purchaseOrderService, inventoryService } from '@/services/admin/procurementService';
import { Notice } from './ProcurementUI';

export function ReceiptForm({ receipt, initialOrderId = '', onClose, onSaved }) {
  const { user } = useAuth();
  const [excel, setExcel] = useState(false);
  const [documentDay] = useState(() => receipt?.receiptDate?.slice(0, 10) || today());
  const [orderId, setOrderId] = useState(receipt?.purchaseOrderId || initialOrderId);
  const [values, setValues] = useState({ purchaseOrderId: '', note: receipt?.note || '', items: [] });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const existingBatches = useResource(() => allPages(inventoryService.batches), []);
  const orders = useResource(() => allPages(purchaseOrderService.list), []);
  const order = useResource(() => orderId ? purchaseOrderService.get(orderId, receipt?.id ? { receiptId: receipt.id } : undefined) : Promise.resolve(null), [orderId, receipt?.id]);
  const productIds = [...new Set((order.data?.id === orderId ? order.data.items || [] : []).map((item) => item.variant?.productId).filter(Boolean))].sort().join(',');
  const origins = useResource(async () => ({ orderId, ...await loadReceiptOrigins(order.data?.id === orderId ? order.data.items : []) }), [orderId, productIds]);
  useEffect(() => {
    if (order.data?.id === orderId && !order.loading && !order.error) setValues((old) => ({ ...old, purchaseOrderId: orderId, items: receiptLines(order.data, receipt, documentDay) }));
  }, [orderId, order.data, order.loading, order.error, receipt, documentDay]);
  useEffect(() => {
    if (origins.loading || origins.data?.orderId !== orderId) return;
    setValues((old) => {
      if (old.purchaseOrderId !== orderId) return old;
      const items = applyReceiptOrigins(old.items, origins.data.byProductId);
      return items === old.items ? old : { ...old, items };
    });
  }, [values.items, orderId, origins.loading, origins.data]);
  useEffect(() => {
    if (existingBatches.loading || existingBatches.error) return;
    setValues((old) => {
      const items = fillReceiptBatchCodes(old.items, existingBatches.data || []);
      return items === old.items ? old : { ...old, items };
    });
  }, [values.items, existingBatches.loading, existingBatches.error, existingBatches.data]);
  const editableOrder = order.data && receiptCandidates([order.data], receipt).length > 0;
  const ready = orderId && !order.loading && !order.error && editableOrder && values.purchaseOrderId === orderId;
  function line(index, key, value) { setValues((old) => ({ ...old, items: old.items.map((item, i) => i === index ? changeReceiptLine(item, key, value) : item) })); }
  async function save(event) {
    event.preventDefault(); setError('');
    try {
      if (origins.loading) throw new Error('Đang lấy xuất xứ sản phẩm. Vui lòng đợi trong giây lát.');
      for (const [index, item] of values.items.entries()) { const problems = errorsFor(item, index); if (Object.keys(problems).length) throw new Error(`${item.variant?.productName || 'Sản phẩm'} · ${item.variant?.variantName || ''}: ${Object.values(problems)[0]}`); }
      const payload = receiptPayload(values); setBusy(true); await goodsReceiptService.save(receipt?.id, payload); toast.success('Đã lưu bản nháp. Gửi duyệt để đề nghị nhập kho.'); onSaved(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  function errorsFor(item, index) {
    const errors = receiptLineErrors(item, today());
    if (Number(item.quantityReceived) > 0 && item.batchCode.trim()) {
      const code = item.batchCode.trim().toLowerCase();
      const duplicate = values.items.some((row, i) => i !== index && Number(row.quantityReceived) > 0 && row.batchCode.trim().toLowerCase() === code);
      const savedBatch = receipt?.items.find((row) => row.purchaseOrderDetailId === item.purchaseOrderDetailId)?.batch;
      const used = existingBatches.data?.some((row) => row.batchCode.toLowerCase() === code && row.id !== savedBatch?.id);
      if (duplicate || used) errors.batchCode = 'Mã lô đã tồn tại hoặc trùng trong phiếu này.';
    }
    return errors;
  }
  return <Modal open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={receipt ? `Sửa ${receipt.receiptCode}` : 'Lập phiếu nhập'} description="Đối chiếu đủ từng dòng của đơn đặt mua trước khi gửi duyệt." className="procurement-modal !max-w-[1000px]">
    <Notice>Lưu nháp chưa cộng tồn kho. Chỉ số lượng đạt chất lượng được nhập kho sau khi Admin duyệt.</Notice>
    {!receipt && <ImportMethodSwitch excel={excel} onChange={setExcel} disabled={busy} />}
    {excel ? <div className="space-y-5"><Field label="Đơn mua để nhập hàng bằng Excel"><SearchSelect aria-label="Đơn mua để nhập hàng bằng Excel" disabled={busy || orders.loading} value={orderId} options={receiptCandidates(orders.data || []).map((row) => ({ value: row.id, label: `${row.orderCode} · ${row.supplier.supplierName}` }))} onChange={setOrderId} /></Field><ResourceState loading={orders.loading} error={orders.error} onRetry={orders.reload} /><ExcelImportPanel key={orderId} kind="goods_receipts" purchaseOrderId={orderId} initialContext={{ note: values.note }} onSaved={onSaved} onBusyChange={setBusy} /></div> : <AdminForm onSubmit={save}><fieldset disabled={busy} className="min-w-0 space-y-5">
      <div className="document-info"><span>Ngày lập: <strong>{adminDate(documentDay)}</strong></span><span>Người lập: <strong>{receipt?.receivedByEmployee?.fullName || user.fullName || user.username}</strong></span></div>
      <Field label="Đơn mua đã duyệt / giao một phần, còn hàng cần nhận *"><SearchSelect required aria-label="Đơn đặt mua đã duyệt" disabled={!!receipt || orders.loading} value={orderId} options={receiptCandidates([...(orders.data || []), ...(order.data?.id && !orders.data?.some((row) => row.id === order.data.id) ? [order.data] : [])], receipt).map((row) => ({ value: row.id, label: `${row.orderCode} · ${row.supplier.supplierName}` }))} onChange={(id) => { setOrderId(id); setValues((old) => ({ ...old, purchaseOrderId: '', items: [] })); }} /></Field>
      {!orders.loading && !orders.error && !receipt && !receiptCandidates(orders.data || []).length && <p className="form-note">Chưa có đơn mua đã duyệt còn chờ nhập. Hãy lập và duyệt Đơn mua trước.</p>}
      {order.data?.expectedDeliveryDate && <p className="text-xs text-stone-500">Ngày giao dự kiến: <strong>{adminDate(order.data.expectedDeliveryDate)}</strong></p>}
      <ResourceState loading={existingBatches.loading} error={existingBatches.error} onRetry={existingBatches.reload} />
      <ResourceState loading={orders.loading || (!!orderId && order.loading)} error={orders.error || order.error} onRetry={() => { orders.reload(); order.reload(); }} />
      {ready && <ResourceState loading={origins.loading} error={origins.error} onRetry={origins.reload} />}
      {ready && !origins.loading && origins.data?.orderId === orderId && origins.data.failed.length > 0 && <div className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900"><p>Chưa tải được xuất xứ của {origins.data.failed.join(', ')}. Bạn có thể thử lại hoặc nhập nguồn gốc trên nhãn hàng.</p><Button size="sm" variant="outline" onClick={origins.reload}>Tải lại xuất xứ</Button></div>}
      {orderId && !order.loading && !order.error && order.data && !editableOrder && <p role="alert" className="form-error">Đơn đã kết thúc hoặc số còn lại đang nằm trong phiếu chờ duyệt. Vui lòng tải lại tiến độ và xử lý các phiếu đang mở.</p>}
      {ready && values.items.map((item, index) => {
        const inline = errorsFor(item, index);
        const capacity = Number(item.quantityAvailableToReceive ?? item.quantityOrdered);
        const missing = capacity - Number(item.quantityReceived || 0) - Number(item.quantityRejected || 0);
        return <section key={item.purchaseOrderDetailId} className="space-y-4 rounded-2xl border border-[#e5e8df] p-5">
          <div><h3 className="!text-base !font-semibold">{item.variant.productName} · {item.variant.variantName}</h3><p className="!mt-1 text-xs text-stone-500">Đơn vị: {item.variant.variantName} · Trọng lượng: {productMeasure(item.variant)} · Đặt: {item.quantityOrdered} · Đã duyệt nhập: {item.quantityReceivedPreviously} · Còn được nhận đợt này: {capacity} · Giá mua: {currency(item.unitPrice)}</p></div>
          {capacity === 0 && Number(item.quantityReceived) === 0 && Number(item.quantityRejected) === 0 ? <p className="text-sm text-stone-500">Sản phẩm này đã nhận đủ hoặc đang được giữ trong phiếu khác. Đợt này ghi nhận 0.</p> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Field error={inline.quantityReceived} label="Số lượng đạt"><Input aria-label={`Số lượng đạt: ${item.variant.productName} ${item.variant.variantName}`} type="number" required min="0" max={capacity} step="1" value={item.quantityReceived} onChange={(e) => line(index, 'quantityReceived', e.target.value)} /></Field><Field error={inline.quantityRejected} label="Số lượng bị loại"><Input aria-label={`Số lượng bị loại: ${item.variant.productName} ${item.variant.variantName}`} type="number" required min="0" max={capacity} step="1" value={item.quantityRejected} onChange={(e) => line(index, 'quantityRejected', e.target.value)} /></Field><div className="rounded-xl bg-stone-50 p-3 text-sm"><span className="text-stone-500">Chưa giao trong đợt này</span><strong className={`block !mt-2 ${missing < 0 ? 'text-red-700' : ''}`}>{missing} gói/hộp</strong></div></div>}
          {Number(item.quantityReceived) < capacity && <Field error={inline.discrepancyReason} label="Lý do chênh lệch (bắt buộc)"><Textarea required maxLength={1000} placeholder="Hàng hỏng, thiếu… và nội dung đã thống nhất với nhà cung cấp" value={item.discrepancyReason} onChange={(e) => line(index, 'discrepancyReason', e.target.value)} /></Field>}
          {Number(item.quantityReceived) > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" error={inline.batchCode} label="Mã lô tự động" hint="Mã được điền sẵn theo ngày và mã hàng; mã đã lưu được giữ nguyên."><Input required readOnly maxLength={100} value={item.batchCode} placeholder="Đang cấp mã lô…" /></Field>
            <Field error={inline.manufactureDate} label="Ngày sản xuất" hint="Điền sẵn ngày lập phiếu; bạn có thể chọn lại."><AdminDateInput max={today()} value={item.manufactureDate} onChange={(e) => line(index, 'manufactureDate', e.target.value)} /></Field>
            <Field error={inline.expiryDate} label="Hạn sử dụng" hint="Gợi ý 10 ngày từ ngày sản xuất. Có thể sửa theo nhãn hàng."><AdminDateInput required min={today()} value={item.expiryDate} onChange={(e) => line(index, 'expiryDate', e.target.value)} /></Field>
            <Field className="sm:col-span-2" label="Nguồn gốc / xuất xứ" hint={origins.loading ? 'Đang lấy xuất xứ từ hồ sơ sản phẩm…' : 'Điền từ hồ sơ sản phẩm. Chỉnh sửa tại đây chỉ áp dụng cho lô nhập này.'}><Input maxLength={500} value={item.originDescription} onChange={(e) => line(index, 'originDescription', e.target.value)} placeholder="Xuất xứ trên hồ sơ sản phẩm hoặc nhãn hàng" /></Field>
          </div>}
        </section>;
      })}
      <Field label="Ghi chú phiếu"><Textarea maxLength={5000} value={values.note} onChange={(e) => setValues((old) => ({ ...old, note: e.target.value }))} /></Field>
      {error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" onClick={onClose}>Đóng</Button><Button type="submit" disabled={!ready || existingBatches.loading || !!existingBatches.error || origins.loading}>{busy ? 'Đang lưu…' : 'Lưu phiếu nháp'}</Button></div>
    </fieldset></AdminForm>}
  </Modal>;
}
