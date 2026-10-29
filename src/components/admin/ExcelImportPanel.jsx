import { useRef, useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { excelImportService, importAttempt, validateImportFile } from '@/services/admin/fileService';
import { importConfig, importIssueText, importLabels } from '@/lib/excelImports';
import { adminDate } from '@/lib/adminFormat';
import { currency, errorMessage } from '@/lib/utils';
import { ProductCategoryMapping } from './ProductCategoryMapping';
import { ExcelImportContextFields } from './ExcelImportContextFields';
import { validationMessage } from './AdminForm';
import { useResource } from '@/hooks/useResource';
import { allPages, today } from '@/lib/apiData';
import { supplierService } from '@/services/admin/managementService';

const numeric = new Set(['quantity', 'quantityReceived', 'quantityRejected', 'quantityAvailableToReceive', 'sellingPrice', 'unitPrice']);
const price = new Set(['sellingPrice', 'unitPrice']);
const dates = new Set(['expectedDeliveryDate', 'manufactureDate', 'expiryDate']);
const display = (column, value) => !value ? '—' : dates.has(column) ? adminDate(value) : price.has(column) && Number.isFinite(Number(value)) ? currency(Number(value)) : value;

export function ExcelImportPanel({ kind, purchaseOrderId, initialContext = {}, onSaved, onBusyChange, categoriesResource }) {
  const config = importConfig[kind];
  const [file, setFile] = useState(null), [preview, setPreview] = useState(null), [result, setResult] = useState(null);
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [recovering, setRecovering] = useState(false);
  const [context, setContext] = useState(() => Object.fromEntries(Object.entries(initialContext).filter(([, value]) => value !== '' && value != null)));
  const key = useRef(''), lock = useRef(false), fields = useRef(null), checkedContext = useRef(null), retryChecksum = useRef('');
  const suppliers = useResource(() => kind === 'purchase_orders' ? allPages(supplierService.list, { status: 'active' }) : Promise.resolve([]), [kind]);
  const selection = (value = context) => ({ ...value, ...(purchaseOrderId ? { purchaseOrderId } : {}) });
  // Store a digest of the selected context, not the supplier/note/address in sessionStorage.
  const slot = (sha, contextHash) => `${sha}:${contextHash}`;
  const ready = kind === 'purchase_orders' ? !!context.supplierId && !suppliers.loading && !suppliers.error && (!context.expectedDeliveryDate || context.expectedDeliveryDate >= today()) : kind !== 'goods_receipts' || !!purchaseOrderId;
  const show = (column, value, values = {}) => {
    if (column === 'categoryId' && value) {
      const category = categoriesResource?.data?.find((item) => item.id === value);
      return category ? `${category.categoryName} · ${category.categoryCode}` : values.categoryName || (/^[0-9a-f-]{36}$/i.test(value) ? 'Loại sản phẩm đã liên kết' : value);
    }
    if (column === 'originId' && value) return values.originName || 'Xuất xứ đã liên kết';
    if (column === 'brandId' && value) return 'Thương hiệu đã liên kết';
    if (column === 'certificationIds' && value) return `${String(value).split(';').filter(Boolean).length} chứng nhận đã liên kết`;
    return display(column, value);
  };
  function working(value) { lock.current = !!value; setBusy(value); onBusyChange?.(!!value); }
  function validateContext() {
    const invalid = [...(fields.current?.querySelectorAll('input,textarea') || [])].find((control) => control.willValidate && !control.validity.valid);
    if (invalid) { invalid.focus(); throw new Error(validationMessage(invalid)); }
    if (!ready) throw new Error(kind === 'purchase_orders' ? 'Chọn nhà cung cấp đang hoạt động và ngày giao hợp lệ trước khi tiếp tục.' : 'Chọn đơn mua trước khi tiếp tục.');
  }
  function changeContext(next) {
    if (lock.current || recovering || result) return;
    const cleaned = Object.fromEntries(Object.entries(next).filter(([, value]) => value !== '' && value != null));
    if (next.categoryId !== context.categoryId) delete cleaned.categoryAssignments;
    setContext(cleaned); setPreview(null); setError(''); key.current = ''; checkedContext.current = null;
  }
  async function check(next, nextContext = context) {
    const requestContext = selection(nextContext);
    const checked = await excelImportService.preview(kind, next, requestContext);
    if (!checked.contextSha256 || !checked.requestFingerprint) throw new Error('Chưa thể kiểm tra tệp lúc này. Vui lòng tải mẫu mới và thử lại; nếu vẫn gặp lỗi, hãy liên hệ người quản lý.');
    setPreview(checked);
    checkedContext.current = requestContext;
    const pending = importAttempt(kind, slot(checked.fileSha256, checked.requestFingerprint));
    key.current = pending?.key || crypto.randomUUID();
    retryChecksum.current = pending?.contextSha256 || checked.contextSha256;
    setRecovering(!!pending?.key);
  }
  async function template() {
    if (lock.current) return;
    working('template'); setError('');
    try { validateContext(); await excelImportService.template(kind, selection()); }
    catch (e) { setError(errorMessage(e)); }
    finally { working(''); }
  }
  async function read(next) {
    if (!next || lock.current) return;
    setError('');
    try { validateContext(); validateImportFile(next); } catch (e) { setError(e.message); return; }
    const nextContext = { ...context };
    if (next !== file) delete nextContext.categoryAssignments;
    setContext(nextContext);
    setFile(null); setPreview(null); setResult(null); setRecovering(false); key.current = ''; checkedContext.current = null;
    setFile(next); working('preview');
    try {
      await check(next, nextContext);
    } catch (e) { setError(errorMessage(e)); }
    finally { working(''); }
  }
  async function applyCategories(assignments) {
    if (kind !== 'products' || lock.current || recovering || result || !preview || !file) return;
    working('mapping'); setError('');
    try {
      const nextContext = { ...context, categoryAssignments: { ...context.categoryAssignments, ...Object.fromEntries(assignments.map((entry) => [entry.row, entry.categoryId])) } };
      setContext(nextContext); setPreview(null); key.current = '';
      working('preview');
      await check(file, nextContext);
    } catch (err) { setError(errorMessage(err)); }
    finally { working(''); }
  }
  async function confirm() {
    if (lock.current || result || !file || !preview || (!preview.canImport && !recovering)) return;
    try { validateContext(); if (JSON.stringify(checkedContext.current) !== JSON.stringify(selection())) throw new Error('Thông tin chung đã thay đổi. Vui lòng kiểm tra lại file.'); }
    catch (e) { setError(errorMessage(e)); return; }
    working('execute'); setError('');
    const attemptSlot = slot(preview.fileSha256, preview.requestFingerprint);
    importAttempt(kind, attemptSlot, { key: key.current, contextSha256: retryChecksum.current });
    try {
      const saved = await excelImportService.execute(kind, file, preview.fileSha256, key.current, checkedContext.current, retryChecksum.current);
      importAttempt(kind, attemptSlot, null); setResult(saved); setRecovering(false);
      toast.success(kind === 'products' ? `Đã nhập ${saved.products?.length || 0} sản phẩm.` : kind === 'purchase_orders' ? 'Đã tạo đơn mua chờ duyệt.' : 'Đã tạo phiếu nhập nháp, chưa tăng tồn kho.');
      onSaved?.(saved);
    } catch (e) {
      const invalid = e.response?.data?.data;
      if (e.response?.status === 422 && invalid?.errors) { setPreview(invalid); retryChecksum.current = invalid.contextSha256; importAttempt(kind, attemptSlot, null); setRecovering(false); }
      else if (e.response && e.response.status < 500) { importAttempt(kind, attemptSlot, null); setRecovering(false); if (e.response.status === 409) { setPreview(null); checkedContext.current = null; } }
      else setRecovering(true);
      setError(errorMessage(e));
    } finally { working(''); }
  }
  return <section className="space-y-5" aria-label={config.title}>
    <div className="rounded-2xl border border-line bg-cream p-5"><div className="flex items-center gap-2 font-semibold text-primary"><FileSpreadsheet size={21} /><h3>{config.title}</h3></div><p className="!mt-2 text-sm leading-6 text-stone-600">{config.description}</p><p className="!mt-2 text-xs leading-6 text-stone-500">{config.limit} Dùng tệp Excel (.xlsx), dung lượng không quá 5 MB.</p></div>
    <details className="rounded-xl border border-line bg-white px-4 py-3 text-xs leading-6 text-stone-600"><summary className="cursor-pointer font-medium text-primary">Lưu ý khi điền Excel</summary><p className="!mt-2">Điền vào trang tính “Data” theo mẫu đã tải. Giữ nguyên tên và thứ tự cột; nhập số trực tiếp, không dùng công thức. Ngày nên ghi dạng ngày-tháng-năm, ví dụ 29-10-2026.</p></details>
    <div ref={fields}><ExcelImportContextFields kind={kind} value={context} onChange={changeContext} disabled={!!busy || recovering || !!result} suppliers={suppliers} categories={categoriesResource} /></div>
    <div className="rounded-2xl border border-line bg-white p-5"><p className="text-sm font-semibold text-primary">2. Tải mẫu, điền thông tin và chọn file</p>
      <div className="!mt-4 flex flex-wrap items-center gap-3"><Button variant="outline" disabled={!!busy || !ready || recovering || !!result} onClick={template}><Download size={16} />Tải Excel mẫu tiếng Việt</Button><label className={`relative inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary/20 bg-white px-5 py-3 text-sm font-medium text-primary focus-within:ring-2 focus-within:ring-primary ${busy || !ready || recovering || result ? 'cursor-not-allowed opacity-50' : ''}`}><Upload size={16} />Chọn file Excel<input aria-label="Chọn file Excel" type="file" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" disabled={!!busy || !ready || recovering || !!result} accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ''; read(selected); }} /></label>{file && <span className="max-w-full break-words text-xs text-stone-500">{file.name} · {(file.size / 1024).toFixed(1)} KB</span>}</div>
      {kind === 'goods_receipts' && !purchaseOrderId && <p className="!mt-2 text-xs text-stone-500">Chọn đơn mua bên trên để tải mẫu có sẵn các sản phẩm cần đối chiếu.</p>}
    </div>
    {!!busy && <p role="status" className="flex items-center gap-2 text-sm text-primary"><LoaderCircle className="animate-spin" size={17} />{busy === 'preview' ? 'Đang kiểm tra tệp và thông tin đã chọn…' : busy === 'mapping' ? 'Đang bổ sung loại sản phẩm đã chọn…' : busy === 'execute' ? 'Đang xác nhận nhập dữ liệu…' : 'Đang tải mẫu Excel…'}</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {kind === 'products' && preview && !result && <ProductCategoryMapping key={preview.fileSha256} rows={preview.rows} resource={categoriesResource} disabled={!!busy || recovering} onApply={applyCategories} />}
    {recovering && !result && <div role="status" className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Lần nhập trước chưa có kết quả. Bấm «Kiểm tra / thử lại lần nhập trước» để tiếp tục an toàn, tránh nhập trùng. Bạn không cần tạo lại đơn hoặc sửa tệp.</div>}
    {preview && !result && <>
      <div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{preview.rowCount} dòng{kind === 'products' ? ` · ${preview.productCount} sản phẩm` : ''}</strong><span className={preview.canImport ? 'text-primary' : 'text-red-700'}>{preview.canImport ? 'File hợp lệ, sẵn sàng xác nhận' : `File có ${preview.errors?.length || 0} lỗi cần sửa`}</span></div>
      {!!preview.warnings?.length && <ul className="space-y-1 rounded-xl bg-sage p-4 text-xs leading-6 text-primary">{preview.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>}
      {!!preview.errors?.length && <div role="alert" className="max-h-56 overflow-auto rounded-xl border border-red-100 bg-red-50 p-4"><p className="text-sm font-semibold text-red-800">Kiểm tra các dòng sau trong Excel</p><ul className="!mt-2 space-y-2 text-xs leading-5 text-red-700">{preview.errors.map((issue, i) => <li key={i}>Dòng {issue.row}: {importIssueText(issue)}</li>)}</ul></div>}
      {!!preview.rows?.length && <div className="max-h-[360px] overflow-auto rounded-xl border border-line"><table className="data-table"><thead><tr><th>Dòng Excel</th>{config.columns.map((column) => <th key={column} className={numeric.has(column) ? 'numeric' : undefined}>{importLabels[column]}</th>)}<th>Kiểm tra</th></tr></thead><tbody>{preview.rows.map((row) => { const issues = preview.errors?.filter((issue) => issue.row === row.row) || []; return <tr key={row.row}><td>{row.row}</td>{config.columns.map((column) => <td key={column} className={`${numeric.has(column) ? 'numeric ' : ''}max-w-64 whitespace-pre-wrap break-words`}>{show(column, row.values[column], row.values)}</td>)}<td className="min-w-44 text-xs">{issues.length ? <span className="text-red-700">{issues.map(importIssueText).join(' ')}</span> : <span className="text-primary">Hợp lệ</span>}</td></tr>; })}</tbody></table></div>}
      <details className="rounded-xl bg-stone-50 p-3 text-xs"><summary className="cursor-pointer text-stone-500">Xem chi tiết thông tin trong tệp</summary><div className="!mt-3 max-h-64 space-y-3 overflow-auto">{preview.rows?.map((row) => <dl key={row.row} className="space-y-1 border-b border-line pb-3"><dt className="font-semibold">Dòng {row.row}</dt>{Object.entries(row.values).map(([column, value]) => <dd className="break-words" key={column}>{importLabels[column] || column}: {show(column, value, row.values)}</dd>)}</dl>)}</div></details>
    </>}
    {result ? <div role="status" className="flex items-center gap-2 rounded-xl bg-sage p-5 text-primary"><CheckCircle2 size={20} />Đã nhập thành công {result.goodsReceiptCode || result.purchaseOrderCode || `${result.products?.length || 0} sản phẩm`}.</div> : <div className="flex flex-wrap justify-end gap-3">{file && !busy && !recovering && <Button variant="outline" disabled={!ready} onClick={() => read(file)}>Kiểm tra lại file</Button>}<Button disabled={!!busy || !ready || !file || !preview || (!preview.canImport && !recovering)} onClick={confirm}>{recovering ? 'Kiểm tra / thử lại lần nhập trước' : config.action}</Button></div>}
  </section>;
}
