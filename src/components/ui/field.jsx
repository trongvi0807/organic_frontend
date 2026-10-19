import { cn } from '@/lib/utils';

export function Field({ label, children, className, hint }) { return <label className={cn('field', className)}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Input({ className, ...props }) { return <input className={cn('input', className)} {...props} />; }
export function Select({ className, children, ...props }) { return <select className={cn('input', className)} {...props}>{children}</select>; }
export function Textarea({ className, ...props }) { return <textarea className={cn('input min-h-24', className)} {...props} />; }
