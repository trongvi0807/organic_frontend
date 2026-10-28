import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { matchesSearch } from '@/lib/adminFormat';
import { ValidationContext } from './AdminForm';

export function SearchSelect({ options, value, onChange, placeholder = 'Tìm và chọn…', required, disabled, name, clearOnSearch = true, className = '', inputClassName = '', id: inputId, 'aria-label': label, ...inputProps }) {
  const id = useId(), root = useRef(null), input = useRef(null), focused = useRef(false), editing = useRef(false);
  const validation = useContext(ValidationContext);
  const chosen = options.find((option) => String(option.value) === String(value));
  const [query, setQuery] = useState(chosen?.label || ''), [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  const search = chosen && query === chosen.label ? '' : query;
  const rows = options.filter((option) => !option.disabled && matchesSearch(`${option.label} ${option.search || ''}`, search)).slice(0, 40);
  useEffect(() => {
    if (!input.current) return;
    if (editing.current) { editing.current = false; return; }
    if (chosen) { setQuery(chosen.label); input.current.setCustomValidity(required && (value === '' || value == null) ? 'Vui lòng chọn một giá trị.' : ''); }
    else if (!focused.current) { setQuery(''); input.current.setCustomValidity(''); }
    if (input.current.getAttribute('aria-invalid') === 'true' || chosen) validation?.validate(input.current);
  }, [value, chosen?.label, required, validation?.validate]);
  useEffect(() => {
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  function choose(option) {
    input.current.setCustomValidity(required && option.value === '' ? 'Vui lòng chọn một giá trị.' : '');
    validation?.validate(input.current);
    setQuery(option.label); onChange(option.value); setOpen(false); setActive(-1);
  }
  function cancel() {
    setOpen(false); setQuery(chosen?.label || ''); input.current.setCustomValidity(required && (value === '' || value == null) ? 'Vui lòng chọn một giá trị.' : ''); validation?.validate(input.current);
  }
  return <div ref={root} className={`searchable-select relative min-w-0 ${className}`}>
    <div className="relative"><input {...inputProps} id={inputId} ref={input} className={`input !pr-9 ${inputClassName}`} role="combobox" aria-label={label} aria-expanded={open} aria-controls={`${id}-options`} aria-autocomplete="list" aria-activedescendant={open && rows[active] ? `${id}-${active}` : undefined} autoComplete="off" required={required} disabled={disabled} placeholder={placeholder} value={query}
      onFocus={() => { focused.current = true; setOpen(true); setActive(-1); }}
      onClick={() => { setOpen(true); }}
      onChange={(event) => {
        event.target.setCustomValidity(event.target.value ? 'Vui lòng chọn một kết quả từ danh sách gợi ý.' : '');
        setQuery(event.target.value); setOpen(true); setActive(-1); if (clearOnSearch && value) { editing.current = true; onChange(''); }
      }}
      onBlur={() => { focused.current = false; setOpen(false); }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel(); }
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive((old) => Math.min(old + 1, rows.length - 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActive((old) => Math.max(old - 1, 0)); }
        if (event.key === 'Enter' && open) { event.preventDefault(); if (rows[active]) choose(rows[active]); }
      }} /><ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" /></div>
    <input type="hidden" name={name} disabled={disabled} value={value ?? ''} />
    {open && <ul id={`${id}-options`} role="listbox" aria-label={label || 'Kết quả gợi ý'} className="absolute z-30 !mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-white p-1 shadow-lg">
      {rows.map((option, index) => <li id={`${id}-${index}`} key={option.value} role="option" aria-selected={String(option.value) === String(value)}><button type="button" tabIndex={-1} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs leading-6 hover:bg-sage ${active === index ? 'bg-sage' : ''}`}><span>{option.label}</span>{String(option.value) === String(value) && <Check size={14} />}</button></li>)}
      {!rows.length && <li className="p-3 text-xs text-stone-500">Không tìm thấy kết quả phù hợp.</li>}
    </ul>}
  </div>;
}
