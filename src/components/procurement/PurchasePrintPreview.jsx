import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResourceState } from '@/components/common/ResourceState';
import { useResource } from '@/hooks/useResource';
import { purchaseOrderPrintData, purchaseRequisitionPrintData } from '@/lib/purchasePrintForms';
import { loadPhysicalStock, loadPurchasePrintContext } from '@/services/admin/purchasePrintService';
import { orderStatuses } from '@/lib/procurement';
import PurchaseRequisitionForm from '@/components/print/forms/PurchaseRequisitionForm';
import PurchaseOrderPrintForm from '@/components/print/forms/PurchaseOrderPrintForm';

export function PurchasePrintPreview({ order, onClose }) {
  const [kind, setKind] = useState('purchase_order');
  const context = useResource(() => loadPurchasePrintContext(order), [order.id]);
  const stock = useResource(() => kind === 'requisition' ? loadPhysicalStock(order) : Promise.resolve(null), [order.id, kind]);
  const ready = !context.loading && !context.error && (kind !== 'requisition' || (!stock.loading && !stock.error));
  const data = { ...context.data, actualStock: stock.data?.actualStock };
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn biểu mẫu UC01"><Button variant={kind === 'requisition' ? 'default' : 'outline'} aria-pressed={kind === 'requisition'} onClick={() => setKind('requisition')}>BM-NV01-01 · Phiếu đề nghị nhập hàng</Button><Button variant={kind === 'purchase_order' ? 'default' : 'outline'} aria-pressed={kind === 'purchase_order'} onClick={() => setKind('purchase_order')}>BM-NV01-02 · Đơn đặt hàng</Button></div>
    <p className="text-xs leading-6 text-stone-500">Đơn nguồn: {order.orderCode} · {orderStatuses[order.status] || order.status}. Những trường chưa có dữ liệu được để dòng chấm để điền khi in.</p>
    {kind === 'requisition' && <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">Phiếu đề nghị được lấy danh sách hàng từ đơn mua để in minh họa; chưa có hồ sơ đề nghị nhập hàng độc lập. Tồn thực tế là tổng hàng trong các lô đã nhập tại thời điểm mở mẫu, gồm cả phần giữ chỗ và hàng hết hạn; không phải tồn tại ngày lập đơn nguồn.</p>}
    {[...(context.data?.warnings || []), ...(kind === 'requisition' ? stock.data?.warnings || [] : [])].map((warning) => <p className="text-xs text-amber-800" key={warning}>{warning}</p>)}
    <ResourceState loading={context.loading || (kind === 'requisition' && stock.loading)} error={context.error || (kind === 'requisition' && stock.error)} onRetry={() => { context.reload(); stock.reload(); }} />
    {ready && (kind === 'requisition' ? <PurchaseRequisitionForm data={purchaseRequisitionPrintData(order, data)} onClose={onClose} /> : <PurchaseOrderPrintForm data={purchaseOrderPrintData(order, data)} onClose={onClose} />)}
  </div>;
}
