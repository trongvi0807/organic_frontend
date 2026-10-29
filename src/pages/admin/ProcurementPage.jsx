import { PurchaseDeliveryPanel } from '@/components/procurement/PurchaseDeliveryPanel';
import { useEffect, useMemo, useState } from 'react';
import { useAdminPageState } from '@/hooks/useAdminPageState';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Eye, ClipboardList, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { DocumentDownloadButton } from '@/components/common/DocumentDownloadButton';
import { ProcurementPrintForm } from '@/components/procurement/ProcurementPrintForm';
import { Pagination } from '@/components/common/Pagination';
import { OrderForm } from '@/components/procurement/OrderForm';
import { ReceiptForm } from '@/components/procurement/ReceiptForm';
import { ReceiptTemplateDownloadButton } from '@/components/procurement/ReceiptTemplateDownloadButton';
import { WorkflowHeader, Status, Refresh, Notice, DecisionDialog, DocumentMeta, DetailState } from '@/components/procurement/ProcurementUI';
import { purchaseOrderService, goodsReceiptService } from '@/services/admin/procurementService';
import { supplierService } from '@/services/admin/managementService';
import { excelImportService } from '@/services/admin/fileService';
import { allPages, dateText } from '@/lib/apiData';
import { currency, errorMessage } from '@/lib/utils';
import { OperationalFilters, emptyOperationalFilters } from '@/components/admin/OperationalFilters';
import { filterDocuments } from '@/lib/adminOperations';
import { productMeasure } from '@/lib/adminFormat';
import { canCreateReceipt } from '@/lib/purchaseWorkflow';
import { orderStatuses, receiptStatuses, canEditOrder, canEditReceipt } from '@/lib/procurement';

export default function ProcurementPage({ kind = 'orders', approval = false }) {
  const receipt = kind === 'receipts', service = receipt ? goodsReceiptService : purchaseOrderService;
  const { isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useAdminPageState(`procurement:${kind}:${approval}:filters`, () => ({ ...emptyOperationalFilters, status: approval ? 'pending_approval' : '' }));
  const [page, setPage] = useAdminPageState(`procurement:${kind}:${approval}:page`, 0);
  const [detailId, setDetailId] = useState(() => params.get('documentId') || null), [editor, setEditor] = useState(null);
  const [printDocument, setPrintDocument] = useState(null);
  const [action, setAction] = useState(null), [note, setNote] = useState(''), [busy, setBusy] = useState(false), [actionError, setActionError] = useState('');
  const orderId = receipt ? params.get('purchaseOrderId') || '' : '';
  const initialOrderId = receipt ? params.get('createFrom') || '' : '';
  const requestedDetailId = params.get('documentId') || null;
  useEffect(() => { setDetailId(requestedDetailId); setEditor(null); }, [kind, requestedDetailId]);
  const records = useResource(() => allPages(service.list, receipt ? { purchaseOrderId: orderId || undefined } : {}), [receipt, orderId]);
  const suppliers = useResource(() => allPages(supplierService.list), []);
  const purchaseOrders = useResource(() => receipt ? allPages(purchaseOrderService.list) : Promise.resolve([]), [receipt]);
  const orderMap = useMemo(() => new Map((purchaseOrders.data || []).map((row) => [row.id, row])), [purchaseOrders.data]);
  const filtered = useMemo(() => filterDocuments(records.data || [], filters, { receipt, orders: orderMap }), [records.data, filters, receipt, orderMap]);
  const list = { ...records, loading: records.loading || (receipt && purchaseOrders.loading), error: records.error || (receipt && purchaseOrders.error), data: { items: filtered.slice(page * 10, page * 10 + 10), totalPages: Math.ceil(filtered.length / 10), totalElements: filtered.length }, reload: () => { records.reload(); if (receipt) purchaseOrders.reload(); } };
  const detail = useResource(() => detailId ? service.get(detailId) : Promise.resolve(null), [detailId]);
  useEffect(() => { if (!list.loading && !list.error && list.data && page > 0 && !list.data.items.length) setPage((old) => old - 1); }, [list.loading, list.error, list.data, page]);
  const title = receipt ? 'Phiếu nhập & Duyệt nhập' : 'Đơn mua & Duyệt đơn';
  const description = receipt ? 'Lập phiếu, đối chiếu hàng thực nhận và theo dõi duyệt nhập trong cùng một danh sách.' : 'Lập đơn, theo dõi giao hàng và xử lý duyệt đơn trong cùng một danh sách.';
  const statuses = receipt ? receiptStatuses : orderStatuses;
  function resetEditor() { setEditor(null); if (initialOrderId) { const next = new URLSearchParams(params); next.delete('createFrom'); setParams(next, { replace: true }); } }
  function saved() { resetEditor(); setDetailId(null); list.reload(); }
  function ask(type, item) {
    const labels = { approve: receipt ? 'Duyệt phiếu & nhập kho?' : 'Duyệt đơn đặt mua?', reject: 'Từ chối đề nghị?', cancel: receipt ? 'Hủy phiếu nhập chưa duyệt?' : 'Hủy đơn đặt mua?', submit: 'Gửi phiếu để Admin duyệt?' };
    setAction({ type, id: item.id, title: labels[type], description: `${receipt ? item.receiptCode : item.orderCode} · ${type === 'approve' && receipt ? 'Số lượng hàng đạt sẽ được cộng vào kho. Phiếu đã duyệt không thể sửa.' : type === 'submit' ? 'Sau khi gửi, phiếu được khóa sửa trong lúc chờ quyết định.' : 'Kiểm tra nội dung trước khi xác nhận.'}` }); setNote(''); setActionError('');
  }
  async function decide(decisionNote = note) {
    if (busy || !action) return;
    if (['cancel', 'reject'].includes(action.type) && !decisionNote.trim()) { setActionError('Vui lòng nhập lý do.'); return; }
    setBusy(true); setActionError('');
    try {
      if (action.type === 'submit') await goodsReceiptService.submit(action.id);
      else await service.decide(action.id, action.type, decisionNote);
      const approvedPurchase = !receipt && action.type === 'approve';
      toast.success(approvedPurchase ? 'Đã duyệt đơn mua. Đang tải Excel phiếu nhập…' : 'Đã cập nhật trạng thái.');
      setAction(null); setDetailId(null); setEditor(null); list.reload();
      if (approvedPurchase) {
        // Approval is already committed. A failed download must not be reported
        // as a failed approval or invite the user to approve the order again.
        try { await excelImportService.template('goods_receipts', action.id); }
        catch (downloadError) { toast.warning(`Đơn mua đã được duyệt, nhưng chưa tải được Excel phiếu nhập. ${errorMessage(downloadError)} Bạn có thể bấm «Tải Excel phiếu nhập» tại đơn mua để tải lại.`, { duration: 10000 }); }
      }
    }
    catch (err) { setActionError(`${errorMessage(err)} Nếu kết nối bị gián đoạn, đóng hộp thoại và tải lại chi tiết để kiểm tra kết quả trước khi thao tác tiếp.`); }
    finally { setBusy(false); }
  }
  const item = !detail.loading && !detail.error && detail.data?.id === detailId ? detail.data : null;
  return <>
    <WorkflowHeader title={title} description={description}><Button onClick={() => setEditor({})}><Plus size={16} />{receipt ? 'Lập phiếu nhập' : 'Lập đơn mua'}</Button></WorkflowHeader>
    <Notice>{receipt ? 'Mỗi đợt hàng về được lập một phiếu nhập. Chỉ số đạt của phiếu đã duyệt mới tăng tồn kho; số bị loại và số thiếu không cộng tồn.' : 'Đơn mua có thể nhập nhiều đợt. Theo dõi số còn phải nhận hoặc đóng phần thiếu khi nhà cung cấp không giao tiếp. Đơn đã có phiếu nhập được khóa sửa và hủy.'}</Notice>
    <section className="admin-table-panel"><div className="table-panel-heading"><h2 className="flex items-center gap-2">{receipt ? <FileCheck2 size={18} /> : <ClipboardList size={18} />}{title}</h2><Refresh resource={list} /></div>
      {isAdmin && <div className="flex flex-wrap gap-2 px-5 pb-4" aria-label="Lọc nhanh duyệt chứng từ"><Button size="sm" variant={filters.status === '' ? 'default' : 'outline'} aria-pressed={filters.status === ''} onClick={() => { setFilters((old) => ({ ...old, status: '' })); setPage(0); }}>Tất cả</Button><Button size="sm" variant={filters.status === 'pending_approval' ? 'default' : 'outline'} aria-pressed={filters.status === 'pending_approval'} onClick={() => { setFilters((old) => ({ ...old, status: 'pending_approval' })); setPage(0); }}>Chờ duyệt{records.data ? ` (${records.data.filter((row) => row.status === 'pending_approval').length})` : ''}</Button></div>}
      <OperationalFilters value={filters} onChange={(next) => { setFilters(next); setPage(0); }} statuses={statuses} suppliers={suppliers.data || []} />
      <datalist id="operations-suggestions">{(records.data || []).slice(0, 150).map((row) => <option key={row.id} value={receipt ? row.receiptCode : row.orderCode} />)}</datalist>
      {orderId && <Button className="!ml-5 !mb-3" variant="ghost" size="sm" onClick={() => { const next = new URLSearchParams(params); next.delete('purchaseOrderId'); setParams(next); setPage(0); }}>Bỏ lọc theo đơn</Button>}
      {suppliers.error && <p className="admin-inline-error">Không tải được nhà cung cấp. <button onClick={suppliers.reload}>Thử lại</button></p>}
      <ResourceState loading={list.loading} error={list.error} empty={list.data?.items.length === 0} onRetry={list.reload} />
      {!list.loading && !list.error && !!list.data?.items.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>STT</th><th>{receipt ? 'Phiếu / đơn mua' : 'Đơn / nhà cung cấp'}</th><th>Ngày lập</th><th>Người lập</th><th className="numeric">{receipt ? 'Tiền hàng đạt' : 'Tổng giá mua'}</th><th>Trạng thái</th><th>Chi tiết</th></tr></thead><tbody>{list.data.items.map((row, index) => <tr key={row.id}><td>{page * 10 + index + 1}</td><td><strong className="block max-w-64 break-words">{receipt ? row.receiptCode : row.orderCode}</strong><span className="!mt-1 block text-xs text-stone-500">{receipt ? `${row.purchaseOrderCode} · ${orderMap.get(row.purchaseOrderId)?.supplier?.supplierName || 'Chưa rõ nhà cung cấp'}` : row.supplier?.supplierName}</span></td><td>{dateText(receipt ? row.receiptDate : row.orderDate)}</td><td>{(receipt ? row.receivedByEmployee : row.createdByEmployee)?.fullName || '—'}</td><td className="numeric font-medium">{currency(receipt ? row.acceptedTotalAmount : row.totalAmount)}</td><td><Status value={row.status} /></td><td><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="ghost" aria-label={`Xem ${receipt ? row.receiptCode : row.orderCode}`} onClick={() => setDetailId(row.id)}><Eye size={16} />Xem</Button>{!receipt && <ReceiptTemplateDownloadButton order={row} size="sm" disabled={busy} />}</div></td></tr>)}</tbody></table></div>}
      <Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} />
    </section>
    <Modal open={!!detailId} onOpenChange={(open) => { if (!open) setDetailId(null); }} title={item ? receipt ? item.receiptCode : item.orderCode : 'Chi tiết chứng từ'} description={receipt ? 'Đối chiếu số đặt, đạt, bị loại và thiếu của từng sản phẩm.' : 'Thông tin nhà cung cấp, hàng đặt mua và kết quả phê duyệt.'} className="procurement-modal !max-w-[1100px]">
      <DetailState resource={detail}>{item && <><div className="!mb-5 flex flex-wrap items-center justify-between gap-3"><Status value={item.status} /><Refresh resource={detail} /></div>
        <DocumentMeta entries={receipt ? [['Ngày lập', dateText(item.receiptDate)], ['Đơn đặt mua', item.purchaseOrderCode], ['Người lập', item.receivedByEmployee?.fullName], ['Người quyết định', item.confirmedByEmployee?.fullName], ['Ngày quyết định', item.confirmedAt && dateText(item.confirmedAt)], ['Ghi chú phiếu', item.note], ['Ghi chú duyệt / từ chối', item.approvalNote]] : [['Ngày lập', dateText(item.orderDate)], ['Nhà cung cấp', item.supplier?.supplierName], ['Người đại diện / liên hệ', item.supplier?.contactPerson], ['Số điện thoại liên hệ', item.supplier?.phoneNumber], ['Email liên hệ', item.supplier?.email], ['Người lập', item.createdByEmployee?.fullName], ['Ngày giao dự kiến', item.expectedDeliveryDate && dateText(item.expectedDeliveryDate)], ['Người duyệt', item.approvedByEmployee?.fullName], ['Ngày duyệt', item.approvedAt && dateText(item.approvedAt)], ['Ghi chú đơn', item.note], ['Ghi chú duyệt / từ chối', item.approvalNote]]} />
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th>STT</th><th>Sản phẩm / quy cách</th><th>Đơn vị tính</th><th className="numeric">Trọng lượng</th><th className="numeric">Đặt toàn đơn</th>{receipt && <><th className="numeric">Đã nhận trước</th><th className="numeric">Cần nhận đợt này</th><th className="numeric">Đạt</th><th className="numeric">Loại</th><th className="numeric">Chưa giao đợt này</th><th>Lô / HSD</th></>}<th className="numeric">Giá mua</th><th className="numeric">Thành tiền</th></tr></thead>
          <tbody>{item.items.map((line, index) => <tr key={line.id}>
            <td>{index + 1}</td><td><strong className="block">{line.variant.productName}</strong><small>{line.variant.variantName} · {line.variant.sku}</small>{receipt && line.discrepancyReason && <p className="!mt-2 max-w-72 whitespace-pre-wrap text-xs text-amber-800">{line.discrepancyReason}</p>}</td>
            <td>{line.variant.variantName}</td><td className="numeric">{productMeasure(line.variant)}</td><td className="numeric">{line.quantityOrdered}</td>
            {receipt && <><td className="numeric">{line.quantityReceivedPreviously ?? 0}</td><td className="numeric">{line.quantityExpected ?? line.quantityOrdered}</td><td className="numeric">{line.quantityReceived}</td><td className="numeric">{line.quantityRejected}</td><td className="numeric">{line.quantityMissing}</td><td>{line.batch ? <><strong>{line.batch.batchCode}</strong><small className="block">{dateText(line.batch.expiryDate)}</small><small className="block">NSX: {line.batch.manufactureDate ? dateText(line.batch.manufactureDate) : '—'}</small><small className="block">{line.batch.originDescription}</small></> : 'Không nhập lô'}</td></>}
            <td className="numeric">{currency(line.unitPrice)}</td><td className="numeric">{currency(receipt ? line.acceptedAmount : line.lineAmount)}</td>
          </tr>)}</tbody>
        </table></div>
        <div className="!mt-4 flex justify-end gap-5 text-sm"><span>{receipt ? 'Tổng thực nhận (chưa thuế/phí)' : 'Tổng giá mua'}</span><strong>{currency(receipt ? item.acceptedTotalAmount : item.totalAmount)}</strong></div>
        {!receipt && <PurchaseDeliveryPanel key={`${item.id}:${item.status}:${item.receiptCount}`} order={item} onChanged={() => { detail.reload(); list.reload(); }} />}<p className="!mt-4 text-xs leading-6 text-stone-500">Kết quả duyệt gần nhất được lưu kèm người duyệt và ghi chú để đối chiếu.</p><div className="!mt-6 flex flex-wrap justify-end gap-3">
          <DocumentDownloadButton kind={receipt ? 'receipt' : 'purchase'} id={item.id} />
          {!receipt && <ReceiptTemplateDownloadButton order={item} disabled={busy} />}
          <Button variant="outline" onClick={() => setPrintDocument(item)}>Xem trước bản in A4</Button>
          {(receipt ? canEditReceipt(item) : canEditOrder(item)) && <Button variant="outline" onClick={() => { setEditor(item); setDetailId(null); }}>Sửa {receipt ? 'phiếu' : 'đơn'}</Button>}
          {!receipt && canEditOrder(item) && <Button variant="outline" onClick={() => ask('cancel', item)}>Hủy đơn</Button>}
          {!receipt && canCreateReceipt(item) && <Link className="button inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 !text-white transition-colors hover:bg-primary-dark" onClick={() => setDetailId(null)} to={`/admin/goods-receipts?createFrom=${encodeURIComponent(item.id)}`}>Lập phiếu nhập</Link>}
          {!receipt && (item.receiptCount > 0 || item.goodsReceiptId) && <Link className="button inline-flex items-center justify-center rounded-xl border border-line px-5 py-3 hover:bg-sage" to={`/admin/goods-receipts?purchaseOrderId=${encodeURIComponent(item.id)}`}>Xem các phiếu nhập</Link>}
          {receipt && canEditReceipt(item) && <Button onClick={() => ask('submit', item)}>Gửi duyệt</Button>}
          {receipt && ['draft', 'pending_approval', 'rejected'].includes(item.status) && <Button variant="outline" onClick={() => ask('cancel', item)}>Hủy phiếu nhập</Button>}
          {isAdmin && item.status === 'pending_approval' && <><Button variant="outline" onClick={() => ask('reject', item)}>Từ chối</Button><Button onClick={() => ask('approve', item)}>{receipt ? 'Duyệt & nhập kho' : 'Duyệt đơn'}</Button></>}
        </div>
      </>}</DetailState>
    </Modal>
    <Modal open={!!printDocument} onOpenChange={(open) => { if (!open) setPrintDocument(null); }} title="Xem trước biểu mẫu A4" description="Kiểm tra thông tin rồi chọn in hoặc lưu PDF." className="!max-w-[1050px]">
      {printDocument && <ProcurementPrintForm document={printDocument} receipt={receipt} onClose={() => setPrintDocument(null)} />}
    </Modal>
    {(editor || initialOrderId) && (receipt ? <ReceiptForm receipt={editor?.id ? editor : null} initialOrderId={initialOrderId} onClose={resetEditor} onSaved={saved} /> : <OrderForm order={editor?.id ? editor : null} onClose={resetEditor} onSaved={saved} />)}
    <DecisionDialog action={action} busy={busy} error={actionError} note={note} setNote={setNote} onClose={() => setAction(null)} onConfirm={decide} />
  </>;
}

