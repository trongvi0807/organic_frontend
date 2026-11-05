import { useRef, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { staffAccountService } from '@/services/admin/staffAccountService';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { AdminForm } from '@/components/admin/AdminForm';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { errorMessage } from '@/lib/utils';
import { STAFF_ROLE_NAMES } from '@/lib/permissions';

const roles = STAFF_ROLE_NAMES;
const descriptions = {
  ADMIN: 'Tài khoản nhân viên và cấu hình hệ thống.',
  EXECUTIVE_DIRECTOR: 'Xem báo cáo, giám sát hoạt động mua hàng và cửa hàng.',
  PROCUREMENT_MANAGER: 'Quản lý nguồn cung, lập và duyệt đơn mua.',
  PROCUREMENT_STAFF: 'Thông tin sản phẩm, nguồn cung, lập và theo dõi đơn mua.',
  STORE_MANAGER: 'Điều phối cửa hàng, duyệt nhập kho và phương án đổi trả.',
  WAREHOUSE_STAFF: 'Tồn kho, nhập hàng, soạn hàng và kiểm nhận hàng thu hồi.',
  SALES_STAFF: 'Đơn bán, khách hàng, ưu đãi, phản hồi và thực hiện phương án đã duyệt.',
  BUSINESS_STAFF: 'Giao hàng, tiến độ vận chuyển và đối soát tiền thu hộ.',
};
const blank = () => ({ fullName: '', username: '', password: '', phoneNumber: '', email: '', roles: [], active: true });
export default function StaffAccountsPage() {
  const [search, setSearch] = useState(''), term = useDebouncedValue(search);
  const [page, setPage] = useState(0), [editor, setEditor] = useState(null), [form, setForm] = useState(blank), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const list = useResource(() => staffAccountService.list({ search: term || undefined, page, size: 10 }), [term, page]);
  function edit(employee) {
    setEditor(employee || {}); setError('');
    setForm(employee ? { ...blank(), ...employee, email: employee.email || '', roles: employee.roles.filter(role => roles[role]) } : blank());
  }
  const change = key => event => setForm(old => ({ ...old, [key]: event.target.value }));
  async function save(event) {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (!form.roles.length) throw new Error('Vui lòng chọn ít nhất một vai trò.');
      const payload = { fullName: form.fullName.trim(), phoneNumber: form.phoneNumber, email: form.email.trim() || null, roles: form.roles };
      if (editor.id) payload.active = form.active;
      else { payload.username = form.username.trim(); payload.password = form.password; }
      await staffAccountService.save(editor.id, payload);
      setEditor(null); setForm(blank()); list.reload(); toast.success(editor.id ? 'Đã cập nhật nhân viên.' : 'Đã tạo tài khoản nhân viên.');
    } catch (failure) { setError(errorMessage(failure)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <>
    <div className="admin-page-heading"><div><span className="eyebrow">HỆ THỐNG</span><h1>Nhân viên & Phân quyền</h1><p>Tạo tài khoản, phân công vai trò và quản lý trạng thái làm việc.</p></div><Button onClick={() => edit(null)}><Plus size={17} />Thêm nhân viên</Button></div>
    <section className="admin-table-panel"><div className="table-panel-heading"><h2 className="flex items-center gap-2"><Users size={18} />Danh sách nhân viên</h2></div><div className="table-filters"><label className="search-field"><Search size={16} /><input aria-label="Tìm nhân viên" placeholder="Họ tên, mã nhân viên, tên đăng nhập…" maxLength={100} value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} /></label></div>
      <ResourceState loading={list.loading} error={list.error} empty={list.data?.items.length === 0} onRetry={list.reload} />
      {!list.loading && !list.error && !!list.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>Mã nhân viên</th><th>Họ tên</th><th>Tên đăng nhập</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{list.data.items.map(employee => <tr key={employee.id}><td>{employee.employeeCode}</td><td><strong>{employee.fullName}</strong></td><td>{employee.username}</td><td>{employee.phoneNumber}<small className="block">{employee.email}</small></td><td>{employee.roles.map(role => roles[role] || role).join(', ')}</td><td><span className={`rounded-full px-3 py-1 text-xs ${employee.active ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{employee.active ? 'Hoạt động' : 'Đã khóa'}</span></td><td><Button size="sm" variant="outline" onClick={() => edit(employee)}>Chỉnh sửa</Button></td></tr>)}</tbody></table></div>}
      <Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} />
    </section>
    <Modal open={!!editor} onOpenChange={open => { if (!open && !busy) { setEditor(null); setForm(blank()); } }} title={editor?.id ? 'Thông tin nhân viên' : 'Tạo tài khoản nhân viên'}>
      <AdminForm onSubmit={save}><fieldset disabled={busy} className="min-w-0 space-y-5"><Field label="Họ tên *"><Input required maxLength={150} value={form.fullName} onChange={change('fullName')} /></Field>
        {!editor?.id && <><Field label="Tên đăng nhập *"><Input required autoComplete="off" minLength={3} maxLength={50} pattern="[a-zA-Z0-9._-]{3,50}" value={form.username} onChange={change('username')} /></Field><Field label="Mật khẩu ban đầu *"><Input required type="password" autoComplete="new-password" minLength={8} maxLength={72} value={form.password} onChange={change('password')} /></Field></>}
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Số điện thoại *"><Input required type="tel" pattern="0[0-9]{9}" maxLength={10} value={form.phoneNumber} onChange={change('phoneNumber')} /></Field><Field label="Email"><Input type="email" maxLength={200} value={form.email} onChange={change('email')} /></Field></div>
        <fieldset className="space-y-3"><legend className="mb-3 text-sm font-semibold">Vai trò *</legend><p className="text-xs text-stone-500">Chọn theo nhiệm vụ được phân công. Có thể chọn nhiều vai trò khi nhân viên kiêm nhiệm.</p><div className="grid gap-3 sm:grid-cols-2">{Object.entries(roles).map(([value, label]) => <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${form.roles.includes(value) ? 'border-emerald-600 bg-emerald-50' : 'border-line'}`}><input type="checkbox" className="mt-1 accent-emerald-700" checked={form.roles.includes(value)} onChange={event => setForm(old => ({ ...old, roles: event.target.checked ? [...old.roles, value] : old.roles.filter(role => role !== value) }))} /><span><strong className="text-sm">{label}</strong><small className="mt-1 block text-xs leading-5 text-stone-500">{descriptions[value]}</small></span></label>)}</div></fieldset>
        {editor?.id && <Field label="Trạng thái tài khoản"><Select value={form.active ? 'active' : 'locked'} onChange={event => setForm(old => ({ ...old, active: event.target.value === 'active' }))}><option value="active">Hoạt động</option><option value="locked">Khóa tài khoản</option></Select></Field>}
        {error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button variant="outline" onClick={() => { setEditor(null); setForm(blank()); }}>Đóng</Button><Button type="submit">{busy ? 'Đang lưu…' : 'Lưu nhân viên'}</Button></div>
      </fieldset></AdminForm>
    </Modal>
  </>;
}
