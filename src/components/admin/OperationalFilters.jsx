import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { AdminDateInput, AdminForm } from './AdminForm';
import { SearchSelect } from './SearchSelect';
export const emptyOperationalFilters = { search: '', status: '', supplierId: '', from: '', to: '', person: '', paymentStatus: '', minAmount: '', maxAmount: '' };
export function OperationalFilters({ value, onChange, statuses, suppliers, sales = false }) {
  const patch = (name, next) => onChange({ ...value, [name]: next });
  return <AdminForm className="operations-filters" onSubmit={(event) => event.preventDefault()}>
    <Field label="Tìm kiếm nhanh"><Input aria-label="Tìm kiếm nhanh chứng từ" list="operations-suggestions" placeholder="Mã đơn, tên, sản phẩm, điện thoại…" value={value.search} onChange={(e) => patch('search', e.target.value)} maxLength={200} /></Field>
    <Field label="Trạng thái"><Select value={value.status} onChange={(e) => patch('status', e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</Select></Field>
    {suppliers && <Field label="Nhà cung cấp"><SearchSelect aria-label="Lọc nhà cung cấp" placeholder="Tất cả nhà cung cấp" options={[{ value: '', label: 'Tất cả nhà cung cấp' }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.supplierName }))]} value={value.supplierId} onChange={(next) => patch('supplierId', next)} /></Field>}
    <Field label="Từ ngày"><AdminDateInput aria-label="Từ ngày" value={value.from} onChange={(e) => patch('from', e.target.value)} /></Field>
    <Field label="Đến ngày"><AdminDateInput aria-label="Đến ngày" min={value.from || undefined} value={value.to} onChange={(e) => patch('to', e.target.value)} /></Field>
    <Field label={sales ? 'Khách hàng / Người lập' : 'Người lập'}><Input value={value.person} onChange={(e) => patch('person', e.target.value)} maxLength={150} placeholder="Tìm theo tên…" /></Field>
    {sales && <Field label="Thanh toán"><Select value={value.paymentStatus} onChange={(e) => patch('paymentStatus', e.target.value)}><option value="">Tất cả thanh toán</option><option value="paid">Đã thanh toán</option><option value="pending">Chờ thanh toán</option><option value="unpaid">Chưa thanh toán</option><option value="requires_review">Cần đối soát</option></Select></Field>}
    <Field label="Giá trị từ (₫)"><Input type="number" min="0" value={value.minAmount} onChange={(e) => patch('minAmount', e.target.value)} /></Field>
    <Field label="Giá trị đến (₫)"><Input type="number" min={value.minAmount || 0} value={value.maxAmount} onChange={(e) => patch('maxAmount', e.target.value)} /></Field>
    <Button type="button" variant="outline" onClick={() => onChange({ ...emptyOperationalFilters })}>Xóa bộ lọc</Button>
    {value.from && value.to && value.from > value.to && <p role="alert" className="text-xs text-red-700">Ngày kết thúc phải từ ngày bắt đầu trở đi.</p>}
    {value.minAmount !== '' && value.maxAmount !== '' && Number(value.minAmount) > Number(value.maxAmount) && <p role="alert" className="text-xs text-red-700">Giá trị đến phải lớn hơn hoặc bằng giá trị từ.</p>}
  </AdminForm>;
}
