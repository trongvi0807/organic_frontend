import { useRef, useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { documentExportService } from '@/services/admin/fileService';
import { errorMessage } from '@/lib/utils';

export function DocumentDownloadButton({ kind, id }) {
  const [busy, setBusy] = useState(false), lock = useRef(false);
  async function download() {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await documentExportService[kind](id); }
    catch (e) { toast.error(errorMessage(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Button variant="outline" disabled={busy} onClick={download}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}Tải PDF</Button>;
}
