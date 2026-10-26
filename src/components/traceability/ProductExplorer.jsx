import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Search, Leaf } from 'lucide-react';
import { catalogService } from '@/services/client/catalogService';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { productHref, productImages } from '@/lib/productDetail';
import { ResourceState } from '@/components/common/ResourceState';
import { OriginSection } from './OriginSection';
import { CertificationSection } from './CertificationSection';
import { VariantSelector } from './VariantSelector';

export function ProductExplorer() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const keyword = useDebouncedValue(search.trim());
  const options = useResource(() => catalogService.products({ keyword: keyword || undefined, page, size: 12 }), [keyword, page]);
  const items = options.data?.items || [];
  const requestedId = params.get('product');
  const activeId = requestedId || (!options.loading && !options.error ? items[0]?.id : '');
  const detail = useResource(() => activeId ? catalogService.product(activeId) : Promise.resolve(null), [activeId]);
  const product = detail.data?.id === activeId ? detail.data : null;
  const pageCount = options.data?.totalPages || 0;
  const knownOption = items.some((item) => item.id === activeId);
  useEffect(() => {
    if (!product || detail.loading || !['#nguon-goc', '#chung-nhan', '#quy-cach'].includes(hash)) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
    return () => cancelAnimationFrame(frame);
  }, [product?.id, detail.loading, hash]);
  return <div id="ho-so-san-pham" className="scroll-mt-8">
    <section className="!mb-8 rounded-3xl border border-line bg-white p-5 shadow-[0_8px_32px_#29473504] sm:p-8" aria-labelledby="explorer-heading">
      <div className="!mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="!mb-2 text-[10px] font-semibold tracking-[0.2em] text-[#7a8c60]">HIỂU RÕ TRƯỚC KHI LỰA CHỌN</p><h2 id="explorer-heading" className="font-serif text-2xl font-medium text-primary sm:text-3xl">Khám phá hồ sơ sản phẩm</h2></div><p className="max-w-sm text-xs leading-6 text-stone-500">Chọn một sản phẩm để xem xuất xứ, chứng nhận và các quy cách được công bố.</p></div>
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div><label htmlFor="trace-search" className="!mb-2 block text-xs font-medium">Tìm theo tên hoặc mã</label><div className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-cream px-4"><Search size={17} className="shrink-0 text-[#83916f]" /><input id="trace-search" type="search" value={search} maxLength={200} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Ví dụ: cà rốt, trà thảo mộc…" className="min-w-0 flex-1 bg-transparent py-3 !text-sm placeholder:text-stone-400" /></div></div>
        <div><label htmlFor="trace-product" className="!mb-2 block text-xs font-medium">Sản phẩm bạn muốn tìm hiểu</label><select id="trace-product" value={activeId || ''} disabled={options.loading || Boolean(options.error) || !items.length} onChange={(event) => setParams((previous) => { const next = new URLSearchParams(previous); next.set('product', event.target.value); return next; })} className="min-h-12 w-full min-w-0 rounded-xl border border-line bg-cream px-3 py-3 !text-sm focus:border-primary disabled:opacity-50">{!activeId && <option value="">{options.loading ? 'Đang tải danh sách…' : 'Chưa có sản phẩm phù hợp'}</option>}{activeId && !knownOption && <option value={activeId}>{product?.productName || 'Sản phẩm đang được chọn'}</option>}{items.map((item) => <option key={item.id} value={item.id}>{item.productName || item.name} · {item.productCode || item.code}</option>)}</select></div>
      </div>
      {options.error && <ResourceState error={options.error} onRetry={options.reload} />}
      {!options.loading && !options.error && !items.length && <p className="!mt-4 text-xs leading-6 text-stone-500" role="status">Không tìm thấy sản phẩm phù hợp. Hãy thử từ khóa khác.</p>}
      {pageCount > 1 && <div className="!mt-4 flex items-center justify-end gap-3 text-xs text-stone-500"><button type="button" disabled={options.loading || page === 0} onClick={() => setPage((value) => value - 1)} className="flex size-11 items-center justify-center rounded-xl border border-line hover:bg-sage disabled:opacity-30" aria-label="Trang sản phẩm trước"><ArrowLeft size={15} /></button><span>Trang {page + 1} / {pageCount}</span><button type="button" disabled={options.loading || page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)} className="flex size-11 items-center justify-center rounded-xl border border-line hover:bg-sage disabled:opacity-30" aria-label="Trang sản phẩm tiếp theo"><ArrowRight size={15} /></button></div>}
    </section>
    {options.loading && !requestedId && <ResourceState loading />}
    {activeId && <>
      <ResourceState loading={detail.loading} error={detail.error || (!detail.loading && !product ? 'Sản phẩm không còn được công bố. Vui lòng chọn sản phẩm khác.' : '')} onRetry={detail.reload} />
      {!detail.loading && !detail.error && product && <>
        <div className="!mb-9 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-[#f0f3e9] p-5 sm:px-7"><div className="flex min-w-0 items-center gap-4"><img src={productImages(product)[0]?.url || '/images/vegetables.jpg'} alt={product.productName} className="size-16 shrink-0 rounded-xl object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/vegetables.jpg'; }} /><div className="min-w-0"><p className="!mb-1 text-[10px] uppercase tracking-widest text-[#7a8c60]">BẠN ĐANG TÌM HIỂU</p><h2 className="break-words text-base font-semibold text-primary">{product.productName}</h2><p className="!mt-1 text-xs text-stone-500">{product.categoryName}{product.productCode ? ` · ${product.productCode}` : ''}</p></div></div><Link to={productHref(product)} className="inline-flex min-h-11 items-center gap-2 text-xs font-medium">Xem chi tiết sản phẩm <ArrowUpRight size={15} /></Link></div>
        <div key={product.id}><OriginSection origin={product.origin} productName={product.productName} /><CertificationSection certificates={product.certifications || []} /><VariantSelector product={product} /></div>
      </>}
    </>}
    {!options.loading && !options.error && !activeId && !items.length && <div className="!mb-12 rounded-3xl bg-sage px-6 py-12 text-center"><Leaf size={35} strokeWidth={1.2} className="!mx-auto !mb-4 text-[#829767]" /><h3 className="font-serif text-2xl text-primary">Những hồ sơ đang được cập nhật</h3><p className="!mt-3 text-sm leading-7 text-stone-500">Thông tin nguồn gốc và chứng nhận sẽ hiển thị khi sản phẩm được công bố.</p><Link to="/san-pham" className="!mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium">Khám phá danh mục <ArrowRight size={15} /></Link></div>}
  </div>;
}
