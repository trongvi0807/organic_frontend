import { AdminDateInput, AdminForm } from '@/components/admin/AdminForm';
import { ProfileAddressEditor } from './ProfileAddressEditor';
import { useMemo, useState } from 'react';
import { Pencil, Plus, MapPin, Upload, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { createProfileService } from '@/services/client/profileService';
import { useResource } from '@/hooks/useResource';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/utils';
import { avatarUploadError } from '@/lib/avatarUpload';
import { dateText, today } from '@/lib/apiData';
import { ResourceState } from '@/components/common/ResourceState';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/field';

export function ProfilePanel({ id = 'me', self = false, onChanged = () => {} }) {
  const service = useMemo(() => createProfileService(id), [id]);
  const resource = useResource(() => service.get(), [id]);
  const { updateProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState(null);
  const [removing, setRemoving] = useState(null);
  const data = resource.data;
  async function mutate(operation, formatError = errorMessage) {
    setBusy(true); setError(''); setAvatarFailed(false);
    try {
      const profile = await operation(); resource.setData(profile);
      if (self) updateProfile(profile);
      onChanged(); toast.success('Đã cập nhật hồ sơ.'); return true;
    } catch (err) { setError(formatError(err)); return false; }
    finally { setBusy(false); }
  }
  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try { setAvatarFailed(!await mutate(() => service.uploadAvatar(file), avatarUploadError)); }
    finally { setUploading(false); }
  }
  async function saveProfile(event) {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
    if (await mutate(() => service.save(values))) setEditing(false);
  }
  return <div className="profile-panel"><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />{!resource.loading && !resource.error && data && <>
    <div className="profile-overview"><div className="profile-photo">{data.avatarUrl ? <img src={data.avatarUrl} alt={`Ảnh ${data.fullName}`} /> : <UserRound size={36} strokeWidth={1.2} />}</div><div><h2>{data.fullName}</h2><p>{data.customerId} · {data.username || 'Chưa liên kết tài khoản'}</p><StatusBadge status={data.status} /></div><div className="profile-photo-actions"><label className={`upload-control ${busy ? 'is-disabled' : ''}`}><Upload size={15} />{uploading ? 'Đang tải ảnh…' : 'Đổi ảnh'}<input aria-label="Tải ảnh đại diện" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={uploadAvatar} /></label>{data.avatarUrl && <Button variant="ghost" size="sm" disabled={busy} onClick={() => setRemoving({ avatar: true })}>Gỡ ảnh</Button>}</div></div>
    <p className="form-note">Ảnh đại diện: JPEG, PNG hoặc WebP, tối đa 5 MB.</p>
    {uploading && <p className="form-note" role="status">Đang tải và xử lý ảnh. Vui lòng chờ trong giây lát.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {avatarFailed && <Button variant="outline" size="sm" disabled={busy} onClick={() => { setError(''); setAvatarFailed(false); resource.reload(); }}>Tải lại hồ sơ</Button>}
    <div className="profile-section-heading"><h3>Thông tin cá nhân</h3>{self && <Button aria-label={editing ? 'Đóng biểu mẫu cá nhân' : 'Chỉnh sửa thông tin cá nhân'} variant="outline" size="sm" disabled={busy} onClick={() => setEditing(!editing)}><Pencil size={14} />{editing ? 'Đóng biểu mẫu' : 'Chỉnh sửa'}</Button>}</div>
    {editing ? <AdminForm className="profile-edit-form" onSubmit={saveProfile}><fieldset disabled={busy}><div className="record-form-grid"><Field label="Họ và tên *"><Input name="fullName" defaultValue={data.fullName} maxLength={255} required /></Field><Field label="Số điện thoại *"><Input name="phoneNumber" defaultValue={data.phoneNumber} pattern="\+?[0-9]{9,15}" required /></Field><Field label="Email"><Input name="email" defaultValue={data.email || ''} type="email" maxLength={255} /></Field><Field label="Ngày sinh"><AdminDateInput name="dateOfBirth" max={today()} defaultValue={data.dateOfBirth || ''} /></Field></div><div className="form-actions"><Button disabled={busy} type="submit">{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</Button></div></fieldset></AdminForm> : <dl className="detail-list"><div><dt>Điện thoại</dt><dd>{data.phoneNumber}</dd></div><div><dt>Email</dt><dd>{data.email || 'Chưa cung cấp'}</dd></div><div><dt>Ngày sinh</dt><dd>{data.dateOfBirth ? dateText(data.dateOfBirth) : 'Chưa cung cấp'}</dd></div><div><dt>Hạng thành viên</dt><dd>{data.membershipStatus}</dd></div><div><dt>Điểm tích lũy</dt><dd>{data.rewardPoints ?? 0}</dd></div><div><dt>Ngày đăng ký</dt><dd>{dateText(data.registrationDate)}</dd></div>{!self && <div><dt>Tài khoản đăng nhập</dt><dd>{data.username || 'Chưa liên kết'}{data.accountStatus ? ` · ${data.accountStatus}` : ''}</dd></div>}</dl>}
    <div className="profile-section-heading"><h3>Địa chỉ nhận hàng</h3><Button variant="outline" size="sm" disabled={busy} onClick={() => setAddress({})}><Plus size={14} />Thêm địa chỉ</Button></div>
    <div className="address-list">{data.addresses?.length ? data.addresses.map((item) => <article className="address-card" key={item.id}><MapPin size={19} /><div><h4>{item.label || 'Địa chỉ nhận hàng'}{item.isDefault && <span>Mặc định</span>}</h4><strong>{item.receiverName} · {item.receiverPhone}</strong><p>{[item.streetAddress, item.ward, item.province].filter(Boolean).join(', ')}</p><div className="address-actions"><button aria-label={`Sửa địa chỉ ${item.label || item.receiverName}`} disabled={busy} onClick={() => setAddress(item)}>Chỉnh sửa</button><button aria-label={`Xóa địa chỉ ${item.label || item.receiverName}`} disabled={busy} onClick={() => setRemoving({ address: item })}>Xóa địa chỉ</button></div></div></article>) : <p className="module-footnote">Chưa có địa chỉ nhận hàng.</p>}</div>
    {address && <ProfileAddressEditor address={address} busy={busy} error={error} onClose={() => setAddress(null)} onSave={async (values) => { if (await mutate(() => service.saveAddress(address.id, values))) setAddress(null); }} />}
    <Modal open={!!removing} onOpenChange={(value) => { if (!value && !busy) setRemoving(null); }} title={removing?.avatar ? 'Gỡ ảnh đại diện?' : 'Xóa địa chỉ nhận hàng?'} description="Xác nhận thay đổi hồ sơ khách hàng.">{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button variant="outline" disabled={busy} onClick={() => setRemoving(null)}>Hủy</Button><Button variant="danger" disabled={busy} onClick={async () => { if (await mutate(() => removing.avatar ? service.deleteAvatar() : service.removeAddress(removing.address.id))) setRemoving(null); }}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Button></div></Modal>
  </>}</div>;
}
