import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCheck, ClipboardCheck, Clock3, FileInput, Leaf, Package, RotateCcw, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { adminDate } from '@/lib/adminFormat';
import { currency } from '@/lib/utils';
import { OrderBadge } from '@/components/orders/OrderPrimitives';

export function DashboardSourceState({ source, empty, children }) {
  if (!source || source.status === 'error') return <p role="status" className="adk-data-empty is-warning">Chưa tải được dữ liệu. Bấm Cập nhật để thử lại.</p>;
  if (source.status === 'forbidden') return <p className="adk-data-empty">Tài khoản hiện tại không có quyền xem phần dữ liệu này.</p>;
  if (empty) return <p className="adk-data-empty"><CheckCheck size={18} />{empty}</p>;
  return children;
}

export function DashboardAlerts({ model, sources, expiryDays, onExpiryDaysChange, onOpen, loading }) {
  return <Card className="adk-panel"><CardHeader><div><CardTitle className="adk-panel-icon-title"><ShieldAlert size={18} />Kho hàng cần chú ý</CardTitle><CardDescription>Lô đã nhập và còn số lượng thực tế trong kho</CardDescription></div><div className="adk-expiry-control"><span>Cận hạn</span><div className="adk-segmented-control">{[7, 14, 30].map((days) => <button type="button" key={days} aria-label={`Cảnh báo cận hạn trong ${days} ngày`} aria-pressed={expiryDays === days} onClick={() => onExpiryDaysChange(days)}>{days} ngày</button>)}</div></div></CardHeader><CardContent>
    {loading ? <p role="status" className="adk-loading-state">Đang kiểm tra các lô hàng…</p> : <>
      <DashboardSourceState source={sources.batches} empty={!model.alerts.length && 'Không có lô cận/quá hạn trong ngưỡng đã chọn.'}>
        <div className="adk-table-scroll"><table className="adk-dashboard-table adk-alert-table"><caption className="sr-only">Các lô hàng cần ưu tiên theo hạn sử dụng</caption><thead><tr><th>Sản phẩm / Mã lô</th><th>Hạn sử dụng</th><th className="is-number">Tình trạng</th></tr></thead><tbody>{model.alerts.slice(0, 5).map((batch) => <tr key={batch.id}><td><button type="button" className="adk-table-link" onClick={() => onOpen('batch', batch)}>{batch.variant?.productName || 'Chưa có tên sản phẩm'}</button><small>{batch.batchCode || 'Chưa có mã lô'} · SL {Number(batch.quantityOnHand).toLocaleString('vi-VN')}</small></td><td><span>{adminDate(batch.expiryDate)}</span><small className={batch.severity === 'danger' ? 'adk-text-danger' : 'adk-text-warning'}>{batch.expiryLabel}</small></td><td className="is-number"><span className={`adk-status-badge ${batch.severity === 'danger' ? 'is-danger' : 'is-warning'}`}>{batch.statusLabel}</span></td></tr>)}</tbody></table></div>
        {model.alerts.length > 5 && <p className="adk-panel-note">Còn {model.alerts.length - 5} lô cần chú ý. Mở Tồn kho / Lô để xem đầy đủ.</p>}
      </DashboardSourceState>
      <div className="adk-stock-section"><div className="adk-subheading"><h3>Sản phẩm dưới ngưỡng tồn</h3>{sources.stock?.status === 'ready' && <span className="adk-count-badge is-warning">{model.lowStock.length}</span>}</div><DashboardSourceState source={sources.stock} empty={!model.lowStock.length && 'Các sản phẩm hiện đều trên ngưỡng cảnh báo.'}><div className="adk-stock-list">{model.lowStock.slice(0, 3).map((stock) => <button type="button" key={stock.variant.id} onClick={() => onOpen('stock', stock)}><span className="adk-stock-icon"><Package size={17} /></span><span className="adk-stock-name">{stock.variant.productName}<small>{stock.variant.variantName}</small></span><span className="adk-stock-quantity">{Number(stock.availableQuantity).toLocaleString('vi-VN')}<small>ngưỡng {Number(stock.reorderLevel).toLocaleString('vi-VN')}</small></span><ArrowUpRight size={15} /></button>)}</div></DashboardSourceState></div>
    </>}
  </CardContent></Card>;
}

export function DashboardTasks({ model, sources, onOpen, loading }) {
  const [tab, setTab] = useState('purchase');
  const groups = {
    purchase: { label: 'Đơn mua', source: sources.purchases, rows: model.pendingPurchases, icon: Package },
    receipt: { label: 'Phiếu nhập', source: sources.receipts, rows: model.pendingReceipts, icon: FileInput },
    return: { label: 'Đổi trả', source: sources.returns, rows: model.pendingReturns, icon: RotateCcw },
  };
  const selected = groups[tab], Icon = selected.icon;
  return <Card className="adk-panel"><CardHeader><div><CardTitle className="adk-panel-icon-title"><ClipboardCheck size={18} />Tác vụ chờ xử lý</CardTitle><CardDescription>Các chứng từ cần tiếp nhận và phê duyệt</CardDescription></div><span className="adk-panel-tag">Hiện tại</span></CardHeader><CardContent>
    <div className="adk-task-tabs" aria-label="Nhóm tác vụ">{Object.entries(groups).map(([key, group]) => <button type="button" key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{group.label}<span>{group.source?.status === 'ready' ? group.rows.length : '—'}</span></button>)}</div>
    {loading ? <p role="status" className="adk-loading-state">Đang tải các công việc…</p> : <DashboardSourceState source={selected.source} empty={!selected.rows.length && 'Không có tác vụ chờ xử lý trong mục này.'}><ul className="adk-task-list">{selected.rows.slice(0, 5).map((row) => <li key={row.id}><button type="button" onClick={() => onOpen(tab, row)}><span className={`adk-task-icon adk-task-icon--${tab}`}><Icon size={19} /></span><span className="adk-task-copy"><strong>{row.orderCode || row.receiptCode || row.requestCode || 'Chưa có mã chứng từ'}</strong><span>{row.supplier?.supplierName || row.customer?.fullName || row.purchaseOrderCode || 'Chưa có thông tin bên liên quan'}</span><small>{adminDate(row.orderDate || row.receiptDate || row.requestedAt)} · {row.status === 'reviewing' ? 'Đang xét duyệt' : 'Chờ tiếp nhận / duyệt'}</small></span><ArrowUpRight size={16} /></button></li>)}</ul>{selected.rows.length > 5 && <p className="adk-panel-note">Hiển thị 5/{selected.rows.length} công việc.</p>}</DashboardSourceState>}
    <div className="adk-workflow-note"><Leaf size={19} /><div><strong>Vận hành minh bạch, chất lượng tươi lành</strong><p>Ưu tiên xử lý lô cận hạn. Phiếu nhập chỉ làm tăng tồn sau khi được duyệt.</p></div></div>
  </CardContent></Card>;
}

export function DashboardRecentOrders({ model, source, loading, onOpen }) {
  return <Card className="adk-panel adk-recent-orders"><CardHeader><div><CardTitle>Đơn hàng gần đây</CardTitle><CardDescription>Các đơn phát sinh trong khoảng thời gian đang chọn</CardDescription></div>{source?.status !== 'forbidden' && <Link to="/admin/sales-orders" className="adk-panel-link">Xem tất cả<ArrowUpRight size={15} /></Link>}</CardHeader><CardContent>
    {loading ? <p role="status" className="adk-loading-state">Đang tải đơn hàng…</p> : <DashboardSourceState source={source} empty={!model.recentOrders.length && 'Chưa có đơn hàng trong khoảng thời gian này.'}><div className="adk-table-scroll"><table className="adk-dashboard-table adk-orders-table"><caption className="sr-only">Đơn bán gần đây</caption><thead><tr><th>Mã đơn</th><th>Khách hàng / Người nhận</th><th>Ngày lập</th><th className="is-number">Tổng tiền</th><th className="is-number">Trạng thái</th></tr></thead><tbody>{model.recentOrders.map((order) => <tr key={order.id}><td><button type="button" className="adk-table-link" onClick={() => onOpen('order', order)}>{order.orderCode || 'Chưa có mã đơn'}</button></td><td><span className="adk-customer-cell"><span className="adk-customer-avatar" aria-hidden="true">{(order.customer?.fullName || order.receiverName || '?').trim().split(/\s+/).slice(-1)[0].slice(0, 1).toUpperCase()}</span><span>{order.customer?.fullName || order.receiverName || 'Chưa có thông tin'}{!order.customer?.fullName && <small>Người nhận hàng</small>}</span></span></td><td>{adminDate(order.orderedAt)}</td><td className="is-number adk-order-amount">{currency(order.pricing?.totalAmount)}</td><td className="is-number"><OrderBadge order={order} /></td></tr>)}</tbody></table></div></DashboardSourceState>}
  </CardContent></Card>;
}

export function DashboardActivities({ model, sources, loading, onOpen }) {
  const ready = sources.purchases?.status === 'ready' || sources.receipts?.status === 'ready';
  return <Card className="adk-panel"><CardHeader><div><CardTitle className="adk-panel-icon-title"><Clock3 size={18} />Hoạt động gần đây</CardTitle><CardDescription>Lịch sử tạo và duyệt chứng từ được phép xem</CardDescription></div></CardHeader><CardContent>
    {loading ? <p role="status" className="adk-loading-state">Đang tải hoạt động…</p> : !ready ? <DashboardSourceState source={sources.receipts} /> : !model.activities.length ? <p className="adk-data-empty">Chưa có hoạt động từ chứng từ.</p> : <ol className="adk-activity-timeline">{model.activities.slice(0, 6).map((event) => <li key={event.key}><span className={`adk-activity-marker ${event.type === 'receipt' ? 'is-receipt' : ''}`}><FileInput size={14} /></span><div><p><strong>{event.actor || 'Chưa có người thực hiện'}</strong> {event.title.toLowerCase()}</p><button type="button" onClick={() => onOpen(event.type, (sources[event.type === 'receipt' ? 'receipts' : 'purchases']?.data || []).find((row) => row.id === event.id))}>{event.code || 'Chưa có mã chứng từ'}</button><time>{adminDate(event.date, true)}</time></div></li>)}</ol>}
    <p className="adk-panel-note adk-activity-disclaimer">Hoạt động từ chứng từ hiện có; backend chưa cung cấp nhật ký kiểm toán đầy đủ cho mọi thao tác.</p>
  </CardContent></Card>;
}
