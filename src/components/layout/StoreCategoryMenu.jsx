import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useResource } from '@/hooks/useResource';
import { catalogService } from '@/services/client/catalogService';
import { ResourceState } from '@/components/common/ResourceState';
import { CategoryExplorer } from './CategoryExplorer';

export function StoreCategoryMenu({ label = 'Danh mục sản phẩm', iconOnly = false, selectedId = '', onNavigate }) {
  const [open, setOpen] = useState(false), [position, setPosition] = useState({ top: 100, left: 12, width: 288, maxHeight: '70dvh' });
  const root = useRef(null), panel = useRef(null), trigger = useRef(null), id = useId(), location = useLocation();
  const categories = useResource(() => open ? catalogService.categoryTree() : null, [open]);
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useLayoutEffect(() => {
    if (!open) return;
    const positionPanel = () => {
      const rectangle = trigger.current?.getBoundingClientRect();
      if (!rectangle) return;
      const margin = 12, mobile = window.innerWidth <= 700;
      const width = mobile ? window.innerWidth - margin * 2 : Math.min(288, window.innerWidth - margin * 2);
      const top = Math.max(margin, Math.min(rectangle.bottom + 8, window.innerHeight - 180));
      setPosition({ top, left: mobile ? margin : Math.max(margin, Math.min(rectangle.left, window.innerWidth - margin - width)), width, maxHeight: window.innerHeight - top - margin });
    };
    positionPanel(); window.addEventListener('resize', positionPanel); window.addEventListener('scroll', positionPanel, true);
    return () => { window.removeEventListener('resize', positionPanel); window.removeEventListener('scroll', positionPanel, true); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const contains = (target) => root.current?.contains(target) || panel.current?.contains(target) || target?.closest?.('[data-category-owner]')?.getAttribute('data-category-owner') === id;
    const outside = (event) => { if (!contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('focusin', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); document.removeEventListener('keydown', escape); };
  }, [open, id]);
  useEffect(() => {
    if (!open || categories.loading) return;
    const frame = requestAnimationFrame(() => (panel.current?.querySelector('.category-nav-item') || panel.current)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, categories.loading, categories.data, categories.error]);
  function navigate() { setOpen(false); onNavigate?.(); }
  const selected = selectedId || new URLSearchParams(location.search).get('category') || '';
  return <div ref={root} className={`store-category-menu ${iconOnly ? 'icon-only' : ''}`}>
    <button ref={trigger} type="button" className="category-menu-trigger" aria-label={iconOnly ? 'Mở danh mục sản phẩm' : undefined} aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); } }}>
      {!iconOnly && <><Menu size={18} /><span>{label}</span></>}<ChevronDown size={15} />
    </button>
    {open && createPortal(<div ref={panel} id={id} data-category-owner={id} className="category-dropdown-panel" style={position} role="region" tabIndex={-1} aria-label="Danh mục sản phẩm">
      <div className="category-dropdown-heading"><span>Danh mục sản phẩm</span><button type="button" onClick={() => { setOpen(false); trigger.current?.focus(); }} aria-label="Đóng danh mục"><X size={18} /></button></div>
      <Link className="category-all-products" to="/san-pham" onClick={navigate}>Tất cả sản phẩm</Link>
      <ResourceState loading={categories.loading} error={categories.error} onRetry={categories.reload} />
      {!categories.loading && !categories.error && <CategoryExplorer ownerId={id} categories={categories.data || []} selectedId={selected} onNavigate={navigate} />}
    </div>, document.body)}
  </div>;
}
