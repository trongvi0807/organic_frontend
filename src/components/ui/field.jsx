import { cn } from '@/lib/utils';
import { Children, Fragment, isValidElement, useContext, useEffect, useId, useRef, useState } from 'react';
import { useFieldError } from '@/components/admin/AdminForm';
import { SearchSelect } from '@/components/admin/SearchSelect';
import { ValidationContext } from '@/components/admin/AdminForm';

export function Field({ label, children, className, hint, error }) {
  const ref = useRef(null), id = useId(), inline = useFieldError(ref), message = error || inline;
  return <label ref={ref} className={cn('field', className, message && 'field-invalid')}><span>{label}</span>{children}{hint && <small>{hint}</small>}{message && <small id={id} role="status" className="!text-red-700">{message}</small>}</label>;
}
export function Input({ className, onChange, ...props }) {
  const context = useContext(ValidationContext), [negative, setNegative] = useState(false);
  const min = props.type === 'number' ? props.min ?? 0 : props.min;
  return <><input {...props} min={min} className={cn('input', className)} onChange={(event) => {
    const invalid = props.type === 'number' && Number(min) >= 0 && event.target.value !== '' && Number(event.target.value) < 0;
    setNegative(invalid); onChange?.(event);
  }} />{negative && !context && <small role="status" className="!text-red-700">Không được nhập số âm.</small>}</>;
}
export function selectOptions(children, group = '') {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    if (child.type === Fragment) return selectOptions(child.props.children, group);
    if (child.type === 'optgroup') return selectOptions(child.props.children, child.props.label);
    const label = Children.toArray(child.props.children).filter((item) => typeof item === 'string' || typeof item === 'number').join('');
    return [{ value: String(child.props.value ?? label), label, search: group, disabled: !!child.props.disabled }];
  });
}
export function Select({ className, children, value, defaultValue, onChange, name, ...props }) {
  const options = selectOptions(children);
  const [selected, setSelected] = useState(() => String(defaultValue ?? options.find((option) => !option.disabled)?.value ?? ''));
  const current = value === undefined ? selected : String(value ?? '');
  useEffect(() => { if (value === undefined && !options.some((option) => option.value === selected)) setSelected(options.find((option) => !option.disabled)?.value ?? ''); }, [children, value, selected]);
  return <SearchSelect {...props} name={name} options={options} value={current} clearOnSearch={false} className={className} onChange={(next) => { setSelected(next); const target = { name, value: next }; onChange?.({ target, currentTarget: target }); }} />;
}
export function Textarea({ className, ...props }) { return <textarea className={cn('input min-h-24', className)} {...props} />; }
