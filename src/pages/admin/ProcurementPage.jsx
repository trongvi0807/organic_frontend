import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Eye, ClipboardList, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { OrderForm } from '@/components/procurement/OrderForm';
import { ReceiptForm } from '@/components/procurement/ReceiptForm';
import { WorkflowHeader, Status, Refresh, Notice, DecisionDialog, DocumentMeta, DetailState } from '@/components/procurement/ProcurementUI';
import { purchaseOrderService, goodsReceiptService } from '@/services/admin/procurementService';
import { supplierService } from '@/services/admin/managementService';
import { allPages, dateText } from '@/lib/apiData';
import { currency, errorMessage } from '@/lib/utils';
import { orderStatuses, receiptStatuses, canEditOrder, canEditReceipt } from '@/lib/procurement';

export default function ProcurementPage({ kind = 'orders', approval = false }) {
  const receipt = kind === 'receipts', service = receipt ? goodsReceiptService : purchaseOrderService;
  const { isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(approval ? 'pending_approval' : '');
  const [supplierId, setSupplierId] = useState(''), [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState(null), [editor, setEditor] = useState(null);
  const [action, setAction] = useState(null), [note, setNote] = useState(''), [busy, setBusy] = useState(false), [actionError, setActionError] = useState('');
  const orderId = receipt ? params.get('purchaseOrderId') || '' : '';
  const initialOrderId = receipt ? params.get('createFrom') || '' : '';
  const list = useResource(() => service.list({ page, size: 10, status: status || undefined, ...(receipt ? { purchaseOrderId: orderId || undefined } : { supplierId: supplierId || undefined }) }), [page, status, supplierId, orderId]);
  const suppliers = useResource(() => receipt ? Promise.resolve([]) : allPages(supplierService.list), [receipt]);
  const detail = useResource(() => detailId ? service.get(detailId) : Promise.resolve(null), [detailId]);
  useEffect(() => { if (!list.loading && !list.error && list.data && page > 0 && !list.data.items.length) setPage((old) => old - 1); }, [list.loading, list.error, list.data, page]);
  const title = approval ? receipt ? 'Duyệt nhập kho' : 'Duyệt đơn mua' : receipt ? 'Phiếu nhập hàng' : 'Đơn đặt mua';
  const description = approval ? receipt ? 'Đối chiếu hàng đạt, hàng loại và lô trước khi cộng tồn.' : 'Kiểm tra nhà cung cấp, số lượng và giá mua đã thỏa thuận.' : receipt ? 'Ghi nhận kiểm hàng và theo dõi quá trình nhập kho.' : 'Chủ động nguồn hàng, bắt đầu từ một đơn mua rõ ràng.';
  const statuses = receipt ? receiptStatuses : orderStatuses;
  function resetEditor() { setEditor(null); if (initialOrderId) { const next = new URLSearchParams(params); next.delete('createFrom'); setParams(next, { replace: true }); } }
  function saved() { resetEditor(); setDetailId(null); list.reload(); }
  function ask(type, item) {
    const labels = { approve: receipt ? 'Duyệt phiếu & nhập kho?' : 'Duyệt đơn đặt mua?', reject: 'Từ chối đề nghị?', cancel: 'Hủy đơn đặt mua?', submit: 'Gửi phiếu để Admin duyệt?' };
    setAction({ type, id: item.id, title: labels[type], description: `${receipt ? item.receiptCode : item.orderCode} · ${type === 'approve' && receipt ? 'Backend sẽ cộng đúng số lượng đạt chất lượng. Phiếu đã duyệt không thể sửa.' : type === 'submit' ? 'Sau khi gửi, phiếu được khóa sửa trong lúc chờ quyết định.' : 'Kiểm tra nội dung trước khi xác nhận.'}` }); setNote(''); setActionError('');
  }
  async function decide() {
    if (busy || !action) return;
    if (['cancel', 'reject'].includes(action.type) && !note.trim()) { setActionError('Vui lòng nhập lý do.'); return; }
    setBusy(true); setActionError('');
    try { if (action.type === 'submit') await goodsReceiptService.submit(action.id); else await service.decide(action.id, action.type, note); toast.success('Đã cập nhật trạng thái.'); setAction(null); list.reload(); detail.reload(); }
    catch (err) { setActionError(`${errorMessage(err)} Nếu kết nối bị gián đoạn, đóng hộp thoại và tải lại chi tiết để kiểm tra kết quả trước khi thao tác tiếp.`); }
    finally { setBusy(false); }
  }
  const item = !detail.loading && !detail.error && detail.data?.id === detailId ? detail.data : null;
  return <>
    <WorkflowHeader title={title} description={description} step={receipt ? approval ? 3 : 2 : approval ? 1 : 0}>{!approval && <Button onClick={() => setEditor({})}><Plus size={16} />{receipt ? 'Lập phiếu nhập' : 'Lập đơn mua'}</Button>}</WorkflowHeader>
    <Notice>{receipt ? 'Hàng ở phiếu nháp hoặc chờ duyệt chưa được bán. Số bị loại và số thiếu không cộng vào tồn.' : 'Mỗi đơn có tối đa một phiếu nhập. Khi đã có phiếu nhập, đơn được khóa sửa và hủy.'}</Notice>
    <section className="admin-table-panel"><div className="table-panel-heading"><h2 className="flex items-center gap-2">{receipt ? <FileCheck2 size={18} /> : <ClipboardList size={18} />}{title}</h2><Refresh resource={list} /></div>
      <div className="table-filters"><Select aria-label="Lọc trạng thái" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}><option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>
        {!receipt && <Select aria-label="Lọc nhà cung cấp" value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(0); }}><option value="">Tất cả nhà cung cấp</option>{suppliers.data?.map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}</Select>}
        {orderId && <Button variant="ghost" size="sm" onClick={() => { const next = new URLSearchParams(params); next.delete('purchaseOrderId'); setParams(next); setPage(0); }}>Bỏ lọc theo đơn</Button>}
      </div>
      {suppliers.error && !receipt && <p className="admin-inline-error">Không tải được nhà cung cấp. <button onClick={suppliers.reload}>Thử lại</button></p>}
      <ResourceState loading={list.loading} error={list.error} empty={list.data?.items.length === 0} onRetry={list.reload} />
      {!list.loading && !list.error && !!list.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>{receipt ? 'Phiếu / đơn mua' : 'Đơn / nhà cung cấp'}</th><th>Ngày lập</th><th>Người lập</th><th>{receipt ? 'Tiền hàng đạt' : 'Tổng giá mua'}</th><th>Trạng thái</th><th>Chi tiết</th></tr></thead><tbody>{list.data.items.map((row) => <tr key={row.id}><td><strong className="block max-w-64 break-words">{receipt ? row.receiptCode : row.orderCode}</strong><span className="!mt-1 block text-xs text-stone-500">{receipt ? row.purchaseOrderCode : row.supplier?.supplierName}</span></td><td>{dateText(receipt ? row.receiptDate : row.orderDate)}</td><td>{(receipt ? row.receivedByEmployee : row.createdByEmployee)?.fullName || '—'}</td><td className="whitespace-nowrap font-medium">{currency(receipt ? row.acceptedTotalAmount : row.totalAmount)}</td><td><Status value={row.status} /></td><td><Button size="sm" variant="ghost" aria-label={`Xem ${receipt ? row.receiptCode : row.orderCode}`} onClick={() => setDetailId(row.id)}><Eye size={16} />Xem</Button></td></tr>)}</tbody></table></div>}
      <Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} />
    </section>
    <Modal open={!!detailId} onOpenChange={(open) => { if (!open) setDetailId(null); }} title={item ? receipt ? item.receiptCode : item.orderCode : 'Chi tiết chứng từ'} description={receipt ? 'Đối chiếu số đặt, đạt, bị loại và thiếu của từng biến thể.' : 'Giá mua và thông tin quyết định được ghi nhận từ backend.'} className="procurement-modal !max-w-[1100px]">
      <DetailState resource={detail}>{item && <><div className="!mb-5 flex flex-wrap items-center justify-between gap-3"><Status value={item.status} /><Refresh resource={detail} /></div>
        <DocumentMeta entries={receipt ? [['Đơn đặt mua', item.purchaseOrderCode], ['Người nhận', item.receivedByEmployee?.fullName], ['Người quyết định', item.confirmedByEmployee?.fullName], ['Ngày quyết định', item.confirmedAt && dateText(item.confirmedAt)], ['Ghi chú phiếu', item.note], ['Ghi chú duyệt / từ chối', item.approvalNote]] : [['Nhà cung cấp', item.supplier?.supplierName], ['Liên hệ', [item.supplier?.contactPerson, item.supplier?.phoneNumber, item.supplier?.email].filter(Boolean).join(' · ')], ['Người lập', item.createdByEmployee?.fullName], ['Ngày giao dự kiến', item.expectedDeliveryDate && dateText(item.expectedDeliveryDate)], ['Người duyệt', item.approvedByEmployee?.fullName], ['Ngày duyệt', item.approvedAt && dateText(item.approvedAt)], ['Ghi chú đơn', item.note], ['Ghi chú duyệt / từ chối', item.approvalNote]]} />
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Sản phẩm / quy cách</th><th>Đặt</th>{receipt && <><th>Đạt</th><th>Loại</th><th>Thiếu</th><th>Lô / HSD</th></>}<th>Giá mua</th><th>Thành tiền</th></tr></thead><tbody>{item.items.map((line) => <tr key={line.id}><td><strong className="block">{line.variant.productName}</strong><small>{line.variant.variantName} · {line.variant.sku}</small>{receipt && line.discrepancyReason && <p className="!mt-2 max-w-72 whitespace-pre-wrap text-xs text-amber-800">{line.discrepancyReason}</p>}</td><td>{line.quantityOrdered}</td>{receipt && <><td>{line.quantityReceived}</td><td>{line.quantityRejected}</td><td>{line.quantityMissing}</td><td>{line.batch ? <><strong>{line.batch.batchCode}</strong><small className="block">{dateText(line.batch.expiryDate)}</small><small className="block">NSX: {line.batch.manufactureDate ? dateText(line.batch.manufactureDate) : '—'}</small><small className="block">{line.batch.originDescription}</small></> : 'Không nhập lô'}</td></>}<td>{currency(line.unitPrice)}</td><td>{currency(receipt ? line.acceptedAmount : line.lineAmount)}</td></tr>)}</tbody></table></div>
        <div className="!mt-4 flex justify-end gap-5 text-sm"><span>{receipt ? 'Tổng thực nhận (chưa thuế/phí)' : 'Tổng giá mua'}</span><strong>{currency(receipt ? item.acceptedTotalAmount : item.totalAmount)}</strong></div>
        <div className="!mt-6 flex flex-wrap justify-end gap-3">
          {(receipt ? canEditReceipt(item) : canEditOrder(item)) && <Button variant="outline" onClick={() => { setEditor(item); setDetailId(null); }}>Sửa {receipt ? 'phiếu' : 'đơn'}</Button>}
          {!receipt && canEditOrder(item) && <Button variant="outline" onClick={() => ask('cancel', item)}>Hủy đơn</Button>}
          {!receipt && item.status === 'approved' && !item.goodsReceiptId && <Link className="button inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 !text-white transition-colors hover:bg-primary-dark" onClick={() => setDetailId(null)} to={`/admin/goods-receipts?createFrom=${encodeURIComponent(item.id)}`}>Lập phiếu nhập</Link>}
          {!receipt && item.goodsReceiptId && <Link className="button inline-flex items-center justify-center rounded-xl border border-line px-5 py-3 hover:bg-sage" to={`/admin/goods-receipts?purchaseOrderId=${encodeURIComponent(item.id)}`}>Xem phiếu nhập</Link>}
          {receipt && canEditReceipt(item) && <Button onClick={() => ask('submit', item)}>Gửi duyệt</Button>}
          {isAdmin && item.status === 'pending_approval' && <><Button variant="outline" onClick={() => ask('reject', item)}>Từ chối</Button><Button onClick={() => ask('approve', item)}>{receipt ? 'Duyệt & nhập kho' : 'Duyệt đơn'}</Button></>}
        </div>
      </>}</DetailState>
    </Modal>
    {(editor || initialOrderId) && (receipt ? <ReceiptForm receipt={editor?.id ? editor : null} initialOrderId={initialOrderId} onClose={resetEditor} onSaved={saved} /> : <OrderForm order={editor?.id ? editor : null} onClose={resetEditor} onSaved={saved} />)}
    <DecisionDialog action={action} busy={busy} error={actionError} note={note} setNote={setNote} onClose={() => setAction(null)} onConfirm={decide} />
  </>;
}

