import { forwardRef } from 'react';
import PrintFormLayout, { DottedField, DottedNotes, PrintFormSection, PrintFormTable, printDate } from '../PrintFormLayout';

export const PurchaseRequisitionForm = forwardRef(function PurchaseRequisitionForm({ data = {}, ...layoutProps }, ref) {
  const items = (data.items || []).map((item) => ({
    ...item,
    productCode: item.productCode ?? item.maSP,
    productName: item.productName ?? item.tenSP,
    unit: item.unit ?? item.dvt,
    actualStock: item.actualStock ?? item.tonThucTe,
    requestedQuantity: item.requestedQuantity ?? item.slDeNghi,
    reason: item.reason ?? item.lyDo,
    note: item.note ?? item.ghiChu,
  }));
  const creator = data.creatorName ?? data.nguoiLap;
  const requiredDate = printDate(data.requiredDate ?? data.thoiGianCan);
  return <PrintFormLayout {...layoutProps} ref={ref} sheetClassName="print-uc01-requisition" title="PHIẾU ĐỀ NGHỊ NHẬP HÀNG" formCode="BM-NV01-01" documentNumber={data.documentNumber ?? data.soPhieu} createdAt={data.createdAt ?? data.ngayLap} confirmationTitle="5. Xác nhận" signatures={[
    { title: 'Người lập đề nghị', name: creator },
    { title: 'Purchasing', name: data.purchaserName ?? data.nguoiThuMua },
    { title: 'Người xác nhận', name: data.confirmerName ?? data.nguoiXacNhan },
  ]}>
    <PrintFormSection title="1. Thông tin đề nghị" keepTogether>
      <DottedField label="Bộ phận đề nghị:" value={data.department ?? data.boPhan} />
      <DottedField label="Người lập đề nghị:" value={creator} />
    </PrintFormSection>
    <PrintFormSection title="2. Danh sách sản phẩm đề nghị nhập hàng" className="print-table-section">
      <PrintFormTable minRows={8} rows={items} rowKey={(row, index) => row.id ?? index} columns={[
        { key: 'stt', label: 'STT', width: '6%', render: (_, index) => index + 1 },
        { key: 'productCode', label: 'Mã SP', width: '10%' },
        { key: 'productName', label: 'Tên sản phẩm', width: '22%' },
        { key: 'unit', label: 'ĐVT', width: '8%' },
        { key: 'actualStock', label: 'Tồn thực tế', width: '11%', numeric: true },
        { key: 'requestedQuantity', label: <>SL đề nghị<br />nhập</>, width: '13%', numeric: true },
        { key: 'reason', label: 'Lý do đề nghị', width: '17%' },
        { key: 'note', label: 'Ghi chú', width: '13%' },
      ]} />
    </PrintFormSection>
    <PrintFormSection title="3. Ghi chú chung" keepTogether><DottedNotes value={data.generalNotes ?? data.ghiChuChung} lines={2} /></PrintFormSection>
    <PrintFormSection title="4. Thời gian và Nhà cung cấp" keepTogether>
      <DottedField label="Thời gian dự kiến cần hàng:" value={requiredDate === '—' ? '....../....../.......' : requiredDate} />
      <DottedField label="Nhà cung cấp đề xuất (nếu có):" value={data.suggestedSupplier ?? data.nccDeXuat} />
    </PrintFormSection>
  </PrintFormLayout>;
});

export const PhieuDeNghiNhapHang = PurchaseRequisitionForm;
export default PurchaseRequisitionForm;
