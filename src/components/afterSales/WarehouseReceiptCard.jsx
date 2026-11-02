import { adminDate } from '@/lib/adminFormat';
import { inspectionStates } from '@/lib/afterSales';
import { Button } from '@/components/ui/button';
import { SupportBadge } from './SupportUI';
import { warehouseActionLabels } from './WarehouseOperationDialog';

export function WarehouseReceiptCard({ item, onAction }) {
  const finished = item.pendingQuantity === 0;
  return <article className="space-y-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
    <div className="flex flex-wrap justify-between gap-3"><div><strong className="text-sm text-primary">{item.productName}</strong><p className="!mt-1 text-xs text-stone-500">{item.receiptItemCode && `${item.receiptItemCode} · `}{item.variantName} · Đã nhận {item.receivedQuantity} sản phẩm</p></div><SupportBadge labels={inspectionStates} value={item.inspectionStatus} /></div>
    <p className="text-xs leading-6 text-stone-500">Lô {item.batchCode || 'chưa đối chiếu'} · HSD {adminDate(item.expiryDate)}<br />Nhận bởi {item.receivedByEmployee?.fullName || 'nhân viên kho'} lúc {adminDate(item.receivedAt, true)}</p>
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[
      ['Cần kiểm tra', item.uninspectedQuantity], ['Hàng tốt chờ xử lý', item.passedHeldQuantity],
      ['Hàng hỏng chờ xử lý', item.failedHeldQuantity], ['Đã nhập lại kho', item.restockedQuantity], ['Đã loại bỏ', item.disposedQuantity],
    ].map(([label, value]) => <div key={label} className="rounded-xl bg-[#F7FAF5] p-3"><dt className="text-xs leading-5 text-stone-500">{label}</dt><dd className="!mt-1 text-base font-semibold text-primary">{value}</dd></div>)}</dl>
    {finished ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Đã xử lý xong số hàng nhận lại trong lần này.</p> : <div className="space-y-1 rounded-xl bg-stone-50 p-3 text-sm leading-6">
      {item.uninspectedQuantity > 0 && <p><strong>Bước tiếp theo:</strong> kiểm tra tình trạng {item.uninspectedQuantity} sản phẩm chưa kiểm.</p>}
      {item.passedHeldQuantity > 0 && item.actions?.canRestock && <p>Có {item.passedHeldQuantity} hàng tốt có thể nhập lại kho.</p>}
      {item.failedHeldQuantity > 0 && <p>Có {item.failedHeldQuantity} hàng hỏng / không thể bán lại. Sau khi loại bỏ thực tế, bấm “Xác nhận đã loại bỏ”.</p>}
    </div>}
    {item.inspectionNote && <p className="whitespace-pre-wrap text-xs leading-6 text-stone-600">{item.inspectionNote}</p>}
    {item.passedHeldQuantity > 0 && item.restockBlockedReason && <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">Hàng tốt chưa thể nhập lại kho: {item.restockBlockedReason}</p>}
    <div className="flex flex-wrap gap-2">{[
      ['canInspect', 'inspect'], ['canRestock', 'restock'], ['canDispose', 'dispose'],
      ['canIdentifyBatch', 'identify-batch'], ['canReinspect', 'reinspect'],
    ].map(([flag, action]) => item.actions?.[flag] && <Button key={action} size="sm" variant={action === 'inspect' || action === 'restock' ? 'default' : 'outline'} onClick={() => onAction(action, item)}>{warehouseActionLabels[action]}</Button>)}</div>
  </article>;
}
