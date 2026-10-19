import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Leaf } from 'lucide-react';
import { catalogService } from '@/services/client/catalogService';
import { useResource } from '@/hooks/useResource';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetail } from '@/components/products/ProductDetail';
import { Pagination } from '@/components/common/Pagination';
import { ResourceState } from '@/components/common/ResourceState';

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const category = params.get('category') || '';
  const query = params.get('q') || '';
  const page = Math.max(0, Number(params.get('page')) || 0);
  const categories = useResource(() => catalogService.categories({ size: 100 }), []);
  const products = useResource(() => catalogService.products({ page, size: 8, keyword: query || undefined, categoryId: category || undefined }), [page, query, category]);
  function change(key, value) { setParams((old) => { const next = new URLSearchParams(old); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); return next; }); }
  return <div className="catalog-page container"><div className="breadcrumbs"><Link to="/">Trang chủ</Link><span>/</span><span>Sản phẩm</span></div><div className="catalog-heading"><span className="eyebrow"><Leaf size={14} /> NHỮNG LỰA CHỌN TỪ THIÊN NHIÊN</span><h1>Tươi lành, theo cách của bạn.</h1><p>Chọn những điều tốt lành cho bữa ăn mỗi ngày.</p></div><div className="catalog-toolbar"><form className="search-field" onSubmit={(event) => { event.preventDefault(); change('q', new FormData(event.currentTarget).get('q')); }} key={query}><Search size={18} /><input name="q" defaultValue={query} placeholder="Tìm sản phẩm tươi lành…" aria-label="Tìm sản phẩm" /><button type="submit" aria-label="Tìm kiếm"><ArrowSearch /></button></form><div className="filter-select"><SlidersHorizontal size={16} /><select value={category} onChange={(event) => change('category', event.target.value)} aria-label="Danh mục sản phẩm"><option value="">Tất cả danh mục</option>{categories.data?.items.map((item) => <option key={item.id} value={item.id}>{item.categoryName}</option>)}</select></div>{(query || category) && <button className="clear-filter" onClick={() => setParams({})}><X size={14} />Xóa lọc</button>}<span className="catalog-count">{products.data?.totalElements ?? '…'} sản phẩm</span></div>{categories.error && <ResourceState error={categories.error} onRetry={categories.reload} />}<ResourceState loading={products.loading} error={products.error} empty={!products.data?.items.length} onRetry={products.reload} />{!products.loading && !products.error && <><div className="product-grid">{products.data?.items.map((product) => <ProductCard key={product.id} product={product} onView={setSelected} />)}</div><Pagination page={page} size={8} totalPages={products.data?.totalPages || 0} totalElements={products.data?.totalElements || 0} onChange={(value) => change('page', String(value))} /></>}{selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}</div>;
}
function ArrowSearch() { return <span className="text-sm">Tìm</span>; }
