import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, can } from '@/lib/permissions';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { returnWarehouseService as service } from '@/services/afterSalesService';
import { inspectionStates, returnStates } from '@/lib/afterSales';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { SupportBadge, SupportError, SupportHistory, supportPanel } from '@/components/afterSales/SupportUI';
import { ReturnTotals } from '@/components/afterSales/ReturnWarehouseProgress';
import { ReturnExecutionPanel } from '@/components/afterSales/ReturnExecutionPanel';

import { WarehouseOperationDialog } from '@/components/afterSales/WarehouseOperationDialog';
import { WarehouseReceiptCard } from '@/components/afterSales/WarehouseReceiptCard';
export default function ReturnWarehousePage() {
  const [params, setParams] = useSearchParams(), id = params.get('requestId'), orderId = params.get('orderId');
  const [pendingOnly, setPendingOnly] = useState(true), [page, setPage] = useState(0);
  const list = useResource(() => service.queue({ page, size: 10, pendingOnly, orderId: orderId || undefined }), [page, pendingOnly, orderId]);
  useOrderRefresh(list.reload, { enabled: !id, interval: 30000 });
  function select(value) { setParams((old) => { const next = new URLSearchParams(old); if (value) next.set('requestId', value); else next.delete('requestId'); return next; }); }
  return <div className="space-y-5"><div className="admin-page-heading"><div><span className="eyebrow">KHO · XỬ LÝ SAU BÁN</span><h1>Hàng thu hồi & giao hàng đổi</h1><p>Nhận hàng, kiểm tra chất lượng và xử lý đúng lô đã giao.</p></div><Button variant="outline" onClick={list.reload}><RefreshCw size={16} />Tải lại</Button></div><section className={supportPanel}><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pendingOnly} onChange={(e) => { setPendingOnly(e.target.checked); setPage(0); }} />Chỉ hiện hồ sơ còn cần nhận, xử lý hoặc giao hàng đổi</label><ResourceState loading={list.loading} error={list.error} empty={!list.loading && !list.data?.items.length} onRetry={list.reload} />{!list.loading && !list.error && <div className="table-scroll !mt-4"><table className="data-table"><thead><tr><th>STT</th><th>Yêu cầu / Đơn hàng</th><th>Khách hàng</th><th className="numeric">Cần nhận thêm</th><th className="numeric">Đang giữ riêng</th><th>Thao tác</th></tr></thead><tbody>{list.data?.items.map((row, index) => <tr key={row.requestId}><td>{page * 10 + index + 1}</td><td><strong className="block">{row.requestCode}</strong><small>{row.orderCode}</small>{row.totals.approvedReturnQuantity === 0 && <small className="block text-emerald-700">Giao hàng đổi không thu hồi</small>}</td><td>{row.customer?.fullName}</td><td className="numeric">{row.totals.remainingToReceive}</td><td className="numeric">{row.totals.pendingQuantity}</td><td><Button size="sm" variant="outline" onClick={() => select(row.requestId)}>Xem / xử lý</Button></td></tr>)}</tbody></table></div>}<Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} /></section>{id && <WarehouseDetail key={id} id={id} onClose={() => { select(null); list.reload({ background: true }); }} />}</div>;
}

function WarehouseDetail({ id, onClose }) {
  const [executionBusy, setExecutionBusy] = useState(false);
  const { user } = useAuth(), [page, setPage] = useState(0), [historyPage, setHistoryPage] = useState(0), [status, setStatus] = useState(''), [operation, setOperation] = useState(null);
  const detail = useResource(() => service.detail(id), [id]);
  const items = useResource(() => service.items(id, { page, size: 10, inspectionStatus: status || undefined }), [id, page, status]);
  const history = useResource(() => service.histories(id, { page: historyPage, size: 10 }), [id, historyPage]);
  const data = detail.data;
  useOrderRefresh(detail.reload, { enabled: !operation && !executionBusy, interval: 20000 });
  useOrderRefresh(items.reload, { enabled: !operation && !executionBusy, interval: 20000 });
  useOrderRefresh(history.reload, { enabled: !operation && !executionBusy, interval: 20000 });
  function refresh() { detail.reload({ background: true }); items.reload({ background: true }); history.reload({ background: true }); }
  function start(action, item) { const line = item ? data.items.find((entry) => entry.returnRequestDetailId === item.returnRequestDetailId) : null; setOperation({ action, item, line }); }
  return <Modal open title={data?.request.requestCode || 'Xử lý hàng thu hồi'} description="Nhận lại hàng chưa làm tăng số lượng có thể bán. Chỉ nhập lại sau khi kiểm tra đạt và đúng lô." className="!max-w-[1050px]" onOpenChange={(open) => { if (!open && !operation && !executionBusy) onClose(); }}><ResourceState loading={detail.loading} error={detail.error} onRetry={detail.reload} />{data && !detail.error && <div className="space-y-5"><div className="flex flex-wrap justify-between gap-3"><p className="text-sm">Đơn {data.request.orderCode} · {data.request.customer?.fullName}</p><SupportBadge labels={returnStates} value={data.request.status} /></div><ReturnTotals totals={data.request.totals} /><SupportError>{detail.refreshError || items.refreshError}</SupportError><div className="flex flex-wrap gap-2">{data.canReceive && <Button onClick={() => start('receive')}>Nhận hàng thu hồi</Button>}{can(user, 'return.read') && <Link className="order-action" to={`/admin/return-requests?requestId=${encodeURIComponent(id)}`}>Xem phương án đổi trả</Link>}<Button variant="outline" onClick={refresh}>Cập nhật tiến độ</Button></div><section className="space-y-3"><h3 className="!font-sans !text-base font-semibold">Sản phẩm cần thu hồi</h3>{data.items.filter((line) => line.returnRequired).map((line) => <div key={line.returnRequestDetailId} className="rounded-xl bg-[#F7FAF5] p-4 text-sm"><strong>{line.productName}</strong><p className="!mt-1 text-xs text-stone-500">{line.variantName} · Duyệt {line.approvedQuantity} · Đã nhận {line.receivedQuantity} · Còn nhận {line.remainingToReceive}</p></div>)}</section><div className="w-full sm:w-60"><Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="Lọc kết quả kiểm hàng"><option value="">Tất cả lần nhận</option>{Object.entries(inspectionStates).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></div><ResourceState loading={items.loading} error={items.error} onRetry={items.reload} /><div className="space-y-4">{!items.error && items.data?.items.map((item) => <WarehouseReceiptCard key={item.id} item={item} onAction={start} />)}</div><Pagination page={page} size={10} totalPages={items.data?.totalPages || 0} totalElements={items.data?.totalElements || 0} onChange={setPage} /><ReturnExecutionPanel id={id} management revision={`${data.request.totals.pendingQuantity}-${data.request.totals.receivedQuantity}`} onBusyChange={setExecutionBusy} onChanged={refresh} /><section className="space-y-4"><h3 className="!font-sans !text-base font-semibold">Lịch sử nhận và xử lý</h3><ResourceState loading={history.loading} error={history.error} onRetry={history.reload} /><SupportHistory items={history.data?.items} /><Pagination page={historyPage} size={10} totalPages={history.data?.totalPages || 0} totalElements={history.data?.totalElements || 0} onChange={setHistoryPage} /></section></div>}{operation && <WarehouseOperationDialog operation={operation} detail={data} onClose={() => { setOperation(null); refresh(); }} />}</Modal>;
}
