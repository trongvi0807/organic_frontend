# Khung in và xuất PDF biểu mẫu khóa luận

Component: `src/components/print/PrintFormLayout.jsx`, stylesheet đi kèm `print-forms.css`. Dùng React + Tailwind và CSS dành cho in. Không cần cài thư viện mới hoặc sửa API Spring Boot.

> Cập nhật 28-10-2026: Bộ đầy đủ 16 biểu mẫu và font Noto Sans tự lưu trong dự án đã thay phần font Times New Roman trước đây. Xem [BUSINESS_FORMS_PDF_REFERENCE.md](BUSINESS_FORMS_PDF_REFERENCE.md) để tra từng chức năng, dữ liệu và hướng giấy.

## Dùng ngay trên Admin

**Đơn mua / Phiếu nhập → Xem chi tiết → Xem trước bản in A4**. Bản xem trước lấy dữ liệu thật của chứng từ, có trạng thái và chữ ký người lập/người duyệt nếu backend trả về. Nút **In biểu mẫu** mở `window.print()`. Nút **Lưu PDF** cũng mở hộp thoại này; chọn **Save as PDF / Lưu dưới dạng PDF** làm máy in đích.

- Giấy A4 dọc, tỷ lệ 100%, không thêm lề tùy chỉnh ngoài thiết lập CSS (8 mm).
- Tắt header/footer mặc định của trình duyệt để bỏ URL/ngày/số trang ngoài biểu mẫu.
- Bật **Background graphics / Đồ họa nền** để giữ các nền xanh nhẹ; trình duyệt/máy in vẫn có thể ghi đè màu/lề.
- Bảng dài tự nối sang trang tiếp theo và lặp tiêu đề cột. Không ép mọi chứng từ dài vào một trang A4, tránh làm chữ quá nhỏ. Chữ ký giữ cùng khối nếu đủ chỗ.
- Màn hình nhỏ cuộn ngang xem trang A4 đúng tỷ lệ, không thu nhỏ chữ đến mức khó đọc.

Nút tải PDF backend sẵn có vẫn tải file do Spring Boot tạo; file đó có template riêng của backend. **Khung minh họa mới áp dụng cho bản in/PDF từ trình duyệt**, không tự thay đổi nội dung PDF backend. Nếu cần file PDF backend có đúng mẫu này, cần cập nhật riêng template `DocumentPdf`/`DocumentExportService` ở backend.

## API component dùng chung cho 16 loại biểu mẫu

Đã có 2 biểu mẫu UC01 được xác định chính xác: **BM-NV01-01 — Phiếu đề nghị nhập hàng**, **BM-NV01-02 — Đơn đặt hàng**. Xem [UC01_PRINT_FORMS.md](UC01_PRINT_FORMS.md) để dùng component, truyền dữ liệu và biết các trường còn thiếu API. 14 biểu mẫu còn lại đã được bổ sung theo PDF ngày 28-10-2026 trong danh mục Biểu mẫu & bản in.

Chuẩn Golden Reference đã áp dụng vào khung chung: Noto Sans tiếng Việt tự lưu trong dự án, giấy `#F7FAF5`, viền ngoài `#A3C1AD`, tiêu đề `#1B4D2E`, nền mục/bảng `#DCEAD6`, lưới `#689F75`, dòng chấm, bảng ít nhất 8 dòng và vùng ký xác nhận để trống để đóng dấu thủ công sau khi in. Các mục nội dung nền trắng. Header 3 cột và tiêu đề phiếu riêng ngay bên dưới giống code mẫu.

```jsx
import { useRef } from 'react';
import PrintFormLayout, {
  PrintFormSection, PrintFormTable, printDate, printNumber,
} from '@/components/print/PrintFormLayout';

export function MyBusinessForm({ document, formCode }) {
  const printRef = useRef(null);
  return <PrintFormLayout
    ref={printRef}
    title="PHIẾU KIỂM NHẬN HÀNG"
    formCode={formCode}
    documentNumber={document.code}
    createdAt={document.createdAt}
    time={document.time}
    signatures={[
      { title: 'Người lập phiếu', name: document.creatorName },
      { title: 'Người kiểm nhận', name: document.inspectorName },
      { title: 'Quản lý xác nhận', name: document.confirmerName },
    ]}
    notes={document.note}
  >
    <PrintFormSection title="Thông tin chung" keepTogether>
      <dl className="print-form-fields">
        <div><dt>Nhà cung cấp:</dt><dd>{document.supplierName}</dd></div>
        <div><dt>Ngày giao:</dt><dd>{printDate(document.deliveryDate)}</dd></div>
      </dl>
    </PrintFormSection>
    <PrintFormTable
      caption="Chi tiết sản phẩm"
      columns={[
        { key: 'stt', label: 'STT', width: '7%', numeric: true,
          render: (_, index) => index + 1 },
        { key: 'productName', label: 'Sản phẩm', width: '33%' },
        { key: 'quantity', label: 'Số lượng', width: '15%', numeric: true },
        { key: 'unitPrice', label: 'Đơn giá (đ)', width: '20%', numeric: true },
        { key: 'amount', label: 'Thành tiền (đ)', width: '25%', numeric: true },
      ]}
      rows={document.items}
      footer={<tr><td colSpan={4}>Tổng cộng (đ)</td>
        <td className="print-numeric">{printNumber(document.totalAmount)}</td></tr>}
    />
  </PrintFormLayout>;
}
```

### Props

| Prop | Ý nghĩa |
|---|---|
| title | Tiêu đề lớn ở giữa trang |
| orientation | portrait hoặc landscape; A4 dọc/ngang tương ứng |
| formCode | Mã biểu mẫu BM-NV… do màn hình truyền |
| documentNumber | Số phiếu thật; thiếu thì hiện — |
| createdAt | Ngày/timestamp; hiển thị dd/mm/yyyy, timestamp có timezone được đổi sang giờ Việt Nam |
| time | Giờ tùy chọn đã định dạng HH:mm |
| signatures | Mảng 2–4 `{title, name?, instruction?, dateLabel?, date?}`. Vùng ký để trống để ký và đóng dấu thủ công; không tạo hình con dấu trên biểu mẫu. Không truyền/mảng ngoài giới hạn dùng 3 vai trò mặc định |
| children | Nội dung riêng của từng biểu mẫu |
| notes | Ghi chú, giữ xuống dòng |
| showToolbar | Mặc định true; có thể ẩn khi dùng nút in ngoài |
| onClose | Tùy chọn, hiện nút đóng xem trước |
| onBeforePrint | Hàm async chuẩn bị nội dung, chờ xong mới in; lỗi hiện trong toolbar |
| className | CSS cho wrapper preview, không thay chuẩn A4 của sheet |
| sheetClassName | Class trên chính trang A4, được giữ trong bản sao in |
| documentNumberLabel / createdAtLabel | Nhãn header, ví dụ Số đơn / Ngày đặt cho PO |
| confirmationTitle | Tiêu đề khu vực ký, ví dụ 5. Xác nhận |
| ref | `ref.current.print()` và `ref.current.getElement()` cho nút ngoài hoặc tích hợp khác |

`PrintFormTable`: `columns`, `rows`, `rowKey` (tên field hoặc hàm), `caption`, `footer` (các `<tr>`), `minRows` (mặc định 8, tối thiểu 6; có thể tăng đến 40 cho mẫu sổ dài). Không có hàng vẫn hiện 8 dòng giấy trắng; có 2 hàng thì thêm 6 dòng trắng, có hơn 8 thì giữ đầy đủ dữ liệu. Cột có `numeric=true` căn phải và định dạng hàng nghìn theo vi-VN; `fractionDigits` cho số lẻ; `render(row,index)` dùng cho cell đặc biệt. Giá thiếu để trống, không đổi thành 0. Giá trị tổng lấy từ backend, không tự tính lại VAT/giảm giá trong template.

Các primitive chuẩn được export qua `PrintFormLayout.jsx`: `DottedField`, `DottedNotes`, `PrintCheckbox`. Không tạo hoặc render dấu đỏ; PO sắp chữ ký thành Người lập đơn → Đại diện NCC (kèm ngày xác nhận) → Người xác nhận bên đặt theo lựa chọn đã chốt.

`PrintFormSection`: tiêu đề nền xanh, viền xanh nhẹ, nội dung tự do; `keepTogether` cho khối ngắn không muốn ngắt trang. Dùng `className="print-numeric"` cho số ngoài component bảng. Dùng `data-print-hide` để ẩn một phần nội dung khi in.

## Cơ chế in

Trước khi gọi `window.print()`, component chờ font/ảnh sẵn sàng tối đa 5 giây rồi sao chép tĩnh phần biểu mẫu ra `#organic-print-root` trực tiếp dưới body. CSS `@media print` chỉ hiện root này, ẩn toàn bộ React root/sidebar/navbar/footer Admin, modal và toast. Không di chuyển/unmount nội dung Admin đang thao tác. Xong hoặc hủy hộp thoại in, sự kiện `afterprint` xóa bản sao; đóng preview cũng dọn bản sao và listener.

Ctrl+P khi đang mở preview sử dụng biểu mẫu đầu tiên đang được mount; nếu có nhiều biểu mẫu hãy dùng nút In của biểu mẫu mong muốn. Chỉ nên mount preview đang xem. Biểu mẫu không tạo hình chữ ký/con dấu; vùng ký để trống để thực hiện thủ công sau khi in. In/xuất không gọi API duyệt hoặc ghi nhận nghiệp vụ.

Với nội dung dài, tránh lồng preview trong component đã transform/scale; bản in được tách riêng để tránh bị cắt, bản xem màn hình vẫn cần cho phép cuộn. Không đặt bảng dài trong `keepTogether`; chỉ hàng bảng được cố gắng giữ nguyên, tiêu đề bảng lặp khi sang trang. Một hàng dài hơn cả trang vẫn có thể bị trình duyệt chia để giữ đủ nội dung.

## Kiểm chứng

Kiểm thử DOM: header, 2/3/4 chữ ký, số/ngày/giá trị thiếu, chọn đúng biểu mẫu khi có nhiều preview, clone chỉ nội dung cần in, Ctrl+P, dọn dẹp sau in/hủy/unmount, chuẩn bị async và chặn bấm lặp, lỗi chuẩn bị, bảng và dữ liệu PO thật. Kiểm tra CSS A4/named page, lặp thead, ẩn toàn bộ vùng ngoài print root.

Chưa kiểm tra bản in bằng máy in hoặc trình duyệt thật trong phiên làm việc này (browser automation đang bị tắt). Cần kiểm tra một phiếu ngắn và phiếu nhiều dòng trên trình duyệt dùng khi bảo vệ khóa luận.
