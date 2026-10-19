import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Modal({ open, onOpenChange, title, description, children, className }) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="modal-overlay" />
      <DialogPrimitive.Content className={cn('modal-content', className)} {...(!description ? { 'aria-describedby': undefined } : {})}>
        <div className="modal-heading"><div><DialogPrimitive.Title>{title}</DialogPrimitive.Title>{description && <DialogPrimitive.Description>{description}</DialogPrimitive.Description>}</div><DialogPrimitive.Close className="icon-button" aria-label="Đóng"><X size={20} /></DialogPrimitive.Close></div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
