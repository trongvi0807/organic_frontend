import { AdminForm } from '@/components/admin/AdminForm';
import { useState } from 'react';
import { ExternalLink, FileCheck, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/field';
import { ResourceState } from '@/components/common/ResourceState';
import { ProfilePanel } from '@/components/customers/ProfilePanel';
import { useResource } from '@/hooks/useResource';
import { useAuth } from '@/contexts/AuthContext';
import { modules, reviewLabels } from '@/constants/management';
import { mayEdit } from '@/lib/permissions';
import { dateText } from '@/lib/apiData';
import { errorMessage } from '@/lib/utils';
import { certificationService } from '@/services/admin/managementService';
import { StatusBadge, CertificateValidity } from './StatusBadge';
import { RelatedProducts } from './RelatedProducts';

export function RecordDetails({ module, id, service, onClose, onChanged }) {
  const config = modules[module];
  return <Modal open onOpenChange={(value) => { if (!value) onClose(); }} title={`Chi tiết ${config.singular}`} description={config.description} className="record-detail-modal">{module === 'customers' ? <ProfilePanel id={id} onChanged={onChanged} /> : <Details module={module} id={id} service={service} onChanged={onChanged} />}</Modal>;
}
function Details({ module, id, service, onChanged }) {
  const resource = useResource(() => service.get(id), [id]);
  const { user, isAdmin } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reviewStatus, setReviewStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const data = resource.data;
  const currentReviewStatus = reviewStatus ?? data?.status ?? 'pending';
  async function mutate(operation) {
    setBusy(true); setError('');
    try { resource.setData(await operation()); setReviewStatus(null); onChanged(); toast.success('Đã cập nhật hồ sơ.'); return true; }
    catch (err) { setError(errorMessage(err)); return false; }
    finally { setBusy(false); }
  }
  const fields = module === 'suppliers' ? [['supplierName','Tên nhà cung cấp'],['supplierCode','Mã nhà cung cấp'],['taxCode','Mã số thuế'],['contactPerson','Người đại diện / liên hệ'],['phoneNumber','Số điện thoại'],['email','Email'],['address','Địa chỉ']] : module === 'origins' ? [['originName','Tên xuất xứ'],['originCode','Mã xuất xứ'],['country','Quốc gia'],['countryCode','Mã quốc gia'],['region','Tỉnh / vùng'],['producerName','Cơ sở sản xuất'],['supplierName','Nhà cung cấp'],['address','Địa chỉ'],['description','Mô tả']] : [['certificateName','Tên chứng nhận'],['certificateNumber','Số chứng nhận'],['issuingOrganization','Tổ chức cấp']];
  return <><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />{!resource.loading && !resource.error && data && <><div className="record-detail-status"><StatusBadge status={data.status} />{module === 'certifications' && <CertificateValidity item={data} />}</div><dl className="detail-list">{fields.map(([name,label]) => <div key={name}><dt>{label}</dt><dd>{data[name] || 'Chưa cung cấp'}</dd></div>)}{module === 'certifications' && <><div><dt>Ngày cấp</dt><dd>{dateText(data.issuedAt)}</dd></div><div><dt>Ngày hết hạn</dt><dd>{dateText(data.expiresAt)}</dd></div><div><dt>Ghi chú duyệt</dt><dd>{data.reviewNote || 'Chưa có'}</dd></div>{data.reviewedAt && <div><dt>Lần duyệt gần nhất</dt><dd>{dateText(data.reviewedAt)}</dd></div>}</>}</dl>
    {error && <p className="form-error" role="alert">{error}</p>}
    {module === 'certifications' && <><section className="certificate-document"><h3><FileCheck size={18} />Tài liệu minh chứng</h3>{data.documentUrl ? <><a className="document-link" href={data.documentUrl} target="_blank" rel="noreferrer"><FileCheck size={19} /><span>{data.documentName || 'Mở tài liệu hiện có'}<small>{data.documentContentType || 'Tài liệu'}{data.documentSize ? ` · ${Math.ceil(data.documentSize / 1024)} KB` : ''}</small></span><ExternalLink size={15} /></a>{data.documentContentType?.startsWith('image/') && <img className="certificate-preview" src={data.documentUrl} alt="Tài liệu chứng nhận" />}</> : <p>Chưa có tài liệu. Cần tải tài liệu trước khi duyệt.</p>}{mayEdit(user, module) && !data.archived && <div className="document-actions"><label className={`upload-control ${busy ? 'is-disabled' : ''}`}><Upload size={15} />{data.documentUrl ? 'Thay tài liệu' : 'Tải tài liệu'}<input aria-label="Tải tài liệu chứng nhận" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={busy} onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) await mutate(() => certificationService.upload(id, file)); }} /></label>{data.documentUrl && <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDelete(true)}><Trash2 size={14} />Gỡ tài liệu</Button>}</div>}<p className="module-footnote">PDF, JPEG, PNG hoặc WebP, tối đa 5 MB. Thay hoặc gỡ tài liệu sẽ chuyển chứng nhận về chờ duyệt.</p></section>
      {isAdmin && !data.archived && <AdminForm className="certificate-review" onSubmit={async (event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); await mutate(() => certificationService.review(id, values)); }}><fieldset disabled={busy}><h3>Duyệt chứng nhận</h3><p>Quyết định xác minh nội bộ dựa trên tài liệu và thời hạn của hồ sơ.</p><Field label="Trạng thái duyệt"><Select name="status" value={currentReviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>{Object.entries(reviewLabels).map(([value,label]) => <option key={value} value={value} disabled={value === 'verified' && (!data.documentUrl || data.validityStatus !== 'valid')}>{label}</option>)}</Select></Field><Field label={['rejected','revoked'].includes(currentReviewStatus) ? 'Lý do *' : 'Ghi chú'}><Textarea key={data.reviewedAt || data.status} name="note" defaultValue={data.reviewNote || ''} maxLength={1000} required={['rejected','revoked'].includes(currentReviewStatus)} /></Field>{(!data.documentUrl || data.validityStatus !== 'valid') && <p className="form-note">Chỉ duyệt khi có tài liệu và đang trong thời hạn hiệu lực.</p>}<Button type="submit" disabled={busy || (currentReviewStatus === 'verified' && (!data.documentUrl || data.validityStatus !== 'valid'))}>{busy ? 'Đang lưu…' : 'Lưu quyết định duyệt'}</Button></fieldset></AdminForm>}
      <Modal open={confirmDelete} onOpenChange={(value) => { if (!busy) setConfirmDelete(value); }} title="Gỡ tài liệu chứng nhận?" description="Chứng nhận sẽ chuyển về chờ duyệt. Cần tải lại tài liệu nếu muốn duyệt lại.">{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>Hủy</Button><Button variant="danger" disabled={busy} onClick={async () => { if (await mutate(() => certificationService.deleteDocument(id))) setConfirmDelete(false); }}>Gỡ tài liệu</Button></div></Modal>
    </>}
    {['origins','certifications'].includes(module) && <RelatedProducts service={service} id={id} />}
  </>}</>;
}
