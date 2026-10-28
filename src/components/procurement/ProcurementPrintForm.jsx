import { PurchasePrintPreview } from './PurchasePrintPreview';
import { BusinessFormPreview } from '@/components/print/BusinessFormPreview';

/** Contextual purchase/receipt template pickers with their documented form codes. */
export function ProcurementPrintForm({ document: item, receipt = false, onClose }) {
  if (!receipt) return <PurchasePrintPreview order={item} onClose={onClose} />;
  return <BusinessFormPreview sourceId={item.id} formIds={['goods_receipt', 'receiving_inspection', 'rejected_goods']} onClose={onClose} />;
}
