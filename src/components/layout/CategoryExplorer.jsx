import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Leaf } from 'lucide-react';
import { storeCategoryMenuEntries, storeCategoryPath } from '@/lib/storeCategoryTree';

const href = (id) => `/san-pham?category=${encodeURIComponent(id)}`;

export function CategoryExplorer({ categories, selectedId = '', onNavigate, ownerId }) {
  const { parent, items } = useMemo(() => storeCategoryMenuEntries(categories), [categories]);
  const selectedPath = useMemo(() => new Set(storeCategoryPath(categories, selectedId).map((entry) => String(entry.id))), [categories, selectedId]);
  const [path, setPath] = useState([]), [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  const anchors = useRef(new Map()), lists = useRef(new Map()), closing = useRef(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)');
    const resize = () => { setMobile(media.matches); setPath([]); };
    media.addEventListener('change', resize);
    return () => { media.removeEventListener('change', resize); clearTimeout(closing.current); };
  }, []);
  useEffect(() => { setPath([]); }, [categories]);
  const keepOpen = () => clearTimeout(closing.current);
  const leave = () => { clearTimeout(closing.current); closing.current = setTimeout(() => setPath([]), 200); };
  function expand(node, depth, anchor) {
    keepOpen(); anchors.current.set(depth, anchor);
    setPath((old) => [...old.slice(0, depth), node]);
  }
  function back(depth) {
    setPath((old) => old.slice(0, Math.max(0, depth - 1)));
    anchors.current.get(depth - 1)?.focus();
  }
  function keydown(event, node, depth) {
    const options = [...(lists.current.get(depth)?.children || [])].map((li) => li.querySelector('.category-nav-item')).filter(Boolean);
    const index = options.indexOf(event.currentTarget);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[next]?.focus();
    } else if (event.key === 'ArrowRight' && node.children.length) {
      event.preventDefault(); expand(node, depth, event.currentTarget);
      requestAnimationFrame(() => lists.current.get(depth + 1)?.querySelector('.category-nav-item')?.focus());
    } else if (event.key === 'ArrowLeft' && depth > 0) { event.preventDefault(); back(depth); }
  }
  function renderList(nodes, depth) {
    return <ul className={`category-nav-list category-nav-level-${depth}`} ref={(element) => { if (element) lists.current.set(depth, element); else lists.current.delete(depth); }}>
      {nodes.map((node) => {
        const expanded = path[depth]?.id === node.id;
        const selected = selectedPath.has(String(node.id));
        const title = <>{depth === 0 && <Leaf size={17} aria-hidden="true" />}<span>{node.name}</span>{node.children.length > 0 && (mobile ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />)}</>;
        return <li key={node.id}>
          {node.children.length ? <button type="button" className={`category-nav-item ${expanded ? 'is-expanded' : ''} ${selected ? 'is-selected' : ''}`} aria-expanded={expanded} aria-controls={`${ownerId}-children-${node.id}`}
            onClick={(event) => { if (expanded) setPath((old) => old.slice(0, depth)); else expand(node, depth, event.currentTarget); }}
            onKeyDown={(event) => keydown(event, node, depth)}>{title}</button>
            : <Link className={`category-nav-item ${selected ? 'is-selected' : ''}`} to={href(node.id)} aria-current={selectedId === node.id ? 'page' : undefined} onClick={onNavigate}
              onMouseEnter={() => { if (!mobile) { keepOpen(); setPath((old) => old.slice(0, depth)); } }}
              onFocus={() => { if (!mobile) setPath((old) => old.slice(0, depth)); }} onKeyDown={(event) => keydown(event, node, depth)}>{title}</Link>}
          {mobile && expanded && <div id={`${ownerId}-children-${node.id}`} className="category-inline-children"><Link className="category-view-all" to={href(node.id)} onClick={onNavigate}>Xem tất cả {node.name.toLocaleLowerCase('vi-VN')}</Link>{renderList(node.children, depth + 1)}</div>}
        </li>;
      })}
    </ul>;
  }
  if (!items.length) return <p className="category-empty">Cửa hàng đang cập nhật danh mục sản phẩm.</p>;
  return <nav className="category-explorer" aria-label="Danh mục sản phẩm" onMouseEnter={keepOpen} onMouseLeave={mobile ? undefined : leave}>
    {parent && <div className="category-family-heading"><Link to={href(parent.id)} onClick={onNavigate} aria-current={selectedId === parent.id ? 'page' : undefined}>{parent.name}</Link><span>Chọn nhóm sản phẩm</span></div>}
    {renderList(items, 0)}
    {!mobile && path.map((node, depth) => <CategoryFlyout key={`${depth}-${node.id}`} ownerId={ownerId} node={node} anchor={anchors.current.get(depth)} onEnter={keepOpen} onLeave={leave} onBack={() => back(depth + 1)} onNavigate={onNavigate}>
      {renderList(node.children, depth + 1)}
    </CategoryFlyout>)}
  </nav>;
}

function CategoryFlyout({ ownerId, node, anchor, onEnter, onLeave, onBack, onNavigate, children }) {
  const ref = useRef(null), [position, setPosition] = useState(null);
  useLayoutEffect(() => {
    function positionPanel() {
      if (!anchor || !ref.current) return;
      const rectangle = anchor.getBoundingClientRect(), gap = 3, margin = 12;
      const width = Math.min(272, window.innerWidth - margin * 2);
      const height = Math.min(ref.current.scrollHeight, window.innerHeight - margin * 2);
      const right = rectangle.right + gap, left = rectangle.left - width - gap;
      const x = right + width <= window.innerWidth - margin ? right : left >= margin ? left : Math.max(margin, window.innerWidth - margin - width);
      setPosition({ left: x, top: Math.max(margin, Math.min(rectangle.top - 5, window.innerHeight - margin - height)), width, maxHeight: window.innerHeight - margin * 2 });
    }
    positionPanel(); window.addEventListener('resize', positionPanel); window.addEventListener('scroll', positionPanel, true);
    return () => { window.removeEventListener('resize', positionPanel); window.removeEventListener('scroll', positionPanel, true); };
  }, [anchor]);
  return createPortal(<div ref={ref} id={`${ownerId}-children-${node.id}`} data-category-owner={ownerId} className="category-flyout" style={position || { visibility: 'hidden' }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
    <div className="category-flyout-heading"><button type="button" onClick={onBack} aria-label={`Quay lại từ ${node.name}`}><ChevronRight size={14} className="rotate-180" /></button><strong>{node.name}</strong></div>
    <Link className="category-view-all" to={href(node.id)} onClick={onNavigate}>Xem tất cả {node.name.toLocaleLowerCase('vi-VN')}</Link>
    {children}
  </div>, document.body);
}
