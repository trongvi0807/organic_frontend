import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, ShieldCheck, Link2, Unlink, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { traceabilityService, originService, certificationService } from '@/services/admin/managementService';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/contexts/AuthContext';
import { mayEdit } from '@/lib/permissions';
import { allPages } from '@/lib/apiData';
import { errorMessage } from '@/lib/utils';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Select, Field } from '@/components/ui/field';
import { StatusBadge, CertificateValidity } from '@/components/admin/StatusBadge';

export default function TraceabilityPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const keyword = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const products = useResource(() => traceabilityService.list({ search: keyword || undefined, page, size: 8 }), [keyword, page]);
  const selected = params.get('product');
  return <><div className="admin-page-heading"><div><span className="eyebrow">MINH BẠCH TỪ NGUỒN GỐC</span><h1>Truy xuất sản phẩm<span className="heading-dot">.</span></h1><p>Gắn vùng sản xuất và chứng nhận phù hợp cho từng sản phẩm.</p></div></div><div className="traceability-grid"><section className="admin-table-panel trace-product-panel"><h2>Chọn sản phẩm</h2><label className="search-field"><Search size={16} /><input aria-label="Tìm sản phẩm truy xuất" maxLength={200} value={search} placeholder="Tên hoặc mã sản phẩm…" onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></label><ResourceState loading={products.loading} error={products.error} empty={products.data?.items.length === 0} onRetry={products.reload} />{!products.loading && !products.error && <div className="trace-product-list">{products.data?.items.map((item) => <button key={item.id} className={selected === item.id ? 'is-selected' : ''} onClick={() => setParams({ product: item.id })}><strong>{item.productName}</strong><StatusBadge status={item.status} /></button>)}</div>}<Pagination page={page} size={8} totalPages={products.data?.totalPages || 0} totalElements={products.data?.totalElements || 0} onChange={setPage} /></section><section className="admin-table-panel trace-detail-panel">{selected ? <TraceDetail key={selected} id={selected} /> : <div className="resource-state"><Leaf size={35} strokeWidth={1} /><h3>Bắt đầu từ một sản phẩm</h3><p>Chọn sản phẩm ở bên trái để xem xuất xứ và hiệu lực chứng nhận.</p></div>}</section></div></>;
}
function TraceDetail({ id }) {
  const { user } = useAuth();
  const editable = mayEdit(user, 'origins');
  const detail = useResource(() => traceabilityService.get(id), [id]);
  const options = useResource(async () => {
    if (!editable) return { origins: [], certificates: [] };
    const [origins, certificates] = await Promise.all([allPages(originService.list, { status: 'active' }), allPages(certificationService.list, { archived: false })]);
    return { origins, certificates };
  }, [id, editable]);
  const [origin, setOrigin] = useState('');
  const [certificate, setCertificate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function mutate(operation) {
    setBusy(true); setError('');
    try { detail.setData(await operation()); toast.success('Đã cập nhật liên kết sản phẩm.'); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  const data = detail.data;
  const availableCertificates = options.data?.certificates.filter((item) => !data?.certifications.some((cert) => cert.id === item.id)) || [];
  return <><ResourceState loading={detail.loading} error={detail.error} onRetry={detail.reload} />{!detail.loading && !detail.error && data && <><div className="trace-title"><div><h2>{data.productName}</h2><p>{data.productCode}</p></div><span className={`effective-badge effective-${data.effectiveOrganicStatus}`}><ShieldCheck size={15} />{data.effectiveOrganicStatus === 'verified' ? 'Có chứng nhận hợp lệ' : data.effectiveOrganicStatus === 'pending' ? 'Đang chờ xác minh' : 'Chưa có chứng nhận hợp lệ'}</span></div>{error && <p className="form-error" role="alert">{error}</p>}
    <section className="trace-section"><h3><MapPin size={18} />Xuất xứ</h3>{data.origin ? <div className="trace-origin"><div><strong>{data.origin.originName}</strong><p>{[data.origin.region, data.origin.country].filter(Boolean).join(', ')}</p>{data.origin.producerName && <p>Cơ sở: {data.origin.producerName}</p>}<StatusBadge status={data.origin.status} /></div>{editable && <Button variant="ghost" size="sm" disabled={busy} onClick={() => mutate(() => traceabilityService.removeOrigin(id))}><Unlink size={14} />Gỡ liên kết</Button>}</div> : <p className="muted">Sản phẩm chưa gắn xuất xứ.</p>}
    {editable && <div className="trace-assignment"><Field label="Chọn vùng sản xuất đang hoạt động"><Select value={origin} onChange={(e) => setOrigin(e.target.value)} disabled={busy || options.loading || !!options.error}><option value="">Chọn xuất xứ</option>{options.data?.origins.map((item) => <option key={item.id} value={item.id}>{item.originName} · {item.countryCode}</option>)}</Select></Field><Button disabled={busy || !origin || !!options.error} onClick={() => mutate(() => traceabilityService.setOrigin(id, origin))}><Link2 size={14} />Gắn xuất xứ</Button></div>}</section>
    <section className="trace-section"><h3><ShieldCheck size={18} />Chứng nhận liên kết</h3><div className="trace-cert-list">{data.certifications.length ? data.certifications.map((item) => <div key={item.id}><div><strong>{item.certificateName}</strong><p>{item.certificateNumber} · {item.issuingOrganization}</p><span className="trace-statuses"><StatusBadge status={item.status} /><CertificateValidity item={item} /></span></div>{editable && <Button variant="ghost" size="sm" disabled={busy} onClick={() => mutate(() => traceabilityService.detach(id, item.id))}><Unlink size={14} />Gỡ</Button>}</div>) : <p className="muted">Chưa gắn chứng nhận.</p>}</div>{editable && <div className="trace-assignment"><Field label="Chọn chứng nhận chưa lưu trữ"><Select value={certificate} onChange={(e) => setCertificate(e.target.value)} disabled={busy || options.loading || !!options.error}><option value="">Chọn chứng nhận</option>{availableCertificates.map((item) => <option key={item.id} value={item.id}>{item.certificateName} · {item.certificateNumber}</option>)}</Select></Field><Button disabled={busy || !certificate || !availableCertificates.some((item) => item.id === certificate) || !!options.error} onClick={() => mutate(() => traceabilityService.attach(id, certificate))}><Link2 size={14} />Gắn chứng nhận</Button></div>}<p className="form-note">Chỉ chứng nhận đã xác minh, có tài liệu và còn hiệu lực mới được hiển thị là hợp lệ.</p></section>
    {options.error && <ResourceState error={options.error} onRetry={options.reload} />}
  </>}</>;
}
