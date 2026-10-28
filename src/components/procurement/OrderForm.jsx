import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
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
import { convertPurchaseQuantity } from '@/lib/purchaseWorkflow';
import { orderPayload } from '@/lib/procurement';
import { supplierService } from '@/services/admin/managementService';
import { supplierProducts } from '@/services/admin/supplierCatalogService';
import { inventoryService, purchaseOrderService } from '@/services/admin/procurementService';
import { Notice } from './ProcurementUI';

const emptyLine = () => ({ variantId: '', quantity: 1, unitPrice: '', container: false, factor: 1 });
export function OrderForm({ order, onClose, onSaved }) {
  const { user } = useAuth();
  const [excel, setExcel] = useState(false);
  const [values, setValues] = useState({ supplierId: order?.supplier?.id || '', expectedDeliveryDate: order?.expectedDeliveryDate || '', note: order?.note || '', items: order?.items.map((line) => ({ variantId: line.variant.id, quantity: line.quantityOrdered, unitPrice: line.unitPrice, variant: line.variant })) || [] });
  const [entry, setEntry] = useState(emptyLine), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const options = useResource(async () => {
    const [suppliers, stocks] = await Promise.all([allPages(supplierService.list, { status: 'active' }), allPages(inventoryService.list)]);
    return { suppliers, variants: stocks.map((stock) => stock.variant) };
  }, []);
  const source = useResource(() => supplierProducts(values.supplierId), [values.supplierId]);
  const allowed = new Set(source.data?.map((product) => product.id) || []);
  const field = (key, value) => setValues((old) => ({ ...old, [key]: value }));
  const available = options.data?.variants.filter((variant) => allowed.has(variant.productId) && !values.items.some((line) => line.variantId === variant.id)) || [];
  const productOptions = available.map((variant) => ({ value: variant.id, label: `${variant.productName} · ${variant.variantName}`, search: variant.sku }));
  function add() {
    try {
      const quantity = convertPurchaseQuantity(entry.quantity, entry.container ? entry.factor : 1);
      const added = { ...entry, quantity, conversion: entry.container ? `${entry.quantity} thùng × ${entry.factor} gói = ${quantity} gói` : '' };
      orderPayload({ ...values, items: [...values.items, added] });
      const variant = available.find((row) => row.id === entry.variantId);
      if (!variant) throw new Error('Chọn sản phẩm thuộc nhà cung cấp đã chọn.');
      field('items', [...values.items, { ...added, variant }]); setEntry(emptyLine()); setError('');
    } catch (e) { setError(e.message); }
  }
  function line(index, key, value) { field('items', values.items.map((item, i) => i === index ? { ...item, [key]: value, conversion: key === 'quantity' ? '' : item.conversion } : item)); }
  async function save(event) {
    event.preventDefault(); setError('');
    if (entry.variantId) { setError('Bấm Thêm sản phẩm để đưa dòng đang nhập vào đơn trước khi lưu.'); return; }
    try { const converted = values.items.filter((item) => item.conversion).map((item) => `${item.variant.productName}: ${item.conversion}`).join('; ');
      const payload = orderPayload({ ...values, note: [values.note, converted && `Quy đổi khi đặt: ${converted}`].filter(Boolean).join('\n') });
      if ((payload.note?.length || 0) > 5000) throw new Error('Ghi chú và quy đổi tối đa 5.000 ký tự.'); setBusy(true); await purchaseOrderService.save(order?.id, payload); toast.success('Đã lưu đơn chờ duyệt.'); onSaved(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <Modal open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={order ? `Sửa ${order.orderCode}` : 'Lập đơn đặt mua'} description="Chọn nhà cung cấp, nhập nhanh sản phẩm rồi đối chiếu trong một bảng chi tiết." className="procurement-modal !max-w-[1100px]">
    {!order && <ImportMethodSwitch excel={excel} onChange={setExcel} disabled={busy} />}
    {excel ? <ExcelImportPanel kind="purchase_orders" initialContext={{ supplierId: values.supplierId, expectedDeliveryDate: values.expectedDeliveryDate, note: values.note }} onSaved={onSaved} onBusyChange={setBusy} /> : <><ResourceState loading={options.loading} error={options.error} onRetry={options.reload} />
    {!options.loading && !options.error && <AdminForm onSubmit={save}><fieldset disabled={busy} className="min-w-0 space-y-5">
      <div className="document-info"><span>Ngày lập: <strong>{adminDate(order?.orderDate || today())}</strong></span><span>Người lập: <strong>{order?.createdByEmployee?.fullName || user.fullName || user.username}</strong></span></div>
      {order && <Notice>Sửa đơn đã duyệt sẽ đưa đơn về chờ duyệt lại. Đơn đã có phiếu nhập không được sửa.</Notice>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Nhà cung cấp *" hint={values.items.length ? 'Xóa các dòng sản phẩm trước khi đổi nhà cung cấp.' : undefined}><SearchSelect required aria-label="Nhà cung cấp" disabled={values.items.length > 0} options={options.data.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.supplierName }))} value={values.supplierId} onChange={(id) => field('supplierId', id)} /></Field><Field label="Ngày giao dự kiến"><AdminDateInput min={today()} value={values.expectedDeliveryDate} onChange={(e) => field('expectedDeliveryDate', e.target.value)} /></Field></div>
      <ResourceState loading={!!values.supplierId && source.loading} error={source.error} onRetry={source.reload} />
      <div className="rounded-2xl border border-line bg-cream p-4"><div className="quick-entry"><Field label="Sản phẩm"><SearchSelect aria-label="Sản phẩm nhập nhanh" placeholder="Tìm tên sản phẩm…" disabled={!values.supplierId || source.loading || !!source.error} options={productOptions} value={entry.variantId} onChange={(variantId) => setEntry((old) => ({ ...old, variantId }))} /></Field><Field label="Số lượng"><Input aria-label="Số lượng nhập nhanh" type="number" min="1" max="99999999999" step="1" value={entry.quantity} onChange={(e) => setEntry((old) => ({ ...old, quantity: e.target.value }))} /></Field><Field label="Giá nhập / gói, hộp (₫)"><Input aria-label="Giá nhập nhanh" type="number" min="0.01" max="999999999999.99" step="0.01" value={entry.unitPrice} onChange={(e) => setEntry((old) => ({ ...old, unitPrice: e.target.value }))} /></Field><Button type="button" disabled={values.items.length >= 100 || !entry.variantId} onClick={add}><Plus size={16} />Thêm sản phẩm</Button></div><div className="!mt-4 grid items-end gap-3 sm:grid-cols-3"><Field label="Đơn vị đặt"><Select value={entry.container ? 'carton' : 'base'} onChange={(e) => setEntry((old) => ({ ...old, container: e.target.value === 'carton' }))}><option value="base">Theo gói / hộp sản phẩm</option><option value="carton">Theo thùng</option></Select></Field>{entry.container && <><Field label="Số gói / hộp trong 1 thùng"><Input required type="number" min="1" max="1000000" step="1" value={entry.factor} onChange={(e) => setEntry((old) => ({ ...old, factor: e.target.value }))} /></Field><p className="pb-3 text-xs text-stone-500">{Number(entry.quantity) > 0 && Number(entry.factor) > 0 ? `${entry.quantity} thùng × ${entry.factor} = ${Number(entry.quantity) * Number(entry.factor)} gói / hộp. Giá nhập phía trên tính cho 1 gói / hộp.` : 'Nhập số lượng và hệ số quy đổi hợp lệ.'}</p></>}</div>{values.supplierId && !source.loading && !source.error && !source.data?.length && <p className="!mt-3 text-xs text-amber-800">Nhà cung cấp chưa có sản phẩm liên kết qua xuất xứ. Cập nhật liên kết tại Truy xuất sản phẩm trước khi nhập đơn.</p>}</div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>STT</th><th>Sản phẩm</th><th>Đơn vị tính</th><th className="numeric">Trọng lượng / dung tích</th><th className="numeric">Số lượng</th><th className="numeric">Giá nhập (₫)</th><th className="numeric">Thành tiền</th><th /></tr></thead><tbody>{values.items.map((item, index) => <tr key={item.variantId}><td>{index + 1}</td><td><strong>{item.variant?.productName}</strong><small>{item.variant?.variantName}</small>{item.conversion && <small>{item.conversion}</small>}</td><td>{item.variant?.variantName || 'Gói / hộp'}</td><td className="numeric">{productMeasure(item.variant)}</td><td className="numeric"><Field label={`Số lượng dòng ${index + 1}`} className="[&>span]:sr-only"><Input aria-label={`Số lượng dòng ${index + 1}`} className="!w-24 text-right" required type="number" min="1" max="99999999999" step="1" value={item.quantity} onChange={(e) => line(index, 'quantity', e.target.value)} /></Field></td><td className="numeric"><Field label={`Giá nhập dòng ${index + 1}`} className="[&>span]:sr-only"><Input aria-label={`Giá nhập dòng ${index + 1}`} className="!w-32 text-right" required type="number" min="0.01" max="999999999999.99" step="0.01" value={item.unitPrice} onChange={(e) => line(index, 'unitPrice', e.target.value)} /></Field></td><td className="numeric">{currency(Number(item.quantity) * Number(item.unitPrice))}</td><td><Button type="button" variant="ghost" size="icon" aria-label={`Xóa dòng ${index + 1}`} onClick={() => field('items', values.items.filter((_, i) => i !== index))}><Trash2 size={16} /></Button></td></tr>)}</tbody></table>{!values.items.length && <p className="p-6 text-center text-sm text-stone-500">Thêm sản phẩm từ dòng nhập nhanh bên trên.</p>}</div>
      <Field label="Ghi chú"><Textarea maxLength={5000} value={values.note} onChange={(e) => field('note', e.target.value)} /></Field><div className="flex justify-between rounded-xl bg-sage p-4"><span>Tổng giá nhập</span><strong>{currency(values.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0))}</strong></div>
      {error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" onClick={onClose}>Đóng</Button><Button type="submit">{busy ? 'Đang lưu…' : 'Lưu & chờ duyệt'}</Button></div>
    </fieldset></AdminForm>}</>}
  </Modal>;
}
