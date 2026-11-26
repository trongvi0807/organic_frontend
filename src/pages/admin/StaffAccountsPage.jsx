import { useRef, useState } from 'react';
import { Plus, Search, ShieldCheck, Users } from 'lucide-react';
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
import { hasRole, roleCodes, STAFF_ROLE_NAMES } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, refreshUser } = useAuth();
  const [search, setSearch] = useState(''), term = useDebouncedValue(search);
  const [page, setPage] = useState(0), [editor, setEditor] = useState(null), [form, setForm] = useState(blank), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const editingAdmin = hasRole(editor, 'ADMIN');
  const administrator = useResource(() => staffAccountService.currentAdministrator(), [user?.username]);
  const list = useResource(() => staffAccountService.list({ search: term || undefined, page, size: 10 }), [term, page]);
  function edit(employee) {
    setEditor(employee || {}); setError('');
    setForm(employee ? { ...blank(), ...employee, email: employee.email || '', roles: roleCodes(employee).filter(role => roles[role]) } : blank());
  }
  const change = key => event => setForm(old => ({ ...old, [key]: event.target.value }));
  async function save(event) {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (!form.roles.length) throw new Error('Vui lòng chọn ít nhất một vai trò.');
      if (!editingAdmin && form.roles.includes('ADMIN')) throw new Error('Không được tạo thêm hoặc cấp quyền Quản trị viên cho tài khoản khác.');
      if (editingAdmin && (!form.active || !form.roles.includes('ADMIN'))) throw new Error('Không được khóa hoặc bỏ quyền tài khoản Quản trị viên.');
      const payload = { fullName: form.fullName.trim(), phoneNumber: form.phoneNumber, email: form.email.trim() || null, roles: form.roles };
      if (editor.id) payload.active = form.active;
      else { payload.username = form.username.trim(); payload.password = form.password; }
      await staffAccountService.save(editor.id, payload);
      setEditor(null); setForm(blank()); list.reload(); administrator.reload(); toast.success(editingAdmin ? 'Đã cập nhật quyền cho tài khoản Admin.' : editor.id ? 'Đã cập nhật nhân viên.' : 'Đã tạo tài khoản nhân viên.');
      if (editor.username === user?.username) {
        try { await refreshUser(); }
        catch { toast.info('Thông tin đã lưu. Vui lòng tải lại trang để cập nhật các chức năng được phép dùng.'); }
      }
    } catch (failure) { setError(errorMessage(failure)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <>
    <div className="admin-page-heading"><div><span className="eyebrow">HỆ THỐNG</span><h1>Nhân viên & Phân quyền</h1><p>Tạo tài khoản, phân công vai trò và quản lý trạng thái làm việc.</p></div><Button onClick={() => edit(null)}><Plus size={17} />Thêm nhân viên</Button></div>
    <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" aria-labelledby="admin-permissions-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 id="admin-permissions-title" className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={21} />Phân quyền tài khoản Admin</h2><p className="mt-2 text-sm text-stone-600">Chọn thêm vai trò để tài khoản Admin thực hiện các công việc tại cửa hàng.</p></div>
        {!administrator.loading && !administrator.error && administrator.data && <Button onClick={() => edit(administrator.data)}>Gán thêm quyền</Button>}
      </div>
      <ResourceState loading={administrator.loading} error={administrator.error} onRetry={administrator.reload} />
      {!administrator.loading && !administrator.error && administrator.data && <div className="mt-4 space-y-3"><p className="text-sm"><strong>{administrator.data.fullName}</strong> · {administrator.data.username}</p><div className="flex flex-wrap gap-2">{roleCodes(administrator.data).map(role => <span key={role} className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm text-emerald-900">{roles[role] || role}</span>)}</div><p className="text-xs text-stone-600">Vai trò Quản trị viên luôn được giữ. Các vai trò bổ sung có thể điều chỉnh khi cần.</p></div>}
    </section>
    <section className="admin-table-panel"><div className="table-panel-heading"><h2 className="flex items-center gap-2"><Users size={18} />Danh sách nhân viên</h2></div><div className="table-filters"><label className="search-field"><Search size={16} /><input aria-label="Tìm nhân viên" placeholder="Họ tên, mã nhân viên, tên đăng nhập…" maxLength={100} value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} /></label></div>
      <ResourceState loading={list.loading} error={list.error} empty={list.data?.items.length === 0} onRetry={list.reload} />
      {!list.loading && !list.error && !!list.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>Mã nhân viên</th><th>Họ tên</th><th>Tên đăng nhập</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{list.data.items.map(employee => <tr key={employee.id}><td>{employee.employeeCode}</td><td><strong>{employee.fullName}</strong></td><td>{employee.username}</td><td>{employee.phoneNumber}<small className="block">{employee.email}</small></td><td>{employee.roles.map(role => roles[role] || role).join(', ')}</td><td><span className={`rounded-full px-3 py-1 text-xs ${employee.active ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{employee.active ? 'Hoạt động' : 'Đã khóa'}</span></td><td><Button size="sm" variant="outline" onClick={() => edit(employee)}>Chỉnh sửa</Button></td></tr>)}</tbody></table></div>}
      <Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} />
    </section>
    <Modal open={!!editor} onOpenChange={open => { if (!open && !busy) { setEditor(null); setForm(blank()); } }} title={editingAdmin ? 'Phân quyền tài khoản Admin' : editor?.id ? 'Thông tin nhân viên' : 'Tạo tài khoản nhân viên'}>
      <AdminForm onSubmit={save}><fieldset disabled={busy} className="min-w-0 space-y-5"><Field label="Họ tên *"><Input required maxLength={150} value={form.fullName} onChange={change('fullName')} /></Field>
        {!editor?.id && <><Field label="Tên đăng nhập *"><Input required autoComplete="off" minLength={3} maxLength={50} pattern="[a-zA-Z0-9._-]{3,50}" value={form.username} onChange={change('username')} /></Field><Field label="Mật khẩu ban đầu *"><Input required type="password" autoComplete="new-password" minLength={8} maxLength={72} value={form.password} onChange={change('password')} /></Field></>}
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Số điện thoại *"><Input required type="tel" pattern="0[0-9]{9}" maxLength={10} value={form.phoneNumber} onChange={change('phoneNumber')} /></Field><Field label="Email"><Input type="email" maxLength={200} value={form.email} onChange={change('email')} /></Field></div>
        <fieldset className="space-y-3"><legend className="mb-3 text-sm font-semibold">Vai trò *</legend><p className="text-xs text-stone-500">Chọn theo nhiệm vụ được phân công. Có thể chọn nhiều vai trò khi nhân viên kiêm nhiệm.</p><div className="grid gap-3 sm:grid-cols-2">{Object.entries(roles).filter(([value]) => value !== 'ADMIN' || editingAdmin).map(([value, label]) => <label key={value} className={`flex items-start gap-3 rounded-xl border p-3 ${value === 'ADMIN' ? 'cursor-default' : 'cursor-pointer'} ${form.roles.includes(value) ? 'border-emerald-600 bg-emerald-50' : 'border-line'}`}><input type="checkbox" className="mt-1 accent-emerald-700" disabled={value === 'ADMIN'} checked={form.roles.includes(value)} onChange={event => setForm(old => ({ ...old, roles: event.target.checked ? [...old.roles, value] : old.roles.filter(role => role !== value) }))} /><span><strong className="text-sm">{label}</strong><small className="mt-1 block text-xs leading-5 text-stone-500">{descriptions[value]}</small></span></label>)}</div></fieldset>
        {editingAdmin && <p className="form-note">Hệ thống chỉ có một tài khoản Quản trị viên. Không được xóa, khóa hoặc chuyển quyền này sang tài khoản khác.</p>}
        {editor?.id && <Field label="Trạng thái tài khoản"><Select disabled={editingAdmin} aria-label="Trạng thái tài khoản" value={form.active ? 'active' : 'locked'} onChange={event => setForm(old => ({ ...old, active: event.target.value === 'active' }))}><option value="active">Hoạt động</option><option value="locked">Khóa tài khoản</option></Select></Field>}
        {error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button variant="outline" onClick={() => { setEditor(null); setForm(blank()); }}>Đóng</Button><Button type="submit">{busy ? 'Đang lưu…' : 'Lưu nhân viên'}</Button></div>
      </fieldset></AdminForm>
    </Modal>
  </>;
}
