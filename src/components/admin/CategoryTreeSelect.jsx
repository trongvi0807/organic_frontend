import { useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Leaf, X } from 'lucide-react';
import { ValidationContext } from './AdminForm';
import { adminCategoryTree } from '@/lib/adminCategoryTree';
import { productCategoryOptions } from '@/lib/productFormOptions';
import { storeCategoryPath } from '@/lib/storeCategoryTree';
import { matchesSearch } from '@/lib/adminFormat';

export function CategoryTreeSelect({ categories, value = '', onChange, excludedId, allowRoot = false, required = false, name, disabled, 'aria-label': label = 'Loại sản phẩm' }) {
  const id = useId(), root = useRef(null), input = useRef(null), columnsRef = useRef(null);
  const skipFocusOpen = useRef(false), editing = useRef(false);
  const validation = useContext(ValidationContext);
  const tree = useMemo(() => adminCategoryTree(categories, excludedId), [categories, excludedId]);
  const options = useMemo(() => productCategoryOptions(tree.categories, value), [tree.categories, value]);
  const chosen = options.find((option) => String(option.value) === String(value));
  const rootLabel = 'Không có (danh mục gốc)';
  const selectedLabel = chosen?.label || (allowRoot && !value ? rootLabel : '');
  const [query, setQuery] = useState(selectedLabel), [search, setSearch] = useState('');
  const [open, setOpen] = useState(false), [expanded, setExpanded] = useState([]);

  useEffect(() => {
    if (editing.current) { editing.current = false; return; }
    setQuery(selectedLabel); setSearch('');
    input.current?.setCustomValidity(required && !value ? 'Vui lòng chọn loại sản phẩm.' : '');
    if (value || input.current?.getAttribute('aria-invalid') === 'true') validation?.validate(input.current);
  }, [value, selectedLabel, required, validation?.validate]);

  function cancel(restoreFocus = false) {
    setOpen(false); setQuery(selectedLabel); setSearch('');
    input.current?.setCustomValidity(required && !value ? 'Vui lòng chọn loại sản phẩm.' : '');
    validation?.validate(input.current);
    if (restoreFocus && document.activeElement !== input.current) { skipFocusOpen.current = true; input.current?.focus(); }
  }

  useEffect(() => {
    if (!open) return;
    const outside = (event) => { if (!root.current?.contains(event.target)) cancel(); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, selectedLabel, value, required]);

  const columns = [{ parent: null, nodes: tree.roots }];
  for (const selectedId of expanded) {
    const node = columns.at(-1).nodes.find((item) => String(item.id) === selectedId);
    if (!node?.children.length) break;
    columns.push({ parent: node, nodes: node.children });
  }
  const depth = columns.length;
  useEffect(() => {
    if (open && !search) columnsRef.current?.scrollTo({ left: columnsRef.current.scrollWidth, behavior: 'smooth' });
  }, [depth, open, search]);

  function show() {
    if (disabled || open) return;
    const path = storeCategoryPath(tree.categories, value);
    setExpanded(path.slice(0, -1).map((node) => String(node.id)));
    setSearch(''); setOpen(true);
  }

  function choose(node) {
    if (node?.status === 'inactive' && String(node.id) !== String(value)) return;
    const next = node?.id || '';
    input.current.setCustomValidity(required && !next ? 'Vui lòng chọn loại sản phẩm.' : '');
    setQuery(node ? options.find((option) => String(option.value) === String(next))?.label || node.name : rootLabel);
    setSearch(''); onChange(next); setOpen(false);
    validation?.validate(input.current);
    if (document.activeElement !== input.current) { skipFocusOpen.current = true; input.current.focus(); }
  }

  function expand(node, level) { setExpanded((old) => [...old.slice(0, level), String(node.id)]); }
  function focusColumn(level) { root.current?.querySelector(`[data-category-column="${level}"] .category-tree-option:not(:disabled)`)?.focus(); }
  function moveFocus(event, node, level) {
    const buttons = [...event.currentTarget.closest('[data-category-column]').querySelectorAll('.category-tree-option:not(:disabled)')];
    const index = buttons.indexOf(event.currentTarget);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    } else if (event.key === 'ArrowRight' && node?.children.length) {
      event.preventDefault(); expand(node, level); requestAnimationFrame(() => focusColumn(level + 1));
    } else if (event.key === 'ArrowLeft' && level > 0) {
      event.preventDefault(); setExpanded((old) => old.slice(0, level - 1)); requestAnimationFrame(() => focusColumn(level - 1));
    }
  }

  const hits = search.trim() ? options.filter((option) => matchesSearch(option.search, search)) : [];
  return <div ref={root} className="admin-category-select" onBlur={(event) => { if (event.relatedTarget && !root.current?.contains(event.relatedTarget)) cancel(); }} onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); cancel(true); }
  }}>
    <div className="relative">
      <input ref={input} className="input !pr-10" role="combobox" aria-haspopup="dialog" aria-label={label} aria-expanded={open} aria-controls={`${id}-panel`} aria-autocomplete="list" required={required} disabled={disabled} autoComplete="off" placeholder="Chọn danh mục hoặc gõ để tìm…" value={query}
        onFocus={() => { if (skipFocusOpen.current) skipFocusOpen.current = false; else show(); }} onClick={show}
        onChange={(event) => { setQuery(event.target.value); setSearch(event.target.value); setOpen(true); input.current.setCustomValidity(event.target.value ? 'Vui lòng chọn một danh mục trong danh sách.' : ''); if (value) { editing.current = true; onChange(''); } }}
        onKeyDown={(event) => { if (event.key === 'ArrowDown' || (event.key === 'Enter' && open)) { event.preventDefault(); show(); requestAnimationFrame(() => focusColumn(0)); } }} />
      <button type="button" disabled={disabled} className="category-tree-toggle" aria-label={open ? 'Đóng danh mục' : 'Mở danh mục'} aria-expanded={open} onMouseDown={(event) => event.preventDefault()} onClick={() => open ? cancel() : show()}><ChevronDown size={16} /></button>
    </div>
    <input type="hidden" name={name} disabled={disabled} value={value} />
    {open && <div id={`${id}-panel`} className="category-tree-panel" role="dialog" aria-label={`Chọn ${label.toLocaleLowerCase('vi')}`}>
      <div className="category-tree-heading"><span>{search.trim() ? `Kết quả tìm kiếm (${hits.length})` : 'Chọn lần lượt từng nhóm danh mục'}</span><button type="button" aria-label="Đóng danh mục" onMouseDown={(event) => event.preventDefault()} onClick={() => cancel(true)}><X size={16} /></button></div>
      <div ref={columnsRef} className="category-tree-columns">
        {search.trim() ? <div className="category-tree-column category-tree-search" data-category-column="0">
          {hits.map((option) => <button type="button" key={option.value} disabled={option.disabled} className="category-tree-option category-tree-search-result" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(tree.categories.find((node) => String(node.id) === String(option.value)))} onKeyDown={(event) => moveFocus(event, null, 0)}>
            <span><strong>{tree.categories.find((node) => String(node.id) === String(option.value))?.categoryName}</strong><small>{option.label}</small></span>{String(value) === String(option.value) && <Check size={15} />}
          </button>)}
          {!hits.length && <p className="category-tree-empty">Không tìm thấy danh mục phù hợp.</p>}
        </div> : columns.map(({ parent, nodes }, level) => <div key={parent?.id || 'root'} className="category-tree-column" data-category-column={level}>
          {parent && <><div className="category-tree-parent"><button type="button" aria-label="Quay lại danh mục trước" onMouseDown={(event) => event.preventDefault()} onClick={() => setExpanded((old) => old.slice(0, level - 1))}><ChevronLeft size={16} /></button><strong>{parent.name}</strong></div><button type="button" className="category-tree-option category-tree-choose-parent" disabled={parent.status === 'inactive' && String(parent.id) !== String(value)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(parent)} onKeyDown={(event) => moveFocus(event, null, level)}>Chọn {parent.name}{String(value) === String(parent.id) && <Check size={15} />}</button></>}
          {!parent && allowRoot && <button type="button" className="category-tree-option category-tree-choose-parent" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(null)} onKeyDown={(event) => moveFocus(event, null, level)}>{rootLabel}{!value && <Check size={15} />}</button>}
          {nodes.map((node) => <button type="button" key={node.id} disabled={!node.children.length && node.status === 'inactive' && String(node.id) !== String(value)} className={`category-tree-option ${expanded[level] === String(node.id) ? 'is-expanded' : ''} ${String(node.id) === String(value) ? 'is-selected' : ''}`} aria-expanded={node.children.length ? expanded[level] === String(node.id) : undefined}
            onMouseDown={(event) => event.preventDefault()} onClick={() => node.children.length ? expand(node, level) : choose(node)} onKeyDown={(event) => moveFocus(event, node, level)}>
            {!level && <Leaf size={16} />}<span>{node.name}{node.status === 'inactive' && <small>Tạm ẩn</small>}</span>{node.children.length ? <ChevronRight size={15} /> : String(node.id) === String(value) ? <Check size={15} /> : null}
          </button>)}
          {!nodes.length && <p className="category-tree-empty">Chưa có danh mục để chọn.</p>}
        </div>)}
      </div>
    </div>}
  </div>;
}
