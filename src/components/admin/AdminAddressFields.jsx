import { useEffect, useState } from 'react';
import { useResource } from '@/hooks/useResource';
import { loadAddresses } from '@/services/client/addressService';
import { exactAddress, formatShippingAddress } from '@/lib/address';
import { Field, Input } from '@/components/ui/field';
import { ResourceState } from '@/components/common/ResourceState';
import { SearchSelect } from './SearchSelect';

export function StructuredAddressFields({ data, value, onChange, disabled, required = true }) {
  const wards = data?.wards.filter((ward) => ward.provinceCode === value.provinceCode) || [];
  return <div className="grid gap-4 sm:grid-cols-2"><Field label="Tỉnh / Thành phố *"><SearchSelect required={required} aria-label="Tỉnh / Thành phố" disabled={disabled || !data} options={(data?.provinces || []).map((province) => ({ value: province.code, label: province.name }))} value={value.provinceCode} onChange={(provinceCode) => onChange({ ...value, provinceCode, wardCode: '' })} placeholder="Tìm Tỉnh / Thành phố" /></Field><Field label="Xã / Phường / Thị trấn *"><SearchSelect required={required} aria-label="Xã / Phường / Thị trấn" disabled={disabled || !value.provinceCode} options={wards.map((ward) => ({ value: ward.code, label: ward.name, search: ward.aliases?.flat().join(' ') }))} value={value.wardCode} onChange={(wardCode) => onChange({ ...value, wardCode })} placeholder="Tìm Xã / Phường" /></Field><Field className="sm:col-span-2" label="Số nhà - Tên đường *"><Input required={required} autoComplete="address-line1" maxLength={255} disabled={disabled} value={value.street} onChange={(e) => onChange({ ...value, street: e.target.value })} placeholder="Ví dụ: 36 Trịnh Đình Trọng" /></Field></div>;
}
export function AdminAddressFields({ name = 'address', initialValue = '', required = false }) {
  const resource = useResource(loadAddresses, []);
  const [address, setAddress] = useState({ provinceCode: '', wardCode: '', street: '' });
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (!resource.data || changed || !initialValue) return;
    const parts = initialValue.split(',').map((part) => part.trim());
    const match = exactAddress(resource.data, parts.slice(-2).join(', '));
    if (match) setAddress({ provinceCode: match.provinceCode, wardCode: match.code, street: parts.slice(0, -2).join(', ') });
  }, [resource.data, initialValue, changed]);
  let formatted = initialValue;
  if (changed) { try { formatted = formatShippingAddress(address, resource.data); } catch { formatted = ''; } }
  return <div className="full-width space-y-3"><p className="text-sm font-medium">Địa chỉ{required ? ' *' : ''}</p><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />{resource.data && <StructuredAddressFields required={required || changed} data={resource.data} value={address} onChange={(next) => { setChanged(true); setAddress(next); }} />}{initialValue && !changed && !address.wardCode && <p className="text-xs leading-6 text-stone-500">Địa chỉ hiện có: {initialValue}. Chọn lại địa chỉ để cập nhật theo cấu trúc Tỉnh và Xã.</p>}<input type="hidden" name={name} value={formatted} /></div>;
}
