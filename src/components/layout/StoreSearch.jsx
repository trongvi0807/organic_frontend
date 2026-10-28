import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LoaderCircle, Search, X } from 'lucide-react';
import { catalogService } from '@/services/client/catalogService';
import { productHref, safeMediaUrl } from '@/lib/productDetail';
import { currency } from '@/lib/utils';

export function StoreSearch({ onExpandedChange }) {
  const id = useId(), root = useRef(null), input = useRef(null), navigate = useNavigate(), location = useLocation();
  const [expanded, setExpanded] = useState(false), [open, setOpen] = useState(false), [query, setQuery] = useState(''), [active, setActive] = useState(-1), [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ term: '', items: [], status: 'idle' });
  const term = query.trim(), items = result.term === term && result.status === 'ready' ? result.items : [];
  const searching = open && term.length >= 1 && (result.term !== term || result.status === 'loading');
  useEffect(() => { onExpandedChange?.(expanded); }, [expanded, onExpandedChange]);
  useEffect(() => { if (expanded) input.current?.focus(); }, [expanded]);
  useEffect(() => { setOpen(false); setExpanded(false); setQuery(''); setActive(-1); }, [location.pathname, location.search]);
  useEffect(() => {
    const outside = (event) => { if (!root.current?.contains(event.target)) { setOpen(false); setExpanded(false); } };
    document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => {
    if (!open || !term) return;
    let current = true;
    const timer = setTimeout(() => {
      setResult({ term, items: [], status: 'loading' });
      catalogService.products({ page: 0, size: 6, keyword: term }).then((page) => { if (current) setResult({ term, items: page.items || [], status: 'ready', total: page.totalElements }); })
        .catch(() => { if (current) setResult({ term, items: [], status: 'error' }); });
    }, 250);
    return () => { current = false; clearTimeout(timer); };
  }, [term, open, revision]);
  function allResults() { if (term) { navigate(`/san-pham?q=${encodeURIComponent(term)}`); setOpen(false); setExpanded(false); } }
  function choose(item) { setOpen(false); setExpanded(false); navigate(productHref(item)); }
  function close() { setOpen(false); setExpanded(false); input.current?.blur(); }
  return <div ref={root} className={`store-search ${expanded ? 'is-expanded' : ''}`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setExpanded(false); } }}>
    <button type="button" className="icon-button store-search-toggle" aria-label="Mở ô tìm sản phẩm" aria-expanded={expanded} aria-controls={`${id}-form`} onClick={() => { setExpanded(true); setOpen(true); input.current?.focus(); }}><Search size={21} /></button>
    <form id={`${id}-form`} className="store-search-form" onSubmit={(event) => { event.preventDefault(); if (active >= 0 && items[active]) choose(items[active]); else allResults(); }}>
      <Search size={18} className="shrink-0 text-stone-500" aria-hidden="true" /><input ref={input} role="combobox" aria-label="Tìm tên hoặc mã sản phẩm" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-results`} aria-activedescendant={open && items[active] ? `${id}-${active}` : undefined} placeholder="Tìm tên hoặc mã sản phẩm…" autoComplete="off" maxLength={150} value={query} onFocus={() => { setExpanded(true); setOpen(true); }} onChange={(event) => { setQuery(event.target.value); setActive(-1); setOpen(true); }} onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive((index) => Math.min(index + 1, items.length - 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => Math.max(index - 1, -1)); }
      }} />{query ? <button type="button" className="icon-button !h-7 !w-7 shrink-0" aria-label="Xóa từ khóa tìm kiếm" onClick={() => { setQuery(''); setActive(-1); input.current?.focus(); }}><X size={15} /></button> : <button type="button" className="store-search-close icon-button !h-7 !w-7" aria-label="Đóng tìm kiếm" onClick={close}><X size={15} /></button>}
    </form>
    {open && <div className="store-search-results"><div className="!mb-1 flex items-center justify-between gap-3 px-4 py-2 text-[10px] font-semibold tracking-wider text-stone-400"><span>{term ? 'GỢI Ý SẢN PHẨM' : 'TÌM ĐIỀU TƯƠI LÀNH'}</span><button type="button" className="icon-button !h-6 !w-6" aria-label="Đóng gợi ý tìm kiếm" onClick={close}><X size={15} /></button></div>
      {!term && <p className="px-4 pb-4 text-xs leading-6 text-stone-500">Nhập tên sản phẩm hoặc mã như SP01 để tìm nhanh ngay tại đây.</p>}
      {searching && <p role="status" className="flex items-center gap-2 p-4 text-xs text-stone-500"><LoaderCircle size={17} className="animate-spin" />Đang tìm sản phẩm…</p>}
      {result.term === term && result.status === 'error' && <div role="status" className="p-4 text-xs leading-6 text-amber-800">Chưa tải được gợi ý. Vui lòng thử lại.<button type="button" className="!ml-2 underline" onClick={() => setRevision((value) => value + 1)}>Thử lại</button></div>}
      <ul id={`${id}-results`} role="listbox" aria-label="Sản phẩm gợi ý">{items.map((item, index) => <li role="option" key={item.id} id={`${id}-${index}`} aria-selected={active === index}><button type="button" tabIndex={-1} className={`store-search-option ${active === index ? 'is-active' : ''}`} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(item)}>
        <img src={safeMediaUrl(item.imageUrl) || '/images/vegetables.jpg'} alt="" loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/vegetables.jpg'; }} /><span className="min-w-0 flex-1"><strong className="block truncate text-xs font-medium">{item.productName}</strong><span className="!mt-1 block text-[10px] text-stone-500">{item.productCode ? `Mã ${item.productCode}` : 'Chưa có mã sản phẩm'}</span><span className="!mt-1 block text-xs font-semibold text-[#1B4D2E]">{currency(item.minPrice)}{item.compareAtPrice && <del className="!ml-2 text-[10px] font-normal text-stone-400">{currency(item.compareAtPrice)}</del>}</span></span><ArrowRight size={15} className="shrink-0 text-stone-400" />
      </button></li>)}</ul>{!!term && result.term === term && result.status === 'ready' && !items.length && <p role="status" className="px-4 py-5 text-xs leading-6 text-stone-500">Chưa tìm thấy sản phẩm phù hợp với “{term}”.</p>}{!!term && <button type="button" className="flex w-full items-center justify-between border-t border-line p-4 text-xs font-medium text-[#1B4D2E] hover:bg-sage" onClick={allResults}>Xem tất cả kết quả<ArrowRight size={15} /></button>}
    </div>}
  </div>;
}
