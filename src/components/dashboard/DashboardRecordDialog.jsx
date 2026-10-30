import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ResourceState } from '@/components/common/ResourceState';
import { useResource } from '@/hooks/useResource';
import { dashboardService } from '@/services/admin/dashboardService';
import { adminDate } from '@/lib/adminFormat';
import { hasRole } from '@/lib/permissions';
import { currency } from '@/lib/utils';
import { RETURN_STATES } from '@/lib/customerOrders';
import { orderStatuses, receiptStatuses } from '@/lib/procurement';
import { OrderBadge } from '@/components/orders/OrderPrimitives';

export function DashboardRecordDialog({ selection, demo, user, onClose }) {
  const { type, row } = selection;
  const resource = useResource(() => type === 'return' && !demo ? dashboardService.returnRequest(row.id) : Promise.resolve(row), [type, row.id, demo]);
  const data = !resource.loading && !resource.error ? resource.data : null, record = type === 'return' ? data?.request || data : data;
  const code = row.orderCode || row.receiptCode || row.requestCode || row.batchCode || row.variant?.productName || 'Chưa có mã';
  let href = '', action = 'Mở trang quản lý';
  if (type === 'order') href = `/admin/sales-orders?orderId=${encodeURIComponent(row.id)}`;
  if (type === 'purchase') href = `/admin/${hasRole(user, 'ADMIN') ? 'order-approvals' : 'purchase-orders'}?documentId=${encodeURIComponent(row.id)}`;
  if (type === 'receipt') href = `/admin/${hasRole(user, 'ADMIN') ? 'receipt-approvals' : 'goods-receipts'}?documentId=${encodeURIComponent(row.id)}`;
  if (['batch', 'stock'].includes(type)) href = `/admin/inventory?variantId=${encodeURIComponent(row.variant.id)}`;
  if (type === 'return') { href = `/admin/return-requests?requestId=${encodeURIComponent(row.id)}`; action = 'Xử lý yêu cầu đổi trả'; }
  const details = !record ? [] : type === 'purchase' ? [['Nhà cung cấp', record.supplier?.supplierName], ['Ngày lập', adminDate(record.orderDate)], ['Người lập', record.createdByEmployee?.fullName], ['Trạng thái', orderStatuses[record.status]], ['Tổng tiền', currency(record.totalAmount)], ['Giao dự kiến', adminDate(record.expectedDeliveryDate)]]
    : type === 'receipt' ? [['Đơn mua', record.purchaseOrderCode], ['Ngày lập', adminDate(record.receiptDate)], ['Người lập phiếu', record.receivedByEmployee?.fullName], ['Trạng thái', receiptStatuses[record.status]], ['Người duyệt', record.confirmedByEmployee?.fullName], ['Ngày duyệt', adminDate(record.confirmedAt)], ['Giá trị thực nhận', currency(record.acceptedTotalAmount)]]
      : type === 'return' ? [['Mã yêu cầu', record.requestCode], ['Khách hàng', record.customer?.fullName], ['Đơn hàng', record.order?.orderCode], ['Ngày yêu cầu', adminDate(record.requestedAt)], ['Trạng thái', RETURN_STATES[record.status]], ['Nhân viên phụ trách', record.assignedEmployee?.fullName]]
        : type === 'batch' ? [['Sản phẩm', record.variant?.productName], ['Quy cách', record.variant?.variantName], ['Mã lô', record.batchCode], ['Ngày sản xuất', adminDate(record.manufactureDate)], ['Hạn sử dụng', adminDate(record.expiryDate)], ['Số lượng thực tế', record.quantityOnHand], ['Số lượng giữ chỗ', record.quantityReserved], ['Nguồn gốc', record.originDescription]]
          : type === 'stock' ? [['Sản phẩm', record.variant?.productName], ['Quy cách', record.variant?.variantName], ['Có thể bán', record.availableQuantity], ['Ngưỡng cảnh báo', record.reorderLevel]]
            : [['Mã đơn', record.orderCode], ['Người nhận', record.receiverName], ['Ngày đặt', adminDate(record.orderedAt, true)], ['Tổng thanh toán', currency(record.pricing?.totalAmount)]];
  const items = type === 'order' ? record?.pricing?.items || [] : data?.items || record?.items || [];
  return <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title={code} description={demo ? 'Dữ liệu mô phỏng để xem trước Dashboard; không thao tác trên chứng từ thật.' : 'Thông tin được đọc từ chứng từ hiện tại. Mở trang quản lý để thực hiện các thao tác theo quyền.'} className="!max-w-[850px]">
    <ResourceState loading={resource.loading} error={resource.error ? 'Chưa tải được chi tiết yêu cầu. Vui lòng thử lại.' : ''} onRetry={resource.reload} />{record && <div className="space-y-5">{type === 'order' && <div className="flex flex-wrap gap-2"><OrderBadge order={record} /><OrderBadge order={record} payment /></div>}<dl className="grid gap-4 rounded-2xl bg-[#F7FAF5] p-5 sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><dt className="text-[10px] text-stone-400">{label}</dt><dd className="!mt-1 text-xs leading-6 text-stone-600">{value ?? 'Chưa có thông tin'}</dd></div>)}</dl>{data.description && <p className="whitespace-pre-wrap break-words text-sm leading-7 text-stone-600">{data.description}</p>}{!!items.length && <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="bg-[#F7FAF5] text-stone-500"><tr><th className="p-3 text-left font-medium">STT</th><th className="p-3 text-left font-medium">Sản phẩm</th><th className="p-3 text-right font-medium">Số lượng</th></tr></thead><tbody>{items.map((item, i) => <tr key={item.id || item.variantId || i} className="border-b border-stone-100"><td className="p-3">{i + 1}</td><td className="p-3 leading-6">{item.productName || item.variant?.productName}<small className="block text-stone-400">{item.variantName || item.variant?.variantName}</small></td><td className="p-3 text-right">{item.quantity ?? item.requestedQuantity ?? item.quantityReceived ?? item.quantityOrdered ?? '—'}</td></tr>)}</tbody></table></div>}{type === 'return' && <p className="rounded-xl bg-amber-50 p-4 text-xs leading-7 text-amber-800">Yêu cầu cần được xét duyệt theo quy trình sau bán. Phương án được duyệt chưa đồng nghĩa đã hoàn tiền.</p>}</div>}<div className="!mt-6 flex flex-wrap justify-end gap-3 border-t border-line pt-5"><Button variant="outline" onClick={onClose}>Đóng</Button>{!demo && href && <Link to={href} onClick={onClose} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs text-white">{action}<ArrowUpRight size={14} /></Link>}</div>
  </Modal>;
}
