import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAppearance } from '@/contexts/AdminAppearanceContext';

export function Modal({ open, onOpenChange, title, description, children, className }) {
  const admin = useAdminAppearance();
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={cn('modal-overlay', admin && 'admin-dialog-overlay')} />
      <DialogPrimitive.Content className={cn('modal-content', admin && 'admin-dialog', className)} {...(!description ? { 'aria-describedby': undefined } : {})}>
        <div className="modal-heading"><div><DialogPrimitive.Title>{title}</DialogPrimitive.Title>{description && <DialogPrimitive.Description>{description}</DialogPrimitive.Description>}</div><DialogPrimitive.Close className="icon-button" aria-label="Đóng"><X size={20} /></DialogPrimitive.Close></div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
