import { useState } from 'react';
import { adminDate } from '@/lib/adminFormat';
import { returnService, returnWarehouseService } from '@/services/afterSalesService';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { SupportBadge } from './SupportUI';
import { inspectionStates } from '@/lib/afterSales';

export function ReturnTotals({ totals }) {
  if (!totals) return null;
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Cần thu hồi', totals.approvedReturnQuantity], ['Đã nhận', totals.receivedQuantity], ['Còn cần nhận', totals.remainingToReceive], ['Chưa kiểm', totals.uninspectedQuantity], ['Đạt', totals.passedQuantity], ['Không đạt', totals.failedQuantity], ['Đã nhập lại', totals.restockedQuantity], ['Đã loại bỏ', totals.disposedQuantity]].map(([label, value]) => <div key={label} className="rounded-xl bg-[#F7FAF5] p-3"><p className="text-xs text-stone-500">{label}</p><strong className="!mt-1 block text-lg text-primary">{Number(value || 0).toLocaleString('vi-VN')}</strong></div>)}</div>;
}
export function ReturnWarehouseProgress({ id, management }) {
  const [page, setPage] = useState(0), customer = returnService();
  const data = useResource(async () => {
    const [summary, items] = await Promise.all([
      management ? returnWarehouseService.detail(id).then((result) => result.request) : customer.progress(id),
      management ? returnWarehouseService.items(id, { page, size: 10 }) : customer.receipts(id, { page, size: 10 }),
    ]);
    return { summary, items };
  }, [id, management, page]);
  useOrderRefresh(data.reload, { interval: 15000 });
  return <section className="space-y-4"><h3 className="!font-sans !text-base font-semibold">Tiến độ hàng thu hồi</h3><ResourceState loading={data.loading} error={data.error} onRetry={data.reload} />{data.data && !data.error && <><ReturnTotals totals={data.data.summary.totals} /><div className="space-y-3">{data.data.items.items.map((item) => <div key={item.id} className="rounded-xl border border-line p-4"><div className="flex flex-wrap justify-between gap-3"><strong className="text-sm">{item.productName} · {item.variantName}</strong><SupportBadge labels={inspectionStates} value={item.inspectionStatus} /></div><p className="!mt-2 text-xs leading-6 text-stone-500">Nhận {item.receivedQuantity} · {adminDate(item.receivedAt, true)} · Lô {item.batchCode || 'Chưa đối chiếu'} · Đã nhập lại {item.restockedQuantity} · Đã loại bỏ {item.disposedQuantity}</p></div>)}</div><Pagination page={page} size={10} totalPages={data.data.items.totalPages || 0} totalElements={data.data.items.totalElements || 0} onChange={setPage} /><p className="text-xs leading-6 text-stone-500">Kết quả kiểm hàng được ghi nhận riêng. Hàng nhận lại chưa tự tăng tồn; xử lý tại kho chưa đồng nghĩa đã hoàn tiền hoặc giao hàng đổi.</p></>}</section>;
}
