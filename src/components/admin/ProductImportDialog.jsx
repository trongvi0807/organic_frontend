import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExcelImportPanel } from './ExcelImportPanel';
import { useResource } from '@/hooks/useResource';
import { allPages } from '@/lib/apiData';
import { categoryService } from '@/services/admin/categoryService';

export function ProductImportDialog({ onChanged }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  return <><Button variant="outline" onClick={() => setOpen(true)}><FileSpreadsheet size={16} />Nhập Excel</Button><Modal open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }} title="Nhập sản phẩm từ Excel" description="Tải mẫu Excel, điền sản phẩm rồi kiểm tra trước khi lưu." className="!max-w-[1100px]">
    {open && <ProductImportContent onBusyChange={setBusy} onSaved={() => { setOpen(false); onChanged?.(); }} />}
  </Modal></>;
}

function ProductImportContent(props) {
  const categories = useResource(() => allPages(categoryService.list), []);
  return <ExcelImportPanel kind="products" categoriesResource={categories} {...props} />;
}
