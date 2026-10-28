import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ResourceState } from '@/components/common/ResourceState';
import { AdminForm } from '@/components/admin/AdminForm';
import { StructuredAddressFields } from '@/components/admin/AdminAddressFields';
import { useResource } from '@/hooks/useResource';
import { loadAddresses } from '@/services/client/addressService';
import { savedAddressToForm } from '@/lib/address';
import { profileAddressPayload } from '@/lib/profileAddress';

export function ProfileAddressEditor({ address, busy, error, onClose, onSave }) {
  const source = useResource(loadAddresses, []);
  const [value, setValue] = useState({ provinceCode: '', wardCode: '', street: address.streetAddress || '' });
  const [message, setMessage] = useState('');
  useEffect(() => { if (source.data) setValue(savedAddressToForm(address, source.data)); }, [source.data, address]);
  return <Modal open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={address.id ? 'Sửa địa chỉ' : 'Thêm địa chỉ'} description="Chọn địa chỉ theo Tỉnh và Xã hiện hành." className="catalog-form-modal"><ResourceState loading={source.loading} error={source.error} onRetry={source.reload} />{source.data && <AdminForm onSubmit={async (event) => { event.preventDefault(); setMessage(''); try { const fields = Object.fromEntries(new FormData(event.currentTarget)); await onSave(profileAddressPayload(fields, value, source.data, address)); } catch (e) { setMessage(e.message); } }} className="catalog-form"><fieldset disabled={busy}><div className="record-form-grid">{[['label', 'Tên gợi nhớ', false], ['receiverName', 'Người nhận', true], ['receiverPhone', 'Điện thoại người nhận', true]].map(([name, label, required]) => <Field key={name} label={`${label}${required ? ' *' : ''}`}><Input name={name} required={required} maxLength={255} defaultValue={address[name] || ''} pattern={name === 'receiverPhone' ? '\\+?[0-9]{9,15}' : undefined} /></Field>)}</div><StructuredAddressFields data={source.data} value={value} onChange={(next) => { setValue(next); setMessage(''); }} disabled={busy} /><label className="checkbox-label !mt-4"><input name="isDefault" type="checkbox" defaultChecked={address.isDefault || false} />Đặt làm địa chỉ mặc định</label>{(message || error) && <p className="form-error" role="alert">{message || error}</p>}<div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu địa chỉ'}</Button></div></fieldset></AdminForm>}</Modal>;
}
