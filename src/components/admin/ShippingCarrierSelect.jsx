import { Field, Select } from '@/components/ui/field';

export const SHIPPING_CARRIERS = ['Express', 'Giao Hàng Tiết Kiệm'];
export function ShippingCarrierSelect({ value, onChange, disabled = false }) {
  const options = value && !SHIPPING_CARRIERS.includes(value) ? [...SHIPPING_CARRIERS, value] : SHIPPING_CARRIERS;
  return <Field label="Đơn vị giao hàng *"><Select required aria-label="Đơn vị giao hàng" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
    <option value="">Chọn đơn vị giao hàng</option>
    {options.map((carrier) => <option key={carrier} value={carrier}>{carrier}</option>)}
  </Select></Field>;
}
