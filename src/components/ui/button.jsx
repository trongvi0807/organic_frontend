import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonStyles = cva('button inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium disabled:pointer-events-none disabled:opacity-50', {
  variants: { variant: { default: 'bg-primary text-white hover:bg-primary-dark', outline: 'border border-line bg-transparent text-primary hover:bg-sage', ghost: 'text-primary hover:bg-sage', danger: 'bg-red-700 text-white hover:bg-red-800' }, size: { default: 'px-5 py-3', sm: 'px-3 py-2 text-xs', icon: 'h-10 w-10 p-0' } },
  defaultVariants: { variant: 'default', size: 'default' },
});
export function Button({ className, variant, size, type = 'button', ...props }) { return <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />; }
