import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { FileDown, Leaf, LoaderCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminDate } from '@/lib/adminFormat';
import { cn } from '@/lib/utils';
import { DottedField, OrganicPrintLogo } from './PrintFormPrimitives';
import './print-forms.css';
export { DottedField, DottedNotes, PrintCheckbox } from './PrintFormPrimitives';

const PRINT_ROOT = 'organic-print-root';
const disclaimer = 'CHỨNG TỪ NỘI BỘ — KIỂM TRA THÔNG TIN TRƯỚC KHI KÝ XÁC NHẬN';
const defaultSignatures = [{ title: 'Người lập phiếu' }, { title: 'Người kiểm nhận' }, { title: 'Quản lý xác nhận' }];

export const printDate = (value) => {
  const dayFirst = typeof value === 'string' && /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return adminDate(dayFirst ? `${dayFirst[3]}-${dayFirst[2]}-${dayFirst[1]}` : value).replaceAll('-', '/');
};
export function printNumber(value, fractionDigits = 0) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return '—';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: fractionDigits }).format(Number(value));
}

function clearPrintCopy(owner) {
  const root = document.getElementById(PRINT_ROOT);
  if (owner && root?.dataset.owner !== owner) return;
  root?.remove(); document.body.classList.remove('organic-print-active');
}

// A body-level static copy avoids clipping by Admin/dialog scrolling containers,
// transforms and responsive layouts. The React preview stays in its original place.
function preparePrintCopy(sheet, owner) {
  clearPrintCopy();
  const root = document.createElement('div'); root.id = PRINT_ROOT; root.dataset.owner = owner;
  const copy = sheet.cloneNode(true);
  copy.removeAttribute('data-print-form');
  copy.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  copy.querySelectorAll('[data-print-hide]').forEach((node) => node.remove());
  root.append(copy); document.body.append(root); document.body.classList.add('organic-print-active');
}

async function readyToPrint(sheet) {
  const images = [...sheet.querySelectorAll('img')].filter((image) => !image.complete);
  const cleanups = [];
  const imagesReady = Promise.all(images.map((image) => new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true });
    cleanups.push(() => { image.removeEventListener('load', resolve); image.removeEventListener('error', resolve); });
  })));
  // Do not block printing indefinitely when a remote font/image is unavailable.
  let timer;
  try { await Promise.race([Promise.all([document.fonts?.ready, imagesReady]), new Promise((resolve) => { timer = setTimeout(resolve, 5000); })]); }
  finally { clearTimeout(timer); cleanups.forEach((cleanup) => cleanup()); }
}

export function PrintFormSection({ title, children, className, keepTogether = false }) {
  return <section className={cn('print-form-section border border-[#689F75] bg-white', keepTogether && 'print-keep-together', className)}>
    {title && <h2 className="print-form-section-title bg-[#DCEAD6] text-[#1B4D2E]">{title}</h2>}
    <div className="print-form-section-body">{children}</div>
  </section>;
}

/** columns: [{key, label, numeric?, fractionDigits?, render?(row,index), width?}]. */
export function PrintFormTable({ columns, rows = [], rowKey = 'id', caption, footer, minRows = 8, className }) {
  const minimum = Number.isInteger(minRows) ? Math.max(6, Math.min(40, minRows)) : 8;
  const emptyRows = Math.max(0, minimum - rows.length);
  return <div className={cn('print-form-table-wrap', className)}><table className="print-form-table">
    {caption && <caption>{caption}</caption>}
    <colgroup>{columns.map((column) => <col key={column.key} style={column.width ? { width: column.width } : undefined} />)}</colgroup>
    <thead><tr>{columns.map((column) => <th scope="col" key={column.key} className={column.numeric ? 'print-numeric' : undefined}>{column.label}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr className="h-7" key={typeof rowKey === 'function' ? rowKey(row, index) : row[rowKey] ?? index}>{columns.map((column) => <td key={column.key} className={column.numeric ? 'print-numeric' : undefined}>{column.render ? column.render(row, index) : column.numeric && row[column.key] != null && row[column.key] !== '' ? printNumber(row[column.key], column.fractionDigits ?? 0) : row[column.key] ?? ''}</td>)}</tr>)}{Array.from({ length: emptyRows }, (_, index) => <tr key={`blank-${index}`} className="print-empty-row h-7" aria-label="Dòng trống">{columns.map((column) => <td key={column.key} />)}</tr>)}</tbody>
    {footer && <tfoot>{footer}</tfoot>}
  </table></div>;
}

/**
 * Reusable A4 portrait document. Pass business content as children; no API writes.
 * signatures: 2–4 [{title, name?, instruction?}]; signing/stamping space stays blank.
 * Ref: { print(): Promise<void>, getElement(): HTMLElement }.
 */
export const PrintFormLayout = forwardRef(function PrintFormLayout({
  title, formCode = 'BM-NV…', documentNumber, createdAt, time, orientation = 'portrait', footerDisclaimer = disclaimer,
  documentNumberLabel = 'Số phiếu:', createdAtLabel = 'Ngày lập:', confirmationTitle,
  signatures = defaultSignatures, children, notes, showToolbar = true,
  onClose, onBeforePrint, className, sheetClassName,
}, ref) {
  const id = useId(), sheet = useRef(null), locked = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const slots = signatures?.length >= 2 && signatures.length <= 4 ? signatures : defaultSignatures;
  async function print() {
    if (locked.current || !sheet.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      await onBeforePrint?.();
      await readyToPrint(sheet.current);
      if (!sheet.current) return;
      preparePrintCopy(sheet.current, id);
      window.print();
    } catch (failure) {
      clearPrintCopy(id); setError(failure?.message || 'Không thể mở hộp thoại in. Vui lòng thử lại.');
    } finally { locked.current = false; setBusy(false); }
  }
  useImperativeHandle(ref, () => ({ print, getElement: () => sheet.current }));
  useEffect(() => {
    const before = () => {
      // Ctrl+P uses the first visible preview unless a toolbar already chose a form.
      if (!document.getElementById(PRINT_ROOT) && sheet.current && document.querySelector('[data-print-form]') === sheet.current) preparePrintCopy(sheet.current, id);
    };
    const after = () => clearPrintCopy(id);
    window.addEventListener('beforeprint', before); window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); clearPrintCopy(id); };
  }, [id]);
  return <div className={cn('print-form-preview', className)}>
    {showToolbar && <div className="print-form-toolbar" data-print-hide>
      <div><strong>Xem trước biểu mẫu</strong><p>A4 {orientation === 'landscape' ? 'ngang' : 'dọc'} · In tỷ lệ 100% · Tắt đầu trang/chân trang của trình duyệt</p></div>
      <div className="flex flex-wrap gap-2">{onClose && <Button variant="outline" disabled={busy} onClick={onClose}>Đóng xem trước</Button>}<Button variant="outline" disabled={busy} onClick={print}><FileDown size={16} />Lưu PDF</Button><Button disabled={busy} onClick={print}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Printer size={16} />}In biểu mẫu</Button></div>
      <p className="print-form-print-help">Để xuất PDF, chọn “Lưu dưới dạng PDF / Save as PDF” trong hộp thoại in. Bật “Đồ họa nền / Background graphics” để giữ màu xanh.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>}
    {!showToolbar && error && <p role="alert" data-print-hide className="mb-4 text-sm text-red-700">{error}</p>}
    <div className="print-form-scroll" tabIndex={0} role="region" aria-label="Bản xem trước A4, có thể cuộn ngang trên màn hình nhỏ">
      <article ref={sheet} data-print-form={id} data-orientation={orientation === 'landscape' ? 'landscape' : 'portrait'} className={cn('print-form-sheet border border-[#A3C1AD] bg-[#F7FAF5] text-gray-900', sheetClassName)} aria-label={`${title} – ${formCode}`}>
        <header className="print-form-header">
          <OrganicPrintLogo />
          <div className="print-form-heading"><h2 className="print-form-company">CỬA HÀNG THỰC PHẨM HỮU CƠ<br />ORGANICFOOD.VN</h2><p className="print-form-subtitle">Chứng từ quản lý cửa hàng</p></div>
          <div className="print-form-metadata rounded-md border border-[#689F75] bg-white/80"><p><strong>Mã biểu mẫu:</strong> {formCode}</p><DottedField label={documentNumberLabel} value={documentNumber} /><DottedField label={createdAtLabel} value={printDate(createdAt) === '—' ? '....../....../.......' : printDate(createdAt)} />{time && <DottedField label="Thời gian:" value={time} />}</div>
        </header>
        <div className="print-form-title"><h1 className="rounded-md border border-[#689F75] bg-[#DCEAD6] text-[#1B4D2E]">{title}</h1></div>
        <div className="print-form-body">{children}</div>
        {notes && <aside className="print-form-notes"><strong>Ghi chú: </strong>{notes}</aside>}
        <footer className="print-form-confirmation">
          {confirmationTitle && <h2 className="print-form-section-title">{confirmationTitle}</h2>}
          <table className="print-form-signatures" aria-label="Xác nhận và chữ ký"><thead><tr>{slots.map((slot, index) => <th scope="col" key={index}>{slot.title}</th>)}</tr></thead><tbody><tr>{slots.map((slot, index) => <td key={index}><div className="print-signature-cell"><p>{slot.instruction || '(Ký, ghi rõ họ tên)'}</p><div className="print-signature-space" aria-hidden="true" /><strong>{slot.name || '\u00a0'}</strong>{slot.dateLabel && <DottedField label={slot.dateLabel} value={slot.date ? printDate(slot.date) : ''} />}</div></td>)}</tr></tbody></table>
          <div className="print-form-banner"><strong>{footerDisclaimer}</strong><p><Leaf size={16} aria-hidden="true" />Vì một cuộc sống xanh và khỏe mạnh hơn!<Leaf size={16} aria-hidden="true" /></p></div>
        </footer>
      </article>
    </div>
  </div>;
});

export default PrintFormLayout;
