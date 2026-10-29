import { AdminForm } from '@/components/admin/AdminForm';
import { useState } from 'react';
import { Save, Plus, Trash2, Search, RotateCcw, Star } from 'lucide-react';
import { toast } from 'sonner';
import { homeAdminService } from '@/services/admin/homeAdminService';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/utils';
import { optional } from '@/lib/apiData';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea, Select } from '@/components/ui/field';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HomeCertificateEditor } from '@/components/admin/HomeCertificateEditor';

export default function HomeManagementPage() {
  const [tab, setTab] = useState('content');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function refresh() {
    setBusy(true); setError('');
    try { await homeAdminService.refresh(); toast.success('Đã tải lại dữ liệu trang chủ.'); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <><div className="admin-page-heading"><div><span className="eyebrow">CHĂM CHÚT TRẢI NGHIỆM ĐẦU TIÊN</span><h1>Quản lý trang chủ<span className="heading-dot">.</span></h1><p>Nội dung cửa hàng, bộ sưu tập nổi bật và thông tin liên hệ.</p></div><Button variant="outline" disabled={busy} onClick={refresh}><RotateCcw size={16} />{busy ? 'Đang tải…' : 'Làm mới dữ liệu Home'}</Button></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="management-tabs" role="group" aria-label="Quản lý trang chủ"><button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>Nội dung & liên hệ</button><button className={tab === 'featured' ? 'active' : ''} onClick={() => setTab('featured')}>Sản phẩm nổi bật</button></div>{tab === 'content' ? <ContentPanel /> : <FeaturedPanel />}</>;
}
function ContentPanel() {
  const resource = useResource(() => homeAdminService.content(), []);
  return <section className="admin-table-panel content-editor-panel"><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />{!resource.loading && !resource.error && resource.data && <ContentEditor key={JSON.stringify(resource.data)} initial={resource.data} onSaved={resource.setData} />}</section>;
}
function ContentEditor({ initial, onSaved }) {
  const [data, setData] = useState({ ...initial, banners: initial.banners || [], highlights: initial.highlights || [], faqs: initial.faqs || [], certificationGallery: initial.certificationGallery || [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function field(name, value) { setData((old) => ({ ...old, [name]: value })); }
  function row(group, index, name, value) { setData((old) => ({ ...old, [group]: old[group].map((entry, at) => at === index ? { ...entry, [name]: value } : entry) })); }
  function remove(group, index) { setData((old) => ({ ...old, [group]: old[group].filter((_, at) => at !== index) })); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    const payload = { ...data, contactEmail: optional(data.contactEmail), contactPhone: optional(data.contactPhone), contactAddress: optional(data.contactAddress), openingHours: optional(data.openingHours), banners: data.banners.map((banner) => ({ ...banner, subtitle: optional(banner.subtitle), imageUrl: optional(banner.imageUrl), imageAlt: optional(banner.imageAlt) })), certificationGallery: data.certificationGallery.map((entry) => ({ ...entry, previewImageUrl: optional(entry.previewImageUrl), previewDocumentUrl: optional(entry.previewDocumentUrl), description: optional(entry.description) })) };
    try { const saved = await homeAdminService.saveContent(payload); toast.success('Đã lưu nội dung trang chủ.'); onSaved(saved); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  const groups = [
    { key: 'banners', label: 'Banner', max: 5, empty: { title: '', subtitle: '', imageUrl: '', imageAlt: '', buttonLabel: 'Khám phá', buttonHref: '/san-pham' }, fields: [['title','Tiêu đề',150,true],['subtitle','Nội dung phụ',500],['imageUrl','URL ảnh HTTPS',1000],['imageAlt','Mô tả ảnh',255],['buttonLabel','Nhãn nút',50,true],['buttonHref','Đường dẫn nội bộ',300,true]] },
    { key: 'highlights', label: 'Điểm nổi bật', max: 6, empty: { title: '', description: '' }, fields: [['title','Tiêu đề',100,true],['description','Mô tả',500,true]] },
    { key: 'faqs', label: 'Câu hỏi thường gặp', max: 10, empty: { question: '', answer: '' }, fields: [['question','Câu hỏi',200,true],['answer','Câu trả lời',1000,true]] },
  ];
  return <AdminForm className="home-content-form" onSubmit={save}><fieldset disabled={busy}><h2>Nội dung cửa hàng</h2><div className="record-form-grid"><Field label="Tên cửa hàng *"><Input required maxLength={150} value={data.siteName} onChange={(e) => field('siteName', e.target.value)} /></Field><Field label="Tiêu đề chính *"><Input required maxLength={200} value={data.headline} onChange={(e) => field('headline', e.target.value)} /></Field><Field label="Giới thiệu *" className="full-width"><Textarea required maxLength={2000} value={data.introduction} onChange={(e) => field('introduction', e.target.value)} /></Field></div>
  {groups.map((group) => <section className="content-group" key={group.key}><div className="profile-section-heading"><h3>{group.label} <span>{data[group.key].length}/{group.max}</span></h3><Button variant="outline" size="sm" disabled={busy || data[group.key].length >= group.max} onClick={() => field(group.key, [...data[group.key], { ...group.empty }])}><Plus size={14} />Thêm</Button></div>{!data[group.key].length && <p className="module-footnote">Chưa có nội dung. Khối này sẽ được ẩn trên trang chủ.</p>}{data[group.key].map((entry, index) => <div className="content-entry" key={`${group.key}-${index}`}><div className="content-entry-heading"><strong>{group.label} {index + 1}</strong><button className="icon-button delete-button" type="button" aria-label={`Xóa ${group.label} ${index + 1}`} onClick={() => remove(group.key, index)}><Trash2 size={16} /></button></div><div className="record-form-grid">{group.fields.map(([name,label,maxLength,required]) => <Field key={name} label={`${label}${required ? ' *' : ''}`} className={['description','answer','subtitle'].includes(name) ? 'full-width' : ''}>{['description','answer','subtitle'].includes(name) ? <Textarea required={required} maxLength={maxLength} value={entry[name] || ''} onChange={(e) => row(group.key,index,name,e.target.value)} /> : <Input required={required} maxLength={maxLength} value={entry[name] || ''} type={name === 'imageUrl' ? 'url' : 'text'} pattern={name === 'imageUrl' ? 'https://.*' : name === 'buttonHref' ? '/(?!/)[^\\s\\\\]*' : undefined} onChange={(e) => row(group.key,index,name,e.target.value)} />}</Field>)}</div></div>)}</section>)}
  <HomeCertificateEditor value={data.certificationGallery} onChange={(value) => field('certificationGallery', value)} disabled={busy} />
  <section className="content-group"><h3>Thông tin liên hệ</h3><div className="record-form-grid">{[['contactEmail','Email',255,'email'],['contactPhone','Điện thoại',30,'text'],['contactAddress','Địa chỉ',500,'text'],['openingHours','Giờ mở cửa',150,'text']].map(([name,label,maxLength,type]) => <Field key={name} label={label}><Input type={type} maxLength={maxLength} value={data[name] || ''} onChange={(e) => field(name,e.target.value)} /></Field>)}</div></section>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button type="submit" disabled={busy}><Save size={16} />{busy ? 'Đang lưu…' : 'Lưu nội dung trang chủ'}</Button></div></fieldset></AdminForm>;
}
function FeaturedPanel() {
  const [search,setSearch] = useState('');
  const keyword = useDebouncedValue(search);
  const [filter,setFilter] = useState('');
  const [page,setPage] = useState(0);
  const [busy,setBusy] = useState(null);
  const [error,setError] = useState('');
  const resource = useResource(() => homeAdminService.products({ search: keyword || undefined, featured: filter ? filter === 'true' : undefined, page, size: 8 }), [keyword,filter,page]);
  async function save(event, item) {
    event.preventDefault(); const values = new FormData(event.currentTarget); setBusy(item.id); setError('');
    try { await homeAdminService.featured(item.id, values.get('featured') === 'on', values.get('order')); toast.success('Đã cập nhật sản phẩm nổi bật.'); resource.reload(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(null); }
  }
  return <section className="admin-table-panel"><div className="table-panel-heading"><h2>Sản phẩm nổi bật</h2><span>Thứ tự nhỏ hiển thị trước</span></div><div className="table-filters"><label className="search-field"><Search size={16} /><input aria-label="Tìm sản phẩm nổi bật" value={search} maxLength={200} onChange={(e) => {setPage(0);setSearch(e.target.value);}} placeholder="Tên hoặc mã sản phẩm…" /></label><Select aria-label="Lọc sản phẩm nổi bật" value={filter} onChange={(e) => {setPage(0);setFilter(e.target.value);}}><option value="">Tất cả sản phẩm</option><option value="true">Đang đánh dấu nổi bật</option><option value="false">Chưa đánh dấu nổi bật</option></Select></div>{error && <p className="form-error" role="alert">{error}</p>}<ResourceState loading={resource.loading} error={resource.error} empty={resource.data?.items.length === 0} onRetry={resource.reload} />{!resource.loading && !resource.error && <div className="featured-editor-list">{resource.data?.items.map((item) => <AdminForm key={`${item.id}-${item.featured}-${item.featuredOrder}`} onSubmit={(event) => save(event,item)}><div><strong>{item.name}</strong><StatusBadge status={item.status} /></div><label className="checkbox-label"><input type="checkbox" name="featured" defaultChecked={item.featured} disabled={!!busy} /><Star size={14} />Nổi bật</label><Field label="Thứ tự"><Input name="order" type="number" min={0} max={100000} step={1} defaultValue={item.featuredOrder} required disabled={!!busy} /></Field><Button size="sm" type="submit" disabled={!!busy}>{busy === item.id ? 'Đang lưu…' : 'Lưu'}</Button></AdminForm>)}</div>}<Pagination page={page} size={8} totalPages={resource.data?.totalPages || 0} totalElements={resource.data?.totalElements || 0} onChange={setPage} /><p className="form-note">Đánh dấu nổi bật là lựa chọn biên tập. Sản phẩm chỉ hiển thị trên Home khi đáp ứng điều kiện công khai, gồm trạng thái và sản phẩm có giá hợp lệ.</p></section>;
}
