import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Search } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';
import { useResource } from '@/hooks/useResource';
import { useStoreCatalogRefresh } from '@/hooks/useStoreCatalogRefresh';
import { matchesSearch } from '@/lib/adminFormat';
import { loadFavoriteProducts } from '@/services/client/favoriteProducts';
import { CommerceHeader } from '@/components/checkout/OrderUI';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetail } from '@/components/products/ProductDetail';
import { Pagination } from '@/components/common/Pagination';
import { ResourceState } from '@/components/common/ResourceState';
import { Button } from '@/components/ui/button';

const SIZE = 8;

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useShop();
  const [query, setQuery] = useState(''), [page, setPage] = useState(0), [selected, setSelected] = useState(null);
  const signature = JSON.stringify(favorites);
  const list = useResource(() => loadFavoriteProducts([...favorites].reverse()), [signature]);
  useStoreCatalogRefresh(list.reload, favorites.length > 0);
  useEffect(() => { setPage(0); }, [signature, query]);
  const products = (list.data?.products || []).filter((product) => favorites.includes(product.id)
    && matchesSearch(`${product.productName} ${product.productCode || ''}`, query));
  const totalPages = Math.ceil(products.length / SIZE), current = Math.min(page, Math.max(0, totalPages - 1));

  return <div className="container py-8 sm:py-12">
    <CommerceHeader title="Những món bạn yêu thích" description="Lưu lại những lựa chọn yêu thích để dễ tìm và mua vào lần sau." />
    <div className="favorites-toolbar">
      <label className="favorites-search"><Search size={18} className="shrink-0 text-stone-400" />
        <input type="search" aria-label="Tìm sản phẩm yêu thích" placeholder="Tìm theo tên hoặc mã sản phẩm…" value={query} maxLength={150} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <span className="text-xs font-medium text-primary">Đã lưu {favorites.length} sản phẩm</span>
    </div>
    <ResourceState loading={list.loading && favorites.length > 0} error={list.error} onRetry={list.reload} />
    {!!list.data?.failed && <div role="status" className="!mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">
      <p>Chưa tải được {list.data.failed} sản phẩm. Các lựa chọn yêu thích vẫn được giữ lại.</p><Button size="sm" variant="outline" onClick={() => list.reload()}>Thử lại</Button>
    </div>}
    {!!list.data?.unavailable.length && <div className="!mb-5 rounded-xl border border-line p-4 text-xs leading-6 text-stone-500">
      <p>{list.data.unavailable.length} sản phẩm đã lưu hiện không còn được hiển thị tại cửa hàng.</p>
      <Button size="sm" variant="ghost" onClick={() => list.data.unavailable.forEach((id) => { if (favorites.includes(id)) toggleFavorite(id); })}>Bỏ lưu các sản phẩm này</Button>
    </div>}
    {!list.loading && !list.error && <>
      {products.length ? <div className="product-grid">{products.slice(current * SIZE, (current + 1) * SIZE).map((product, index) =>
        <ProductCard key={product.id} product={product} index={index} onView={setSelected} hideWhenUnavailable={false} />)}
      </div> : !list.data?.failed && <section className="rounded-3xl border border-line bg-[#F7FAF5] px-5 py-16 text-center">
        <Heart size={42} className="!mx-auto !mb-5 text-[#7b9469]" strokeWidth={1.3} />
        <h2 className="font-serif text-2xl text-primary">{query ? 'Chưa tìm thấy món phù hợp' : favorites.length ? 'Cửa hàng đang cập nhật các sản phẩm đã lưu' : 'Lưu lại những món bạn thích'}</h2>
        <p className="!mx-auto !mt-3 max-w-md text-sm leading-7 text-stone-500">{query ? 'Thử tìm với tên hoặc mã sản phẩm khác nhé.' : 'Bấm vào trái tim trên sản phẩm để lưu vào danh sách này.'}</p>
        <Link to="/san-pham" className="!mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm !text-white">Khám phá sản phẩm<ArrowRight size={16} /></Link>
      </section>}
      <Pagination page={current} size={SIZE} totalPages={totalPages} totalElements={products.length} onChange={setPage} />
    </>}
    {selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}
  </div>;
}
