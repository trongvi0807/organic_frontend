import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { adminDate } from '@/lib/adminFormat';
import { numberInputDisplay, numberInputValue, purchaseMoney, purchaseQuantity, purchaseUnit } from '@/lib/purchaseDocuments';

export function DocumentNumberInput({ value, onChange, scale = 3, ...props }) {
  return <Input {...props} type="text" inputMode="decimal" value={numberInputDisplay(value)} onChange={(event) => {
    const next = numberInputValue(event.target.value, scale);
    if (next != null) onChange(next);
  }} />;
}
export function DocumentIdentity({ code, creator, date, saved = false }) {
  return <div className="document-info flex-wrap"><span>{saved ? 'Mã chứng từ' : 'Mã dự kiến'}: <strong>{code || 'Đang lấy mã…'}</strong></span><span>Ngày giờ lập: <strong>{adminDate(date, true)}</strong></span><span>Người lập: <strong>{creator}</strong></span></div>;
}
export function DocumentReview({ receipt = false, code, creator, date, supplier, orderCode, deliveryDate, note, items,
  busy, error, onBack, onConfirm, confirmLabel = 'Xác nhận lưu' }) {
  const amount = (item) => Number(receipt ? item.quantityReceived : item.quantity ?? item.quantityOrdered) * Number(item.unitPrice);
  return <section className="space-y-5" aria-label="Xem lại chứng từ trước khi lưu">
    <div className="rounded-xl bg-sage p-4"><h3 className="font-semibold">Xem lại {receipt ? 'phiếu nhập kho' : 'đơn đặt mua'}</h3><p className="text-sm !mt-2">Kiểm tra thông tin bên dưới. Chứng từ chỉ được lưu khi bạn bấm xác nhận.</p></div>
    <DocumentIdentity code={code} creator={creator} date={date} />
    <dl className="grid gap-3 sm:grid-cols-2"><div><dt>Nhà cung cấp</dt><dd className="font-semibold">{supplier || '—'}</dd></div>
      {orderCode && <div><dt>Đơn đặt mua</dt><dd>{orderCode}</dd></div>}
      {deliveryDate && <div><dt>Ngày giao dự kiến</dt><dd>{adminDate(deliveryDate)}</dd></div>}
      {!receipt && <div><dt>Thanh toán nhà cung cấp</dt><dd>Chưa thanh toán</dd></div>}</dl>
    <div className="table-scroll"><table className="data-table"><thead><tr><th>STT</th><th>Sản phẩm / quy cách</th><th>Đơn vị tính</th><th className="numeric">{receipt ? 'Cần nhận' : 'Số lượng'}</th>
      {receipt && <><th className="numeric">Đạt</th><th className="numeric">Bị loại</th><th>Lô / hạn sử dụng</th></>}<th className="numeric">Giá nhập (VNĐ)</th><th className="numeric">Thành tiền (VNĐ)</th></tr></thead>
      <tbody>{items.map((item, index) => <tr key={item.variantId || item.purchaseOrderDetailId || index}><td>{index + 1}</td><td><strong>{item.variant?.productName || item.productName}</strong><small>{item.variant?.variantName || item.variantName}</small>{item.discrepancyReason && <small>{item.discrepancyReason}</small>}</td><td>{purchaseUnit(item)}</td><td className="numeric">{purchaseQuantity(receipt ? item.quantityAvailableToReceive ?? item.quantityOrdered : item.quantity ?? item.quantityOrdered)}</td>
        {receipt && <><td className="numeric">{purchaseQuantity(item.quantityReceived)}</td><td className="numeric">{purchaseQuantity(item.quantityRejected)}</td><td>{Number(item.quantityReceived) > 0 ? <>{item.batchCode}<small>NSX: {item.manufactureDate ? adminDate(item.manufactureDate) : '—'} · HSD: {adminDate(item.expiryDate)}</small><small>{item.originDescription}</small></> : 'Không nhập lô'}</td></>}
        <td className="numeric">{purchaseMoney(item.unitPrice)}</td><td className="numeric">{purchaseMoney(amount(item))}</td></tr>)}</tbody></table></div>
    <div className="flex justify-between rounded-xl bg-sage p-4"><span>{receipt ? 'Tổng tiền hàng đạt' : 'Tổng tiền đặt mua'}</span><strong>{purchaseMoney(items.reduce((sum, item) => sum + amount(item), 0))}</strong></div>
    {note && <div><strong>Ghi chú</strong><p className="whitespace-pre-wrap">{note}</p></div>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="form-actions"><Button variant="outline" disabled={busy} onClick={onBack}>Quay lại chỉnh sửa</Button><Button disabled={busy} onClick={onConfirm}>{busy ? 'Đang lưu…' : confirmLabel}</Button></div>
  </section>;
}
