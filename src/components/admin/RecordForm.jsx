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
import { errorMessage } from '@/lib/utils';

export function RecordForm({ module, item, service, onClose, onSaved }) {
  const config = modules[module];
  const resource = useResource(async () => ({ item: item.id ? await service.get(item.id) : item, suppliers: module === 'origins' ? await allPages(supplierService.list) : [] }), [module, item.id]);
  return <Modal open onOpenChange={(value) => { if (!value) onClose(); }} title={`${item.id ? 'Chỉnh sửa' : 'Thêm'} ${config.singular}`} description={config.description} className="catalog-form-modal"><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />{!resource.loading && !resource.error && <RecordEditor module={module} initial={resource.data.item} suppliers={resource.data.suppliers} service={service} onClose={onClose} onSaved={onSaved} />}</Modal>;
}
function RecordEditor({ module, initial, suppliers, service, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const config = modules[module];
  async function submit(event) {
    event.preventDefault(); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (module === 'certifications' && values.expiresAt && values.expiresAt < values.issuedAt) { setError('Ngày hết hạn không được trước ngày cấp.'); return; }
    setBusy(true);
    try { await service.save(initial.id, values); toast.success(`Đã lưu ${config.singular}.`); onSaved(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  return <form className="catalog-form" onSubmit={submit}><fieldset disabled={busy}>
    {module === 'customers' && <p className="form-note">Đây là hồ sơ khách hàng. Việc tạo hồ sơ không cấp tài khoản đăng nhập hoặc thay đổi quyền của tài khoản.</p>}
    {module === 'certifications' && <p className="form-note">Tạo mới ở trạng thái chờ duyệt. Sửa thông tin sẽ chuyển chứng nhận về chờ duyệt; tải tài liệu và duyệt ở màn hình chi tiết.</p>}
    <div className="record-form-grid">{config.fields.map((field) => {
      const { name, label, options, supplier, hint, type, defaultToday, defaultValue, uuid, past, ...props } = field;
      const controlProps = { name, defaultValue: initial[name] ?? (defaultToday ? today() : defaultValue ?? ''), ...props };
      return <Field key={name} label={`${label}${props.required ? ' *' : ''}`} hint={hint} className={type === 'textarea' || name === 'accountId' ? 'full-width' : ''}>
        {supplier ? <Select {...controlProps}><option value="">Không liên kết</option>{suppliers.map((s) => <option key={s.id} value={s.id} disabled={s.status === 'inactive' && s.id !== initial.supplierId}>{s.supplierName}{s.status === 'inactive' ? ' (Ngừng hoạt động)' : ''}</option>)}</Select> : options ? <Select {...controlProps}>{options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</Select> : type === 'textarea' ? <Textarea {...controlProps} /> : <Input {...controlProps} type={type || 'text'} max={past ? today() : undefined} pattern={uuid ? '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' : props.pattern} />}
      </Field>;
    })}</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><Button variant="outline" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{busy ? 'Đang lưu…' : 'Lưu thông tin'}</Button></div>
  </fieldset></form>;
}
