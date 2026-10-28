import { cn } from '@/lib/utils';

// Local shadcn-style primitives; share this project's Tailwind tokens and button/dialog system.
export function Card({ className, ...props }) { return <section data-slot="card" className={cn('min-w-0 rounded-2xl border border-[#E5EBDD] bg-white shadow-[0_3px_16px_#1B4D2E03]', className)} {...props} />; }
export function CardHeader({ className, ...props }) { return <div data-slot="card-header" className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6', className)} {...props} />; }
export function CardTitle({ className, ...props }) { return <h2 data-slot="card-title" className={cn('!font-sans !text-sm !font-semibold !leading-6 text-[#1B4D2E]', className)} {...props} />; }
export function CardDescription({ className, ...props }) { return <p data-slot="card-description" className={cn('!mt-1 text-[11px] leading-6 text-stone-500', className)} {...props} />; }
export function CardContent({ className, ...props }) { return <div data-slot="card-content" className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...props} />; }
