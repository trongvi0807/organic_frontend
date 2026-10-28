import { Field, Textarea } from '@/components/ui/field';
import { ResourceState } from '@/components/common/ResourceState';
import { SearchSelect } from './SearchSelect';
import { AdminDateInput } from './AdminForm';
import { today } from '@/lib/apiData';
import { useState } from 'react';
import { validationMessage } from './AdminForm';

export function ExcelImportContextFields({ kind, value, onChange, disabled, suppliers, categories }) {
  const change = (key, next) => onChange({ ...value, [key]: next });
  const [inputError, setInputError] = useState('');
  const dateError = value.expectedDeliveryDate && value.expectedDeliveryDate < today() ? 'Ngày giao dự kiến không được trong quá khứ.' : '';
  return <fieldset disabled={disabled} className="min-w-0 space-y-4 rounded-2xl border border-line bg-white p-5" onChange={(event) => setInputError(event.target.validity ? validationMessage(event.target) : '')} onBlur={(event) => setInputError(event.target.validity ? validationMessage(event.target) : '')}>
    <legend className="px-2 text-sm font-semibold text-primary">1. Thông tin chung</legend>
    {kind === 'purchase_orders' && <>
      <ResourceState loading={suppliers.loading} error={suppliers.error} onRetry={suppliers.reload} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nhà cung cấp *" hint="Mẫu Excel và file tải lên phải thuộc nhà cung cấp này."><SearchSelect aria-label="Nhà cung cấp nhập Excel" disabled={disabled || suppliers.loading || !!suppliers.error} value={value.supplierId || ''} onChange={(id) => change('supplierId', id)} options={(suppliers.data || []).filter((row) => row.status === 'active').map((row) => ({ value: row.id, label: `${row.supplierName} · ${row.supplierCode}` }))} /></Field>
        <Field label="Ngày giao dự kiến" error={dateError}><AdminDateInput aria-label="Ngày giao dự kiến nhập Excel" min={today()} value={value.expectedDeliveryDate || ''} onChange={(event) => change('expectedDeliveryDate', event.target.value)} /></Field>
      </div>
    </>}
    {kind === 'products' && <>
      <ResourceState loading={categories?.loading} error={categories?.error} onRetry={categories?.reload} />
      <Field label="Loại sản phẩm dùng cho các ô trống (không bắt buộc)" hint="Nếu file gồm nhiều loại, điền tên/mã loại trong Excel hoặc chọn riêng từng sản phẩm sau khi xem trước."><SearchSelect aria-label="Loại sản phẩm chung nhập Excel" disabled={disabled || categories?.loading || !!categories?.error} value={value.categoryId || ''} onChange={(id) => change('categoryId', id)} options={[{ value: '', label: 'Dùng loại đã nhập trong file' }, ...(categories?.data || []).filter((row) => row.status === 'active').map((row) => ({ value: row.id, label: `${row.categoryName} · ${row.categoryCode}` }))]} /></Field>
    </>}
    {kind !== 'products' && <Field label="Ghi chú chung" hint="Nhập một lần cho toàn bộ chứng từ. Không cần lặp lại trong mẫu mới."><Textarea aria-label="Ghi chú chung nhập Excel" maxLength={5000} value={value.note || ''} onChange={(event) => change('note', event.target.value)} /></Field>}
    <p className="text-xs leading-6 text-stone-500">Khi đổi thông tin chung, bạn cần kiểm tra lại file trước khi xác nhận nhập.</p>
    {inputError && <p role="alert" className="form-error">{inputError}</p>}
  </fieldset>;
}
