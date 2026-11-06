import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { AdminDateInput, AdminForm } from '@/components/admin/AdminForm';
import { ExcelImportPanel } from '@/components/admin/ExcelImportPanel';
import { ImportMethodSwitch } from '@/components/admin/ImportMethodSwitch';
import { SearchSelect } from '@/components/admin/SearchSelect';
import { useResource } from '@/hooks/useResource';
import { allPages, today } from '@/lib/apiData';
import { adminDate, productMeasure } from '@/lib/adminFormat';
import { currency, errorMessage } from '@/lib/utils';
import { purchaseUnits, inferPurchaseUnit, purchaseUnit, purchaseMoney, purchaseProductChoices } from '@/lib/purchaseDocuments';
import { DocumentReview, DocumentIdentity, DocumentNumberInput } from './DocumentReview';
import { excelImportService } from '@/services/admin/fileService';
import { orderPayload } from '@/lib/procurement';
import { supplierService } from '@/services/admin/managementService';
import { purchaseOrderService } from '@/services/admin/procurementService';
import { Notice } from './ProcurementUI';

const emptyLine = () => ({ variantId: '', quantity: 1, unitPrice: '', purchaseUnit: 'gói' });
export function OrderForm({ order, onClose, onSaved }) {
  const { user } = useAuth();
  const [excel, setExcel] = useState(false);
  const [review, setReview] = useState(null);
  const [documentTime] = useState(() => order?.orderDate || new Date().toISOString());
  const code = useResource(() => order ? Promise.resolve({ code: order.orderCode }) : purchaseOrderService.nextCode(), [order?.id]);
  const creator = order?.createdByEmployee?.fullName || user.fullName || user.username;
  const [values, setValues] = useState({ supplierId: order?.supplier?.id || '', expectedDeliveryDate: order?.expectedDeliveryDate || '', note: order?.note || '', items: order?.items.map((line) => ({ variantId: line.variant.id, quantity: line.quantityOrdered, unitPrice: line.unitPrice, purchaseUnit: purchaseUnit(line), variant: line.variant })) || [] });
  const [entry, setEntry] = useState(emptyLine), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const options = useResource(async () => ({ suppliers: await allPages(supplierService.list, { status: 'active' }) }), []);
  const source = useResource(async () => ({ supplierId: values.supplierId, items: values.supplierId ? await allPages((params) => purchaseOrderService.productOptions(values.supplierId, params)) : [] }), [values.supplierId]);
  const field = (key, value) => setValues((old) => ({ ...old, [key]: value }));
  const available = purchaseProductChoices(source.data?.supplierId === values.supplierId ? source.data.items : [], values.items.map((line) => line.variantId));
  const productOptions = available.map((variant) => ({ value: variant.id, label: `${variant.productName} · ${variant.variantName}`, search: variant.sku, group: variant.purchasedBefore ? 'Đã mua từ nhà cung cấp' : 'Chưa mua từ nhà cung cấp' }));
  function add() {
    try {
      const added = { ...entry };
      orderPayload({ ...values, items: [...values.items, added] });
      const variant = available.find((row) => row.id === entry.variantId);
      if (!variant) throw new Error('Chọn sản phẩm đang hoạt động trong danh sách.');
      field('items', [...values.items, { ...added, variant }]); setEntry(emptyLine()); setError('');
    } catch (e) { setError(e.message); }
  }
  function line(index, key, value) { field('items', values.items.map((item, i) => i === index ? { ...item, [key]: value } : item)); }
  async function save(event) {
    event.preventDefault(); setError('');
    if (entry.variantId) { setError('Bấm Thêm sản phẩm để đưa dòng đang nhập vào đơn trước khi lưu.'); return; }
    try { setReview(orderPayload(values)); }
    catch (err) { setError(errorMessage(err)); }
  }
  async function confirmSave() {
    if (busy || !review) return;
    setBusy(true); setError('');
    try { await purchaseOrderService.save(order?.id, review); toast.success('Đã lưu đơn chờ duyệt.'); onSaved(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function template() {
    if (!values.supplierId) { setError('Chọn nhà cung cấp trước khi tải mẫu.'); return; }
    setBusy(true); setError('');
    try { await excelImportService.template('purchase_orders', { supplierId: values.supplierId }); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <Modal open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={order ? `Sửa ${order.orderCode}` : 'Lập đơn đặt mua'} description="Chọn nhà cung cấp, nhập nhanh sản phẩm rồi đối chiếu trong một bảng chi tiết." className="procurement-modal !max-w-[1440px] !w-[96vw]">
    {review ? <DocumentReview code={code.data?.code} creator={creator} date={documentTime} supplier={options.data?.suppliers.find((s) => s.id === values.supplierId)?.supplierName} deliveryDate={values.expectedDeliveryDate} note={values.note} items={values.items} busy={busy} error={error} onBack={() => { setReview(null); setError(''); }} onConfirm={confirmSave} /> : <>
    <DocumentIdentity code={code.data?.code} creator={creator} date={documentTime} saved={!!order} />
    {code.error && <ResourceState error={code.error} onRetry={code.reload} />}
    {!order && <ImportMethodSwitch excel={excel} onChange={setExcel} disabled={busy} />}
    {excel ? <ExcelImportPanel kind="purchase_orders" initialContext={{ supplierId: values.supplierId, expectedDeliveryDate: values.expectedDeliveryDate, note: values.note }} onSaved={onSaved} onBusyChange={setBusy} /> : <><ResourceState loading={options.loading} error={options.error} onRetry={options.reload} />
    {!options.loading && !options.error && <AdminForm onSubmit={save}><fieldset disabled={busy} className="min-w-0 space-y-5">
      {order && <Notice>Sửa đơn đã duyệt sẽ đưa đơn về chờ duyệt lại. Đơn đã có phiếu nhập không được sửa.</Notice>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Nhà cung cấp *" hint={values.items.length ? 'Xóa các dòng sản phẩm trước khi đổi nhà cung cấp.' : undefined}><SearchSelect required aria-label="Nhà cung cấp" disabled={values.items.length > 0} options={options.data.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.supplierName }))} value={values.supplierId} onChange={(id) => { field('supplierId', id); setEntry(emptyLine()); setError(''); }} /></Field><Field label="Ngày giao dự kiến"><AdminDateInput min={today()} value={values.expectedDeliveryDate} onChange={(e) => field('expectedDeliveryDate', e.target.value)} /></Field></div>
      <ResourceState loading={!!values.supplierId && source.loading} error={source.error} onRetry={source.reload} />
      <div className="rounded-2xl border border-line bg-cream p-4 space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,2fr)_140px_150px_180px_auto] items-end">
          <Field label="Sản phẩm"><SearchSelect aria-label="Sản phẩm nhập nhanh" placeholder="Tìm tên sản phẩm…" disabled={!values.supplierId || source.loading || !!source.error} options={productOptions} value={entry.variantId} onChange={(variantId) => setEntry((old) => ({ ...old, variantId, purchaseUnit: available.find((v) => v.id === variantId)?.purchaseUnit || inferPurchaseUnit(available.find((v) => v.id === variantId)) }))} /></Field>
          <Field label="Đơn vị tính"><select className="input purchase-unit-select" aria-label="Đơn vị tính nhập nhanh" value={entry.purchaseUnit} onChange={(e) => setEntry((old) => ({ ...old, purchaseUnit: e.target.value }))}>{purchaseUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></Field>
          <Field label="Số lượng"><DocumentNumberInput aria-label="Số lượng nhập nhanh" value={entry.quantity} onChange={(quantity) => setEntry((old) => ({ ...old, quantity }))} /></Field>
          <Field label="Giá nhập (VNĐ)"><DocumentNumberInput aria-label="Giá nhập nhanh" scale={2} value={entry.unitPrice} onChange={(unitPrice) => setEntry((old) => ({ ...old, unitPrice }))} /></Field>
          <Button type="button" disabled={values.items.length >= 100 || !entry.variantId} onClick={add}><Plus size={16} />Thêm sản phẩm</Button>
        </div>
        <p className="text-xs text-stone-500">Số lượng và giá nhập theo đơn vị đã chọn. Hệ thống không quy đổi đơn vị.</p><p className="text-xs text-stone-500">Ưu tiên sản phẩm đã mua; nhóm chưa mua gồm các sản phẩm còn lại trong hệ thống. Có thể tìm theo tên, mã hàng hoặc “chưa mua”.</p>
        <Button type="button" variant="outline" disabled={!values.supplierId || busy} onClick={template}>Tải mẫu Excel đặt mua</Button>
        {values.supplierId && !source.loading && !source.error && !source.data?.items?.length && <p className="text-xs text-amber-800">Chưa có sản phẩm đang hoạt động để lập đơn mua.</p>}
      </div>
      <div className="table-scroll"><table className="data-table purchase-entry-table"><colgroup><col style={{ width: '4%' }} /><col style={{ width: '24%' }} /><col style={{ width: '10%' }} /><col style={{ width: '14%' }} /><col style={{ width: '12%' }} /><col style={{ width: '15%' }} /><col style={{ width: '16%' }} /><col style={{ width: '5%' }} /></colgroup><thead><tr><th>STT</th><th>Sản phẩm</th><th>Đơn vị tính</th><th className="purchase-cell">Trọng lượng / dung tích</th><th className="purchase-cell">Số lượng</th><th className="purchase-cell">Giá nhập (VNĐ)</th><th className="purchase-cell">Thành tiền (VNĐ)</th><th /></tr></thead><tbody>{values.items.map((item, index) => <tr key={item.variantId}><td>{index + 1}</td><td><strong>{item.variant?.productName}</strong><small>{item.variant?.variantName}</small></td><td><select className="input purchase-unit-select" aria-label={`Đơn vị tính dòng ${index + 1}`} value={item.purchaseUnit} onChange={(e) => line(index, 'purchaseUnit', e.target.value)}>{purchaseUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></td><td className="purchase-cell">{productMeasure(item.variant)}</td><td className="purchase-cell"><Field label={`Số lượng dòng ${index + 1}`} className="[&>span]:sr-only"><DocumentNumberInput aria-label={`Số lượng dòng ${index + 1}`} className="w-full text-left" required value={item.quantity} onChange={(value) => line(index, 'quantity', value)} /></Field></td><td className="purchase-cell"><Field label={`Giá nhập dòng ${index + 1}`} className="[&>span]:sr-only"><DocumentNumberInput aria-label={`Giá nhập dòng ${index + 1}`} className="w-full text-left" scale={2} required value={item.unitPrice} onChange={(value) => line(index, 'unitPrice', value)} /></Field></td><td className="purchase-cell">{purchaseMoney(Number(item.quantity) * Number(item.unitPrice))}</td><td><Button type="button" variant="ghost" size="icon" aria-label={`Xóa dòng ${index + 1}`} onClick={() => field('items', values.items.filter((_, i) => i !== index))}><Trash2 size={16} /></Button></td></tr>)}</tbody></table>{!values.items.length && <p className="p-6 text-center text-sm text-stone-500">Thêm sản phẩm từ dòng nhập nhanh bên trên.</p>}</div>
      <Field label="Ghi chú"><Textarea maxLength={5000} value={values.note} onChange={(e) => field('note', e.target.value)} /></Field><div className="flex justify-between rounded-xl bg-sage p-4"><span>Tổng giá nhập</span><strong>{purchaseMoney(values.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0))}</strong></div>
      {error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" onClick={onClose}>Đóng</Button><Button type="submit">{busy ? 'Đang lưu…' : 'Xem lại đơn mua'}</Button></div>
    </fieldset></AdminForm>}</>}</>}
  </Modal>;
}
