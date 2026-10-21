import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Pencil, Archive, RotateCcw, Leaf, X } from 'lucide-react';
import { toast } from 'sonner';
import { modules, reviewLabels, validityLabels } from '@/constants/management';
import { customerService, supplierService, originService, certificationService } from '@/services/admin/managementService';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/contexts/AuthContext';
import { mayEdit } from '@/lib/permissions';
import { dateText, allPages } from '@/lib/apiData';
import { errorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { RecordForm } from '@/components/admin/RecordForm';
import { RecordDetails } from '@/components/admin/RecordDetails';
import { StatusBadge, CertificateValidity } from '@/components/admin/StatusBadge';

const services = { customers: customerService, suppliers: supplierService, origins: originService, certifications: certificationService };
export default function RecordsPage({ module }) {
  const config = modules[module], service = services[module];
  const { user, isAdmin } = useAuth();
  const editAllowed = mayEdit(user, module);
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ status: '', validity: '', archived: 'false', countryCode: '', supplierId: '' });
  const [editor, setEditor] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const params = { page, size: 8, search: term || undefined, status: filters.status || undefined,
    ...(module === 'certifications' ? { validity: filters.validity || undefined, archived: filters.archived === 'true' } : {}),
    ...(module === 'origins' ? { countryCode: filters.countryCode || undefined, supplierId: filters.supplierId || undefined } : {}) };
  const records = useResource(() => service.list(params), [module, page, term, ...Object.values(filters)]);
  const suppliers = useResource(() => module === 'origins' ? allPages(supplierService.list) : Promise.resolve([]), [module]);
  useEffect(() => { if (!records.loading && records.data && page > 0 && !records.data.items.length) setPage((value) => value - 1); }, [records.loading, records.data, page]);
  function filter(key, value) { setPage(0); setFilters((old) => ({ ...old, [key]: value })); }
  function saved() { setEditor(null); records.reload(); }
  async function confirmAction() {
    setBusy(true); setActionError('');
    try {
      if (action.restore) await certificationService.restore(action.item.id); else await service.archive(action.item.id);
      toast.success(action.restore ? 'Đã khôi phục chứng nhận về chờ duyệt.' : module === 'certifications' ? 'Đã lưu trữ chứng nhận.' : `Đã ngừng hoạt động ${config.singular}.`);
      setAction(null); records.reload();
    } catch (err) { setActionError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <>
    <div className="admin-page-heading"><div><span className="eyebrow">QUẢN LÝ CỬA HÀNG</span><h1>{config.title}<span className="heading-dot">.</span></h1><p>{config.description}</p></div>{editAllowed && <Button onClick={() => setEditor({})}><Plus size={17} />Thêm {config.singular}</Button>}</div>
    <div className="module-summary"><span><Leaf size={18} /><strong>{records.loading ? '…' : records.data?.totalElements ?? '—'}</strong> kết quả phù hợp bộ lọc</span><span>{editAllowed ? 'Xem, thêm và cập nhật hồ sơ' : 'Quyền truy cập: chỉ xem'}</span></div>
    <section className="admin-table-panel"><div className="table-panel-heading"><h2>Danh sách {config.singular}</h2><Button variant="outline" size="sm" onClick={records.reload} disabled={records.loading}><RotateCcw size={14} />Tải lại</Button></div>
      <div className="table-filters record-filters"><label className="search-field"><Search size={17} /><input aria-label={`Tìm ${config.singular}`} maxLength={200} placeholder="Tìm theo tên, mã hoặc thông tin liên hệ…" value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} /></label>
        <Select aria-label="Lọc trạng thái" value={filters.status} onChange={(e) => filter('status', e.target.value)}><option value="">Tất cả trạng thái</option>{module === 'certifications' ? Object.entries(reviewLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>) : <><option value={config.active}>Hoạt động</option><option value={config.inactive}>Ngừng hoạt động</option></>}</Select>
        {module === 'certifications' && <><Select aria-label="Lọc hiệu lực" value={filters.validity} onChange={(e) => filter('validity', e.target.value)}><option value="">Tất cả thời hạn</option>{Object.entries(validityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select aria-label="Kho lưu trữ" value={filters.archived} onChange={(e) => filter('archived', e.target.value)}><option value="false">Đang quản lý</option><option value="true">Đã lưu trữ</option></Select></>}
        {module === 'origins' && <><Input className="country-filter" value={filters.countryCode} maxLength={2} aria-label="Mã quốc gia" placeholder="VN, US…" onChange={(e) => filter('countryCode', e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} /><Select aria-label="Lọc nhà cung cấp" value={filters.supplierId} onChange={(e) => filter('supplierId', e.target.value)}><option value="">Tất cả nhà cung cấp</option>{suppliers.data?.map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}</Select></>}
        {(search || Object.entries(filters).some(([key, value]) => key === 'archived' ? value !== 'false' : !!value)) && <button className="icon-button" aria-label="Xóa bộ lọc" onClick={() => { setSearch(''); setPage(0); setFilters({ status: '', validity: '', archived: 'false', countryCode: '', supplierId: '' }); }}><X size={16} /></button>}
      </div>
      {suppliers.error && module === 'origins' && <div className="admin-inline-error">Không tải được bộ lọc nhà cung cấp. <button onClick={suppliers.reload}>Thử lại</button></div>}
      <ResourceState loading={records.loading} error={records.error} empty={records.data?.items.length === 0} onRetry={records.reload} />
      {!records.loading && !records.error && !!records.data?.items.length && <div className="table-scroll"><table className="data-table records-table"><thead><tr><th>{config.title}</th><th>{module === 'certifications' ? 'Tổ chức cấp / thời hạn' : module === 'origins' ? 'Quốc gia / vùng' : 'Thông tin liên hệ'}</th><th>{module === 'customers' ? 'Tài khoản / thành viên' : module === 'suppliers' ? 'Mã số thuế' : 'Sản phẩm liên kết'}</th><th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead><tbody>{records.data.items.map((item) => <tr key={item.id}>
        <td><div className="table-product">{module === 'customers' && (item.avatarUrl ? <img src={item.avatarUrl} alt="" /> : <span className="person-avatar">{item.fullName?.slice(0, 1)}</span>)}<div><strong>{item[config.nameKey]}</strong><small>{item[config.codeKey]}</small></div></div></td>
        <td><div className="record-cell">{module === 'certifications' ? <><span>{item.issuingOrganization}</span><small>{dateText(item.issuedAt)} → {dateText(item.expiresAt)}</small></> : module === 'origins' ? <><span>{item.country} · {item.countryCode}</span><small>{item.region || 'Chưa có vùng'}{item.supplierName ? ` · ${item.supplierName}` : ''}</small></> : <><span>{item.phoneNumber || 'Chưa có điện thoại'}</span><small>{item.email || item.contactPerson || 'Chưa có email'}</small></>}</div></td>
        <td>{module === 'customers' ? <div className="record-cell"><span>{item.username || 'Chưa liên kết tài khoản'}</span><small>{item.membershipStatus} · {item.rewardPoints ?? 0} điểm</small></div> : module === 'suppliers' ? item.taxCode || '—' : `${item.productCount ?? 0} sản phẩm`}</td>
        <td><div className="record-cell"><StatusBadge status={item.status} />{module === 'certifications' && <CertificateValidity item={item} />}</div></td>
        <td><div className="table-actions"><button className="icon-button" aria-label={`Xem ${item[config.nameKey]}`} onClick={() => setDetailId(item.id)}><Eye size={16} /></button>{editAllowed && !item.archived && <button className="icon-button" aria-label={`Sửa ${item[config.nameKey]}`} onClick={() => setEditor(item)}><Pencil size={16} /></button>}{isAdmin && (module === 'certifications' || item.status === config.active) && <button className="icon-button delete-button" aria-label={`${item.archived ? 'Khôi phục' : module === 'certifications' ? 'Lưu trữ' : 'Ngừng hoạt động'} ${item[config.nameKey]}`} onClick={() => { setAction({ item, restore: item.archived }); setActionError(''); }}>{item.archived ? <RotateCcw size={16} /> : <Archive size={16} />}</button>}</div></td>
      </tr>)}</tbody></table></div>}
      <Pagination page={page} size={8} totalPages={records.data?.totalPages || 0} totalElements={records.data?.totalElements || 0} onChange={setPage} />
    </section><p className="module-footnote">Dữ liệu được quản lý qua API cửa hàng. {module === 'certifications' ? 'Hiệu lực được tính theo ngày và trạng thái duyệt của backend.' : 'Hồ sơ ngừng hoạt động vẫn được giữ để đối chiếu.'}</p>
    {editor && <RecordForm module={module} item={editor} service={service} onClose={() => setEditor(null)} onSaved={saved} />}
    {detailId && <RecordDetails module={module} id={detailId} service={service} onClose={() => setDetailId(null)} onChanged={records.reload} />}
    <Modal open={!!action} onOpenChange={(value) => { if (!value && !busy) setAction(null); }} title={action?.restore ? 'Khôi phục chứng nhận?' : module === 'certifications' ? 'Lưu trữ chứng nhận?' : `Ngừng hoạt động ${config.singular}?`} description={action?.restore ? 'Chứng nhận sẽ trở về trạng thái chờ duyệt.' : 'Giữ lại dữ liệu và liên kết lịch sử; thao tác này không xóa tài khoản đăng nhập.'}><p className="delete-item-name">{action?.item[config.nameKey]}</p>{actionError && <p className="form-error" role="alert">{actionError}</p>}<div className="form-actions"><Button variant="outline" disabled={busy} onClick={() => setAction(null)}>Hủy</Button><Button disabled={busy} onClick={confirmAction}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Button></div></Modal>
  </>;
}
