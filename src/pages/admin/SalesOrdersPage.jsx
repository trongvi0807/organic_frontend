import { useAdminPageState } from '@/hooks/useAdminPageState';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { orderService } from '@/services/admin/orderService';
import { hasRole } from '@/lib/permissions';
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
import { Field, Input, Textarea } from '@/components/ui/field';
import { Pagination } from '@/components/common/Pagination';
import { ResourceState } from '@/components/common/ResourceState';
import { CommerceStatus, OrderContents, QuoteSummary } from '@/components/checkout/OrderUI';

export default function SalesOrdersPage() {
  const { user } = useAuth(), finance = hasRole(user, 'ADMIN', 'SALES_STAFF');
  const [params] = useSearchParams(); const queryId = params.get('orderId');
  const [page, setPage] = useAdminPageState('sales:page', 0), [id, setId] = useState(null), [action, setAction] = useState(null), [note, setNote] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [booking, setBooking] = useState({ carrier: '', trackingCode: '', driverName: '', driverPhone: '', shippingCost: '', note: '' });
  const locked = useRef(false);
  useEffect(() => { if (queryId) setId(queryId); }, [queryId]);
  const [filters, setFilters] = useAdminPageState('sales:filters', () => ({ ...emptyOperationalFilters }));
  const records = useResource(() => allPages(orderService.list), []);
  const filtered = useMemo(() => filterDocuments(records.data || [], filters, { sales: true }), [records.data, filters]);
  const list = { ...records, data: { items: filtered.slice(page * 10, page * 10 + 10), totalPages: Math.ceil(filtered.length / 10), totalElements: filtered.length } };
  useEffect(() => { if (page > 0 && page >= Math.ceil(filtered.length / 10)) setPage(Math.max(0, Math.ceil(filtered.length / 10) - 1)); }, [filtered.length, page]);
  const detail = useResource(() => id ? orderService.get(id) : Promise.resolve(null), [id]);
  useOrderRefresh(list.reload, { enabled: !busy && !action, interval: 30000 });
  useOrderRefresh(detail.reload, { enabled: !!id && !busy && !action, interval: 5000 });
  const order = !detail.loading && !detail.error && detail.data?.id === id ? detail.data : null;
  function ask(type, label, shipmentId, nextStatus) { setAction({ type, label, shipmentId, nextStatus }); setNote(''); setError(''); setBooking({ carrier: '', trackingCode: '', driverName: '', driverPhone: '', shippingCost: '', note: '' }); }
  async function perform(event) {
    event.preventDefault(); if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      if (action.type === 'book') await orderService.book(id, { ...booking, trackingCode: booking.trackingCode.trim() || null, driverName: booking.driverName.trim() || null, driverPhone: booking.driverPhone.trim() || null, shippingCost: booking.shippingCost === '' ? null : Number(booking.shippingCost), note: booking.note.trim() || null });
      else if (action.type === 'shipment') await orderService.shipment(action.shipmentId, { status: action.nextStatus, note: note.trim() || null });
      else await orderService[action.type](id);
      setAction(null); detail.reload(); list.reload(); toast.success('Đã cập nhật theo xác nhận của backend.');
    } catch (err) { setError(`${errorMessage(err)} Tải lại chi tiết khi chưa rõ kết quả trước khi thao tác tiếp.`); }
    finally { locked.current = false; setBusy(false); }
  }
  return <><div className="admin-page-heading"><div><span className="eyebrow">VẬN HÀNH BÁN HÀNG</span><h1>Đơn bán & giao hàng.</h1><p>Chuẩn bị hàng, ghi nhận chuyến giao và đối soát COD.</p></div><Button variant="outline" disabled={list.loading} onClick={list.reload}>Tải lại</Button></div><section className="admin-table-panel"><OperationalFilters value={filters} onChange={(next) => { setFilters(next); setPage(0); }} statuses={orderLabels} sales /><datalist id="operations-suggestions">{(records.data || []).slice(0, 150).map((row) => <option key={row.id} value={row.orderCode} />)}</datalist><ResourceState loading={list.loading} error={list.error} empty={!list.data?.items.length} onRetry={list.reload} />{!list.loading && !list.error && !!list.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>STT</th><th>Đơn / người nhận</th><th>Ngày lập</th><th>Người lập</th><th className="numeric">Thành tiền</th><th>Đơn hàng</th><th>Thanh toán</th><th>Chi tiết</th></tr></thead><tbody>{list.data.items.map((o, index) => <tr key={o.id}><td>{page * 10 + index + 1}</td><td><strong className="block">{o.orderCode}</strong><small>{o.receiverName}</small></td><td>{dateText(o.orderedAt)}</td><td>{orderCreator(o)}</td><td className="numeric">{currency(o.pricing.totalAmount)}</td><td><CommerceStatus value={o.status} /></td><td><CommerceStatus type="payment" value={o.paymentStatus} /></td><td><Button size="sm" variant="ghost" onClick={() => setId(o.id)}>Xem {o.orderCode}</Button></td></tr>)}</tbody></table></div>}<Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} /></section>
    <Modal open={!!id} onOpenChange={(open) => { if (!open) setId(null); }} title={order?.orderCode || 'Chi tiết đơn bán'} description="Tồn kho chỉ xuất lúc bàn giao hàng; điểm chỉ cộng khi hoàn tất đủ điều kiện." className="!max-w-[1150px]"><ResourceState loading={detail.loading} error={detail.error} onRetry={detail.reload} />{order && <div className="space-y-6"><div className="document-info"><span>Ngày lập: <strong>{dateText(order.orderedAt)}</strong></span><span>Người lập: <strong>{orderCreator(order)}</strong></span></div><OrderContents order={order} showMeasures /><QuoteSummary quote={order.pricing}><p className="text-xs">Điểm đã cộng: {order.pointsEarned} · COD khách trả: {order.cashCollectedAt ? 'Đã ghi nhận' : 'Chưa ghi nhận'} · Tiền tài xế: {order.cashReconciledAt ? 'Đã đối soát' : 'Chưa đối soát'}</p></QuoteSummary><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={detail.reload}>Tải lại chi tiết</Button><Link className="button inline-flex items-center rounded-xl border border-line px-5 py-3 text-sm" to={`/admin/business-forms?form=order_confirmation&sourceId=${encodeURIComponent(order.id)}`}>Biểu mẫu bán hàng / giao hàng</Link>{finance && <DocumentDownloadButton kind="managementSale" id={order.id} />}{['confirmed', 'paid'].includes(order.status) && (order.paymentMethod === 'cod' || order.paymentStatus === 'paid') && <Button onClick={() => ask('prepare', 'Bắt đầu chuẩn bị hàng?')}>Chuẩn bị hàng</Button>}{order.status === 'preparing' && !order.shipments.some((s) => ['pending', 'picked_up', 'in_transit', 'delivered'].includes(s.status)) && <Button onClick={() => ask('book', 'Ghi nhận chuyến giao đã đặt ngoài')}>Ghi nhận chuyến giao</Button>}{finance && order.paymentMethod === 'cod' && order.status === 'delivered' && !order.cashCollectedAt && order.pricing.totalAmount > 0 && <Button onClick={() => ask('collect', 'Xác nhận khách đã trả đủ tiền COD?')}>Ghi nhận khách trả tiền</Button>}{finance && order.cashCollectedAt && !order.cashReconciledAt && order.status === 'delivered' && <Button onClick={() => ask('reconcile', 'Xác nhận đã nhận và đối soát đủ tiền từ tài xế?')}>Đối soát tiền tài xế</Button>}{order.status === 'delivered' && order.paymentStatus === 'paid' && (order.paymentMethod !== 'cod' || order.cashReconciledAt || order.pricing.totalAmount === 0) && <Button onClick={() => ask('complete', 'Hoàn tất đơn và cộng điểm cho khách?')}>Hoàn tất đơn</Button>}</div>{order.shipments.map((s) => !!shipmentNext[s.status]?.length && <div key={s.id} className="rounded-xl bg-sage p-4"><strong className="text-sm">Cập nhật chuyến {s.trackingCode || s.carrier}</strong><div className="!mt-3 flex flex-wrap gap-2">{shipmentNext[s.status].map((next) => <Button key={next} size="sm" variant="outline" onClick={() => ask('shipment', `Xác nhận: ${shipmentLabels[next]}?`, s.id, next)}>{shipmentLabels[next]}</Button>)}</div></div>)}</div>}</Modal>
    <Modal open={!!action} onOpenChange={(open) => { if (!open && !busy) setAction(null); }} title={action?.label || 'Xác nhận'} description="Chỉ xác nhận khi đã kiểm tra nghiệp vụ thực tế. Backend kiểm tra lại quyền và trạng thái."><AdminForm onSubmit={perform}><fieldset disabled={busy} className="min-w-0 space-y-4">{action?.type === 'book' ? <>{[['carrier', 'Đơn vị giao hàng', true, 100], ['trackingCode', 'Mã chuyến', false, 100], ['driverName', 'Tên tài xế', false, 100], ['driverPhone', 'Điện thoại tài xế', false, 20]].map(([key, label, required, max]) => <Field key={key} label={label}><Input required={required} maxLength={max} value={booking[key]} onChange={(e) => setBooking((old) => ({ ...old, [key]: e.target.value }))} /></Field>)}<Field label="Chi phí xe thực tế (không thu thêm khách)"><Input type="number" min="0" max="999999999999.99" step="0.01" value={booking.shippingCost} onChange={(e) => setBooking((old) => ({ ...old, shippingCost: e.target.value }))} /></Field><Field label="Ghi chú giao hàng"><Textarea maxLength={1000} value={booking.note} onChange={(e) => setBooking((old) => ({ ...old, note: e.target.value }))} /></Field></> : action?.type === 'shipment' && <Field label={['failed', 'returned', 'cancelled'].includes(action.nextStatus) ? 'Lý do (bắt buộc)' : 'Ghi chú'}><Textarea required={['failed', 'returned', 'cancelled'].includes(action.nextStatus)} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>}{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button variant="outline" onClick={() => setAction(null)}>Quay lại</Button><Button type="submit">{busy ? 'Đang xử lý…' : 'Xác nhận'}</Button></div></fieldset></AdminForm></Modal>
  </>;
}
