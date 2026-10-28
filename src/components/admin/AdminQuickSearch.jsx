import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { flattenAdminLinks, getAdminNavigation } from '@/constants/adminNavigation';
import { matchesSearch } from '@/lib/adminFormat';

export function AdminQuickSearch({ user }) {
  const [query, setQuery] = useState(''), [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  const root = useRef(null), input = useRef(null), id = useId();
  const { pathname } = useLocation(), navigate = useNavigate();
  const items = flattenAdminLinks(getAdminNavigation(user)).filter((item) => matchesSearch(item.name, query)).slice(0, 12);
  useEffect(() => { setOpen(false); setQuery(''); setActive(-1); }, [pathname, user]);
  useEffect(() => {
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const shortcut = (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !document.querySelector('[aria-modal="true"], [role="dialog"][data-state="open"]')) { event.preventDefault(); input.current?.focus(); setOpen(true); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', shortcut);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', shortcut); };
  }, []);
  return <div ref={root} className="adk-quick-search" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <div className="adk-search-input"><Search size={17} aria-hidden="true" /><input ref={input} type="search" role="combobox" aria-expanded={open} aria-controls={`${id}-results`} aria-autocomplete="list" aria-activedescendant={open && items[active] ? `${id}-result-${active}` : undefined} value={query} autoComplete="off" placeholder="Tìm chức năng…" aria-label="Tìm chức năng quản trị" onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(-1); }} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); }
      if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive((old) => Math.min(old + 1, items.length - 1)); }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActive((old) => Math.max(old - 1, 0)); }
      if (event.key === 'Enter' && open && items[active]) { event.preventDefault(); navigate(`/admin/${items[active].path}`); setOpen(false); input.current?.blur(); }
    }} />{query ? <button type="button" aria-label="Xóa từ khóa" onClick={() => { setQuery(''); setActive(-1); input.current?.focus(); }}><X size={14} /></button> : <kbd aria-hidden="true">Ctrl K</kbd>}</div>
    {open && <div className="adk-search-results"><p>Chức năng theo quyền của bạn</p><ul role="listbox" id={`${id}-results`} aria-label="Chức năng tìm được">{items.map((item, index) => { const Icon = item.icon; return <li role="option" key={item.path} id={`${id}-result-${index}`} aria-selected={index === active}><Link tabIndex={-1} to={`/admin/${item.path}`} className={index === active ? 'is-active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => { setOpen(false); input.current?.blur(); }}><Icon size={16} /><span>{item.name}</span><ArrowUpRight size={14} /></Link></li>; })}{!items.length && <li className="adk-search-empty">Không tìm thấy chức năng phù hợp.</li>}</ul></div>}
  </div>;
}
