import { useEffect, useState } from 'react';
import { Package, Plus, Search, SlidersHorizontal, Download, Pencil, Trash2, Leaf, Shapes, CircleCheck, FileText, Archive, X, ArrowUpRight, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { Select } from '@/components/ui/field';
import { CatalogForm } from '@/components/admin/CatalogForm';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { productService } from '@/services/admin/productService';
import { categoryService } from '@/services/admin/categoryService';
import { currency, errorMessage, cn } from '@/lib/utils';
import { DEMO_MODE } from '@/services/api';

export default function ManagementPage({ type }) {
  const product = type === 'products';
  const service = product ? productService : categoryService;
  const [search, setSearch] = useState('');
  const keyword = useDebouncedValue(search);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [exporting, setExporting] = useState(false);
  const result = useResource(() => service.list({ page, size: 6, keyword: keyword || undefined, categoryId: categoryId || undefined, status: status || undefined }), [type, page, keyword, categoryId, status]);
  const categories = useResource(() => allPages(categoryService, {}), [type]);
  const stats = useResource(async () => {
    const statuses = product ? ['', 'active', 'draft', 'inactive'] : ['', 'active', 'inactive'];
    return Promise.all(statuses.map(async (value) => (await service.list({ size: 1, status: value || undefined })).totalElements));
  }, [type]);
  useEffect(() => { if (!result.loading && result.data && page > 0 && result.data.items.length === 0) setPage((old) => Math.max(0, old - 1)); }, [result.loading, result.data, page]);
  function refresh() { result.reload(); categories.reload(); stats.reload(); }
  function changeFilter(update) { update(); setPage(0); }
  function saved() { setEditor(null); refresh(); }
  async function remove() {
    setDeletingBusy(true); setDeleteError('');
    try { await service.remove(deleting.id); setDeleting(null); toast.success(product ? 'Đã ngừng bán sản phẩm.' : 'Đã xóa loại sản phẩm.'); refresh(); }
    catch (err) { setDeleteError(errorMessage(err)); }
    finally { setDeletingBusy(false); }
  }
  async function exportCsv() {
    setExporting(true);
    try {
      const items = await allPages(service, { keyword: keyword || undefined, categoryId: categoryId || undefined, status: status || undefined });
      const rows = product ? [['Mã sản phẩm', 'Tên sản phẩm', 'Danh mục', 'Giá từ', 'Trạng thái'], ...items.map((item) => [item.productCode, item.productName, item.categoryName, item.minPrice ?? '', item.status])] : [['Mã danh mục', 'Tên danh mục', 'Mô tả', 'Trạng thái'], ...items.map((item) => [item.categoryCode, item.categoryName, item.description, item.status])];
      const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `moc-${type}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Đã xuất ${items.length} dòng dữ liệu.`);
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setExporting(false); }
  }
  const statCards = product ? [{ label: 'Tổng sản phẩm', icon: Package, sub: 'Tất cả sản phẩm trong cửa hàng', tone: 'green' }, { label: 'Đang bán', icon: CircleCheck, sub: 'Sẵn sàng trên cửa hàng', tone: 'lime' }, { label: 'Bản nháp', icon: FileText, sub: 'Đang chờ hoàn thiện', tone: 'yellow' }, { label: 'Ngừng bán', icon: Archive, sub: 'Đang tạm ẩn khỏi cửa hàng', tone: 'gray' }] : [{ label: 'Tổng loại sản phẩm', icon: Shapes, sub: 'Danh mục trong cửa hàng', tone: 'green' }, { label: 'Đang hoạt động', icon: CircleCheck, sub: 'Hiển thị trên cửa hàng', tone: 'lime' }, { label: 'Tạm ẩn', icon: Archive, sub: 'Chưa hiển thị với khách hàng', tone: 'yellow' }];
  return <><div className="admin-page-heading"><div><span className="eyebrow">CHĂM CHÚT TỪNG LỰA CHỌN</span><h1>Quản lý {product ? 'sản phẩm' : 'loại sản phẩm'}<span className="heading-dot">.</span></h1><p>{product ? 'Một nơi để quản lý tất cả những điều tươi lành của Mộc.' : 'Sắp xếp sản phẩm gọn gàng, giúp khách hàng tìm điều họ cần.'}</p></div><Button onClick={() => setEditor({})}><Plus size={18} />{product ? 'Thêm sản phẩm' : 'Thêm loại sản phẩm'}</Button></div><div className={cn('stats-grid', !product && 'three-stats')}>{statCards.map(({ icon: Icon, ...card }, index) => <div className="stat-card" key={card.label}><div><span>{card.label}</span><div className={`stat-icon stat-${card.tone}`}><Icon size={18} strokeWidth={1.6} /></div></div><strong>{stats.loading ? '—' : stats.error ? '—' : stats.data?.[index] ?? 0}</strong><small>{card.sub}</small></div>)}</div>{stats.error && <div className="admin-inline-error" role="alert">Không tải được thống kê. <button onClick={stats.reload}>Thử lại</button></div>}
  <section className="admin-table-panel"><div className="table-panel-heading"><div><h2>{product ? 'Danh sách sản phẩm' : 'Danh sách loại sản phẩm'}</h2><span>{result.data?.totalElements ?? '…'} {product ? 'sản phẩm' : 'loại sản phẩm'}</span></div><Button variant="outline" size="sm" disabled={exporting || result.loading || !!result.error} onClick={exportCsv}><Download size={15} />{exporting ? 'Đang xuất…' : 'Xuất dữ liệu'}</Button></div><div className="table-filters"><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => changeFilter(() => setSearch(event.target.value))} placeholder={product ? 'Tìm theo tên hoặc mã sản phẩm…' : 'Tìm tên hoặc mã danh mục…'} aria-label="Tìm kiếm trong bảng" /></label>{product && <Select value={categoryId} onChange={(event) => changeFilter(() => setCategoryId(event.target.value))} aria-label="Lọc theo loại sản phẩm" disabled={categories.loading}><option value="">Tất cả danh mục</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.categoryName}</option>)}</Select>}<div className="status-filter"><SlidersHorizontal size={15} /><Select value={status} onChange={(event) => changeFilter(() => setStatus(event.target.value))} aria-label="Lọc theo trạng thái"><option value="">Tất cả trạng thái</option>{product && <option value="draft">Bản nháp</option>}<option value="active">{product ? 'Đang bán' : 'Hoạt động'}</option><option value="inactive">{product ? 'Ngừng bán' : 'Tạm ẩn'}</option></Select></div>{(search || categoryId || status) && <button className="icon-button" aria-label="Xóa bộ lọc" onClick={() => changeFilter(() => { setSearch(''); setCategoryId(''); setStatus(''); })}><X size={16} /></button>}</div>{categories.error && <div className="admin-inline-error" role="alert">Không tải được danh mục. <button onClick={categories.reload}>Thử lại</button></div>}<ResourceState loading={result.loading} error={result.error} empty={result.data?.items?.length === 0} onRetry={result.reload} />{!result.loading && !result.error && !!result.data?.items?.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>{product ? 'Sản phẩm' : 'Loại sản phẩm'}</th><th>{product ? 'Danh mục' : 'Mã danh mục'}</th><th>{product ? 'Giá bán từ' : 'Mô tả'}</th>{product && <th>Khai báo hữu cơ</th>}<th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead><tbody>{result.data.items.map((item) => <tr key={item.id}><td><div className="table-product">{product ? <img src={item.imageUrl || '/images/vegetables.jpg'} alt="" /> : <span className="table-category-icon"><Shapes size={21} strokeWidth={1.5} /></span>}<div><strong>{product ? item.productName : item.categoryName}</strong><small>{product ? item.productCode : item.parentName || 'Danh mục gốc'}</small></div></div></td><td>{product ? <span className="category-chip">{item.categoryName}</span> : <code className="table-code">{item.categoryCode}</code>}</td><td>{product ? <strong className="table-price">{currency(item.minPrice)}</strong> : <span className="table-description">{item.description || 'Chưa có mô tả'}</span>}</td>{product && <td><span className={`organic-status organic-${item.organicClaimStatus}`}><Leaf size={12} />{item.organicClaimStatus === 'verified' ? 'Đã xác minh' : item.organicClaimStatus === 'rejected' ? 'Chưa đạt' : 'Chờ xác minh'}</span></td>}<td><span className={`status-pill status-${item.status}`}><i />{item.status === 'active' ? product ? 'Đang bán' : 'Hoạt động' : item.status === 'draft' ? 'Bản nháp' : product ? 'Ngừng bán' : 'Tạm ẩn'}</span></td><td><div className="table-actions">{product && <Link className="icon-button" to={`/admin/traceability?product=${item.id}`} aria-label={`Truy xuất ${item.productName}`}><Link2 size={16} /></Link>}<button className="icon-button" aria-label={`Sửa ${item.productName || item.categoryName}`} onClick={() => setEditor(item)}><Pencil size={16} /></button><button className="icon-button delete-button" disabled={product && item.status === 'inactive'} aria-label={`${product ? 'Ngừng bán' : 'Xóa'} ${item.productName || item.categoryName}`} onClick={() => { setDeleting(item); setDeleteError(''); }}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>}<Pagination page={page} size={6} totalPages={result.data?.totalPages || 0} totalElements={result.data?.totalElements || 0} onChange={setPage} /></section><div className="admin-bottom-note"><span><Leaf size={14} />{DEMO_MODE ? 'Chế độ mẫu · Thay đổi được lưu trên trình duyệt này.' : 'Dữ liệu được đồng bộ trực tiếp với hệ thống cửa hàng.'}</span><Link to="/san-pham">Xem trên cửa hàng <ArrowUpRight size={14} /></Link></div>
  {editor && <CatalogForm type={type} item={editor} categories={categories.data || []} onClose={() => setEditor(null)} onSaved={saved} />}
  <Modal open={!!deleting} onOpenChange={(value) => { if (!value && !deletingBusy) setDeleting(null); }} title={product ? 'Ngừng bán sản phẩm?' : 'Xóa loại sản phẩm?'} description={product ? 'Sản phẩm sẽ được chuyển sang trạng thái ngừng bán và ẩn khỏi cửa hàng.' : 'Danh mục chỉ có thể xóa khi không còn sản phẩm liên kết.'}><p className="delete-item-name">{deleting?.productName || deleting?.categoryName}</p>{deleteError && <p className="form-error" role="alert">{deleteError}</p>}<div className="form-actions"><Button variant="outline" disabled={deletingBusy} onClick={() => setDeleting(null)}>Hủy</Button><Button variant="danger" disabled={deletingBusy} onClick={remove}>{deletingBusy ? 'Đang xử lý…' : product ? 'Ngừng bán' : 'Xóa danh mục'}</Button></div></Modal></>;
}

async function allPages(service, params) {
  const first = await service.list({ ...params, page: 0, size: 100 });
  const items = [...first.items];
  for (let page = 1; page < first.totalPages; page++) { const next = await service.list({ ...params, page, size: 100 }); items.push(...next.items); }
  return items;
}
function csvCell(value) {
  let text = String(value ?? '');
  // Prevent spreadsheet formula injection in exported user-supplied content.
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
