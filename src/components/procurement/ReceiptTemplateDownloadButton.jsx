import { useRef, useState } from 'react';
import { FileSpreadsheet, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { excelImportService } from '@/services/admin/fileService';
import { canCreateReceipt } from '@/lib/purchaseWorkflow';
import { errorMessage } from '@/lib/utils';

export function ReceiptTemplateDownloadButton({ order, size, disabled }) {
  const [busy, setBusy] = useState(false), lock = useRef(false);
  if (!canCreateReceipt(order)) return null;
  async function download() {
    if (lock.current || disabled) return;
    lock.current = true; setBusy(true);
    try { await excelImportService.template('goods_receipts', order.id); }
    catch (error) { toast.error(`Chưa tải được Excel phiếu nhập. ${errorMessage(error)}`); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Button variant="outline" size={size} disabled={disabled || busy} onClick={download} aria-label={`Tải Excel phiếu nhập cho ${order.orderCode}`}>
    {busy ? <LoaderCircle size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}{busy ? 'Đang tải Excel…' : 'Tải Excel phiếu nhập'}
  </Button>;
}
