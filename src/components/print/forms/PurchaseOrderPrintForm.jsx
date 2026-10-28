import { forwardRef } from 'react';
import PrintFormLayout, { DottedField, DottedNotes, PrintFormSection, PrintFormTable, printDate, printNumber } from '../PrintFormLayout';

const dateOrDots = (value) => printDate(value) === '—' ? '....../....../.......' : printDate(value);
const isAmount = (value) => value != null && value !== '' && Number.isFinite(Number(value));

export const PurchaseOrderPrintForm = forwardRef(function PurchaseOrderPrintForm({ data = {}, ...layoutProps }, ref) {
  const buyer = data.buyer || {}, supplier = data.supplier || {}, delivery = data.delivery || {}, terms = data.terms || {};
  const items = (data.items || []).map((item) => ({ ...item, amount: item.amount ?? (isAmount(item.quantity) && isAmount(item.unitPrice) ? Number(item.quantity) * Number(item.unitPrice) : undefined) }));
  const total = data.totalAmount ?? (items.length && items.every((row) => isAmount(row.amount)) ? items.reduce((sum, row) => sum + Number(row.amount), 0) : undefined);
  return <PrintFormLayout {...layoutProps} ref={ref} sheetClassName="print-uc01-po" title="ĐƠN ĐẶT HÀNG - PURCHASE ORDER" formCode="BM-NV01-02" documentNumberLabel="Số đơn:" createdAtLabel="Ngày đặt:" documentNumber={data.documentNumber} createdAt={data.createdAt} signatures={[
    { title: 'Người lập đơn (Purchasing)', name: data.creatorName ?? buyer.contactName },
    { title: 'Đại diện nhà cung cấp', name: data.supplierRepresentative, dateLabel: 'Ngày NCC xác nhận:', date: data.supplierConfirmedAt },
    { title: 'Người xác nhận bên đặt', name: data.confirmerName },
  ]}>
    <div className="print-two-columns">
      <PrintFormSection title="A. Bên đặt hàng" keepTogether>
        <DottedField label="Đơn vị:" value={buyer.name ?? 'Cửa hàng thực phẩm hữu cơ Organicfood.vn'} />
        <DottedField label="Người phụ trách:" value={buyer.contactName} />
        <DottedField label="Bộ phận:" value={buyer.department ?? 'Purchasing'} />
        <DottedField label="Số điện thoại:" value={buyer.phone} />
        <DottedField label="Email:" value={buyer.email} />
        <DottedField label="Địa điểm nhận hàng:" value={buyer.receivingLocation} />
      </PrintFormSection>
      <PrintFormSection title="B. Nhà cung cấp" keepTogether>
        <DottedField label="Tên nhà cung cấp:" value={supplier.name} />
        <DottedField label="Người liên hệ:" value={supplier.contactName} />
        <DottedField label="Điện thoại:" value={supplier.phone} />
        <DottedField label="Email:" value={supplier.email} />
        <DottedField label="Địa chỉ:" value={supplier.address} />
        <DottedField label="Mã NCC:" value={supplier.code} />
      </PrintFormSection>
    </div>
    <PrintFormSection title="C. Chi tiết hàng đặt" className="print-table-section">
      <PrintFormTable minRows={8} rows={items} rowKey={(row, index) => row.id ?? index} columns={[
        { key: 'stt', label: 'STT', width: '5%', render: (_, index) => index + 1 },
        { key: 'productCode', label: 'Mã SP', width: '10%' },
        { key: 'productName', label: 'Tên sản phẩm', width: '24%' },
        { key: 'unit', label: 'ĐVT', width: '8%' },
        { key: 'quantity', label: 'SL đặt', width: '9%', numeric: true },
        { key: 'unitPrice', label: 'Đơn giá dự kiến', width: '14%', numeric: true },
        { key: 'amount', label: 'Thành tiền dự kiến', width: '17%', numeric: true },
        { key: 'note', label: 'Ghi chú', width: '13%' },
      ]} />
      <div className="print-po-totals"><span>Tổng số mặt hàng: <strong>{items.length ? printNumber(items.length) : ''}</strong></span><span>Tổng giá trị dự kiến: {isAmount(total) ? printNumber(total) : '..................'} đồng</span></div>
    </PrintFormSection>
    <PrintFormSection title="D. Yêu cầu / Ghi chú về hàng hóa" keepTogether><DottedNotes value={data.productRequirements} lines={1} /></PrintFormSection>
    <div className="print-two-columns">
      <PrintFormSection title="E. Thông tin giao hàng" keepTogether>
        <DottedField label="Ngày giao dự kiến:" value={dateOrDots(delivery.expectedDate)} />
        <DottedField label="Khung giờ dự kiến:" value={delivery.timeWindow} />
        <DottedField label="Địa điểm giao:" value={delivery.address} />
        <DottedField label="Người nhận hàng:" value={delivery.receiverName} />
        <DottedField label="SĐT người nhận:" value={delivery.receiverPhone} />
        <DottedField label="Phương thức vận chuyển:" value={delivery.transportMethod} />
      </PrintFormSection>
      <PrintFormSection title="F. Điều kiện thương mại" keepTogether>
        <DottedField label="Phương thức thanh toán:" value={terms.paymentMethod} />
        <DottedField label="Thời hạn thanh toán:" value={terms.paymentDeadline} />
        <DottedField label="Chi phí vận chuyển:" value={typeof terms.shippingCost === 'number' ? `${printNumber(terms.shippingCost)} đồng` : terms.shippingCost} />
        <DottedField label="Ghi chú khác:" value={terms.otherNotes} />
      </PrintFormSection>
    </div>
  </PrintFormLayout>;
});

export const DonDatHang = PurchaseOrderPrintForm;
export default PurchaseOrderPrintForm;
