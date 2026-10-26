import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';

export function ClearCartDialog({ open, onOpenChange, onConfirm, busy }) {
  return <Modal open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }} title="Xóa toàn bộ giỏ hàng?" description="Tất cả sản phẩm và mã ưu đãi đang áp dụng sẽ được xóa khỏi giỏ hàng của bạn.">
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
      <button type="button" disabled={busy} autoFocus onClick={() => onOpenChange(false)} className="min-h-12 rounded-xl border border-line px-5 text-sm font-medium transition-colors hover:bg-sage">Giữ lại sản phẩm</button>
      <button type="button" disabled={busy} onClick={onConfirm} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a65444] px-5 text-sm font-medium text-white transition-colors hover:bg-[#8f4537]"><Trash2 size={16} /> {busy ? 'Đang xóa…' : 'Xóa tất cả'}</button>
    </div>
  </Modal>;
}
