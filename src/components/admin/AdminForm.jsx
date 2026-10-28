import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { adminDate, parseAdminDate } from '@/lib/adminFormat';
import { CalendarDays } from 'lucide-react';
import { CalendarPicker } from './CalendarPicker';

export const ValidationContext = createContext(null);
export function validationMessage(control) {
  const label = control.closest('.field')?.querySelector(':scope > span')?.textContent?.replace(/\s*\*$/, '') || control.getAttribute('aria-label') || 'Thông tin';
  const v = control.validity;
  if (!v) return '';
  if (v.customError) return control.validationMessage;
  if (v.valueMissing || (control.required && typeof control.value === 'string' && !control.value.trim())) return `Vui lòng nhập hoặc chọn ${label.toLowerCase()}.`;
  if (v.valid) return '';
  if (v.typeMismatch) return control.type === 'email' ? 'Địa chỉ email chưa đúng định dạng.' : `${label} chưa đúng định dạng.`;
  if (v.rangeUnderflow) return `${label} phải từ ${control.min} trở lên.`;
  if (v.rangeOverflow) return `${label} không được vượt ${control.max}.`;
  if (v.stepMismatch) return `${label} cần đúng đơn vị nhập (${control.step}).`;
  if (v.patternMismatch || v.badInput) return `${label} chưa đúng định dạng. Vui lòng kiểm tra lại.`;
  return `${label} không hợp lệ.`;
}
export function AdminForm({ onSubmit, children, onChange, ...props }) {
  const [errors, setErrors] = useState(new Map());
  const validate = useCallback((control) => {
    if (!control?.validity || control.type === 'hidden') return;
    const message = control.willValidate ? validationMessage(control) : '';
    control.setAttribute('aria-invalid', String(!!message));
    setErrors((old) => { if (old.get(control) === message) return old; const next = new Map([...old].filter(([element]) => element.isConnected)); next.set(control, message); return next; });
  }, []);
  function submit(event) {
    const form = event.currentTarget;
    const controls = [...form.elements].filter((element) => element.willValidate);
    controls.forEach(validate);
    const invalid = controls.find((element) => validationMessage(element));
    if (invalid) { event.preventDefault(); invalid.focus(); return; }
    onSubmit?.(event);
  }
  const ungrouped = [...errors].filter(([control, message]) => message && control.isConnected && control.willValidate && !control.closest('.field'));
  return <ValidationContext.Provider value={{ errors, validate }}><form {...props} noValidate onChange={(event) => { validate(event.target); onChange?.(event); }} onBlur={(event) => validate(event.target)} onSubmit={submit}>{children}{!!ungrouped.length && <p role="status" className="form-error">{ungrouped.map(([, message]) => message).join(' ')}</p>}</form></ValidationContext.Provider>;
}
export function useFieldError(ref) {
  const errors = useContext(ValidationContext)?.errors;
  return errors && ref.current ? [...ref.current.querySelectorAll('input,select,textarea')].map((control) => errors.get(control)).find(Boolean) : '';
}
export function AdminDateInput({ value, defaultValue = '', name, onChange, min, max, withTime = false, ...props }) {
  const [draft, setDraft] = useState(() => (value ?? defaultValue) ? adminDate(value ?? defaultValue, withTime) : '');
  const [iso, setIso] = useState(value ?? defaultValue);
  const focused = useRef(false);
  const input = useRef(null);
  const root = useRef(null);
  const [calendar, setCalendar] = useState(false);
  const validation = useContext(ValidationContext);
  useEffect(() => {
    const outside = (event) => { if (!root.current?.contains(event.target)) setCalendar(false); };
    document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => { if (value !== undefined && !focused.current) { setDraft(value ? adminDate(value, withTime) : ''); setIso(value || ''); } }, [value]);
  function dateError(text) {
    const parsed = parseAdminDate(text, withTime);
    const lower = min?.slice(0, withTime ? 16 : 10), upper = max?.slice(0, withTime ? 16 : 10);
    return text && !parsed ? `Sử dụng định dạng ${withTime ? 'dd-mm-yyyy HH:mm' : 'dd-mm-yyyy'} và ngày hợp lệ.` : parsed && lower && parsed < lower ? `Ngày không được trước ${adminDate(min, withTime)}.` : parsed && upper && parsed > upper ? `Ngày không được sau ${adminDate(max, withTime)}.` : '';
  }
  useEffect(() => {
    if (!input.current) return;
    input.current.setCustomValidity(dateError(draft));
    if (draft || input.current.getAttribute('aria-invalid') === 'true') validation?.validate(input.current);
  }, [draft, min, max, withTime, validation?.validate]);
  function update(event) {
    const text = event.target.value, parsed = parseAdminDate(text, withTime);
    setDraft(text); setIso(parsed);
    event.target.setCustomValidity(dateError(text));
    onChange?.({ target: { value: parsed, name } });
  }
  return <div ref={root} className="relative min-w-0" onKeyDown={(event) => { if (event.key === 'Escape' && calendar) { event.stopPropagation(); setCalendar(false); } }}><div className="relative"><input {...props} ref={input} className={`input !pr-11 ${props.className || ''}`} type="text" inputMode={withTime ? 'text' : 'numeric'} autoComplete="off" placeholder={withTime ? 'dd-mm-yyyy HH:mm' : 'dd-mm-yyyy'} value={draft} onFocus={() => { focused.current = true; }} onClick={() => setCalendar(true)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setCalendar(true); } }} onBlur={() => { focused.current = false; }} onChange={update} aria-label={props['aria-label']} aria-expanded={calendar} /><button type="button" disabled={props.disabled} onClick={() => setCalendar((old) => !old)} aria-label="Mở lịch chọn ngày" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-stone-500 hover:bg-sage"><CalendarDays size={17} /></button></div><input type="hidden" name={name} disabled={props.disabled} value={iso || ''} />{calendar && !props.disabled && <CalendarPicker value={iso} min={min} max={max} withTime={withTime} onClose={() => setCalendar(false)} onChoose={(next) => { setDraft(adminDate(next, withTime)); setIso(next); input.current.setCustomValidity(''); onChange?.({ target: { value: next, name } }); if (!withTime) setCalendar(false); }} />}</div>;
}
