import { useState } from 'react';
import { Save, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { modules } from '@/constants/management';
import { useResource } from '@/hooks/useResource';
import { ResourceState } from '@/components/common/ResourceState';
import { allPages, today } from '@/lib/apiData';
import { supplierService } from '@/services/admin/managementService';
import { AdminForm, AdminDateInput } from './AdminForm';
import { SearchSelect } from './SearchSelect';
import { AdminAddressFields } from './AdminAddressFields';
import { errorMessage } from '@/lib/utils';
import { nextRecordCode } from '@/lib/recordCodes';

export function RecordForm({ module, item, service, onClose, onSaved }) {
  const config = modules[module];
  const [busy, setBusy] = useState(false);
  const resource = useResource(async () => {
    const detail = item.id ? await service.get(item.id) : { ...item };
    if (module === 'suppliers' && !item.id) detail.supplierCode = nextRecordCode(await allPages(supplierService.list), 'supplierCode', 'NCC');
    return { item: detail, suppliers: module === 'origins' ? await allPages(supplierService.list) : [] };
  }, [module, item.id]);
  return <Modal open onOpenChange={(value) => { if (!value && !busy) onClose(); }} title={`${item.id ? 'Chỉnh sửa' : 'Thêm'} ${config.singular}`} description={config.description} className="catalog-form-modal"><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />{!resource.loading && !resource.error && <RecordEditor module={module} initial={resource.data.item} suppliers={resource.data.suppliers} service={service} onClose={onClose} onSaved={onSaved} busy={busy} setBusy={setBusy} />}</Modal>;
}
function RecordEditor({ module, initial, suppliers, service, onClose, onSaved, busy, setBusy }) {
  const [error, setError] = useState('');
  const config = modules[module];
  const [dates, setDates] = useState(() => Object.fromEntries(config.fields.filter((field) => field.type === 'date').map((field) => [field.name, initial[field.name] || (field.defaultToday ? today() : '')])));
  const [supplierId, setSupplierId] = useState(initial.supplierId || '');
  async function submit(event) {
    event.preventDefault(); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (module === 'certifications' && values.expiresAt && values.expiresAt < values.issuedAt) { setError('Ngày hết hạn không được trước ngày cấp.'); return; }
    setBusy(true);
    try {
      if (module === 'suppliers' && !initial.id) values.supplierCode = nextRecordCode(await allPages(supplierService.list), 'supplierCode', 'NCC');
      await service.save(initial.id, values); toast.success(`Đã lưu ${config.singular}.`); onSaved(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  return <AdminForm className="catalog-form" onSubmit={submit}><fieldset disabled={busy}>
    {module === 'customers' && <p className="form-note">Đây là hồ sơ khách hàng. Việc tạo hồ sơ không cấp tài khoản đăng nhập hoặc thay đổi quyền của tài khoản.</p>}
    {module === 'certifications' && <p className="form-note">Tạo mới ở trạng thái chờ duyệt. Sửa thông tin sẽ chuyển chứng nhận về chờ duyệt; tải tài liệu và duyệt ở màn hình chi tiết.</p>}
    {module === 'origins' && <p className="form-note">Xuất xứ là vùng/cơ sở sản xuất, được liên kết với nhà cung cấp. Khi thêm sản phẩm, chọn nhà cung cấp rồi chọn xuất xứ tương ứng.</p>}
    <div className="record-form-grid">{config.fields.map((field) => {
      const { name, label, options, supplier, hint, type, defaultToday, defaultValue, uuid, past, ...props } = field;
      const controlProps = { name, defaultValue: initial[name] ?? (defaultToday ? today() : defaultValue ?? ''), ...props };
      if (name === 'address') return <AdminAddressFields key={name} name={name} initialValue={initial[name] || ''} required={props.required} />;
      return <Field key={name} label={`${label}${props.required ? ' *' : ''}`} hint={hint} className={type === 'textarea' || name === 'accountId' ? 'full-width' : ''}>
        {supplier ? <SearchSelect name={name} value={supplierId} onChange={setSupplierId} aria-label="Nhà cung cấp" options={[{ value: '', label: 'Không liên kết' }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.supplierName, disabled: supplier.status === 'inactive' && supplier.id !== initial.supplierId }))]} /> : options ? <Select {...controlProps}>{options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</Select> : type === 'date' ? <AdminDateInput name={name} {...props} value={dates[name]} onChange={(e) => setDates((old) => ({ ...old, [name]: e.target.value }))} min={name === 'expiresAt' ? dates.issuedAt || undefined : undefined} max={past ? today() : name === 'issuedAt' ? dates.expiresAt || undefined : undefined} /> : type === 'textarea' ? <Textarea {...controlProps} /> : <Input {...controlProps} type={type || 'text'} max={past ? today() : undefined} pattern={uuid ? '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' : props.pattern} />}
      </Field>;
    })}</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><Button variant="outline" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{busy ? 'Đang lưu…' : 'Lưu thông tin'}</Button></div>
  </fieldset></AdminForm>;
}
