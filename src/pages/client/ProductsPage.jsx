import { Select } from '@/components/ui/field';
import { useState } from 'react';
import { Reveal } from '@/components/common/Reveal';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Leaf, ChevronRight } from 'lucide-react';
import { catalogService } from '@/services/client/catalogService';
import { useResource } from '@/hooks/useResource';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetail } from '@/components/products/ProductDetail';
import { Pagination } from '@/components/common/Pagination';
import { ResourceState } from '@/components/common/ResourceState';
import { useHome } from '@/contexts/HomeContext';
import { withHomePricing } from '@/lib/apiData';
import { storeCategoryOptions, storeCategoryPath } from '@/lib/storeCategoryTree';

export default function ProductsPage() {
  const { data: home } = useHome();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const category = params.get('category') || '';
  const query = params.get('q') || '';
  const page = Math.max(0, Number(params.get('page')) || 0);
  const categories = useResource(() => catalogService.categoryTree(), []);
  const categoryOptions = storeCategoryOptions(categories.data || []);
  const categoryPath = storeCategoryPath(categories.data || [], category);
  const children = categoryOptions.filter((item) => String(item.parentId || '') === category);
  // The backend expands the hierarchy before pagination, so totals include all descendants.
  const products = useResource(() => catalogService.products({ page, size: 8, keyword: query || undefined, categoryId: category || undefined, includeDescendants: true }), [page, query, category]);
  function change(key, value) { setParams((old) => { const next = new URLSearchParams(old); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); return next; }); }
  return <div className="catalog-page container"><nav className="breadcrumbs !flex-wrap" aria-label="Đường dẫn danh mục"><Link to="/">Trang chủ</Link><span>/</span><Link to="/san-pham">Sản phẩm</Link>{categoryPath.map((item) => <span key={item.id} className="inline-flex items-center gap-2"><ChevronRight size={12} /><Link to={`/san-pham?category=${encodeURIComponent(item.id)}`}>{item.name}</Link></span>)}</nav><Reveal className="catalog-heading"><span className="eyebrow"><Leaf size={14} /> NHỮNG LỰA CHỌN TỪ THIÊN NHIÊN</span><h1>Tươi lành, theo cách của bạn.</h1><p>Chọn những điều tốt lành cho bữa ăn mỗi ngày.</p></Reveal><div className="catalog-toolbar"><form className="search-field" onSubmit={(event) => { event.preventDefault(); change('q', new FormData(event.currentTarget).get('q')); }} key={query}><Search size={18} /><input name="q" defaultValue={query} placeholder="Tìm sản phẩm tươi lành…" aria-label="Tìm sản phẩm" /><button type="submit" aria-label="Tìm kiếm"><ArrowSearch /></button></form><div className="filter-select"><SlidersHorizontal size={16} /><Select value={category} onChange={(event) => change('category', event.target.value)} aria-label="Danh mục sản phẩm"><option value="">Tất cả danh mục</option>{categoryOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></div>{(query || category) && <button className="clear-filter" onClick={() => setParams({})}><X size={14} />Xóa lọc</button>}<span className="catalog-count">{products.data?.totalElements ?? '…'} sản phẩm</span></div>{!!children.length && <section className="mb-6 rounded-2xl border border-line bg-[#F7FAF5] p-4" aria-label="Các loại sản phẩm thuộc danh mục"><h2 className="!font-sans !text-sm !font-semibold !text-[#1B4D2E]">Các loại sản phẩm thuộc {categoryPath.at(-1)?.name || 'danh mục này'}</h2><div className="mt-3 flex flex-wrap gap-2">{children.map((item) => <button type="button" key={item.id} className="rounded-full border border-line bg-white px-4 py-2 text-sm text-primary hover:bg-sage" onClick={() => change('category', item.id)}>{item.categoryName || item.name}<ChevronRight size={13} className="ml-1 inline" /></button>)}</div><p className="mt-3 text-xs leading-5 text-stone-600">Đang hiển thị sản phẩm của danh mục này và các loại con. Chọn một loại bên trên để lọc cụ thể hơn.</p></section>}{categories.error && <ResourceState error={categories.error} onRetry={categories.reload} />}<ResourceState loading={products.loading} error={products.error} empty={!products.data?.items.length} onRetry={products.reload} />{!products.loading && !products.error && <><div className="product-grid">{products.data?.items.map((product,index) => <ProductCard index={index} key={product.id} product={withHomePricing(product,home)} categories={categories.data || home?.categories} onView={setSelected} />)}</div><Pagination page={page} size={8} totalPages={products.data?.totalPages || 0} totalElements={products.data?.totalElements || 0} onChange={(value) => change('page', String(value))} /></>}{selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}</div>;
}
function ArrowSearch() { return <span className="text-sm">Tìm</span>; }
