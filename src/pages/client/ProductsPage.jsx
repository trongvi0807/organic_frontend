import { StoreCategoryMenu } from '@/components/layout/StoreCategoryMenu';
import { useEffect, useState } from 'react';
import { useStoreCatalogRefresh } from '@/hooks/useStoreCatalogRefresh';
import { Reveal } from '@/components/common/Reveal';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, Leaf, ChevronRight } from 'lucide-react';
import { catalogService } from '@/services/client/catalogService';
import { useResource } from '@/hooks/useResource';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetail } from '@/components/products/ProductDetail';
import { Pagination } from '@/components/common/Pagination';
import { ResourceState } from '@/components/common/ResourceState';
import { useHome } from '@/contexts/HomeContext';
import { withHomePricing } from '@/lib/apiData';
import { storeCategoryPath } from '@/lib/storeCategoryTree';

export default function ProductsPage() {
  const { data: home } = useHome();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const category = params.get('category') || '';
  const query = params.get('q') || '';
  const page = Math.max(0, Number(params.get('page')) || 0);
  const categories = useResource(() => catalogService.categoryTree(), []);
  const categoryPath = storeCategoryPath(categories.data || [], category);
  // The backend expands the hierarchy before pagination, so totals include all descendants.
  const products = useResource(() => catalogService.products({ page, size: 8, keyword: query || undefined, categoryId: category || undefined, includeDescendants: true }), [page, query, category]);
  useStoreCatalogRefresh(products.reload);
  useEffect(() => {
    if (!products.loading && !products.error && products.data && page > Math.max(0, products.data.totalPages - 1)) {
      setParams((old) => { const next = new URLSearchParams(old); next.delete('page'); return next; }, { replace: true });
    }
  }, [products.data, products.loading, products.error, page, setParams]);
  function change(key, value) { setParams((old) => { const next = new URLSearchParams(old); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); return next; }); }
  return <div className="catalog-page container"><nav className="breadcrumbs !flex-wrap" aria-label="Đường dẫn danh mục"><Link to="/">Trang chủ</Link><span>/</span><Link to="/san-pham">Sản phẩm</Link>{categoryPath.map((item) => <span key={item.id} className="inline-flex items-center gap-2"><ChevronRight size={12} /><Link to={`/san-pham?category=${encodeURIComponent(item.id)}`}>{item.name}</Link></span>)}</nav><Reveal className="catalog-heading"><span className="eyebrow"><Leaf size={14} /> NHỮNG LỰA CHỌN TỪ THIÊN NHIÊN</span><h1>Tươi lành, theo cách của bạn.</h1><p>Chọn những điều tốt lành cho bữa ăn mỗi ngày.</p></Reveal><div className="catalog-toolbar"><form className="search-field" onSubmit={(event) => { event.preventDefault(); change('q', new FormData(event.currentTarget).get('q')); }} key={query}><Search size={18} /><input name="q" defaultValue={query} placeholder="Tìm sản phẩm tươi lành…" aria-label="Tìm sản phẩm" /><button type="submit" aria-label="Tìm kiếm"><ArrowSearch /></button></form><StoreCategoryMenu selectedId={category} label={categoryPath.at(-1)?.name || 'Danh mục sản phẩm'} />{(query || category) && <button className="clear-filter" onClick={() => setParams({})}><X size={14} />Xóa lọc</button>}<span className="catalog-count">{products.data?.totalElements ?? '…'} sản phẩm</span></div>{categories.error && <ResourceState error={categories.error} onRetry={categories.reload} />}<ResourceState loading={products.loading} error={products.error} empty={!products.data?.items.length} onRetry={products.reload} />{!products.loading && !products.error && <><div className="product-grid">{products.data?.items.map((product,index) => <ProductCard index={index} key={product.id} product={withHomePricing(product,home)} categories={categories.data || home?.categories} onView={setSelected} />)}</div><Pagination page={page} size={8} totalPages={products.data?.totalPages || 0} totalElements={products.data?.totalElements || 0} onChange={(value) => change('page', String(value))} /></>}{selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}</div>;
}
function ArrowSearch() { return <span className="text-sm">Tìm</span>; }
