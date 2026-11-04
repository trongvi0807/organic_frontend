import { useAdminPageState } from '@/hooks/useAdminPageState';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useReadThread } from '@/components/afterSales/ThreadNotifications';
import { OrderAttentionPanel, matchesOrderWorklist } from '@/components/orders/OrderAttentionPanel';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { orderService } from '@/services/admin/orderService';
import { hasRole } from '@/lib/permissions';
import { DeliveryLocationPicker } from '@/components/admin/DeliveryLocationPicker';
import { DeliveryEstimate } from '@/components/orders/DeliveryEstimate';
import { validLocation } from '@/lib/deliveryLocation';
import { ShippingCarrierSelect } from '@/components/admin/ShippingCarrierSelect';
import { createShipmentCode } from '@/lib/shipmentCodes';
import { shipmentNext, shipmentLabels, orderLabels } from '@/lib/checkout';
import { currency, errorMessage } from '@/lib/utils';
import { allPages, dateText } from '@/lib/apiData';
import { OperationalFilters, emptyOperationalFilters } from '@/components/admin/OperationalFilters';
import { AdminForm } from '@/components/admin/AdminForm';
import { filterDocuments } from '@/lib/adminOperations';
import { orderCreator } from '@/lib/adminFormat';
import { Button } from '@/components/ui/button';
import { DocumentDownloadButton } from '@/components/common/DocumentDownloadButton';
import { Modal } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Pagination } from '@/components/common/Pagination';
import { ResourceState } from '@/components/common/ResourceState';
import { CommerceStatus, OrderContents, QuoteSummary } from '@/components/checkout/OrderUI';

export default function SalesOrdersPage() {
  const { user } = useAuth(), finance = hasRole(user, 'ADMIN', 'SALES_STAFF');
  const { items: notifications, reloadInbox } = useNotifications();
  const unreadOrders = useMemo(() => new Set(notifications.filter(item => item.persistent && item.source === 'order' && !item.read).map(item => item.orderId)), [notifications]);
  const unreadOrderKey = [...unreadOrders].sort().join(',');
  const [worklist, setWorklist] = useState('all');
  const [params, setParams] = useSearchParams(); const id = params.get('orderId');
  function setId(value) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (value) next.set('orderId', value); else next.delete('orderId');
      return next;
    }, { replace: !value });
  }
  const [page, setPage] = useAdminPageState('sales:page', 0), [action, setAction] = useState(null), [note, setNote] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [booking, setBooking] = useState({ carrier: '', trackingCode: '', driverName: '', driverPhone: '', shippingCost: '', note: '', deliveryMode: 'carrier', deliveryLatitude: '', deliveryLongitude: '' });
  const locked = useRef(false);
  const [filters, setFilters] = useAdminPageState('sales:filters', () => ({ ...emptyOperationalFilters }));
  const records = useResource(() => allPages(orderService.list), []);
  useEffect(() => { if (unreadOrderKey) records.reload({ background: true }); }, [unreadOrderKey, records.reload]);
  const filtered = useMemo(() => filterDocuments(records.data || [], filters, { sales: true }).filter(order => matchesOrderWorklist(order, worklist)), [records.data, filters, worklist]);
  const list = { ...records, data: { items: filtered.slice(page * 10, page * 10 + 10), totalPages: Math.ceil(filtered.length / 10), totalElements: filtered.length } };
  useEffect(() => { if (page > 0 && page >= Math.ceil(filtered.length / 10)) setPage(Math.max(0, Math.ceil(filtered.length / 10) - 1)); }, [filtered.length, page]);
  const detail = useResource(() => id ? orderService.get(id) : Promise.resolve(null), [id]);
  useReadThread('order', id, detail);
  useOrderRefresh(list.reload, { enabled: !busy && !action, interval: 30000 });
  useOrderRefresh(detail.reload, { enabled: !!id && !busy && !action, interval: 5000 });
  const order = !detail.loading && !detail.error && detail.data?.id === id ? detail.data : null;
  function ask(type, label, shipmentId, nextStatus, repairLocation = false) {
    const target = order?.shipments.find(shipment => shipment.id === shipmentId);
    const needsLocation = repairLocation;
    setAction({ type, label, shipmentId, nextStatus, needsLocation });
    setNote(''); setError('');
    setBooking({ carrier: '', trackingCode: type === 'book' ? createShipmentCode(order?.shipments || []) : '', driverName: '', driverPhone: '', shippingCost: '', note: '', deliveryMode: 'carrier', deliveryLatitude: target?.deliveryLatitude ?? order?.deliveryLatitude ?? '', deliveryLongitude: target?.deliveryLongitude ?? order?.deliveryLongitude ?? '' });
  }
  async function perform(event) {
    event.preventDefault(); if (locked.current) return;
    if (action.needsLocation && !validLocation(booking.deliveryLatitude, booking.deliveryLongitude)) { setError('Chọn vị trí nhận hàng đã xác nhận trên bản đồ để tính thời gian giao.'); return; }
    locked.current = true; setBusy(true); setError('');
    try {
      if (action.type === 'book') await orderService.book(id, { ...booking, deliveryLatitude: validLocation(booking.deliveryLatitude, booking.deliveryLongitude) ? Number(booking.deliveryLatitude) : null, deliveryLongitude: validLocation(booking.deliveryLatitude, booking.deliveryLongitude) ? Number(booking.deliveryLongitude) : null, trackingCode: booking.trackingCode.trim() || null, driverName: booking.driverName.trim() || null, driverPhone: booking.driverPhone.trim() || null, shippingCost: booking.shippingCost === '' ? null : Number(booking.shippingCost), note: booking.note.trim() || null });
      else if (action.type === 'shipment') await orderService.shipment(action.shipmentId, { status: action.nextStatus, note: note.trim() || null, ...(action.needsLocation ? { deliveryLatitude: Number(booking.deliveryLatitude), deliveryLongitude: Number(booking.deliveryLongitude) } : {}) });
      else await orderService[action.type](id);
      setAction(null); detail.reload(); list.reload(); reloadInbox({ background: true }); toast.success('Đã cập nhật đơn hàng.');
    } catch (err) { setError(`${errorMessage(err)} Tải lại chi tiết khi chưa rõ kết quả trước khi thao tác tiếp.`); }
    finally { locked.current = false; setBusy(false); }
  }
  return <><div className="admin-page-heading"><div><span className="eyebrow">VẬN HÀNH BÁN HÀNG</span><h1>Đơn bán & giao hàng.</h1><p>Chuẩn bị hàng, ghi nhận chuyến giao và đối soát COD.</p></div><Button variant="outline" disabled={list.loading} onClick={list.reload}>Tải lại</Button></div>
    {!records.loading && !records.error && <OrderAttentionPanel orders={records.data || []} value={worklist} onChange={next => { setWorklist(next); setFilters({ ...emptyOperationalFilters }); setPage(0); }} />}
    {worklist !== 'all' && <div className="!mb-4 flex items-center justify-between gap-3 text-sm"><p>Đang lọc theo công việc đã chọn.</p><Button size="sm" variant="outline" onClick={() => { setWorklist('all'); setPage(0); }}>Xem tất cả đơn</Button></div>}
    <section className="admin-table-panel"><OperationalFilters value={filters} onChange={(next) => { setFilters(next); setPage(0); }} statuses={orderLabels} sales /><datalist id="operations-suggestions">{(records.data || []).slice(0, 150).map((row) => <option key={row.id} value={row.orderCode} />)}</datalist><ResourceState loading={list.loading} error={list.error} empty={!list.data?.items.length} onRetry={list.reload} />{!list.loading && !list.error && !!list.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>STT</th><th>Đơn / người nhận</th><th>Ngày lập</th><th>Người lập</th><th className="numeric">Thành tiền</th><th>Đơn hàng</th><th>Thanh toán</th><th>Chi tiết</th></tr></thead><tbody>{list.data.items.map((o, index) => <tr key={o.id} className={unreadOrders.has(o.id) ? '!bg-amber-50/70' : undefined}><td>{page * 10 + index + 1}</td><td><strong className="block">{o.orderCode}</strong>{unreadOrders.has(o.id) && <span className="!my-1 inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-800"><span className="size-1.5 rounded-full bg-rose-500 motion-safe:animate-pulse" />Mới cập nhật</span>}<small>{o.receiverName}</small></td><td>{dateText(o.orderedAt)}</td><td>{orderCreator(o)}</td><td className="numeric">{currency(o.pricing.totalAmount)}</td><td><CommerceStatus value={o.status} /></td><td><CommerceStatus type="payment" value={o.paymentMethod === 'exchange' ? 'exchange' : o.paymentStatus} /></td><td><Button size="sm" variant="ghost" onClick={() => setId(o.id)}>Xem {o.orderCode}</Button></td></tr>)}</tbody></table></div>}<Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} /></section>
    <Modal open={!!id} onOpenChange={(open) => { if (!open) setId(null); }} title={order?.orderCode || 'Chi tiết đơn bán'} description="Tồn kho chỉ xuất lúc bàn giao hàng; điểm chỉ cộng khi hoàn tất đủ điều kiện." className="!max-w-[1150px]"><ResourceState loading={detail.loading} error={detail.error} onRetry={detail.reload} />{order && <div className="space-y-6"><div className="document-info"><span>Ngày lập: <strong>{dateText(order.orderedAt)}</strong></span><span>Người lập: <strong>{orderCreator(order)}</strong></span></div>{order.paymentMethod === 'exchange' && <p className="rounded-xl bg-emerald-50 p-4 text-sm leading-7 text-primary">Đây là đơn giao hàng đổi, không thu thêm tiền. Chuẩn bị, giao hàng và hoàn tất tại hồ sơ đổi trả. <Link className="underline" to="/admin/return-receipts">Mở hàng thu hồi & giao hàng đổi</Link></p>}<OrderContents order={order} showMeasures /><QuoteSummary quote={order.pricing}><p className="text-xs">Điểm đã cộng: {order.pointsEarned} · COD khách trả: {order.cashCollectedAt ? 'Đã ghi nhận' : 'Chưa ghi nhận'} · Tiền tài xế: {order.cashReconciledAt ? 'Đã đối soát' : 'Chưa đối soát'}</p></QuoteSummary><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={detail.reload}>Tải lại chi tiết</Button><Link className="button inline-flex items-center rounded-xl border border-line px-5 py-3 text-sm" to={`/admin/business-forms?form=order_confirmation&sourceId=${encodeURIComponent(order.id)}`}>Biểu mẫu bán hàng / giao hàng</Link>{finance && <DocumentDownloadButton kind="managementSale" id={order.id} />}{order.paymentMethod !== 'exchange' && ['confirmed', 'paid'].includes(order.status) && (order.paymentMethod === 'cod' || order.paymentStatus === 'paid') && <Button onClick={() => ask('prepare', 'Bắt đầu chuẩn bị hàng?')}>Chuẩn bị hàng</Button>}{order.paymentMethod !== 'exchange' && order.status === 'preparing' && !order.shipments.some((s) => ['pending', 'picked_up', 'in_transit', 'delivered'].includes(s.status)) && <Button onClick={() => ask('book', 'Ghi nhận chuyến giao đã đặt ngoài')}>Ghi nhận chuyến giao</Button>}{finance && order.paymentMethod === 'cod' && order.status === 'delivered' && !order.cashCollectedAt && order.pricing.totalAmount > 0 && <Button onClick={() => ask('collect', 'Xác nhận khách đã trả đủ tiền COD?')}>Ghi nhận khách trả tiền</Button>}{finance && order.cashCollectedAt && !order.cashReconciledAt && order.status === 'delivered' && <Button onClick={() => ask('reconcile', 'Xác nhận đã nhận và đối soát đủ tiền từ tài xế?')}>Đối soát tiền tài xế</Button>}{order.paymentMethod !== 'exchange' && order.status === 'delivered' && ['paid', 'partially_refunded', 'refunded'].includes(order.paymentStatus) && (order.paymentMethod !== 'cod' || order.cashReconciledAt || order.pricing.totalAmount === 0) && <Button onClick={() => ask('complete', 'Hoàn tất đơn và cộng điểm cho khách?')}>Hoàn tất đơn</Button>}</div>{order.paymentMethod !== 'exchange' && order.shipments.map((s) => !!shipmentNext[s.status]?.length && <div key={s.id} className="rounded-xl bg-sage p-4"><strong className="text-sm">Cập nhật chuyến {s.trackingCode || s.carrier}</strong><DeliveryEstimate shipment={s} />{s.estimateStatus === 'location_required' && <Button size="sm" variant="outline" onClick={() => ask('shipment', 'Xác nhận lại vị trí nhận hàng', s.id, s.status, true)}>Xác nhận vị trí nhận hàng</Button>}<div className="!mt-3 flex flex-wrap gap-2">{shipmentNext[s.status].map((next) => <Button key={next} size="sm" variant="outline" onClick={() => ask('shipment', `Xác nhận: ${shipmentLabels[next]}?`, s.id, next)}>{next === 'in_transit' && s.deliveryMode === 'direct' ? 'Xác nhận shipper xuất phát' : shipmentLabels[next]}</Button>)}</div></div>)}</div>}</Modal>
    <Modal open={!!action} onOpenChange={(open) => { if (!open && !busy) setAction(null); }} title={action?.label || 'Xác nhận'} description="Vui lòng đối chiếu đơn hàng và tình trạng thực tế trước khi xác nhận."><AdminForm onSubmit={perform}><fieldset disabled={busy} className="min-w-0 space-y-4">{action?.type === 'book' ? <><Field label="Hình thức giao hàng *"><Select value={booking.deliveryMode} onChange={event => setBooking(old => ({ ...old, deliveryMode: event.target.value, carrier: event.target.value === 'direct' ? 'Shipper cửa hàng' : '', deliveryLatitude: '', deliveryLongitude: '' }))}><option value="carrier">Qua đơn vị vận chuyển</option><option value="direct">Giao trực tiếp từ cửa hàng</option></Select></Field><p className="rounded-xl bg-emerald-50 p-3 text-xs leading-6 text-emerald-900">Vị trí nhận hàng được lấy từ đơn đặt hàng. Thời gian giao sẽ tự tính khi xác nhận đã lấy hàng.</p>{booking.deliveryMode === "carrier" ? <ShippingCarrierSelect value={booking.carrier} onChange={(carrier) => setBooking((old) => ({ ...old, carrier }))} /> : <Field label="Đơn vị giao hàng"><Input readOnly value="Shipper cửa hàng" /></Field>}{[['trackingCode', 'Mã vận chuyển tự động', true, 100], ['driverName', 'Tên tài xế', false, 100], ['driverPhone', 'Điện thoại tài xế', false, 20]].map(([key, label, required, max]) => <Field key={key} label={label} hint={key === 'trackingCode' ? 'Điền sẵn mã chuyến; có thể thay bằng mã vận đơn của đơn vị giao hàng.' : undefined}><Input required={required} maxLength={max} value={booking[key]} onChange={(e) => setBooking((old) => ({ ...old, [key]: e.target.value }))} /></Field>)}<Field label="Chi phí xe thực tế (không thu thêm khách)"><Input type="number" min="0" max="999999999999.99" step="0.01" value={booking.shippingCost} onChange={(e) => setBooking((old) => ({ ...old, shippingCost: e.target.value }))} /></Field><Field label="Ghi chú giao hàng"><Textarea maxLength={1000} value={booking.note} onChange={(e) => setBooking((old) => ({ ...old, note: e.target.value }))} /></Field></> : action?.type === 'shipment' && <Field label={['failed', 'returned', 'cancelled'].includes(action.nextStatus) ? 'Lý do (bắt buộc)' : 'Ghi chú'}><Textarea required={['failed', 'returned', 'cancelled'].includes(action.nextStatus)} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>}{action?.needsLocation && <DeliveryLocationPicker address={order?.shippingAddress || ''} latitude={booking.deliveryLatitude} longitude={booking.deliveryLongitude} onChange={point => setBooking(old => ({ ...old, deliveryLatitude: point.latitude, deliveryLongitude: point.longitude }))} />}{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button variant="outline" onClick={() => setAction(null)}>Quay lại</Button><Button type="submit">{busy ? 'Đang xử lý…' : 'Xác nhận'}</Button></div></fieldset></AdminForm></Modal>
  </>;
}
